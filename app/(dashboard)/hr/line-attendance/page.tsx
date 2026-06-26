"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Users, CheckCircle2, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Employee {
  id: number;
  emp_code: string;
  emp_name: string;
  station_no?: string;
  punchtime?: string;
  punchtimeout?: string;
  status: string;
  active: number;
  area?: string;
  agency?: string;
}

interface GroupedArea {
  name: string;
  employees: Employee[];
  total: number;
  present: number;
  activeTotal: number;
  poolTotal: number;
  activePresent: number;
  poolPresent: number;
}

export default function LineAttendancePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [plant] = useState("AC");
  const [attendanceData, setAttendanceData] = useState<Employee[]>([]);
  const [totalheadcount, setTotalheadcount] = useState<any[]>([]);
  const [poolCounterData, setPoolCounterData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedLine, setSelectedLine] = useState("IDU");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedArea, setSelectedArea] = useState("ALL");
  const [selectedType, setSelectedType] = useState("1"); // "1" for Active, "2" for Pool, "ALL" for both

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";
  const hostname = `${apiBase}/ac`;

  useEffect(() => {
    setMounted(true);
    setSelectedDate(new Date().toISOString().split("T")[0]);
  }, []);

  const fetchData = async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const deprt = selectedLine === "IDU" ? "IDU" : selectedLine === "ODU" ? "ODU" : selectedLine === "Paintshop" ? "Paintshop" : "QC";
      
      const res = await fetch(`${hostname}/hr/line-manpower/attendance?date=${selectedDate}&deprt=${deprt}`);
      const data = await res.json();
      
      setTotalheadcount(data.totalheadcount || []);
      setPoolCounterData(data.poolCounter || []);
      
      if (data && data.manpowerpunchData) {
        const sortedData = [...data.manpowerpunchData].sort((a, b) =>
          a.emp_name.localeCompare(b.emp_name)
        );
        setAttendanceData(sortedData);
      } else {
        setAttendanceData([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to fetch shopfloor attendance data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && selectedDate) {
      fetchData();
      setSelectedArea("ALL");
    }
  }, [mounted, selectedDate, selectedLine]);

  if (!mounted) return null;

  const lineOptions = [
    { value: "IDU", label: "IDU" },
    { value: "ODU", label: "ODU" },
    { value: "QC", label: "QC" },
    { value: "Paintshop", label: "Paintshop" }
  ];

  // Grouping by area
  const groupedData = attendanceData.reduce<Record<string, GroupedArea>>((acc, current) => {
    const area = current.area || "OTHERS";
    if (!acc[area]) {
      acc[area] = {
        name: area,
        employees: [],
        total: 0,
        present: 0,
        activeTotal: 0,
        poolTotal: 0,
        activePresent: 0,
        poolPresent: 0
      };
    }
    acc[area].employees.push(current);
    acc[area].total += 1;
    if (current.status === "PRESENT") {
      acc[area].present += 1;
      if (current.active === 1) acc[area].activePresent += 1;
      else if (current.active === 2) acc[area].poolPresent += 1;
    }
    if (current.active === 1) acc[area].activeTotal += 1;
    else if (current.active === 2) acc[area].poolTotal += 1;
    return acc;
  }, {});

  const areaOptions = [
    { value: "ALL", label: "ALL AREAS" },
    ...Object.keys(groupedData).sort().map(area => ({ value: area, label: area }))
  ];

  // Filter based on Selected Type & Selected Area
  const filteredAttendance = attendanceData.filter(emp => {
    const matchesArea = selectedArea === "ALL" || (emp.area || "OTHERS") === selectedArea;
    const matchesType = selectedType === "ALL" || 
                        (selectedType === "1" && emp.active === 1) || 
                        (selectedType === "2" && emp.active === 2);
    return matchesArea && matchesType;
  });

  const activePresent = filteredAttendance.filter(e => e.active === 1 && e.status === "PRESENT").length;
  const activeTotal = filteredAttendance.filter(e => e.active === 1).length;

  const currentLinePoolEntry = poolCounterData.find(p => p.line.toUpperCase() === selectedLine.toUpperCase());
  const poolPresent = currentLinePoolEntry ? currentLinePoolEntry.counter : filteredAttendance.filter(e => e.active === 2 && e.status === "PRESENT").length;
  const poolTotal = currentLinePoolEntry ? currentLinePoolEntry.counter : filteredAttendance.filter(e => e.active === 2).length;

  const hasActiveType = selectedType === "ALL" || selectedType === "1";
  const hasPoolType = selectedType === "ALL" || selectedType === "2";

  let sitePresent = 0;
  if (hasActiveType) sitePresent += activePresent;
  if (hasPoolType) sitePresent += poolPresent;

  let siteTotal = 0;
  if (hasActiveType) siteTotal += activeTotal;
  if (hasPoolType) siteTotal += poolTotal;

  const isMultiType = selectedType === "ALL";
  const currentSanctioned = totalheadcount.find(h => h.line === selectedLine)?.headcount || 0;

  const checkAccessAndNavigate = (targetPath: string, queryParams: any = {}) => {
    const storedData = sessionStorage.getItem("logindata");
    if (!storedData) {
      toast.error("Unauthorized Access! Please log in.");
      return;
    }
    const access = JSON.parse(storedData);
    if (access?.hr_access === 1 || access?.production_access === 1) {
      if (targetPath.includes("update-list")) {
        // Next.js state passing is done via session storage or URL parameters,
        // so we can store this temporary payload in sessionStorage
        sessionStorage.setItem("manpowerUpdatePayload", JSON.stringify({
          areaName: "ALL",
          manpowerAreaCount: attendanceData,
          worktype: "ALL"
        }));
      }
      const searchParams = new URLSearchParams(queryParams).toString();
      router.push(`${targetPath}${searchParams ? "?" + searchParams : ""}`);
    } else {
      toast.error("You do not have access permissions for this operation.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/hr">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-500" />
              Shopfloor Attendance
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live status dashboard for operational assembly lines and team presence.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => checkAccessAndNavigate("/hr/line-attendance/update-list")}
            className="text-xs h-9"
          >
            Update List
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={() => checkAccessAndNavigate("/hr/line-attendance/headcount-config")}
            className="text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Headcount Config
          </Button>
        </div>
      </div>

      {/* CONTROLS GRID */}
      <Card className="border-border/60 shadow-md">
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Line</Label>
            <select
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background text-foreground text-xs px-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {lineOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Area</Label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background text-foreground text-xs px-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {areaOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Type</Label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background text-foreground text-xs px-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="1">Active</option>
              <option value="2">Pool</option>
              <option value="ALL">Active & Pool</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Date</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>
      </Card>

      {/* SUMMARY STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {totalheadcount.length > 0 && (
          <Card className="relative overflow-hidden border-border/60 shadow-sm bg-card hover:shadow-md transition-shadow">
            <div className="p-5 flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Contractual Sanctioned</span>
              <span className="text-3xl font-extrabold text-blue-600 mt-2">{currentSanctioned}</span>
              <span className="text-[10px] text-muted-foreground mt-1">Required Target Headcount</span>
            </div>
            <div className="absolute left-0 top-0 h-full w-1.5 bg-blue-500" />
          </Card>
        )}

        <Card 
          onClick={() => router.push(`/hr/line-attendance/details?type=present&line=${selectedLine}&date=${selectedDate}&label=${selectedLine}`)}
          className="relative overflow-hidden border-border/60 shadow-sm bg-card hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5"
        >
          <div className="p-5 flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Present</span>
            <span className="text-3xl font-extrabold text-emerald-600 mt-2">
              {isMultiType ? (
                <>
                  {activePresent} <span className="text-xs text-muted-foreground font-normal">+</span> {poolPresent}
                </>
              ) : sitePresent}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1">
              Active Workers {isMultiType && "(Active + Pool)"}
            </span>
          </div>
          <div className="absolute left-0 top-0 h-full w-1.5 bg-emerald-500" />
        </Card>

        <Card 
          onClick={() => router.push(`/hr/line-attendance/details?type=absent&line=${selectedLine}&date=${selectedDate}&label=${selectedLine}`)}
          className="relative overflow-hidden border-border/60 shadow-sm bg-card hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5"
        >
          <div className="p-5 flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Absent</span>
            <span className="text-3xl font-extrabold text-rose-600 mt-2">
              {currentSanctioned > 0 ? (
                currentSanctioned - (isMultiType ? (activePresent + poolPresent) : sitePresent)
              ) : (
                isMultiType ? (activeTotal - activePresent) : (siteTotal - sitePresent)
              )}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1">Unreported Shift Vacancies</span>
          </div>
          <div className="absolute left-0 top-0 h-full w-1.5 bg-rose-500" />
        </Card>

        <Card 
          onClick={() => router.push(`/hr/line-attendance/details?type=all&line=${selectedLine}&date=${selectedDate}&label=${selectedLine}`)}
          className="relative overflow-hidden border-border/60 shadow-sm bg-card hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5"
        >
          <div className="p-5 flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Team</span>
            <span className="text-3xl font-extrabold text-foreground mt-2">
              {isMultiType ? (activeTotal + poolTotal) : siteTotal}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1">
              Rostered Personnel {isMultiType && "(Active + Pool)"}
            </span>
          </div>
          <div className="absolute left-0 top-0 h-full w-1.5 bg-zinc-500" />
        </Card>
      </div>

      {/* WORK AREAS & EMPLOYEES GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs text-muted-foreground font-medium">Synchronizing live data with Command Center...</span>
        </div>
      ) : Object.keys(groupedData).length > 0 ? (
        <div className="space-y-4">
          {Object.values(groupedData)
            .filter(area => selectedArea === "ALL" || area.name === selectedArea)
            .map((area, idx) => {
              const attendanceRate = area.total > 0 ? Math.round((area.present / area.total) * 100) : 0;
              return (
                <Card key={idx} className="overflow-hidden border-border/60 shadow-md">
                  <div className="flex flex-col md:flex-row align-stretch min-h-[140px]">
                    {/* Area Info Sidebar */}
                    <div className="md:w-56 bg-slate-900 text-white p-5 flex flex-col justify-between shrink-0">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Line Area</span>
                        <h3 className="text-base font-extrabold tracking-tight mt-0.5 uppercase">{area.name}</h3>
                      </div>
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between items-end text-xs">
                          <span className="font-semibold text-slate-300">
                            {isMultiType ? (
                              <>
                                <span>{area.activePresent}</span>
                                <span className="text-[10px] opacity-40 mx-0.5">+</span>
                                <span>{area.poolPresent}</span>
                              </>
                            ) : area.present}
                            <span className="opacity-30 mx-1">/</span>
                            {isMultiType ? (
                              <>
                                <span>{area.activeTotal}</span>
                                <span className="text-[10px] opacity-40 mx-0.5">+</span>
                                <span>{area.poolTotal}</span>
                              </>
                            ) : area.total}
                          </span>
                          <span className={`font-bold ${attendanceRate === 100 ? "text-emerald-400" : "text-amber-400"}`}>{attendanceRate}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${attendanceRate === 100 ? "bg-emerald-500" : "bg-amber-500"}`} 
                            style={{ width: `${attendanceRate}%` }} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Employee Cards Container */}
                    <div className="flex-1 overflow-x-auto p-4 flex items-center gap-3 select-none scrollbar-thin">
                      {area.employees.map((emp, eidx) => {
                        const isAbsent = emp.status === "ABSENT";
                        return (
                          <div
                            key={eidx}
                            className={`min-w-[130px] p-3 rounded-xl border flex flex-col items-center justify-between text-center transition-all bg-card shadow-sm hover:shadow-md hover:-translate-y-1 border-t-4 ${
                              isAbsent 
                                ? "border-rose-500 border-t-rose-500 bg-rose-500/[0.01]" 
                                : "border-emerald-500 border-t-emerald-500 bg-emerald-500/[0.01]"
                            }`}
                          >
                            <span className="text-[9px] font-bold text-muted-foreground bg-muted/60 p-1 px-2 rounded-md uppercase">
                              {emp.station_no || `ST-${eidx + 1}`}
                            </span>
                            <span className={`text-xs font-bold mt-2 truncate w-full min-h-[32px] line-clamp-2 px-1 ${isAbsent ? "text-rose-900 dark:text-rose-200" : "text-foreground"}`}>
                              {emp.emp_name}
                            </span>
                            {isAbsent ? (
                              <span className="text-[9px] font-extrabold text-rose-500 bg-rose-500/10 p-1 px-2 rounded-full inline-flex items-center gap-1 mt-2">
                                <AlertCircle className="w-2.5 h-2.5" /> ABSENT
                              </span>
                            ) : (
                              <span className="text-[9px] font-extrabold text-emerald-500 bg-emerald-500/10 p-1 px-2 rounded-full inline-flex items-center gap-1 mt-2">
                                <CheckCircle2 className="w-2.5 h-2.5" /> {emp.punchtime || "08:00"}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-muted-foreground/20 rounded-2xl bg-card">
          <Sparkles className="w-10 h-10 mx-auto text-muted-foreground/60 mb-2" />
          <h4 className="text-sm font-semibold text-muted-foreground">No operational data matches your filters for this period.</h4>
        </div>
      )}
    </div>
  );
}
