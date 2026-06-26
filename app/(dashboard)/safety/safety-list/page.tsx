"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, FileText, CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";
import { toast } from "sonner";
import { format } from "date-fns";

interface SafetyObservation {
  id: number;
  obsertype: string;
  obser: string;
  departin: string;
  hazard: string;
  risklevel: string;
  action: string;
  reperson: string;
  rperson: string;
  onBehalf: string;
  raisedby: string;
  date: string;
  tdate: string;
  status: string;
  timestamp?: string;
  repersonemail?: string | string[];
}

interface CompletedStats {
  within24h: number;
  within48h: number;
  within72h: number;
  within1w: number;
  within2w: number;
  within3w: number;
}

export default function SafetyListPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [safetyData, setSafetyData] = useState<SafetyObservation[]>([]);
  const [sessionEmail, setSessionEmail] = useState("");
  const [activeTab, setActiveTab] = useState("action");

  const allowedEmails = useMemo(() => [
    "ramchandra_yadav@ifbglobal.com",
    "salim_khan@ifbglobal.com",
    "riv_acplant@ifbglobal.com",
    "binnet_sam@ifbglobal.com",
    "safety_acplant@ifbglobal.com",
    "sairaj_usgaonkar@ifbglobal.com",
    "yogesh_more@ifbglobal.com",
    "santosh_nimbalkar@ifbglobal.com",
    "ketan_keshav@ifbglobal.com",
    "j_karthikeyan@ifbglobal.com",
  ], []);

  const API_HOST = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";

  // Dynamic FY options (matching original 5 years back logic)
  const yearOptions = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth(); // 3 = April
    const currentYear = today.getFullYear();
    const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;

    const options = [];
    for (let i = 0; i < 5; i++) {
      const year = startYear - i;
      const fy = `${year}-${(year + 1).toString().substring(2)}`;
      options.push({ value: fy, label: fy });
    }
    return options;
  }, []);

  const [selectedYear, setSelectedYear] = useState(yearOptions[0].value);

  const fetchSafetyDataList = useCallback(async () => {
    setLoading(true);
    const startYear = parseInt(selectedYear.split("-")[0]);
    const sdate = `${startYear}-04-01`;
    const edate = `${startYear + 1}-03-31`;

    const apiURL = `${API_HOST}/safety/ohc/year=${startYear}&ptype=AC&rtype=Date&sdate=${sdate}&edate=${edate}`;

    try {
      const response = await axios.get(apiURL);
      const data = response.data?.overall || [];
      setSafetyData(data);
    } catch (error) {
      console.error("Error fetching safety data list:", error);
      toast.error("Failed to load safety records");
      setSafetyData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, API_HOST]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setSessionEmail(sessionStorage.getItem("employee_email") || "");
      const savedYear = sessionStorage.getItem("selectedSafetyYear");
      if (savedYear) {
        try {
          const parsed = JSON.parse(savedYear);
          if (parsed && parsed.value) {
            setSelectedYear(parsed.value);
          }
        } catch (e) {
          // fallback to default
        }
      }
    }
  }, []);

  useEffect(() => {
    if (mounted && selectedYear) {
      fetchSafetyDataList();
    }
  }, [selectedYear, fetchSafetyDataList, mounted]);

  const handleYearChange = (val: string) => {
    setSelectedYear(val);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("selectedSafetyYear", JSON.stringify({ value: val, label: val }));
    }
  };

  const isAllowedUser = useMemo(() => {
    return allowedEmails.includes(sessionEmail);
  }, [sessionEmail, allowedEmails]);

  // Filters
  const approvalPendingList = useMemo(() => {
    return safetyData.filter((item) => item.status === "Approval Pending");
  }, [safetyData]);

  const actionPendingList = useMemo(() => {
    return safetyData.filter(
      (item) =>
        item.status !== "Completed" &&
        item.status !== "Approval Pending" &&
        item.status !== "Rejected"
    );
  }, [safetyData]);

  const completedList = useMemo(() => {
    return safetyData.filter((item) => item.status === "Completed");
  }, [safetyData]);

  const rejectedList = useMemo(() => {
    return safetyData.filter(
      (item) =>
        item.status !== "Completed" &&
        item.status !== "Approval Pending" &&
        item.status !== "Under Progress" &&
        item.status !== "Pending"
    );
  }, [safetyData]);

  // Statistics calculation
  const completedStats = useMemo<CompletedStats>(() => {
    let statsData = completedList;

    // Filter to user-specific completed items if not admin
    if (!isAllowedUser) {
      statsData = completedList.filter((item) => {
        const emails = Array.isArray(item.repersonemail)
          ? item.repersonemail
          : typeof item.repersonemail === "string"
          ? [item.repersonemail]
          : [];
        return emails.includes(sessionEmail);
      });
    }

    const stats = {
      within24h: 0,
      within48h: 0,
      within72h: 0,
      within1w: 0,
      within2w: 0,
      within3w: 0,
    };

    statsData.forEach((item) => {
      const start = new Date(item.date);
      const end = item.timestamp ? new Date(item.timestamp) : new Date();
      const diffTime = Math.max(0, end.getTime() - start.getTime());

      const hours = diffTime / (1000 * 60 * 60);
      const days = diffTime / (1000 * 60 * 60 * 24);

      if (hours <= 24) stats.within24h++;
      else if (hours <= 48) stats.within48h++;
      else if (hours <= 72) stats.within72h++;
      else if (days <= 7) stats.within1w++;
      else if (days <= 14) stats.within2w++;
      else if (days <= 21) stats.within3w++;
    });

    return stats;
  }, [completedList, isAllowedUser, sessionEmail]);

  // Columns Configuration
  const columns = useMemo<ColumnConfig<SafetyObservation>[]>(
    () => [
      {
        header: "Type",
        accessorKey: "obsertype",
        isFilterable: true,
        isSortable: true,
        className: "font-semibold text-xs text-left min-w-[100px]",
      },
      {
        header: "Observation",
        accessorKey: "obser",
        isFilterable: true,
        className: "text-left text-xs max-w-[250px] truncate",
      },
      {
        header: "Department",
        accessorKey: "departin",
        isFilterable: true,
        isSortable: true,
        className: "text-center text-xs",
      },
      {
        header: "Hazard",
        accessorKey: "hazard",
        isFilterable: true,
        className: "text-center text-xs",
      },
      {
        header: "Risk Level",
        accessorKey: "risklevel",
        isFilterable: true,
        className: "text-center text-xs",
        cell: (row) => (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              row.risklevel?.toLowerCase() === "high"
                ? "bg-red-500/10 text-red-600 border border-red-500/20"
                : row.risklevel?.toLowerCase() === "medium"
                ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
            }`}
          >
            {row.risklevel}
          </span>
        ),
      },
      {
        header: "Responsible Person",
        accessorKey: "reperson",
        isFilterable: true,
        className: "text-left text-xs",
      },
      {
        header: "Status",
        accessorKey: "status",
        isFilterable: true,
        isSortable: true,
        className: "text-center text-xs",
        cell: (row) => {
          const stat = row.status?.toLowerCase();
          let pillClass = "bg-muted text-muted-foreground border-muted-foreground/20";
          if (stat === "completed") pillClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
          else if (stat === "approval pending") pillClass = "bg-blue-500/10 text-blue-600 border-blue-500/20";
          else if (stat === "rejected") pillClass = "bg-rose-500/10 text-rose-600 border-rose-500/20";
          else if (stat === "under progress" || stat === "pending") pillClass = "bg-amber-500/10 text-amber-600 border-amber-500/20";

          return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${pillClass}`}>
              {row.status}
            </span>
          );
        },
      },
      {
        header: "Initial Date",
        accessorKey: "date",
        isSortable: true,
        className: "text-center text-xs",
        cell: (row) => (row.date ? format(new Date(row.date), "dd-MMM-yyyy") : "--"),
      },
      {
        header: "Target Date",
        accessorKey: "tdate",
        isSortable: true,
        className: "text-center text-xs",
        cell: (row) => (row.tdate ? format(new Date(row.tdate), "dd-MMM-yyyy") : "Not Yet Set"),
      },
      {
        header: "Action",
        accessorKey: "id",
        isFilterable: false,
        isSortable: false,
        className: "text-center w-20",
        cell: (row) => (
          <Button
            onClick={() => router.push(`/safety/safety-list/view?id=${row.id}`)}
            variant="ghost"
            size="sm"
            className="text-xs h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 font-semibold"
          >
            Details
          </Button>
        ),
      },
    ],
    [router]
  );

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-8xl mx-auto p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/safety">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
              Safety Observation Ledger
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review, track, and approve reported hazards and incidents within the AC Plant.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border/60 px-3 py-1 rounded-lg">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="h-7 text-xs border-0 bg-transparent focus:ring-0 w-[110px] p-0 shadow-none">
                <SelectValue placeholder="Select FY" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Link href="/safety/safety-form">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 cursor-pointer">
              Report Observation
            </Button>
          </Link>
        </div>
      </div>

      {/* METRICS SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Reported</p>
              <h3 className="text-2xl font-extrabold mt-1">{safetyData.length}</h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Pending Action</p>
              <h3 className="text-2xl font-extrabold mt-1 text-amber-500">{actionPendingList.length}</h3>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Pending Approval</p>
              <h3 className="text-2xl font-extrabold mt-1 text-indigo-500">{approvalPendingList.length}</h3>
            </div>
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Completed</p>
              <h3 className="text-2xl font-extrabold mt-1 text-emerald-500">{completedList.length}</h3>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DETAILED TABLES BY STATUS */}
      <div className="w-full space-y-4">
        <div className="grid grid-cols-4 md:flex md:w-fit bg-muted/60 p-1 rounded-lg gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("action")}
            className={`text-xs font-semibold px-4 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === "action" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:bg-muted/30"
            }`}
          >
            Action Pending ({actionPendingList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("approval")}
            className={`text-xs font-semibold px-4 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === "approval" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:bg-muted/30"
            }`}
          >
            Pending HOD Approval ({approvalPendingList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`text-xs font-semibold px-4 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === "completed" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:bg-muted/30"
            }`}
          >
            Completed ({completedList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rejected")}
            className={`text-xs font-semibold px-4 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === "rejected" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:bg-muted/30"
            }`}
          >
            Rejected ({rejectedList.length})
          </button>
          {isAllowedUser && (
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`text-xs font-semibold px-4 py-1.5 rounded-md transition-all hidden md:inline-flex cursor-pointer ${
                activeTab === "all" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:bg-muted/30"
              }`}
            >
              Full Registry ({safetyData.length})
            </button>
          )}
        </div>

        {/* Tab Contents */}
        <div className="mt-4">
          {activeTab === "action" && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2 border-b border-border/40">
                <CardTitle className="text-sm font-bold uppercase text-foreground">Action Pending Observations</CardTitle>
                <CardDescription className="text-xs">Safety issues requiring closure implementation.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <CommonTable
                  data={actionPendingList}
                  columns={columns}
                  enableFiltering={true}
                  enableExport={true}
                  exportFileName={`safety_action_pending_${selectedYear}.csv`}
                  noDataMessage="No issues pending action"
                  initialPageSize={10}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === "approval" && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2 border-b border-border/40">
                <CardTitle className="text-sm font-bold uppercase text-foreground">HOD Verification Pending</CardTitle>
                <CardDescription className="text-xs">Observations completed but awaiting final validation by HOD.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <CommonTable
                  data={approvalPendingList}
                  columns={columns}
                  enableFiltering={true}
                  enableExport={true}
                  exportFileName={`safety_approval_pending_${selectedYear}.csv`}
                  noDataMessage="No issues awaiting HOD approval"
                  initialPageSize={10}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === "completed" && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2 border-b border-border/40">
                <CardTitle className="text-sm font-bold uppercase text-foreground">Completed / Closed Observations</CardTitle>
                <CardDescription className="text-xs">Verified and permanently closed safety entries.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <CommonTable
                  data={completedList}
                  columns={columns}
                  enableFiltering={true}
                  enableExport={true}
                  exportFileName={`safety_completed_${selectedYear}.csv`}
                  noDataMessage="No completed observations recorded"
                  initialPageSize={10}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === "rejected" && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2 border-b border-border/40">
                <CardTitle className="text-sm font-bold uppercase text-foreground">Rejected Entries</CardTitle>
                <CardDescription className="text-xs">Observations that were rejected by HOD reviewers.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <CommonTable
                  data={rejectedList}
                  columns={columns}
                  enableFiltering={true}
                  enableExport={true}
                  exportFileName={`safety_rejected_${selectedYear}.csv`}
                  noDataMessage="No rejected observations"
                  initialPageSize={10}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === "all" && isAllowedUser && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2 border-b border-border/40">
                <CardTitle className="text-sm font-bold uppercase text-foreground">All Observations</CardTitle>
                <CardDescription className="text-xs">Full history of reported observations for the year.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <CommonTable
                  data={safetyData}
                  columns={columns}
                  enableFiltering={true}
                  enableExport={true}
                  exportFileName={`safety_registry_full_${selectedYear}.csv`}
                  noDataMessage="No safety records found"
                  initialPageSize={10}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* RESOLUTION SPEED PERFORMANCE METRICS CARD */}
      <Card className="border-border/60 shadow-sm bg-card">
        <CardHeader className="pb-2 border-b border-border/40">
          <CardTitle className="text-sm font-bold uppercase text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Closure Resolution Summary
          </CardTitle>
          <CardDescription className="text-xs">
            Performance tracker showing hours/weeks taken to resolve and verify reported observations.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            <div className="border border-border/55 p-3 rounded-lg bg-muted/10">
              <h4 className="text-xs font-semibold text-muted-foreground">Within 24 Hours</h4>
              <p className="text-2xl font-black text-emerald-600 mt-1">{completedStats.within24h}</p>
            </div>
            <div className="border border-border/55 p-3 rounded-lg bg-muted/10">
              <h4 className="text-xs font-semibold text-muted-foreground">Within 48 Hours</h4>
              <p className="text-2xl font-black text-emerald-500 mt-1">{completedStats.within48h}</p>
            </div>
            <div className="border border-border/55 p-3 rounded-lg bg-muted/10">
              <h4 className="text-xs font-semibold text-muted-foreground">Within 72 Hours</h4>
              <p className="text-2xl font-black text-amber-500 mt-1">{completedStats.within72h}</p>
            </div>
            <div className="border border-border/55 p-3 rounded-lg bg-muted/10">
              <h4 className="text-xs font-semibold text-muted-foreground">Under 1 Week</h4>
              <p className="text-2xl font-black text-orange-500 mt-1">{completedStats.within1w}</p>
            </div>
            <div className="border border-border/55 p-3 rounded-lg bg-muted/10">
              <h4 className="text-xs font-semibold text-muted-foreground">Under 2 Weeks</h4>
              <p className="text-2xl font-black text-rose-500 mt-1">{completedStats.within2w}</p>
            </div>
            <div className="border border-border/55 p-3 rounded-lg bg-muted/10">
              <h4 className="text-xs font-semibold text-muted-foreground">Under 3 Weeks</h4>
              <p className="text-2xl font-black text-red-700 mt-1">{completedStats.within3w}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
