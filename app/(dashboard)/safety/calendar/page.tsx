"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, Calendar, Info, AlertTriangle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

export default function SafetyCalendarPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState<any>({ scaldata: {} });

  // Date selection states (default to current month/year)
  const today = new Date();
  const [monthSelected, setMonthSelected] = useState<string>(String(today.getMonth() + 1));
  const [yearSelected, setYearSelected] = useState<string>(String(today.getFullYear()));

  const API_HOST = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";
  const safetyDataBase = API_HOST;

  const months = [
    { label: "January", value: "1" },
    { label: "February", value: "2" },
    { label: "March", value: "3" },
    { label: "April", value: "4" },
    { label: "May", value: "5" },
    { label: "June", value: "6" },
    { label: "July", value: "7" },
    { label: "August", value: "8" },
    { label: "September", value: "9" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" }
  ];

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const list = [];
    for (let i = 0; i < 5; i++) {
      list.push(String(currentYear - i));
    }
    return list;
  }, []);

  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${safetyDataBase}/safety/ohc/calender`, {
        month: monthSelected.padStart(2, "0"),
        year: yearSelected,
        plant: "AC"
      });
      if (response.data) {
        setCalendarData(response.data);
      } else {
        setCalendarData({ scaldata: {} });
      }
    } catch (error) {
      console.error("Error fetching safety calendar data:", error);
      toast.error("Failed to load safety calendar data");
      setCalendarData({ scaldata: {} });
    } finally {
      setLoading(false);
    }
  }, [monthSelected, yearSelected, safetyDataBase]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchCalendarData();
    }
  }, [fetchCalendarData, mounted]);

  // Generates date strings for the target month padded to 31 items
  const dateRange = useMemo(() => {
    const yearNum = parseInt(yearSelected);
    const monthNum = parseInt(monthSelected);
    const dateRangeList = [];
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      dateRangeList.push(dStr);
    }
    // Pad to 31 items
    while (dateRangeList.length < 31) {
      dateRangeList.push("");
    }
    return dateRangeList;
  }, [monthSelected, yearSelected]);

  const activeMonthName = useMemo(() => {
    const item = months.find((m) => m.value === monthSelected);
    return item ? item.label : "";
  }, [monthSelected]);

  // Render cell helper
  const renderCell = (date: string) => {
    if (!date) {
      return <div className="h-14 sm:h-16 border border-border/10 bg-muted/5 flex items-center justify-center text-xs font-semibold text-muted-foreground/30 shadow-inner rounded-md" />;
    }

    const dayNum = date.slice(-2);
    const incidentDescription = calendarData?.scaldata?.[date];
    const isIncident = !!incidentDescription;

    const cellEl = (
      <div
        className={`h-14 sm:h-16 flex flex-col items-center justify-center border font-bold text-xs sm:text-sm rounded-md shadow-sm transition-all cursor-pointer ${
          isIncident
            ? "bg-rose-500 text-white border-rose-600 hover:bg-rose-600 shadow-rose-500/10"
            : "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-emerald-500/10"
        }`}
      >
        <span>{dayNum}</span>
        {isIncident && <AlertTriangle className="w-3.5 h-3.5 mt-1 animate-bounce" />}
      </div>
    );

    if (isIncident) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            {cellEl}
          </PopoverTrigger>
          <PopoverContent className="w-64 bg-card border-border/80 text-foreground p-3 text-xs shadow-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-500 uppercase tracking-wider text-[10px]">Incident Details ({dayNum})</p>
                <p className="leading-relaxed text-muted-foreground">{incidentDescription}</p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          {cellEl}
        </PopoverTrigger>
        <PopoverContent className="w-52 bg-card border-border/80 text-foreground p-3 text-xs shadow-md">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-emerald-500 uppercase tracking-wider text-[10px]">Safe Work Day</p>
              <p className="text-muted-foreground">No safety incidents reported on {dayNum}-{activeMonthName.substring(0, 3)}.</p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6">
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
              Safety Calendar
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visual safety cross calendar reporting safe workdays vs recorded incidents.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-36">
            <Select value={monthSelected} onValueChange={setMonthSelected}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-xs">
                    {m.label.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-28">
            <Select value={yearSelected} onValueChange={setYearSelected}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y} className="text-xs">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* SAFETY CALENDAR RED CROSS SHAPE GRID */}
      <Card className="border-border/60 shadow-sm bg-card overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-md font-bold uppercase text-foreground">
              {activeMonthName} {yearSelected}
            </CardTitle>
            <CardDescription className="text-xs">
              Daily status tracking cross layout structure
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-500 rounded" />
              <span className="text-muted-foreground">Safe Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-rose-500 rounded" />
              <span className="text-muted-foreground">Incident Reported</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-8 flex justify-center bg-card/50">
          {loading ? (
            <div className="h-96 flex items-center justify-center w-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="w-full max-w-lg space-y-2">
              {/* Row 1: 2 Blanks, slice(0,3), 2 Blanks */}
              <div className="grid grid-cols-7 gap-2">
                <div className="col-span-2" />
                {dateRange.slice(0, 3).map((d) => (
                  <div key={d || "r1-empty"} className="col-span-1">{renderCell(d)}</div>
                ))}
                <div className="col-span-2" />
              </div>

              {/* Row 2: 2 Blanks, slice(3,6), 2 Blanks */}
              <div className="grid grid-cols-7 gap-2">
                <div className="col-span-2" />
                {dateRange.slice(3, 6).map((d) => (
                  <div key={d || "r2-empty"} className="col-span-1">{renderCell(d)}</div>
                ))}
                <div className="col-span-2" />
              </div>

              {/* Row 3: slice(6,13) */}
              <div className="grid grid-cols-7 gap-2">
                {dateRange.slice(6, 13).map((d, idx) => (
                  <div key={d || `r3-${idx}`} className="col-span-1">{renderCell(d)}</div>
                ))}
              </div>

              {/* Row 4: slice(13,20) */}
              <div className="grid grid-cols-7 gap-2">
                {dateRange.slice(13, 20).map((d, idx) => (
                  <div key={d || `r4-${idx}`} className="col-span-1">{renderCell(d)}</div>
                ))}
              </div>

              {/* Row 5: slice(20,27) */}
              <div className="grid grid-cols-7 gap-2">
                {dateRange.slice(20, 27).map((d, idx) => (
                  <div key={d || `r5-${idx}`} className="col-span-1">{renderCell(d)}</div>
                ))}
              </div>

              {/* Row 6: 2 Blanks, slice(27,30), 2 Blanks */}
              <div className="grid grid-cols-7 gap-2">
                <div className="col-span-2" />
                {dateRange.slice(27, 30).map((d) => (
                  <div key={d || "r6-empty"} className="col-span-1">{renderCell(d)}</div>
                ))}
                <div className="col-span-2" />
              </div>

              {/* Row 7: 2 Blanks, 1 Cross Spacer, slice(30,31), 1 Cross Spacer, 2 Blanks */}
              <div className="grid grid-cols-7 gap-2">
                <div className="col-span-2" />
                <div className="col-span-1 h-14 sm:h-16 border border-emerald-600/30 bg-emerald-500/10 rounded-md" />
                <div className="col-span-1">
                  {renderCell(dateRange[30])}
                </div>
                <div className="col-span-1 h-14 sm:h-16 border border-emerald-600/30 bg-emerald-500/10 rounded-md" />
                <div className="col-span-2" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
