// app/(dashboard)/manufacturing/shift-config/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    ArrowLeft,
    Calendar,
    Clock,
    RefreshCw,
    Send,
    CheckCircle2,
    AlertCircle,
    Edit,
    Trash2,
    Plus
} from "lucide-react";
import Link from "next/link";
import { DatePicker } from "@/components/manufacturing/DatePicker";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";
import BreakDialog from "@/components/manufacturing/BreakDialog";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

const API_HOST = process.env.NEXT_PUBLIC_API_BASE_URL;

interface ShiftConfigItem {
    id: number;
    date: string;
    line: string;
    shiftstart: string;
    shiftend: string;
    totalhours: number;
    extensionhours: number;
    reason: string;
    updatedby: string;
    updatedat: string;
}

interface BreakItem {
    id: number;
    date: string;
    line: string;
    startTime: string;
    endTime: string;
    totalMins: number;
    type: string;
    updatedby: string;
    updatedat: string;
}

export default function ShiftConfigPage() {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<"extension" | "shiftTimes">("extension");

    // ==========================================
    // EXTENSION FORM STATE
    // ==========================================
    const [formDate, setFormDate] = useState("");
    const [formLine, setFormLine] = useState<"IDU-Line" | "ODU-Line">("IDU-Line");
    const [extensionHours, setExtensionHours] = useState("");
    const [reason, setReason] = useState("");
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formStatus, setFormStatus] = useState<{ type: "success" | "error" | ""; message: string }>({ type: "", message: "" });

    // ==========================================
    // SHIFT TIMES FORM STATE
    // ==========================================
    const [shiftDate, setShiftDate] = useState("");
    const [shiftLine, setShiftLine] = useState<"IDU-Line" | "ODU-Line">("IDU-Line");
    const [shiftStartDate, setShiftStartDate] = useState("");
    const [shiftStartTime, setShiftStartTime] = useState("08:00");
    const [shiftEndDate, setShiftEndDate] = useState("");
    const [shiftEndTime, setShiftEndTime] = useState("16:30");
    const [shiftSubmitting, setShiftSubmitting] = useState(false);
    const [shiftStatus, setShiftStatus] = useState<{ type: "success" | "error" | ""; message: string }>({ type: "", message: "" });

    // ==========================================
    // SHIFT DETAILS LOGS TABLE FILTER & DATA
    // ==========================================
    const [filterFrom, setFilterFrom] = useState("");
    const [filterTo, setFilterTo] = useState("");
    const [filterLine, setFilterLine] = useState<"IDU-Line" | "ODU-Line" | "ALL">("ALL");
    const [logs, setLogs] = useState<ShiftConfigItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(false);

    // ==========================================
    // BREAK LOGS FILTER, DATA, AND DIALOG STATES
    // ==========================================
    const [breakDate, setBreakDate] = useState("");
    const [breakLine, setBreakLine] = useState<"IDU-Line" | "ODU-Line" | "ALL">("ALL");
    const [breakLogs, setBreakLogs] = useState<BreakItem[]>([]);
    const [breakLoading, setBreakLoading] = useState(true);
    const [breakError, setBreakError] = useState<string | null>(null);
    const [breakRefreshTrigger, setBreakRefreshTrigger] = useState(false);

    const [breakDialogOpen, setBreakDialogOpen] = useState(false);
    const [isBreakEdit, setIsBreakEdit] = useState(false);
    const [editingBreakItem, setEditingBreakItem] = useState<BreakItem | null>(null);

    const [deleteBreakOpen, setDeleteBreakOpen] = useState(false);
    const [breakToDelete, setBreakToDelete] = useState<BreakItem | null>(null);
    const [deleteBreakSubmitting, setDeleteBreakSubmitting] = useState(false);

    useEffect(() => {
        setMounted(true);
        const todayStr = new Date().toISOString().split("T")[0];
        setFormDate(todayStr);
        setShiftDate(todayStr);
        setShiftStartDate(todayStr);
        setShiftEndDate(todayStr);
        setFilterFrom(todayStr);
        setFilterTo(todayStr);
        setBreakDate(todayStr);
    }, []);

    // Fetch Shift Config logs
    const fetchLogs = async () => {
        if (!filterFrom || !filterTo) return;
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_HOST}/production/data/shift-config`, {
                params: {
                    fromDate: filterFrom,
                    toDate: filterTo,
                    line: filterLine,
                }
            });

            if (response.data.success) {
                const mapped: ShiftConfigItem[] = response.data.data.map((item: any) => ({
                    id: item.id,
                    date: item.date,
                    line: item.line,
                    shiftstart: item.shift_start,
                    shiftend: item.shift_end,
                    totalhours: item.total_hours,
                    extensionhours: item.extension_hours,
                    reason: item.reason,
                    updatedby: item.updated_by,
                    updatedat: item.updated_at
                }));
                setLogs(mapped);
            } else {
                setError(response.data.message || "Failed to fetch shift configuration.");
            }
        } catch (err) {
            console.error("Fetch shift config error:", err);
            setError("Failed to load shift config data. Ensure backend is running.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch Operational Break logs
    const fetchBreakLogs = async () => {
        if (!breakDate) return;
        setBreakLoading(true);
        setBreakError(null);
        try {
            const response = await axios.get(`${API_HOST}/production/shift-data/break-data`, {
                params: {
                    date: breakDate,
                    line: breakLine === "ALL" ? "" : breakLine,
                }
            });

            if (response.data.success) {
                const mapped: BreakItem[] = response.data.data.map((item: any) => ({
                    id: item.id,
                    date: item.date,
                    line: item.line,
                    startTime: item.start_time,
                    endTime: item.end_time,
                    totalMins: item.total_mins,
                    type: item.type,
                    updatedby: item.updated_by,
                    updatedat: item.updated_at
                }));
                setBreakLogs(mapped);
            } else {
                setBreakLogs([]);
            }
        } catch (err) {
            console.error("Fetch break logs error:", err);
            setBreakError("Failed to load operational break details.");
        } finally {
            setBreakLoading(false);
        }
    };

    // Columns config for Shift Details Logs
    const columns = useMemo<ColumnConfig<ShiftConfigItem>[]>(() => [
        {
            header: "Date",
            accessorKey: "date",
            isFilterable: true,
            isSortable: true,
            cell: (row) => {
                let displayDate = row.date;
                try {
                    const d = new Date(row.date);
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    displayDate = `${d.getDate().toString().padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
                } catch (e) { }
                return displayDate;
            }
        },
        {
            header: "Line",
            accessorKey: "line",
            isFilterable: true,
            isSortable: true,
        },
        {
            header: "Start",
            accessorKey: "shiftstart",
            cell: (row) => {
                if (row.shiftstart && row.shiftstart.includes(" ")) {
                    return row.shiftstart.split(" ")[1].substring(0, 5);
                }
                return row.shiftstart || "08:00";
            },
        },
        {
            header: "End",
            accessorKey: "shiftend",
            cell: (row) => {
                if (row.shiftend && row.shiftend.includes(" ")) {
                    return row.shiftend.split(" ")[1].substring(0, 5);
                }
                return row.shiftend || "16:30";
            },
        },
        {
            header: "Hours",
            accessorKey: "totalhours",
            className: "text-center",
            cell: (row) => row.totalhours || 8,
        },
        {
            header: "Ext",
            accessorKey: "extensionhours",
            className: "text-amber-600 dark:text-amber-400 font-bold text-center",
            cell: (row) => `+${row.extensionhours}`,
        },
        {
            header: "Reason",
            accessorKey: "reason",
            className: "max-w-[120px] truncate",
            cell: (row) => <span title={row.reason}>{row.reason || "N/A"}</span>,
        },
        {
            header: "Updated By",
            accessorKey: "updatedby",
            isFilterable: true,
            isSortable: true,
        }
    ], []);

    // Columns config for Break Details Logs
    const breakColumns = useMemo<ColumnConfig<BreakItem>[]>(() => [
        {
            header: "Date",
            accessorKey: "date",
            isFilterable: true,
            isSortable: true,
            cell: (row) => {
                let displayDate = row.date;
                try {
                    const d = new Date(row.date);
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    displayDate = `${d.getDate().toString().padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
                } catch (e) { }
                return displayDate;
            }
        },
        {
            header: "Line",
            accessorKey: "line",
            isFilterable: true,
            isSortable: true,
        },
        {
            header: "Type",
            accessorKey: "type",
            isFilterable: true,
            isSortable: true,
            cell: (row) => (
                <span className="capitalize font-semibold text-foreground/90">
                    {row.type === "tea"
                        ? "Tea Break"
                        : row.type === "lunch"
                            ? "Lunch Break"
                            : row.type === "dinner"
                                ? "Dinner Break"
                                : row.type}
                </span>
            ),
        },
        {
            header: "Start Time",
            accessorKey: "startTime",
            cell: (row) => row.startTime || "N/A",
        },
        {
            header: "End Time",
            accessorKey: "endTime",
            cell: (row) => row.endTime || "N/A",
        },
        {
            header: "Total Mins",
            accessorKey: "totalMins",
            className: "text-center font-bold text-rose-500 dark:text-rose-400",
            cell: (row) => row.totalMins || 0,
        },
        {
            header: "Updated By",
            accessorKey: "updatedby",
            isFilterable: true,
            isSortable: true,
        },
        {
            header: "Actions",
            accessorKey: "id",
            isFilterable: false,
            isSortable: false,
            cell: (row) => (
                <div className="flex items-center justify-center gap-1">
                    <Button
                        onClick={() => handleOpenEditBreak(row)}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                    >
                        <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        onClick={() => handleOpenDeleteBreak(row)}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            )
        }
    ], []);

    useEffect(() => {
        if (mounted) {
            fetchLogs();
        }
    }, [filterFrom, filterTo, filterLine, refreshTrigger, mounted]);

    useEffect(() => {
        if (mounted) {
            fetchBreakLogs();
        }
    }, [breakDate, breakLine, breakRefreshTrigger, mounted]);

    // ==========================================
    // EXTENSION FORM ACTIONS
    // ==========================================
    const handleSubmitExtension = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus({ type: "", message: "" });

        if (!formDate) {
            setFormStatus({ type: "error", message: "Please select a date." });
            return;
        }
        if (!extensionHours || isNaN(Number(extensionHours)) || Number(extensionHours) < 0) {
            setFormStatus({ type: "error", message: "Please enter valid extension hours (0 or greater)." });
            return;
        }

        const employeeName = typeof window !== "undefined" ? sessionStorage.getItem("employee_name") || "DEFAULT" : "DEFAULT";

        const payload = {
            date: formDate,
            line: formLine,
            extension: parseFloat(extensionHours),
            reason: reason || "",
            updatedBy: employeeName,
        };

        setFormSubmitting(true);
        try {
            const res = await axios.post(`${API_HOST}/production/data/shift-config`, payload);
            if (res.data.success || res.status === 200 || res.status === 201) {
                setFormStatus({ type: "success", message: "Shift configuration saved successfully." });
                setExtensionHours("");
                setReason("");
                setRefreshTrigger(prev => !prev);
            } else {
                setFormStatus({ type: "error", message: res.data.message || "Failed to save configuration." });
            }
        } catch (err) {
            console.error("Save shift config error:", err);
            const msg = err instanceof Error ? err.message : "Network error, please try again.";
            setFormStatus({ type: "error", message: msg });
        } finally {
            setFormSubmitting(false);
        }
    };

    // ==========================================
    // SHIFT TIMES FORM ACTIONS
    // ==========================================
    const handleSubmitShiftTimes = async (e: React.FormEvent) => {
        e.preventDefault();
        setShiftStatus({ type: "", message: "" });

        if (!shiftDate) {
            setShiftStatus({ type: "error", message: "Please select a configuration date." });
            return;
        }
        if (!shiftStartTime || !shiftEndTime) {
            setShiftStatus({ type: "error", message: "Please provide valid start and end times." });
            return;
        }

        const formatTime = (timeStr: string) => {
            const parts = timeStr.split(":");
            return parts.length === 2 ? `${timeStr}:00` : timeStr;
        };

        const payload = {
            date: shiftDate,
            shiftStart: `${shiftStartDate} ${formatTime(shiftStartTime)}`,
            shiftEnd: `${shiftEndDate} ${formatTime(shiftEndTime)}`,
            line: shiftLine,
        };

        setShiftSubmitting(true);
        try {
            const res = await axios.post(`${API_HOST}/production/shift-data`, payload);
            if (res.data.success || res.status === 200 || res.status === 201) {
                setShiftStatus({ type: "success", message: "Shift operational hours saved successfully." });
                setRefreshTrigger(prev => !prev);
            } else {
                setShiftStatus({ type: "error", message: res.data.message || "Failed to save operational hours." });
            }
        } catch (err: any) {
            console.error("Save shift hours error:", err);
            const errorMsg = err.response?.data?.message || err.message || "Network error. Please try again.";
            setShiftStatus({ type: "error", message: errorMsg });
        } finally {
            setShiftSubmitting(false);
        }
    };

    // ==========================================
    // BREAK LOGS OPERATIONS
    // ==========================================
    const handleOpenAddBreak = () => {
        setIsBreakEdit(false);
        setEditingBreakItem(null);
        setBreakDialogOpen(true);
    };

    const handleOpenEditBreak = (row: BreakItem) => {
        setIsBreakEdit(true);
        setEditingBreakItem(row);
        setBreakDialogOpen(true);
    };

    const handleSaveBreak = async (payload: any, isEdit: boolean) => {
        const employeeName = typeof window !== "undefined" ? sessionStorage.getItem("employee_name") || "DEFAULT" : "DEFAULT";
        const finalPayload = {
            ...payload,
            createdBy: employeeName,
            updatedBy: employeeName,
        };

        const endpoint = isEdit
            ? "/production/shift-data/break-data/update"
            : "/production/shift-data/break-data";

        const res = await axios.post(`${API_HOST}${endpoint}`, finalPayload);
        if (res.data.success || res.status === 200 || res.status === 201) {
            setBreakRefreshTrigger(prev => !prev);
        } else {
            throw new Error(res.data.message || "Failed to save break details.");
        }
    };

    const handleOpenDeleteBreak = (row: BreakItem) => {
        setBreakToDelete(row);
        setDeleteBreakOpen(true);
    };

    const handleDeleteBreakConfirm = async () => {
        if (!breakToDelete) return;
        setDeleteBreakSubmitting(true);
        try {
            const res = await axios.post(`${API_HOST}/production/shift-data/break-data/delete`, {
                id: breakToDelete.id
            });
            if (res.data.success || res.status === 200) {
                setBreakRefreshTrigger(prev => !prev);
                setDeleteBreakOpen(false);
            } else {
                alert(res.data.message || "Failed to delete break.");
            }
        } catch (err: any) {
            console.error("Delete break error:", err);
            alert(err.message || "An error occurred while deleting break.");
        } finally {
            setDeleteBreakSubmitting(false);
            setBreakToDelete(null);
        }
    };

    return (
        <div className="space-y-6 max-w-8xl mx-auto p-2">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/manufacturing">
                    <Button variant="outline" size="icon" className="h-9 w-9">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
                        Shift Configuration
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Manage operational schedules, extensions, and line break timings
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Tabs Card */}
                <Card className="lg:col-span-1 border-border/60 shadow-sm bg-card flex flex-col justify-between">
                    <CardHeader className="pb-3">
                        <div className="flex border-b border-border/40 mb-3">
                            <button
                                type="button"
                                onClick={() => setActiveTab("extension")}
                                className={`flex-1 pb-2 text-xs font-bold uppercase border-b-2 transition-all cursor-pointer ${activeTab === "extension"
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Log Extension
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("shiftTimes")}
                                className={`flex-1 pb-2 text-xs font-bold uppercase border-b-2 transition-all cursor-pointer ${activeTab === "shiftTimes"
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Log Shift Times
                            </button>
                        </div>
                        <CardDescription className="text-xs">
                            {activeTab === "extension"
                                ? "Apply shift extensions for lines"
                                : "Configure operational boundaries for lines"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2 flex-grow">
                        {activeTab === "extension" ? (
                            // ==========================================
                            // SHIFT EXTENSION FORM
                            // ==========================================
                            <div>
                                {formStatus.message && (
                                    <Alert variant={formStatus.type === "success" ? "default" : "destructive"} className="mb-4 text-xs py-2 px-3">
                                        <div className="flex gap-2 items-center">
                                            {formStatus.type === "success" ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : <AlertCircle className="w-4 h-4" />}
                                            <AlertDescription className="text-xs font-medium">{formStatus.message}</AlertDescription>
                                        </div>
                                    </Alert>
                                )}

                                <form onSubmit={handleSubmitExtension} className="space-y-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 ml-0.5">
                                            <Calendar className="w-3.5 h-3.5" /> Date *
                                        </Label>
                                        <DatePicker
                                            value={formDate}
                                            onChange={(dateStr) => setFormDate(dateStr)}
                                            className="w-full"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 ml-0.5">
                                            Line Selection *
                                        </Label>
                                        <Select value={formLine} onValueChange={(v) => setFormLine(v as any)}>
                                            <SelectTrigger className="w-full bg-background border-border h-9 text-xs">
                                                <SelectValue placeholder="Select Line" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="IDU-Line">IDU LINE</SelectItem>
                                                <SelectItem value="ODU-Line">ODU LINE</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 ml-0.5">
                                            <Clock className="w-3.5 h-3.5" /> Extension Hours *
                                        </Label>
                                        <Input
                                            type="number"
                                            step="any"
                                            min="0"
                                            placeholder="e.g. 1.5"
                                            value={extensionHours}
                                            onChange={(e) => setExtensionHours(e.target.value)}
                                            className="bg-background border-border h-9 text-xs"
                                            required
                                        />
                                        <span className="text-[10px] text-muted-foreground/80 block mt-0.5">Hours to add beyond normal shift duration</span>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 ml-0.5">
                                            Justification / Reason
                                        </Label>
                                        <Input
                                            placeholder="Explain the reason for shift extension..."
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="bg-background border-border h-9 text-xs"
                                        />
                                    </div>

                                    <Button type="submit" disabled={formSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9">
                                        {formSubmitting ? (
                                            <span className="flex items-center gap-1.5 justify-center">
                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Submitting...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 justify-center">
                                                <Send className="w-3.5 h-3.5" /> Submit Log
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            </div>
                        ) : (
                            // ==========================================
                            // SHIFT TIMINGS FORM
                            // ==========================================
                            <div>
                                {shiftStatus.message && (
                                    <Alert variant={shiftStatus.type === "success" ? "default" : "destructive"} className="mb-4 text-xs py-2 px-3">
                                        <div className="flex gap-2 items-center">
                                            {shiftStatus.type === "success" ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : <AlertCircle className="w-4 h-4" />}
                                            <AlertDescription className="text-xs font-medium">{shiftStatus.message}</AlertDescription>
                                        </div>
                                    </Alert>
                                )}

                                <form onSubmit={handleSubmitShiftTimes} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-0.5">
                                                Config Date *
                                            </Label>
                                            <DatePicker
                                                value={shiftDate}
                                                onChange={(dateStr) => setShiftDate(dateStr)}
                                                className="w-full text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-0.5">
                                                Line *
                                            </Label>
                                            <Select value={shiftLine} onValueChange={(v) => setShiftLine(v as any)}>
                                                <SelectTrigger className="w-full bg-background border-border h-9 text-xs">
                                                    <SelectValue placeholder="Line" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="IDU-Line">IDU LINE</SelectItem>
                                                    <SelectItem value="ODU-Line">ODU LINE</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* SHIFT START */}
                                    <div className="space-y-1.5 border border-border/40 p-2.5 rounded-lg bg-muted/20">
                                        <span className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-blue-500" /> Shift Start
                                        </span>
                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                            <div className="space-y-0.5">
                                                <Label className="text-[9px] text-muted-foreground uppercase font-semibold">Start Date</Label>
                                                <DatePicker
                                                    value={shiftStartDate}
                                                    onChange={(dateStr) => setShiftStartDate(dateStr)}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div className="space-y-0.5">
                                                <Label className="text-[9px] text-muted-foreground uppercase font-semibold">Start Time</Label>
                                                <Input
                                                    type="time"
                                                    value={shiftStartTime}
                                                    onChange={(e) => setShiftStartTime(e.target.value)}
                                                    className="bg-background border-border h-9 text-xs"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* SHIFT END */}
                                    <div className="space-y-1.5 border border-border/40 p-2.5 rounded-lg bg-muted/20">
                                        <span className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-rose-500" /> Shift End
                                        </span>
                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                            <div className="space-y-0.5">
                                                <Label className="text-[9px] text-muted-foreground uppercase font-semibold">End Date</Label>
                                                <DatePicker
                                                    value={shiftEndDate}
                                                    onChange={(dateStr) => setShiftEndDate(dateStr)}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div className="space-y-0.5">
                                                <Label className="text-[9px] text-muted-foreground uppercase font-semibold">End Time</Label>
                                                <Input
                                                    type="time"
                                                    value={shiftEndTime}
                                                    onChange={(e) => setShiftEndTime(e.target.value)}
                                                    className="bg-background border-border h-9 text-xs"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Button type="submit" disabled={shiftSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9">
                                        {shiftSubmitting ? (
                                            <span className="flex items-center gap-1.5 justify-center">
                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Submitting...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 justify-center">
                                                <Send className="w-3.5 h-3.5" /> Save Shift Boundaries
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Logs Table Card */}
                <Card className="lg:col-span-2 border-border/60 shadow-sm bg-card flex flex-col justify-between">
                    <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div>
                            <CardTitle className="text-md font-bold uppercase">Shift Operational Logs</CardTitle>
                            <CardDescription className="text-xs">Historical log of shift operational boundaries & extensions</CardDescription>
                        </div>
                        {mounted && (
                            <div className="flex flex-wrap gap-2 items-center">
                                <DatePicker
                                    value={filterFrom}
                                    onChange={(dateStr) => setFilterFrom(dateStr)}
                                />

                                <span className="text-muted-foreground text-xs">to</span>

                                <DatePicker
                                    value={filterTo}
                                    onChange={(dateStr) => setFilterTo(dateStr)}
                                />
                                <Select value={filterLine} onValueChange={(v) => setFilterLine(v as any)}>
                                    <SelectTrigger className="w-[110px] bg-background border-border h-8 text-[11px] py-1">
                                        <SelectValue placeholder="Line" />
                                    </SelectTrigger>
                                    <SelectContent className="text-[11px]">
                                        <SelectItem value="ALL">ALL LINES</SelectItem>
                                        <SelectItem value="IDU-Line">IDU LINE</SelectItem>
                                        <SelectItem value="ODU-Line">ODU LINE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="pt-2 flex-grow overflow-auto">
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle className="text-xs">Error</AlertTitle>
                                <AlertDescription className="text-xs">{error}</AlertDescription>
                            </Alert>
                        )}

                        {loading ? (
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-8 w-full" />
                                ))}
                            </div>
                        ) : (
                            <CommonTable
                                data={logs}
                                columns={columns}
                                enableFiltering={true}
                                enableExport={true}
                                exportFileName="Shift_Operational_Logs.csv"
                                noDataMessage="No shift configurations logged for this period"
                                initialPageSize={5}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* BREAK DETAILS LOGS CARD */}
            <Card className="border-border/60 shadow-sm bg-card flex flex-col justify-between">
                <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div>
                        <CardTitle className="text-md font-bold uppercase text-foreground">Break Details</CardTitle>
                        <CardDescription className="text-xs">Manage shift-wise operational breaks and timings</CardDescription>
                    </div>
                    {mounted && (
                        <div className="flex flex-wrap gap-2 items-center">
                            <DatePicker
                                value={breakDate}
                                onChange={(dateStr) => setBreakDate(dateStr)}
                            />

                            <Select value={breakLine} onValueChange={(v) => setBreakLine(v as any)}>
                                <SelectTrigger className="w-[110px] bg-background border-border h-8 text-[11px] py-1">
                                    <SelectValue placeholder="Line" />
                                </SelectTrigger>
                                <SelectContent className="text-[11px]">
                                    <SelectItem value="ALL">ALL LINES</SelectItem>
                                    <SelectItem value="IDU-Line">IDU LINE</SelectItem>
                                    <SelectItem value="ODU-Line">ODU LINE</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button onClick={handleOpenAddBreak} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 gap-1.5">
                                <Plus className="w-3.5 h-3.5" /> Add Break
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="pt-2 flex-grow overflow-auto">
                    {breakError && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="text-xs">Error</AlertTitle>
                            <AlertDescription className="text-xs">{breakError}</AlertDescription>
                        </Alert>
                    )}

                    {breakLoading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-8 w-full" />
                            ))}
                        </div>
                    ) : (
                        <CommonTable
                            data={breakLogs}
                            columns={breakColumns}
                            enableFiltering={true}
                            enableExport={true}
                            exportFileName="Shift_Break_Logs.csv"
                            noDataMessage="No operational breaks logged for this date"
                            initialPageSize={5}
                        />
                    )}
                </CardContent>
            </Card>

            {/* BREAK DETAILS DIALOG */}
            <BreakDialog
                open={breakDialogOpen}
                onClose={() => {
                    setBreakDialogOpen(false);
                    setEditingBreakItem(null);
                }}
                onSave={handleSaveBreak}
                isEdit={isBreakEdit}
                initialData={editingBreakItem}
                defaultDate={breakDate}
                defaultLine={breakLine === "ALL" ? "IDU-Line" : breakLine}
            />

            {/* BREAK DELETE CONFIRMATION DIALOG */}
            <ConfirmDialog
                open={deleteBreakOpen}
                onOpenChange={setDeleteBreakOpen}
                title="Confirm Deletion"
                description="Are you sure you want to delete this break detail? This action is permanent and cannot be undone."
                onConfirm={handleDeleteBreakConfirm}
                loading={deleteBreakSubmitting}
                confirmText="Yes, Delete"
            >
                {breakToDelete && (
                    <div className="text-xs py-2 bg-muted/40 p-3 rounded-lg border border-border/40">
                        <div><span className="font-bold">Type:</span> <span className="capitalize">{breakToDelete.type}</span></div>
                        <div><span className="font-bold">Line:</span> {breakToDelete.line}</div>
                        <div><span className="font-bold">Duration:</span> {breakToDelete.startTime} - {breakToDelete.endTime} ({breakToDelete.totalMins} mins)</div>
                    </div>
                )}
            </ConfirmDialog>
        </div>
    );
}
