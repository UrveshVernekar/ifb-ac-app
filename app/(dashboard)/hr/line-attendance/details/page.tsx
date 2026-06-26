"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";
import { toast } from "sonner";

interface EmployeeRow {
  id: number;
  emp_code: string;
  employeename: string;
  clocknumber: string;
  area: string;
  station: string;
  status: string;
  agency: string;
  punchtime: string;
  punchtimeout: string;
  otHours: string;
}

function DetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = searchParams.get("type") || "all";
  const line = searchParams.get("line") || "IDU";
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const depLabel = searchParams.get("label") || "IDU";

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";
  const hostname = `${apiBase}/ac`;

  useEffect(() => {
    setLoading(true);
    const deprt = line === "Paintshop" ? "Paintshop" : line === "QC" ? "QC" : line === "IDU" ? "IDU" : "ODU";

    fetch(`${hostname}/hr/line-manpower/attendance?date=${date}&deprt=${deprt}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.manpowerpunchData) {
          let filtered = data.manpowerpunchData;
          const shiftdata = data.shiftData;

          // Get shift_time in seconds from shiftData
          const shiftTimeSec = shiftdata && shiftdata.length > 0 ? shiftdata[0].shift_time : null;

          // Helper: convert "HH:MM:SS" to total seconds
          const timeToSeconds = (timeStr: string) => {
            if (!timeStr || timeStr === "--:--" || timeStr === "--:--:--") return null;
            const parts = timeStr.split(":").map(Number);
            if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
            if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60;
            return null;
          };

          // Helper: convert seconds to "HH:MM:SS" display
          const secondsToHMS = (sec: number | null) => {
            if (sec == null || sec < 0) return "--";
            const h = Math.floor(sec / 3600);
            const m = Math.floor((sec % 3600) / 60);
            const s = sec % 60;
            return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
          };

          if (type === "present") {
            filtered = filtered.filter((e: any) => e.status === "PRESENT");
          } else if (type === "absent") {
            filtered = filtered.filter((e: any) => e.status === "ABSENT");
          }

          const mappedRows = filtered.map((emp: any, index: number) => {
            const inSec = timeToSeconds(emp.punchtime);
            const outSec = timeToSeconds(emp.punchtimeout);
            let otDisplay = "--";
            if (inSec !== null && outSec !== null && shiftTimeSec !== null) {
              const workedSec = outSec - inSec;
              const otSec = workedSec - shiftTimeSec;
              otDisplay = otSec > 0 ? secondsToHMS(otSec) : "00:00:00";
            }
            return {
              id: index + 1,
              emp_code: emp.emp_code,
              employeename: emp.emp_name,
              clocknumber: emp.emp_clock_no || "-",
              area: emp.area || "N/A",
              station: emp.station_no || "N/A",
              status: emp.status,
              agency: emp.agency || "N/A",
              punchtime: emp.punchtime || "--:--",
              punchtimeout: emp.punchtimeout || "--:--",
              otHours: otDisplay
            };
          });

          // Sort alphabetically by employee name
          mappedRows.sort((a: EmployeeRow, b: EmployeeRow) => a.employeename.localeCompare(b.employeename));
          setEmployees(mappedRows);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        toast.error("Failed to load line attendance details.");
        setLoading(false);
      });
  }, [type, line, date, hostname]);

  const handleRowClick = (row: EmployeeRow) => {
    const params = new URLSearchParams({
      empCode: row.emp_code,
      empName: row.employeename,
      agency: row.agency,
      area: row.area,
      station: row.station
    });
    router.push(`/hr/line-attendance/employee-history?${params.toString()}`);
  };

  const columns: ColumnConfig<EmployeeRow>[] = [
    {
      header: "Employee Name",
      accessorKey: "employeename",
      cell: (row) => (
        <span 
          onClick={() => handleRowClick(row)} 
          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-bold transition-all"
        >
          {row.employeename}
        </span>
      ),
      isSortable: true,
      isFilterable: true
    },
    {
      header: "Employee Code",
      accessorKey: "emp_code",
      isSortable: true,
      isFilterable: true
    },
    {
      header: "Area",
      accessorKey: "area",
      isSortable: true,
      isFilterable: true
    },
    {
      header: "Station",
      accessorKey: "station",
      isSortable: true,
      isFilterable: true
    },
    {
      header: "Agency",
      accessorKey: "agency",
      isSortable: true,
      isFilterable: true
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
          row.status === "PRESENT" 
            ? "bg-emerald-500/10 text-emerald-600" 
            : "bg-rose-500/10 text-rose-600"
        }`}>
          {row.status}
        </span>
      ),
      isSortable: true,
      isFilterable: true
    },
    {
      header: "Punch In",
      accessorKey: "punchtime",
      isSortable: true
    },
    {
      header: "Punch Out",
      accessorKey: "punchtimeout",
      isSortable: true
    },
    {
      header: "OT Hours",
      accessorKey: "otHours",
      isSortable: true
    },
    {
      header: "History",
      accessorKey: "actions",
      cell: (row) => (
        <Button
          size="icon"
          variant="outline"
          className="h-7 w-7 border-border hover:bg-slate-100 hover:text-blue-600"
          onClick={() => handleRowClick(row)}
        >
          <Eye className="w-3.5 h-3.5" />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* HEADER SECTION */}
      <div className="flex items-center gap-3">
        <Link href="/hr/line-attendance">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
            Manpower Details List
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Detailed view for {depLabel} Line on {new Date(date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}.
          </p>
        </div>
      </div>

      {/* TABLE CARD */}
      <Card className="border-border/60 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent border-b border-border/40 pb-4">
          <CardTitle className="text-sm font-bold tracking-wide text-foreground uppercase">
            Rostered Personnel ({type.toUpperCase()})
          </CardTitle>
          <CardDescription className="text-xs">
            Review live punch logs, operational area allocations, and overtime configurations. Click on names for trends.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <CommonTable
            data={employees}
            columns={columns}
            loading={loading}
            enableFiltering={true}
            enableExport={true}
            exportFileName={`Manpower_Details_${line}_${type}_${date}.csv`}
            noDataMessage="No manpower records found for the selected criteria."
            initialPageSize={15}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function LineAttendanceDetailsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-xs text-muted-foreground">Loading details...</span>
      </div>
    }>
      <DetailsContent />
    </Suspense>
  );
}
