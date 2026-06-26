"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Calendar, FileText, CheckCircle2, AlertCircle, Clock, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";
import { toast } from "sonner";

interface PermitItem {
  id: number;
  dateofissue: string;
  validfrom: string;
  expiry_date: string;
  perminame: string;
  description: string;
  ini_mail: string;
  plant: string;
  permit_status: number;
  safety_status: number;
  area_status: number;
  main_status: number;
  main_mail?: string;
  area_mail?: string;
  safety_mail?: string;
}

export default function SafetyWorkPermitDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [permits, setPermits] = useState<PermitItem[]>([]);
  const [loading, setLoading] = useState(true);

  const API_HOST = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";
  const safetyDataBase = API_HOST;

  const fetchPermits = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${safetyDataBase}/safety/workpermit`, {
        key: "GET",
      });
      if (response.data && response.data.sdata) {
        setPermits(response.data.sdata || []);
      }
    } catch (error) {
      console.error("Error fetching permits:", error);
      toast.error("Failed to load safety work permits");
    } finally {
      setLoading(false);
    }
  }, [safetyDataBase]);

  useEffect(() => {
    setMounted(true);
    fetchPermits();
  }, [fetchPermits]);

  // Status configuration helper
  const isExpired = (expiryDateStr: string) => {
    if (!expiryDateStr) return false;
    const exp = new Date(expiryDateStr);
    exp.setHours(17, 15, 0, 0);
    return new Date() > exp;
  };

  const getPermitStatusInfo = (item: PermitItem) => {
    const expired = isExpired(item.expiry_date);
    if (expired && !(item.permit_status === 1 && item.safety_status === 1)) {
      return { label: "Auto Closed", color: "bg-stone-500/10 text-stone-600 border-stone-500/20" };
    }
    if (item.permit_status === 0 && item.safety_status === 1) {
      return { label: "Closure Pending", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" };
    }
    if (item.permit_status === 1 && item.safety_status === 1) {
      return { label: "Closed", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
    }
    return { label: "Approval Pending", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
  };

  const currentFYCount = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startFY = now.getMonth() >= 3 ? new Date(currentYear, 3, 1) : new Date(currentYear - 1, 3, 1);
    const endFY = new Date(startFY.getFullYear() + 1, 2, 31);

    return permits.filter((obj) => {
      const dateOfIssue = new Date(obj.dateofissue);
      return dateOfIssue >= startFY && dateOfIssue <= endFY && obj.plant === "AC";
    }).length;
  }, [permits]);

  const columns = useMemo<ColumnConfig<PermitItem>[]>(
    () => [
      {
        header: "Sr. No",
        accessorKey: "index",
        isFilterable: false,
        isSortable: false,
        className: "w-12 text-center",
        cell: (_, index) => index + 1,
      },
      {
        header: "Issue Date",
        accessorKey: "dateofissue",
        isFilterable: true,
        isSortable: true,
        className: "text-center",
      },
      {
        header: "Valid From",
        accessorKey: "validfrom",
        className: "text-center",
      },
      {
        header: "Expiry Date",
        accessorKey: "expiry_date",
        className: "text-center",
        cell: (row) => {
          const expired = isExpired(row.expiry_date);
          return (
            <span className={expired ? "text-rose-600 font-bold bg-rose-500/10 px-2 py-0.5 rounded" : ""}>
              {row.expiry_date}
            </span>
          );
        }
      },
      {
        header: "Permittee",
        accessorKey: "perminame",
        isFilterable: true,
        isSortable: true,
        className: "text-left font-semibold truncate max-w-[150px]",
      },
      {
        header: "Description of Work",
        accessorKey: "description",
        className: "text-left max-w-[200px] truncate",
      },
      {
        header: "Initiated By",
        accessorKey: "ini_mail",
        isFilterable: true,
        cell: (row) => row.ini_mail?.split("@")[0]?.replace(/_/g, " ") || "--",
      },
      {
        header: "Status",
        accessorKey: "status",
        isFilterable: true,
        isSortable: true,
        className: "text-center",
        cell: (row) => {
          const info = getPermitStatusInfo(row);
          return (
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${info.color}`}>
              {info.label.toUpperCase()}
            </span>
          );
        }
      },
      {
        header: "Actions",
        accessorKey: "id",
        isFilterable: false,
        isSortable: false,
        className: "w-24 text-center",
        cell: (row) => (
          <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="xs"
              onClick={() => router.push(`/safety/work-permit/view?id=${row.id}`)}
              className="h-7 px-2.5 border-blue-500/30 text-blue-600 hover:bg-blue-500/10 text-[10px] font-bold cursor-pointer"
            >
              Details
            </Button>
            {row.safety_status === 1 && row.area_status === 1 && row.main_status === 1 && !isExpired(row.expiry_date) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/safety/work-permit/view?id=${row.id}&download=1`)}
                className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )
      }
    ],
    []
  );

  if (!mounted) return null;

  const acPermits = permits.filter((p) => p.plant === "AC");

  return (
    <div className="space-y-6 max-w-8xl mx-auto p-4 sm:p-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/safety">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
              Safety Work Permits
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review active hot/height work permits, authorize clearance, or verify closure.
            </p>
          </div>
        </div>

        <Link href="/safety/work-permit/initiate">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" /> Initiate Permit
          </Button>
        </Link>
      </div>

      {/* METRIC GRIDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Permits (AC)</span>
              <span className="text-2xl font-extrabold block">{acPermits.length}</span>
            </div>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileText className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">FY Count (AC)</span>
              <span className="text-2xl font-extrabold block text-blue-600 dark:text-blue-400">{currentFYCount}</span>
            </div>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Active Approvals Pending</span>
              <span className="text-2xl font-extrabold block text-amber-600 dark:text-amber-400">
                {acPermits.filter((p) => getPermitStatusInfo(p).label === "Approval Pending").length}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN PERMITS TABLE */}
      <Card className="border-border/60 shadow-sm bg-card">
        <CardHeader className="pb-2 border-b border-border/40">
          <CardTitle className="text-md font-bold uppercase text-foreground">
            Safety Work Permits Registry
          </CardTitle>
          <CardDescription className="text-xs">
            Review status updates and download authorized permit PDFs. Click rows to view full details.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <CommonTable
            data={acPermits}
            columns={columns}
            enableFiltering={true}
            enableExport={true}
            exportFileName={`safety_work_permits_${new Date().toISOString().split("T")[0]}.csv`}
            noDataMessage="No safety work permits logged for the AC plant"
            initialPageSize={10}
            rowClassName={(row) => "cursor-pointer"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
