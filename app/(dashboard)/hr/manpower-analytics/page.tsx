"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, RefreshCw, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Recharts imports
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

interface AttendanceSummaryItem {
  punch_date: string;
  idu_sanctioned: number;
  idu_present: number;
  idu_pool_present: number;
  odu_sanctioned: number;
  odu_present: number;
  odu_pool_present: number;
}

interface StatusTrendItem {
  period: string;
  active_percent: number;
  inactive_percent: number;
}

export default function ManpowerAnalyticsPage() {
  const router = useRouter();

  // Date defaults: From (7 days ago) to To (today)
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);

  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummaryItem[]>([]);
  const [selectedLine, setSelectedLine] = useState("IDU");
  const [selectedType, setSelectedType] = useState("1"); // 1=Active, 2=Pool, "1,2"=Both
  const [statusTrend, setStatusTrend] = useState<StatusTrendItem[]>([]);
  const [trendViewType, setTrendViewType] = useState("daily");
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";
  const hostname = `${apiBase}/ac`;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch attendance summary
        const summaryRes = await axios.get(`${hostname}/hr/line-manpower/analytics/attendance-summary`, {
          params: { startDate: fromDate, endDate: toDate, area: selectedLine, type: selectedType }
        });
        setAttendanceSummary(summaryRes.data || []);
      } catch (error) {
        console.error("Error fetching summary:", error);
        setAttendanceSummary([]);
      }

      try {
        // Fetch status trend
        const trendRes = await axios.get(`${hostname}/hr/line-manpower/analytics/employee-status-trend`, {
          params: { startDate: fromDate, endDate: toDate, area: selectedLine, viewType: trendViewType }
        });
        setStatusTrend(trendRes.data || []);
      } catch (error) {
        console.error("Error fetching status trend:", error);
        setStatusTrend([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fromDate, toDate, selectedLine, selectedType, trendViewType, refreshTrigger, hostname]);

  // Map data to Recharts format
  const attendanceChartData = useMemo(() => {
    return attendanceSummary.map((d) => {
      const sanctioned = selectedLine === "IDU" ? Number(d.idu_sanctioned || 0) : Number(d.odu_sanctioned || 0);
      const present = selectedLine === "IDU" ? Number(d.idu_present || 0) : Number(d.odu_present || 0);
      const poolPresent = selectedLine === "IDU" 
        ? Number(d.idu_pool_present || 0) 
        : selectedLine === "ODU" 
          ? Number(d.odu_pool_present || 0) 
          : 0;
      const absent = Math.max(0, sanctioned - present);
      return {
        date: d.punch_date ? new Date(d.punch_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
        "Present": present,
        "Pool Present": poolPresent,
        "Absent": absent
      };
    });
  }, [attendanceSummary, selectedLine]);

  const absencePercentageData = useMemo(() => {
    return attendanceSummary.map((d) => {
      const p_odu = Number(d.odu_present || 0);
      const p_idu = Number(d.idu_present || 0);
      const sanctioned = selectedLine === "IDU" ? Number(d.idu_sanctioned || 0) : Number(d.odu_sanctioned || 0);
      const present = selectedLine === "IDU" ? p_idu : p_odu;
      const gap = Math.max(0, sanctioned - present);
      const percent = sanctioned > 0 ? parseFloat(((gap / sanctioned) * 100).toFixed(1)) : 0;
      return {
        date: d.punch_date ? new Date(d.punch_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
        percentage: percent
      };
    });
  }, [attendanceSummary, selectedLine]);

  const statusTrendChartData = useMemo(() => {
    return statusTrend.map((d) => ({
      period: d.period || "",
      "Active %": d.active_percent || 0,
      "Inactive %": d.inactive_percent || 0
    }));
  }, [statusTrend]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/hr">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-blue-500" />
              Manpower Analytics
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live trend lines and statistics of active shopfloor workers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            disabled={loading}
            className="h-9 w-9 border-border bg-card"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-muted-foreground" : "text-blue-500"}`} />
          </Button>
        </div>
      </div>

      {/* FILTER BAR CARD */}
      <Card className="border-border/60 shadow-md">
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Line</Label>
            <select
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background text-foreground text-xs px-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="IDU">IDU Line</option>
              <option value="ODU">ODU Line</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Type</Label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background text-foreground text-xs px-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="1">Active</option>
              <option value="2">Pool</option>
              <option value="1,2">Active & Pool</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">From Date</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">To Date</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Trend Interval</Label>
            <select
              value={trendViewType}
              onChange={(e) => setTrendViewType(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background text-foreground text-xs px-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="daily">Daily View</option>
              <option value="monthly">Monthly View</option>
            </select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs text-muted-foreground font-medium">Re-calculating trend plots and status summaries...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Chart 1: Attendance Trend Bar Chart */}
          <Card className="border-border/60 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Attendance Trends - {selectedLine === "IDU" ? "IDU" : "ODU"} Line
              </CardTitle>
              <CardDescription className="text-[10px]">
                Stacked representation of roster presence, pool workers, and absent counts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full pt-4">
                {attendanceChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontSize: '11px' }} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="rect"
                        iconSize={10}
                        formatter={(value) => <span className="text-[10px] font-semibold text-muted-foreground uppercase">{value}</span>} 
                      />
                      <Bar dataKey="Present" stackId="a" fill={selectedLine === "IDU" ? "#6366f1" : "#8b5cf6"} />
                      <Bar dataKey="Pool Present" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="Absent" stackId="a" fill="#ff5252" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No data loaded for selected parameters.</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chart 2: Absence Trend Line Chart */}
          <Card className="border-border/60 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Absence Percentage Trend - {selectedLine === "IDU" ? "IDU" : "ODU"} Line
              </CardTitle>
              <CardDescription className="text-[10px]">
                Timeline of absence rate percentage calculated against active targets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full pt-4">
                {absencePercentageData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={absencePercentageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} tickFormatter={(value) => `${value}%`} axisLine={false} tickLine={false} />
                      <RechartsTooltip formatter={(value) => [`${value}%`, "Absence Rate"]} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontSize: '11px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="percentage" 
                        stroke="#ff5252" 
                        strokeWidth={3} 
                        activeDot={{ r: 6 }} 
                        dot={{ stroke: '#ff5252', strokeWidth: 2, r: 4, fill: 'white' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No data loaded for selected parameters.</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chart 3: Active Status Trend Bar Chart */}
          <Card className="border-border/60 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Workforce Active Status Trend - {selectedLine === "IDU" ? "IDU" : "ODU"} Line
              </CardTitle>
              <CardDescription className="text-[10px]">
                Rostered worker distribution showing active vs inactive roster shares.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full pt-4">
                {statusTrendChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusTrendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="period" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} tickFormatter={(value) => `${value}%`} axisLine={false} tickLine={false} />
                      <RechartsTooltip formatter={(value) => [`${value}%`, ""]} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontSize: '11px' }} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="rect"
                        iconSize={10}
                        formatter={(value) => <span className="text-[10px] font-semibold text-muted-foreground uppercase">{value}</span>} 
                      />
                      <Bar dataKey="Active %" stackId="a" fill="#22c55e" />
                      <Bar dataKey="Inactive %" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No data loaded for selected parameters.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
