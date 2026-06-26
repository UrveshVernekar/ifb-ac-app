"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, BookOpen, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";
import { toast } from "sonner";

interface DocumentRecord {
  id: number;
  name: string;
  value: string;
  type: string;
  plant: string;
}

export default function EmergencyPreparednessPage() {
  const [mounted, setMounted] = useState(false);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const API_HOST = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";
  const safetyDataBase = API_HOST;

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${safetyDataBase}/safety/ohc/safety-iso`);
      const allDocs = response.data || [];
      // Filter for AC plant and type guide
      const filtered = allDocs.filter(
        (doc: any) => doc.plant === "AC" && doc.type === "guide"
      );
      setDocuments(filtered);
    } catch (error) {
      console.error("Error fetching emergency manuals:", error);
      toast.error("Failed to load emergency preparedness documents");
    } finally {
      setLoading(false);
    }
  }, [safetyDataBase]);

  useEffect(() => {
    setMounted(true);
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDownload = (value: string) => {
    const link = document.createElement("a");
    link.href = `http://10.0.7.17/uploads/safety/ac/ems/${value}`;
    link.download = value;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = useMemo<ColumnConfig<DocumentRecord>[]>(
    () => [
      {
        header: "Sr. No",
        accessorKey: "index",
        isFilterable: false,
        isSortable: false,
        className: "w-16 text-center",
        cell: (_, index) => index + 1,
      },
      {
        header: "Document Name",
        accessorKey: "name",
        isFilterable: true,
        isSortable: true,
        className: "text-left font-semibold text-foreground/80",
      },
      {
        header: "Download / View",
        accessorKey: "value",
        isFilterable: false,
        isSortable: false,
        className: "w-40 text-center",
        cell: (row) => (
          <Button
            size="sm"
            onClick={() => handleDownload(row.value)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </Button>
        ),
      },
    ],
    []
  );

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      {/* HEADER SECTION */}
      <div className="flex items-center gap-3">
        <Link href="/safety">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
            Emergency Preparedness Guides
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Emergency preparedness procedures, maps, and guides for the AC plant.
          </p>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500 animate-pulse" />
            <div>
              <CardTitle className="text-md font-bold uppercase text-foreground">
                EHS Emergency Manuals
              </CardTitle>
              <CardDescription className="text-xs">
                Select and download standard guides for safe emergency evacuation
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <CommonTable
              data={documents}
              columns={columns}
              enableFiltering={true}
              enableExport={false}
              noDataMessage="No emergency preparedness documents uploaded"
              initialPageSize={10}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
