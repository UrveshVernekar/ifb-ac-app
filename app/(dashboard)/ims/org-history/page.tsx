"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  History,
  Search
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Interface definitions
interface HistoryRecord {
  id: number;
  action_type: "Add New" | "Add Dotted Relation" | "Update Existing" | "Delete";
  employee_name?: string;
  department_name?: string;
  role?: string;
  reports_to?: string;
  title?: string;
  timestamp: string;
  request_timestamp: string;
  parent_name?: string; // For dotted parent
  child_name?: string;  // For dotted child or old incharge
}

export default function OrgHistoryPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";
    setIsLoading(true);

    axios
      .get(`${apiBase}/quality/ims/history`)
      .then((response) => {
        setHistoryData(response.data || []);
      })
      .catch((error) => {
        console.error("Error fetching history data:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [mounted]);

  // Format date helper (Locale Date String)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB");
  };

  // Filter history data based on search term
  const filteredData = historyData.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Group historical data
  const addNewData = filteredData.filter((entry) => entry.action_type === "Add New");
  const dottedRelationData = filteredData.filter((entry) => entry.action_type === "Add Dotted Relation");
  const updatedData = filteredData.filter((entry) => entry.action_type === "Update Existing");
  const deleteData = filteredData.filter((entry) => entry.action_type === "Delete");

  // Headers definitions
  const addNewHeaders = ["Employee", "Department", "Title", "Role", "Reports To", "Requested On", "Approved On"];
  const dottedRelationHeaders = ["Employee", "Dotted Reporting", "Requested On", "Approved On"];
  const updatedHeaders = ["Old Incharge", "New Incharge", "Department", "Title", "Role", "Reports To", "Requested On", "Approved On"];
  const deleteHeaders = ["Employee", "Department", "Title", "Role", "Reports To", "Requested On", "Approved On"];

  // Header mapping to database keys
  const headerMapping: Record<string, keyof HistoryRecord> = {
    "Employee": "employee_name",
    "Department": "department_name",
    "Role": "role",
    "Reports To": "reports_to",
    "Title": "title",
    "Approved On": "timestamp",
    "Requested On": "request_timestamp",
    "Dotted Reporting": "parent_name",
    "Old Incharge": "child_name",
    "New Incharge": "employee_name",
  };

  // Dotted relation child employee mapping mapping fixes
  const getHeaderValue = (item: HistoryRecord, header: string) => {
    // Specifically handle dotted relation employee name mapping to child_name
    if (item.action_type === "Add Dotted Relation" && header === "Employee") {
      return item.child_name || "-";
    }
    const key = headerMapping[header];
    if (header === "Approved On" || header === "Requested On") {
      return formatDate(String(item[key]));
    }
    return String(item[key]) || "-";
  };

  if (!mounted) return null;

  const renderHistoryTable = (headers: string[], data: HistoryRecord[]) => (
    <div className="border border-border/60 rounded-xl overflow-hidden shadow-sm bg-card">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-center border-collapse text-xs">
          <thead>
            <tr className="bg-muted/50 border-b border-border/40 text-muted-foreground font-bold">
              <th className="p-3 w-16">S.No</th>
              {headers.map((h, idx) => (
                <th key={idx} className="p-3 text-[10px] uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-medium">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-muted/20 transition-all">
                <td className="p-3 text-muted-foreground">{index + 1}</td>
                {headers.map((h, idx) => (
                  <td key={idx} className="p-3 text-foreground truncate max-w-[160px]">
                    {getHeaderValue(item, h)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const hasAnyRecords = addNewData.length > 0 || dottedRelationData.length > 0 || updatedData.length > 0 || deleteData.length > 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <History className="w-5 h-5 text-blue-500" />
              Organization History
            </h1>
            <p className="text-xs text-muted-foreground">
              Trace chronological logs of verified team structure adjustments.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs rounded-full border border-input pl-9 pr-4 py-2 bg-background text-foreground outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {isLoading ? (
        <Card className="border border-border/60 bg-card p-6 animate-pulse space-y-3">
          <div className="h-6 bg-muted rounded w-1/4" />
          <div className="h-10 bg-muted rounded w-full" />
          <div className="h-10 bg-muted rounded w-full" />
        </Card>
      ) : hasAnyRecords ? (
        <div className="space-y-10">
          
          {/* Add New Section */}
          {addNewData.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                New Members Added
              </h3>
              {renderHistoryTable(addNewHeaders, addNewData)}
            </div>
          )}

          {/* Dotted Relations Section */}
          {dottedRelationData.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                New Dotted Relations Added
              </h3>
              {renderHistoryTable(dottedRelationHeaders, dottedRelationData)}
            </div>
          )}

          {/* Updated Section */}
          {updatedData.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Updated Existing Members
              </h3>
              {renderHistoryTable(updatedHeaders, updatedData)}
            </div>
          )}

          {/* Delete Section */}
          {deleteData.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Deleted Members
              </h3>
              {renderHistoryTable(deleteHeaders, deleteData)}
            </div>
          )}

        </div>
      ) : (
        <div className="border border-border/60 rounded-xl py-12 text-center text-xs text-muted-foreground font-semibold bg-card shadow-sm">
          No historical organization logs found.
        </div>
      )}
    </div>
  );
}
