"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import ReactECharts from "echarts-for-react";
import Link from "next/link";
import { ArrowLeft, Plus, Calendar, Clock, GraduationCap, Download, BarChart2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";
import CommonDialog from "@/components/shared/CommonDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface TrainingRecord {
  id?: number;
  date: string;
  details: string;
  total_program: number;
  participants: number;
  duration: number;
  men_hours: number;
  men_days: number;
  conducted_by: string;
}

interface TrainingTopicOption {
  value: string;
  label: string;
}

export default function SafetyTrainingPage() {
  const [mounted, setMounted] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedTopicFilter, setSelectedTopicFilter] = useState("All");

  // Data States
  const [trainingList, setTrainingList] = useState<TrainingRecord[]>([]);
  const [topicOptions, setTopicOptions] = useState<TrainingTopicOption[]>([]);
  
  // Form States
  const [formDate, setFormDate] = useState("");
  const [formDetails, setFormDetails] = useState("");
  const [formTotalProgram, setFormTotalProgram] = useState("1");
  const [formParticipants, setFormParticipants] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formConductedBy, setFormConductedBy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_HOST = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";

  const fetchTrainingRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_HOST}/safety/training_record`, {
        key: "GET",
        plant: "AC",
      });
      if (response.data && response.data.success) {
        setTrainingList(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching training records:", error);
      toast.error("Failed to load training ledger history");
    } finally {
      setLoading(false);
    }
  }, [API_HOST]);

  const fetchTopicOptions = useCallback(async () => {
    try {
      const response = await axios.get(`${API_HOST}/safety/training_name`);
      if (response.data && response.data.success) {
        const options = (response.data.data || []).map((item: any) => ({
          value: item.topic_name,
          label: item.topic_label || item.topic_name,
        }));
        setTopicOptions(options);
      }
    } catch (error) {
      console.error("Error fetching training names:", error);
    }
  }, [API_HOST]);

  useEffect(() => {
    setMounted(true);
    fetchTrainingRecords();
    fetchTopicOptions();
  }, [fetchTrainingRecords, fetchTopicOptions]);

  // Data processing for Chart & Table
  const filteredTrainingList = useMemo(() => {
    return trainingList.filter((item) => {
      // Date filter
      if (dateRange.start) {
        const itemDate = new Date(item.date).getTime();
        const start = new Date(dateRange.start).getTime();
        if (itemDate < start) return false;
      }
      if (dateRange.end) {
        const itemDate = new Date(item.date).getTime();
        const end = new Date(dateRange.end).getTime();
        if (itemDate > end) return false;
      }
      // Topic filter
      if (selectedTopicFilter !== "All" && item.details !== selectedTopicFilter) {
        return false;
      }
      return true;
    });
  }, [trainingList, dateRange, selectedTopicFilter]);

  const groupedChartData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTrainingList.forEach((item) => {
      const key = item.details || "Unknown";
      if (!map[key]) map[key] = 0;
      map[key] += Number(item.men_hours) || 0;
    });
    return Object.keys(map).map((key) => ({
      name: key,
      value: map[key],
    }));
  }, [filteredTrainingList]);

  // Ledger summary counts
  const summaryTotals = useMemo(() => {
    return filteredTrainingList.reduce(
      (acc, curr) => ({
        programs: acc.programs + (Number(curr.total_program) || 0),
        participants: acc.participants + (Number(curr.participants) || 0),
        duration: acc.duration + (Number(curr.duration) || 0),
        hours: acc.hours + (Number(curr.men_hours) || 0),
        days: acc.days + (Number(curr.men_days) || 0),
      }),
      { programs: 0, participants: 0, duration: 0, hours: 0, days: 0 }
    );
  }, [filteredTrainingList]);

  // Submit record
  const handleStoreData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate || !formDetails || !formParticipants || !formDuration) {
      toast.error("Please fill out all required fields");
      return;
    }

    const participantsNum = parseInt(formParticipants) || 0;
    const durationNum = parseFloat(formDuration) || 0;
    const totalProgNum = parseInt(formTotalProgram) || 1;
    const menHours = participantsNum * durationNum;
    const menDays = menHours / 8;

    const recordToStore = {
      date: formDate,
      details: formDetails,
      total_program: totalProgNum,
      participants: participantsNum,
      duration: durationNum,
      conducted_by: formConductedBy,
      men_hours: menHours,
      men_days: menDays,
    };

    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API_HOST}/safety/training_record`, {
        key: "INSERT",
        formData: recordToStore,
        plant: "AC",
      });

      if (response.status === 200) {
        toast.success("Training record submitted successfully!");
        setShowFormDialog(false);
        fetchTrainingRecords();
        // Reset form
        setFormDate("");
        setFormDetails("");
        setFormTotalProgram("1");
        setFormParticipants("");
        setFormDuration("");
        setFormConductedBy("");
      } else {
        toast.error("Submission failed");
      }
    } catch (error) {
      console.error("API Error during submit:", error);
      toast.error("Error submitting training record");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ECharts options
  const chartOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" }
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "10%",
      top: "12%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: groupedChartData.map((item) => item.name),
      axisLabel: {
        rotate: 15,
        interval: 0,
        fontSize: 10,
        color: "#64748b",
        formatter: (value: string) =>
          value.length > 15 ? value.substring(0, 12) + "..." : value,
      },
      axisLine: { lineStyle: { color: "#cbd5e1" } },
    },
    yAxis: {
      type: "value",
      name: "Men Hours",
      nameTextStyle: { color: "#64748b", fontSize: 10 },
      axisLabel: { color: "#64748b" },
      splitLine: { lineStyle: { type: "dashed", color: "#e2e8f0" } },
    },
    series: [
      {
        name: "Men Hours",
        type: "bar",
        label: {
          show: true,
          position: "top",
          fontSize: 11,
          fontWeight: "bold",
          color: "#475569",
          formatter: "{c} hrs"
        },
        barWidth: "30%",
        data: groupedChartData.map((item) => item.value),
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: "#3b82f6"
        }
      },
    ],
  };

  // Table columns configuration
  const columns = useMemo<ColumnConfig<TrainingRecord>[]>(
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
        header: "Date",
        accessorKey: "date",
        isFilterable: true,
        isSortable: true,
        cell: (row) => {
          try {
            const d = new Date(row.date);
            return `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getFullYear()}`;
          } catch {
            return row.date;
          }
        }
      },
      {
        header: "Training Name / Details",
        accessorKey: "details",
        isFilterable: true,
        isSortable: true,
        className: "text-left font-semibold truncate max-w-[300px]",
      },
      {
        header: "Programs",
        accessorKey: "total_program",
        className: "text-center",
      },
      {
        header: "Participants",
        accessorKey: "participants",
        className: "text-center",
      },
      {
        header: "Duration (hrs)",
        accessorKey: "duration",
        className: "text-center",
      },
      {
        header: "Men Hours",
        accessorKey: "men_hours",
        className: "text-center font-bold text-blue-600 dark:text-blue-400",
        cell: (row) => Number(row.men_hours || 0).toFixed(1),
      },
      {
        header: "Men Days",
        accessorKey: "men_days",
        className: "text-center font-bold text-emerald-600 dark:text-emerald-400",
        cell: (row) => Number(row.men_days || 0).toFixed(2),
      },
      {
        header: "Conducted By",
        accessorKey: "conducted_by",
        isFilterable: true,
        isSortable: true,
        cell: (row) => row.conducted_by || "--",
      },
    ],
    []
  );

  if (!mounted) return null;

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
              Safety Training Dashboard
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track and analyze training metrics, men hours, and compliance ledgers.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowFormDialog(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Record Training
        </Button>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Programs Run</span>
              <span className="text-2xl font-extrabold block">{summaryTotals.programs}</span>
            </div>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <GraduationCap className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Participants</span>
              <span className="text-2xl font-extrabold block">{summaryTotals.participants}</span>
            </div>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Calendar className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Men Hours</span>
              <span className="text-2xl font-extrabold block text-blue-600 dark:text-blue-400">
                {summaryTotals.hours.toFixed(1)}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Men Days Equivalent</span>
              <span className="text-2xl font-extrabold block text-emerald-600 dark:text-emerald-400">
                {summaryTotals.days.toFixed(2)}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BarChart2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTER BAR & CHART */}
      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader className="pb-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/40">
          <div>
            <CardTitle className="text-md font-bold uppercase text-foreground">Visual Analytics</CardTitle>
            <CardDescription className="text-xs">Training Impact Analysis: Men Hours by Program Type</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-52">
              <Select value={selectedTopicFilter} onValueChange={setSelectedTopicFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Filter Topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All" className="text-xs">ALL TOPICS</SelectItem>
                  {topicOptions.map((topic) => (
                    <SelectItem key={topic.value} value={topic.value} className="text-xs">
                      {topic.label.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                className="h-8 text-xs w-[130px] p-2"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                className="h-8 text-xs w-[130px] p-2"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5 h-80">
          {filteredTrainingList.length > 0 ? (
            <ReactECharts option={chartOption} style={{ height: "100%", width: "100%" }} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs font-medium space-y-2">
              <BarChart2 className="w-8 h-8 text-muted-foreground/60" />
              <span>No metrics details recorded in selected filters</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* LEDGER TABLE CARD */}
      <Card className="border-border/60 shadow-sm bg-card">
        <CardHeader className="pb-2 border-b border-border/40">
          <CardTitle className="text-md font-bold uppercase text-foreground">
            Training Attendance Ledger
          </CardTitle>
          <CardDescription className="text-xs">
            Individual logged safety program registrations history
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <CommonTable
            data={filteredTrainingList}
            columns={columns}
            enableFiltering={true}
            enableExport={true}
            exportFileName={`safety_training_ledger_${new Date().toISOString().split("T")[0]}.csv`}
            noDataMessage="No training records registered"
            showTotal={false}
            initialPageSize={10}
          />
        </CardContent>
      </Card>

      {/* RECORD TRAINING DIALOG */}
      <CommonDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        title="Record New Safety Training"
        description="Fill out the fields below to log a safety training session"
      >
        <form onSubmit={handleStoreData} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="date" className="text-xs">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="details" className="text-xs">Training Topic *</Label>
            <Select value={formDetails} onValueChange={setFormDetails}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select topic name" />
              </SelectTrigger>
              <SelectContent>
                {topicOptions.map((topic) => (
                  <SelectItem key={topic.value} value={topic.value} className="text-xs">
                    {topic.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="total_program" className="text-xs">Total Programs</Label>
              <Input
                id="total_program"
                type="number"
                min="1"
                value={formTotalProgram}
                onChange={(e) => setFormTotalProgram(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="participants" className="text-xs">Participants Count *</Label>
              <Input
                id="participants"
                type="number"
                min="1"
                value={formParticipants}
                onChange={(e) => setFormParticipants(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="duration" className="text-xs">Duration (hours) *</Label>
              <Input
                id="duration"
                type="number"
                step="0.1"
                min="0.1"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="conducted_by" className="text-xs">Conducted By</Label>
              <Input
                id="conducted_by"
                type="text"
                placeholder="Name or agency"
                value={formConductedBy}
                onChange={(e) => setFormConductedBy(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowFormDialog(false)}
              className="text-xs h-9"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 min-w-[80px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Submit"}
            </Button>
          </div>
        </form>
      </CommonDialog>
    </div>
  );
}
