"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Download,
  Plus,
  Minus,
  RotateCcw,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TreeDataNode {
  id: number;
  department: string;
  employee: string;
  title: string;
  role: string;
  isDotted?: boolean;
  children: TreeDataNode[];
}

const convertToTreeData = (data: any[]): TreeDataNode[] => {
  return data.map((node) => ({
    id: node.id,
    department: node.department_name || node.department || "N/A",
    employee: node.employee || "N/A",
    title: node.title || "N/A",
    role: node.role || "N/A",
    isDotted: node.isDotted || false,
    children: [
      ...convertToTreeData(node.children || []),
      ...convertToTreeData(node.dottedChildren || []),
    ],
  }));
};

export default function OrgChartPage() {
  const [mounted, setMounted] = useState(false);
  const [orgChartData, setOrgChartData] = useState<any[]>([]);
  const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
  const [filteredData, setFilteredData] = useState<TreeDataNode[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Search & Filter Dropdown state
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [flatNodes, setFlatNodes] = useState<{ id: number; label: string }[]>([]);

  // Ref for capture
  const treeContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // Close dropdown on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch chart data
  useEffect(() => {
    if (!mounted) return;

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";
    setIsLoading(true);

    axios
      .get(`${apiBase}/quality/ims/orgchart`)
      .then((response) => {
        const rawData = response.data || [];
        setOrgChartData(rawData);
      })
      .catch((error) => {
        console.error("Error fetching org chart data:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [mounted]);

  // Convert raw data to hierarchical tree structure
  useEffect(() => {
    if (orgChartData.length > 0) {
      const treeStructure = convertToTreeData(orgChartData);

      // Prioritize Govindaraj (CEO) at the root level if present
      const ceoIndex = treeStructure.findIndex((node) =>
        node.employee && node.employee.toLowerCase().includes("govindaraj")
      );
      if (ceoIndex > -1) {
        const ceoNode = treeStructure[ceoIndex];
        treeStructure.splice(ceoIndex, 1);
        treeStructure.unshift(ceoNode);
      }

      setTreeData(treeStructure);

      // Flatten nodes for dropdown selection
      const options: { id: number; label: string }[] = [];
      const generateOptions = (nodes: TreeDataNode[]) => {
        nodes.forEach((node) => {
          options.push({
            id: node.id,
            label: `${node.department} - ${node.employee} - ${node.title}`,
          });
          if (node.children) generateOptions(node.children);
        });
      };
      generateOptions(treeStructure);
      setFlatNodes(options);
    }
  }, [orgChartData]);

  // Drag handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, select, input, .node-toggle-btn")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 2.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.25));
  const handleReset = () => {
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
  };

  // Node selection handler
  const handleSelectNode = (nodeId: number) => {
    setSelectedNodeId(nodeId);
    setIsDropdownOpen(false);

    const findNodeById = (nodes: TreeDataNode[], id: number): TreeDataNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const result = findNodeById(node.children, id);
          if (result) return result;
        }
      }
      return null;
    };

    const targetNode = findNodeById(treeData, nodeId);
    setFilteredData(targetNode ? [targetNode] : null);
    // Reset panning to center on node
    setPan({ x: 0, y: 0 });
  };

  const handleClearSelection = () => {
    setSelectedNodeId(null);
    setFilteredData(null);
    setSearchQuery("");
    setPan({ x: 0, y: 0 });
  };

  // PDF Downloader
  const handleDownloadPDF = async () => {
    const element = treeContainerRef.current;
    if (!element) return;

    // Temporarily reset zoom and pan for high quality snapshot
    const originalTransform = element.style.transform;
    element.style.transform = "none";

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("org-chart.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      element.style.transform = originalTransform;
    }
  };



  const activeNodes = filteredData || treeData;

  const filteredOptions = flatNodes.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-8xl mx-auto p-4 sm:p-6 h-[92vh] flex flex-col overflow-hidden">
      {/* CSS Tree connector lines styled in style block */}
      <style dangerouslySetInnerHTML={{ __html: `
        .canvas-grid {
          background-color: #f8fafc;
          background-image: radial-gradient(#cbd5e1 1.2px, transparent 1.2px);
          background-size: 20px 20px;
        }
        .dark .canvas-grid {
          background-color: #09090b;
          background-image: radial-gradient(#27272a 1.2px, transparent 1.2px);
        }
        .org-tree {
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }
        .org-tree ul {
          display: flex;
          flex-direction: row;
          padding-top: 24px;
          position: relative;
          transition: all 0.3s;
        }
        .org-tree li {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          padding: 24px 12px 0 12px;
          transition: all 0.3s;
        }
        /* Horizontal connectors */
        .org-tree li::before, .org-tree li::after {
          content: '';
          position: absolute;
          top: 0;
          right: 50%;
          border-top: 2px solid #cbd5e1;
          width: 50%;
          height: 24px;
        }
        .org-tree li::after {
          right: auto;
          left: 50%;
          border-left: 2px solid #cbd5e1;
        }
        .dark .org-tree li::before, .dark .org-tree li::after {
          border-top-color: #334155;
          border-left-color: #334155;
        }
        /* Single child elements */
        .org-tree li:only-child::after, .org-tree li:only-child::before {
          display: none;
        }
        .org-tree li:only-child {
          padding-top: 0;
        }
        /* Remove outer connectors */
        .org-tree li:first-child::before, .org-tree li:last-child::after {
          border: 0 none;
        }
        /* Add round border to connectors */
        .org-tree li:last-child::before {
          border-right: 2px solid #cbd5e1;
          border-radius: 0 8px 0 0;
        }
        .dark .org-tree li:last-child::before {
          border-right-color: #334155;
        }
        .org-tree li:first-child::after {
          border-radius: 8px 0 0 0;
        }
        /* Vertical connector from parent down */
        .org-tree ul::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          border-left: 2px solid #cbd5e1;
          width: 0;
          height: 24px;
          transform: translateX(-50%);
        }
        .dark .org-tree ul::before {
          border-left-color: #334155;
        }
        /* Dotted relationships */
        .org-tree li.is-dotted::before, .org-tree li.is-dotted::after {
          border-top-style: dashed !important;
          border-left-style: dashed !important;
          border-color: #60a5fa !important;
        }
      ` }} />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Organization Hierarchy
          </h1>
          <p className="text-xs text-muted-foreground">
            Visualize reporting trees, dotted lines, and department levels.
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Custom Search Selector Dropdown */}
          <div className="relative w-72" ref={dropdownRef}>
            <div
              className="flex items-center justify-between border border-input bg-background rounded-lg px-3 py-2 text-xs cursor-pointer select-none"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="truncate pr-4 text-muted-foreground flex items-center gap-2">
                <Search className="w-3.5 h-3.5 shrink-0 text-muted-foreground/80" />
                {selectedNodeId
                  ? flatNodes.find((n) => n.id === selectedNodeId)?.label
                  : "Search hierarchy starting node..."}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {selectedNodeId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSelection();
                    }}
                    className="p-0.5 rounded-full hover:bg-muted"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>

            {isDropdownOpen && (
              <div className="absolute right-0 left-0 mt-1 border border-border bg-popover text-popover-foreground rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                <div className="p-2 border-b border-border flex items-center gap-2 sticky top-0 bg-popover z-10">
                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search node name..."
                    className="w-full text-xs bg-transparent border-0 outline-none placeholder:text-muted-foreground"
                    autoFocus
                  />
                </div>
                <div className="py-1">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectNode(opt.id)}
                        className={`px-3 py-2 text-[11px] cursor-pointer hover:bg-accent hover:text-accent-foreground truncate ${
                          selectedNodeId === opt.id ? "bg-accent text-accent-foreground font-semibold" : ""
                        }`}
                      >
                        {opt.label}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-[11px] text-muted-foreground text-center">
                      No nodes found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center border border-border rounded-lg p-0.5 bg-background shadow-sm shrink-0">
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleZoomIn} title="Zoom In">
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleZoomOut} title="Zoom Out">
              <Minus className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleReset} title="Reset view">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          <Button
            size="sm"
            onClick={handleDownloadPDF}
            className="font-semibold text-xs gap-1.5 h-9 bg-blue-600 hover:bg-blue-500 text-white shrink-0"
          >
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* CANVAS VIEWPORT CONTAINER */}
      <div className="flex-1 border border-border/60 rounded-2xl shadow-inner overflow-hidden relative select-none canvas-grid">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-xs">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="text-xs text-muted-foreground font-bold tracking-wide">Drawing Organization Tree...</p>
            </div>
          </div>
        ) : activeNodes.length > 0 ? (
          <div
            className="w-full h-full overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              ref={treeContainerRef}
              className="org-tree p-16 origin-top"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                cursor: isDragging ? "grabbing" : "grab",
                transition: isDragging ? "none" : "transform 0.15s ease-out",
              }}
            >
              <ul>
                {activeNodes.map((rootNode) => (
                  <TreeNodeComponent key={rootNode.id} node={rootNode} />
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs font-semibold">
            No organization hierarchy records available
          </div>
        )}
      </div>
    </div>
  );
}

