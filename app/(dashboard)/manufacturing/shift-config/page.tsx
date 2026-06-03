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
import { ArrowLeft, Calendar, Clock, RefreshCw, Send, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";

const API_HOST = "http://10.0.7.26:3003";

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

export default function ShiftConfigPage() {
    const [mounted, setMounted] = useState(false);

    // Form states
    const [formDate, setFormDate] = useState("");
    const [formLine, setFormLine] = useState<"IDU-Line" | "ODU-Line">("IDU-Line");
    const [extensionHours, setExtensionHours] = useState("");
    const [reason, setReason] = useState("");
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formStatus, setFormStatus] = useState<{ type: "success" | "error" | ""; message: string }>({ type: "", message: "" });

    // Table Filter states
    const [filterFrom, setFilterFrom] = useState("");
    const [filterTo, setFilterTo] = useState("");
    const [filterLine, setFilterLine] = useState<"IDU-Line" | "ODU-Line" | "ALL">("ALL");

    // Data states
    const [logs, setLogs] = useState<ShiftConfigItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(false);

    useEffect(() => {
        setMounted(true);
        const todayStr = new Date().toISOString().split("T")[0];
        setFormDate(todayStr);
        setFilterFrom(todayStr);
        setFilterTo(todayStr);
    }, []);

    // Fetch Shift Config logs
    const fetchLogs = async () => {
        if (!filterFrom || !filterTo) return;
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_HOST}/api/production/data/shift-config`, {
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
            cell: (row) => row.shiftstart || "08:00",
        },
        {
            header: "End",
            accessorKey: "shiftend",
            cell: (row) => row.shiftend || "16:30",
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

    useEffect(() => {
        if (mounted) {
            fetchLogs();
        }
    }, [filterFrom, filterTo, filterLine, refreshTrigger, mounted]);

    // Handle Form Submit
    const handleSubmit = async (e: React.FormEvent) => {
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
            const res = await axios.post(`${API_HOST}/api/production/data/shift-config`, payload);
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
                        Manage and log shift extension hours and operational schedules
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Card */}
                <Card className="lg:col-span-1 border-border/60 shadow-sm bg-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-md font-bold uppercase">Log Shift Extension</CardTitle>
                        <CardDescription className="text-xs">Apply shift extensions for lines</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        {formStatus.message && (
                            <Alert variant={formStatus.type === "success" ? "default" : "destructive"} className="mb-4 text-xs py-2 px-3">
                                <div className="flex gap-2 items-center">
                                    {formStatus.type === "success" ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : <AlertCircle className="w-4 h-4" />}
                                    <AlertDescription className="text-xs font-medium">{formStatus.message}</AlertDescription>
                                </div>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 ml-0.5">
                                    <Calendar className="w-3.5 h-3.5" /> Date *
                                </Label>
                                <Input
                                    type="date"
                                    value={formDate}
                                    onChange={(e) => setFormDate(e.target.value)}
                                    className="bg-background border-border h-9 text-xs"
                                    required
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
                    </CardContent>
                </Card>

                {/* Logs Table Card */}
                <Card className="lg:col-span-2 border-border/60 shadow-sm bg-card flex flex-col justify-between">
                    <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div>
                            <CardTitle className="text-md font-bold uppercase">Shift Extension Logs</CardTitle>
                            <CardDescription className="text-xs">Historical log of extensions applied</CardDescription>
                        </div>
                        {mounted && (
                            <div className="flex flex-wrap gap-2 items-center">
                                <Input
                                    type="date"
                                    value={filterFrom}
                                    onChange={(e) => setFilterFrom(e.target.value)}
                                    className="w-auto bg-background border-border h-8 text-[11px] py-1"
                                />
                                <span className="text-muted-foreground text-xs">to</span>
                                <Input
                                    type="date"
                                    value={filterTo}
                                    onChange={(e) => setFilterTo(e.target.value)}
                                    className="w-auto bg-background border-border h-8 text-[11px] py-1"
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
                                exportFileName="Shift_Extension_Logs.csv"
                                noDataMessage="No shift extensions logged for this period"
                                initialPageSize={5}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
