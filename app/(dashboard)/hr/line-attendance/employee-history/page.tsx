"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, RefreshCw, User, Calendar, MapPin, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";
import { toast } from "sonner";

// Recharts imports
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

interface HistoryLog {
  id: number;
  punch_date: string;
  punchtime: string;
  status: string;
}

interface StatsItem {
  status: string;
  count: number;
}

interface HistoryResponse {
  stats: StatsItem[];
  history: HistoryLog[];
}

function HistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const empCode = searchParams.get("empCode") || "";
  const empName = searchParams.get("empName") || "Employee";
  const agency = searchParams.get("agency") || "N/A";
  const area = searchParams.get("area") || "N/A";
  const station = searchParams.get("station") || "N/A";

  const [historyData, setHistoryData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("all");

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";
  const hostname = `${apiBase}/ac`;

  // FY calculation
  const today = new Date();
  const currentMonth = today.getMonth();
  const fyYear = currentMonth >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  const fyText = `FY ${fyYear}-${String(fyYear + 1).slice(2)}`;

  // FY Months
  const fyMonths = useMemo(() => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const months = [];
    const fyStartYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
    const fyStartDate = new Date(fyStartYear, 3, 1);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const tempDate = new Date(fyStartDate);

    while (
      tempDate.getFullYear() < currentYear ||
      (tempDate.getFullYear() === currentYear && tempDate.getMonth() <= currentMonth)
    ) {
      const year = tempDate.getFullYear();
      const month = tempDate.getMonth();
      months.push({
        label: `${monthNames[month]} ${year}`,
        value: `${year}-${String(month + 1).padStart(2, "0")}`,
        year,
        month,
      });
      tempDate.setMonth(tempDate.getMonth() + 1);
    }
    return months;
  }, []);

  const getDatesForSelection = (selection: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (selection === "all") {
      return {
        startDate: `${fyYear}-04-01`,
        endDate: todayStr,
      };
    }
    const found = fyMonths.find((m) => m.value === selection);
    if (!found) {
      return {
        startDate: `${fyYear}-04-01`,
        endDate: todayStr,
      };
    }
    const startDate = `${found.value}-01`;
    const lastDay = new Date(found.year, found.month + 1, 0).getDate();
    const endDate = `${found.value}-${String(lastDay).padStart(2, "0")}`;
    return { startDate, endDate };
  };

  const getSelectedMonthLabel = () => {
    if (selectedMonth === "all") return fyText;
    const found = fyMonths.find((m) => m.value === selectedMonth);
    return found ? found.label : fyText;
  };

  useEffect(() => {
    if (!empCode) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { startDate, endDate } = getDatesForSelection(selectedMonth);
        const response = await axios.get(`${hostname}/hr/line-manpower/analytics/employee-stats`, {
          params: { empCode, startDate, endDate },
        });
        setHistoryData(response.data || null);
      } catch (error) {
        console.error("Error fetching employee history:", error);
        toast.error("Failed to load attendance logs.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [empCode, selectedMonth, hostname]);

  // Pie chart calculation
  const pieChartData = useMemo(() => {
    if (!historyData?.stats) return [];
    return historyData.stats.map((s) => ({
      name: s.status,
      value: s.count,
    }));
  }, [historyData]);

  // Line chart calculation
  const trendChartData = useMemo(() => {
    if (!historyData?.history) return [];
    return [...historyData.history]
      .sort((a, b) => new Date(a.punch_date).getTime() - new Date(b.punch_date).getTime())
      .map((h) => ({
        date: h.punch_date ? new Date(h.punch_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
        value: h.status === "PRESENT" ? 1 : 0,
        statusLabel: h.status
      }));
  }, [historyData]);

  const historyLogs = useMemo(() => {
    if (!historyData?.history) return [];
    return historyData.history.map((h, idx) => ({
      id: idx + 1,
      punch_date: h.punch_date ? h.punch_date.slice(0, 10) : "-",
      punchtime: h.punchtime || "--:--",
      status: h.status?.toUpperCase() || "ABSENT"
    }));
  }, [historyData]);

  const COLORS = {
    PRESENT: "#10b981", // emerald
    ABSENT: "#f43f5e",  // rose
  };

  const columns: ColumnConfig<any>[] = [
    {
      header: "Punch Date",
      accessorKey: "punch_date",
      isSortable: true,
      isFilterable: true
    },
    {
      header: "Clock-In Time",
      accessorKey: "punchtime",
      isSortable: true
    },
    {
      header: "Roster Status",
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
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
              <User className="w-6 h-6 text-blue-500" />
              Employee History
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Attendance logs and analytics for <span className="font-semibold text-foreground">{empName}</span> ({empCode}).
            </p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background text-foreground text-xs px-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[150px]"
          >
            <option value="all">All ({fyText})</option>
            {fyMonths.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <div className="h-9 px-3 border border-border rounded-lg flex items-center bg-muted/30 text-xs font-bold text-foreground">
            {getSelectedMonthLabel()}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs text-muted-foreground font-medium">Loading history logs & analytics charts...</span>
        </div>
      ) : historyData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Attendance Distribution Card */}
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Attendance Distribution</CardTitle>
                <CardDescription className="text-[10px]">Percentage of present vs absent days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-56 w-full">
                  {pieChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.name === "PRESENT" ? COLORS.PRESENT : COLORS.ABSENT} 
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            fontSize: '11px', 
                            border: '1px solid var(--border)',
                            backgroundColor: 'white'
                          }} 
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36} 
                          iconType="circle"
                          iconSize={8}
                          formatter={(value) => <span className="text-[10px] font-semibold text-muted-foreground uppercase">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No data available</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Attendance Trend Card */}
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Attendance Trend</CardTitle>
                <CardDescription className="text-[10px]">Log timeline showing shift attendance status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-56 w-full">
                  {trendChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          ticks={[0, 1]}
                          tickFormatter={(value) => value === 1 ? "P" : "A"}
                          tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 800 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <RechartsTooltip 
                          formatter={(value, name, props) => [props.payload.statusLabel, "Status"]}
                          contentStyle={{ 
                            borderRadius: '8px', 
                            fontSize: '11px', 
                            border: '1px solid var(--border)',
                            backgroundColor: 'white'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorValue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No data available</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Profile Info Card */}
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Employee Profile</CardTitle>
                <CardDescription className="text-[10px]">Registered organizational details</CardDescription>
              </CardHeader>
              <CardContent className="h-56 flex flex-col justify-center space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase block">Agency Provider</span>
                    <span className="text-xs font-bold text-foreground">{agency}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase block">Allocated Area</span>
                    <span className="text-xs font-bold text-foreground">{area}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase block">Line Station</span>
                    <span className="text-xs font-bold text-foreground">{station}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* HISTORY LOG TABLE CARD */}
          <Card className="border-border/60 shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent border-b border-border/40 pb-4">
              <CardTitle className="text-sm font-bold tracking-wide text-foreground uppercase">
                Attendance History Logs
              </CardTitle>
              <CardDescription className="text-xs">
                Detailed day-to-day roster audit history for the selected fiscal range.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <CommonTable
                data={historyLogs}
                columns={columns}
                loading={false}
                enableFiltering={true}
                enableExport={true}
                exportFileName={`${empName}_history_${fyText}.csv`}
                noDataMessage="No historical logs found for the selected month range."
                initialPageSize={10}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-muted-foreground/20 rounded-2xl bg-card">
          <h4 className="text-sm font-semibold text-muted-foreground">Failed to load history data for employee code {empCode}.</h4>
        </div>
      )}
    </div>
  );
}

export default function EmployeeHistoryPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-xs text-muted-foreground">Loading details...</span>
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}