// Initials generator helper
const getInitials = (name: string) => {
  if (!name || name === "N/A") return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Recursive TreeNode Renderer declared outside of parent component definition
const TreeNodeComponent = ({ node, depth = 0 }: { node: TreeDataNode; depth?: number }) => {
  // depth = 0 is Level 1 (expanded by default)
  // depth = 1 is Level 2 (its children/Level 3 are collapsed by default)
  const [isCollapsed, setIsCollapsed] = useState(depth >= 1);
  const hasChildren = node.children && node.children.length > 0;
  const initials = getInitials(node.employee);
  const isHOD = node.role === "HOD";

  return (
    <li className={node.isDotted ? "is-dotted" : ""}>
      {/* Node Box */}
      <div
        className={`node-card relative flex flex-col items-center w-56 p-4 pt-6 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 select-none ${
          node.isDotted
            ? "border-dashed border-blue-400 dark:border-blue-500 bg-blue-50/5 dark:bg-blue-950/5"
            : ""
        }`}
      >
        {/* Top bar accent strip to distinguish HODs and members */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-xl ${
          isHOD ? "bg-amber-500 dark:bg-amber-600 animate-pulse" : "bg-blue-500 dark:bg-blue-600"
        }`} />

        {/* Empty Initials Avatar */}
        <div className={`w-11 h-11 rounded-full border text-xs font-bold flex items-center justify-center shadow-inner shrink-0 mb-3 ${
          isHOD 
            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400"
            : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400"
        }`}>
          {initials}
        </div>

        <h3 className="font-extrabold text-sm text-foreground text-center truncate w-full" title={node.department}>
          {node.department}
        </h3>
        <p className="text-xs font-semibold text-muted-foreground mt-1 text-center truncate w-full" title={node.employee}>
          {node.employee}
        </p>
        <p className="text-[10px] text-muted-foreground/75 mt-0.5 text-center truncate w-full" title={node.title}>
          {node.title}
        </p>
        
        {node.role && node.role !== "N/A" && (
          <Badge className={`mt-3 text-[9px] hover:bg-secondary font-bold tracking-wider ${
            isHOD 
              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100"
              : "bg-secondary text-secondary-foreground"
          }`}>
            {node.role}
          </Badge>
        )}

        {/* Toggle Expand/Collapse for nested items */}
        {hasChildren && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="node-toggle-btn absolute -bottom-3.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 w-7 h-7 rounded-full flex items-center justify-center shadow focus:outline-none transition-all z-20"
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Children nodes recursive rendering */}
      {hasChildren && !isCollapsed && (
        <ul>
          {node.children.map((child) => (
            <TreeNodeComponent key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
};
