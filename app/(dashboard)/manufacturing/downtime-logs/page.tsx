// app/(dashboard)/manufacturing/downtime-logs/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    ArrowLeft,
    RefreshCw,
    Plus,
    Edit,
    Trash2,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Clock,
    Send,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import Link from "next/link";
import { DatePicker } from "@/components/manufacturing/DatePicker";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";
import CommonDialog from "@/components/shared/CommonDialog";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";

const API_HOST = process.env.NEXT_PUBLIC_API_BASE_URL;

interface DowntimeLogItem {
    id: number;
    date: string;
    time: string;
    line: string;
    type: string;
    reason: string;
    duration: number;
    remarks: string;
    person_incharge: string;
    person_incharge_email: string;
    department_incharge: string;
    department_incharge_email: string;
    department?: string;
    approved?: number | string;
    submitted?: number | string;
}

interface DepartmentSummaryItem {
    department: string;
    total: number;
    pending: number;
    submitted: number;
    approved: number;
}

export default function DowntimeLogsPage() {
    const [mounted, setMounted] = useState(false);

    // ==========================================
    // FILTER STATES
    // ==========================================
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [filterLine, setFilterLine] = useState<"ODU-Line" | "IDU-Line">("ODU-Line");
    const [departmentFilter, setDepartmentFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "SUBMITTED" | "APPROVED">("ALL");

    // ==========================================
    // DATA STATES
    // ==========================================
    const [logs, setLogs] = useState<DowntimeLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(false);

    // Department summary state
    const [departmentSummary, setDepartmentSummary] = useState<DepartmentSummaryItem[]>([]);
    const [summaryMinimized, setSummaryMinimized] = useState(false);

    // ==========================================
    // FORM & DIALOG STATES
    // ==========================================
    const [modalOpen, setModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form Fields
    const [formDate, setFormDate] = useState("");
    const [formLine, setFormLine] = useState<"ODU-Line" | "IDU-Line">("ODU-Line");
    const [formType, setFormType] = useState("AVAILABILITY");
    const [formHourSlot, setFormHourSlot] = useState("");
    const [formReason, setFormReason] = useState("");
    const [formDuration, setFormDuration] = useState("");
    const [formRemarks, setFormRemarks] = useState("");
    const [formIncharge, setFormIncharge] = useState("");
    const [formHod, setFormHod] = useState("");

    // Form dropdown configurations
    const [hourSlots, setHourSlots] = useState<{ label: string; value: string }[]>([]);
    const [reasonOptions, setReasonOptions] = useState<{ label: string; value: string }[]>([]);
    const [employeeOptions, setEmployeeOptions] = useState<{ label: string; value: string; email?: string }[]>([]);
    const [hodOptions, setHodOptions] = useState<{ label: string; value: string; email?: string }[]>([]);

    // Form Submission Feedback
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formFeedback, setFormFeedback] = useState<{ type: "success" | "error" | ""; message: string }>({ type: "", message: "" });

    // Delete Modal
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<DowntimeLogItem | null>(null);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);

    // ==========================================
    // INITIALIZATION & SESSION PERSISTENCE
    // ==========================================
    useEffect(() => {
        setMounted(true);
        const todayStr = new Date().toISOString().split("T")[0];

        const savedFrom = sessionStorage.getItem("acDowntimeFromDate") || todayStr;
        const savedTo = sessionStorage.getItem("acDowntimeToDate") || todayStr;
        const savedLine = sessionStorage.getItem("acDowntimeType") as any || "ODU-Line";

        setFromDate(savedFrom);
        setToDate(savedTo);
        setFilterLine(savedLine);
        setFormDate(todayStr);
    }, []);

    // ==========================================
    // DATA FETCHING METHODS
    // ==========================================
    const fetchLogs = useCallback(async () => {
        if (!fromDate || !toDate) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_HOST}/production/downtime`, {
                params: {
                    line: filterLine,
                    fromDate,
                    toDate,
                }
            });
            if (res.data.success) {
                setLogs(res.data.data);
            } else {
                setLogs([]);
            }
        } catch (err) {
            console.error("Downtime fetch error:", err);
            setError("Failed to fetch downtime log history.");
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate, filterLine]);

    const fetchSummary = useCallback(async () => {
        if (!fromDate || !toDate) return;
        try {
            const res = await axios.get(`${API_HOST}/production/downtime/department-summary`, {
                params: {
                    line: filterLine,
                    fromDate,
                    toDate,
                }
            });
            if (res.data.success) {
                const mapped = res.data.data.map((item: any) => ({
                    department: item.DEPARTMENT || item.department || "N/A",
                    total: Number(item.TOTAL || item.total || 0),
                    pending: Number(item.PENDING || item.pending || 0),
                    submitted: Number(item.SUBMITTED || item.submitted || 0),
                    approved: Number(item.APPROVED || item.approved || 0),
                }));
                setDepartmentSummary(mapped);
            } else {
                setDepartmentSummary([]);
            }
        } catch (err) {
            console.error("Failed to fetch department summary", err);
            setDepartmentSummary([]);
        }
    }, [fromDate, toDate, filterLine]);

    useEffect(() => {
        if (mounted) {
            fetchLogs();
            fetchSummary();
        }
    }, [fetchLogs, fetchSummary, refreshTrigger, mounted]);

    // ==========================================
    // FILTER COMPUTATIONS
    // ==========================================
    // Dynamic Department list options
    const departmentOptions = useMemo<string[]>(() => {
        const depts = new Set(
            logs.map(d => d.department).filter((d): d is string => typeof d === "string" && d !== "")
        );
        return ["All", ...Array.from(depts)];
    }, [logs]);

    // Filter logs by selected department filter
    const departmentFilteredLogs = useMemo(() => {
        if (departmentFilter === "All" || !departmentFilter) {
            return logs;
        }
        return logs.filter(item => item.department && item.department.toLowerCase() === departmentFilter.toLowerCase());
    }, [logs, departmentFilter]);

    // Filter logs by selected status filter card
    const finalTableData = useMemo(() => {
        if (statusFilter === "ALL") {
            return departmentFilteredLogs;
        }
        if (statusFilter === "PENDING") {
            return departmentFilteredLogs.filter(item => Number(item.approved) === 0 && Number(item.submitted) === 0);
        }
        if (statusFilter === "SUBMITTED") {
            return departmentFilteredLogs.filter(item => Number(item.submitted) === 1 && Number(item.approved) === 0);
        }
        if (statusFilter === "APPROVED") {
            return departmentFilteredLogs.filter(item => Number(item.approved) === 1);
        }
        return departmentFilteredLogs;
    }, [departmentFilteredLogs, statusFilter]);

    // Status Counts based on department filtered data
    const totalLogs = departmentFilteredLogs.length;
    const pendingCount = useMemo(() => {
        return departmentFilteredLogs.filter(item => Number(item.approved) === 0 && Number(item.submitted) === 0).length;
    }, [departmentFilteredLogs]);
    const submittedCount = useMemo(() => {
        return departmentFilteredLogs.filter(item => Number(item.submitted) === 1 && Number(item.approved) === 0).length;
    }, [departmentFilteredLogs]);
    const completedCount = useMemo(() => {
        return departmentFilteredLogs.filter(item => Number(item.approved) === 1).length;
    }, [departmentFilteredLogs]);

    // Colored Row Background highlights
    const getRowClassName = (row: DowntimeLogItem) => {
        const approved = Number(row.approved);
        const submitted = Number(row.submitted);
        if (submitted === 1 && approved === 0) {
            // Submitted Yellow
            return "bg-yellow-500/10 hover:bg-yellow-500/15 dark:bg-yellow-500/10 dark:hover:bg-yellow-500/15";
        }
        if (approved === 0) {
            // Pending Amber
            return "bg-amber-500/10 hover:bg-amber-500/15 dark:bg-amber-500/10 dark:hover:bg-amber-500/15";
        }
        if (approved === 1) {
            // Approved Green
            return "bg-emerald-500/10 hover:bg-emerald-500/15 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15";
        }
        return "";
    };

    // Columns config for summary table
    const summaryColumns = useMemo<ColumnConfig<DepartmentSummaryItem>[]>(() => [
        {
            header: "Department",
            accessorKey: "department",
            isFilterable: true,
            isSortable: true,
            className: "capitalize font-semibold",
        },
        {
            header: "Total",
            accessorKey: "total",
            className: "font-semibold text-center text-blue-600 dark:text-blue-400",
        },
        {
            header: "Pending",
            accessorKey: "pending",
            className: "text-center text-amber-500 dark:text-amber-400",
        },
        {
            header: "Submitted",
            accessorKey: "submitted",
            className: "text-center text-yellow-600 dark:text-yellow-400",
        },
        {
            header: "Approved",
            accessorKey: "approved",
            className: "text-center text-emerald-600 dark:text-emerald-400 font-semibold",
        }
    ], []);

    // Columns config for main logs table
    const columns = useMemo<ColumnConfig<DowntimeLogItem>[]>(() => [
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
            header: "Time",
            accessorKey: "time",
            cell: (row) => row.time || "N/A",
        },
        {
            header: "Type",
            accessorKey: "type",
            isFilterable: true,
            isSortable: true,
            cell: (row) => (
                <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold border",
                    row.type === "AVAILABILITY"
                        ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        : row.type === "PERFORMANCE"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                )}>
                    {row.type}
                </span>
            ),
        },
        {
            header: "Reason",
            accessorKey: "reason",
            isFilterable: true,
            isSortable: true,
            className: "font-semibold text-foreground/80",
        },
        {
            header: "Duration (min)",
            accessorKey: "duration",
            className: "font-bold text-rose-500 text-center",
            cell: (row) => row.duration,
        },
        {
            header: "Department",
            accessorKey: "department",
            isFilterable: true,
            isSortable: true,
            className: "capitalize",
        },
        {
            header: "Remarks",
            accessorKey: "remarks",
            className: "max-w-[150px] truncate text-muted-foreground",
            cell: (row) => <span title={row.remarks}>{row.remarks || "-"}</span>,
        },
        {
            header: "Person Incharge",
            accessorKey: "person_incharge",
            isFilterable: true,
            isSortable: true,
            className: "max-w-[120px] truncate",
            cell: (row) => row.person_incharge || "N/A",
        },
        {
            header: "Actions",
            accessorKey: "id",
            isFilterable: false,
            isSortable: false,
            cell: (row) => (
                <div className="flex items-center justify-center gap-1">
                    <Button
                        onClick={() => handleOpenEdit(row)}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                        disabled={Number(row.approved) === 1}
                    >
                        <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        onClick={() => handleOpenDelete(row)}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        disabled={Number(row.approved) === 1}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <Link href={`/manufacturing/downtime-logs/${row.id}`}>
                        <Button variant="outline" size="xs" className="h-7 px-2 border-blue-500/30 text-blue-600 hover:bg-blue-500/10 text-[10px] font-bold cursor-pointer">
                            5 Why
                        </Button>
                    </Link>
                </div>
            )
        }
    ], []);

    // ==========================================
    // LOAD FORM DYNAMIC OPTIONS (MODAL OPEN)
    // ==========================================
    useEffect(() => {
        if (!mounted || !modalOpen) return;

        const loadHourSlots = async () => {
            if (!formDate) return;
            try {
                const res = await axios.get(`${API_HOST}/production/downtime/hour-slots`, {
                    params: { date: formDate, line: formLine }
                });
                if (res.data.success) setHourSlots(res.data.data);
            } catch (e) {
                console.error("Failed to load hour slots", e);
            }
        };

        loadHourSlots();
    }, [formDate, formLine, modalOpen, mounted]);

    useEffect(() => {
        if (!mounted || !modalOpen) return;

        const loadReasons = async () => {
            try {
                const res = await axios.get(`${API_HOST}/production/downtime/downtime-reasons`, {
                    params: { line: formLine }
                });
                if (res.data.success) setReasonOptions(res.data.data);
            } catch (e) {
                console.error("Failed to load reasons", e);
            }
        };

        loadReasons();
    }, [formLine, modalOpen, mounted]);

    useEffect(() => {
        if (!mounted || !modalOpen) return;

        const loadEmployees = async () => {
            try {
                const [empRes, hodRes] = await Promise.all([
                    axios.get(`${API_HOST}/ac/hr/employees/employee-options`),
                    axios.get(`${API_HOST}/ac/hr/employees/department-heads`)
                ]);
                if (empRes.data.success) setEmployeeOptions(empRes.data.data);
                if (hodRes.data.success) setHodOptions(hodRes.data.data);
            } catch (e) {
                console.error("Failed to load employee/hod lists", e);
            }
        };

        loadEmployees();
    }, [modalOpen, mounted]);

    // ==========================================
    // MODAL TRIGGER HANDLERS
    // ==========================================
    const handleOpenCreate = () => {
        setIsEdit(false);
        setEditingId(null);
        setFormLine(filterLine);
        setFormDate(new Date().toISOString().split("T")[0]);
        setFormType("AVAILABILITY");
        setFormHourSlot("");
        setFormReason("");
        setFormDuration("");
        setFormRemarks("");
        setFormIncharge("");
        setFormHod("");
        setFormFeedback({ type: "", message: "" });
        setModalOpen(true);
    };

    const handleOpenEdit = (item: DowntimeLogItem) => {
        setIsEdit(true);
        setEditingId(item.id);
        setFormLine(item.line as any || "ODU-Line");
        setFormDate(item.date);
        setFormType(item.type || "AVAILABILITY");
        setFormHourSlot(item.date && item.time ? `${item.date} ${item.time}` : "");
        setFormReason(item.reason || "");
        setFormDuration(item.duration ? String(item.duration).replace(/\D/g, "") : "");
        setFormRemarks(item.remarks || "");
        setFormIncharge(item.person_incharge || "");
        setFormHod(item.department_incharge || "");
        setFormFeedback({ type: "", message: "" });
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormFeedback({ type: "", message: "" });

        if (!formDate || !formReason || !formDuration) {
            setFormFeedback({ type: "error", message: "Please fill out all required fields." });
            return;
        }

        const activeEmp = employeeOptions.find(o => o.value === formIncharge);
        const activeHod = hodOptions.find(o => o.value === formHod);

        const payload: any = {
            date: formDate,
            line: formLine,
            reason: formReason,
            type: formType,
            hourSlot: formHourSlot,
            duration: Number(formDuration),
            remarks: formRemarks,
            personInCharge: formIncharge,
            personInChargeEmail: activeEmp?.email || "",
            departmentInCharge: formHod,
            departmentInChargeEmail: activeHod?.email || "",
        };

        if (isEdit && editingId) {
            payload.id = editingId;
        } else {
            const employeeName = typeof window !== "undefined" ? sessionStorage.getItem("employee_name") || "DEFAULT" : "DEFAULT";
            const employeeEmail = typeof window !== "undefined" ? sessionStorage.getItem("employee_email") || "DEFAULT" : "DEFAULT";
            payload.createdBy = employeeName;
            payload.createdByEmail = employeeEmail;
        }

        setFormSubmitting(true);
        try {
            const endpoint = isEdit ? "/production/downtime/update" : "/production/downtime";
            const res = await axios.post(`${API_HOST}${endpoint}`, payload);

            if (res.data.success) {
                setFormFeedback({
                    type: "success",
                    message: isEdit ? "Downtime updated successfully!" : "Downtime recorded successfully!"
                });
                setRefreshTrigger(prev => !prev);
                setTimeout(() => setModalOpen(false), 1500);
            } else {
                setFormFeedback({ type: "error", message: res.data.message || "Failed to submit downtime." });
            }
        } catch (err) {
            console.error("Downtime submit error:", err);
            setFormFeedback({ type: "error", message: "Error submitting downtime log." });
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleOpenDelete = (item: DowntimeLogItem) => {
        setItemToDelete(item);
        setDeleteOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;
        setDeleteSubmitting(true);
        try {
            const res = await axios.post(`${API_HOST}/production/downtime/delete`, itemToDelete);
            if (res.data.success) {
                setRefreshTrigger(prev => !prev);
                setDeleteOpen(false);
            }
        } catch (e) {
            console.error("Failed to delete", e);
        } finally {
            setDeleteSubmitting(false);
            setItemToDelete(null);
        }
    };

    return (
        <div className="space-y-6 max-w-8xl mx-auto p-2">
            {/* HEADER SELECTION */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/manufacturing">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
                            Downtime Logs
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Log downtime events and conduct 5 Why root cause analyses
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    {mounted && (
                        <div className="flex flex-wrap gap-2 items-center bg-card border border-border/60 p-2 rounded-xl shadow-sm">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block ml-1">From</span>
                                <DatePicker
                                    value={fromDate}
                                    onChange={(dateStr) => {
                                        setFromDate(dateStr);
                                        sessionStorage.setItem("acDowntimeFromDate", dateStr);
                                    }}
                                    className="h-8 text-[11px] py-1"
                                />
                            </div>

                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">To</span>
                                <DatePicker
                                    value={toDate}
                                    onChange={(dateStr) => {
                                        setToDate(dateStr);
                                        sessionStorage.setItem("acDowntimeToDate", dateStr);
                                    }}
                                    className="h-8 text-[11px] py-1"
                                />
                            </div>

                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Line</span>
                                <Select
                                    value={filterLine}
                                    onValueChange={(v: any) => {
                                        setFilterLine(v);
                                        sessionStorage.setItem("acDowntimeType", v);
                                    }}
                                >
                                    <SelectTrigger className="w-[110px] bg-background border-border h-8 text-[11px] py-1">
                                        <SelectValue placeholder="Line" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="IDU-Line">IDU LINE</SelectItem>
                                        <SelectItem value="ODU-Line">ODU LINE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Department Dropdown Filter */}
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Department</span>
                                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                    <SelectTrigger className="w-[150px] bg-background border-border h-8 text-[11px] py-1">
                                        <SelectValue placeholder="All Departments" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departmentOptions.map(dept => (
                                            <SelectItem key={dept} value={dept} className="text-[11px]">
                                                {dept === "All" ? "ALL DEPARTMENTS" : dept.toUpperCase()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* <Button onClick={() => setRefreshTrigger(p => !p)} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground mt-4 sm:mt-0">
                                <RefreshCw className="w-3.5 h-3.5" />
                            </Button> */}
                        </div>
                    )}

                    <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 gap-1.5 cursor-pointer">
                        <Plus className="w-4 h-4" /> Downtime
                    </Button>
                </div>
            </div>

            {/* STATUS FILTER SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Logs */}
                <div
                    onClick={() => setStatusFilter("ALL")}
                    className={cn(
                        "p-5 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-sm flex items-center justify-between",
                        statusFilter === "ALL"
                            ? "bg-blue-600 text-white shadow-blue-500/20 shadow-md ring-2 ring-blue-400"
                            : "bg-card border border-border/60 hover:bg-muted/40 text-foreground"
                    )}
                >
                    <div>
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider block", statusFilter === "ALL" ? "text-blue-100" : "text-muted-foreground")}>Total Logs</span>
                        <span className="text-3xl font-extrabold block mt-1">{totalLogs}</span>
                    </div>
                    <div className={cn("p-2 rounded-xl", statusFilter === "ALL" ? "bg-white/20 text-white" : "bg-blue-500/10 text-blue-600 dark:text-blue-400")}>
                        <Calendar className="w-6 h-6" />
                    </div>
                </div>

                {/* Pending Logs */}
                <div
                    onClick={() => setStatusFilter("PENDING")}
                    className={cn(
                        "p-5 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-sm flex items-center justify-between",
                        statusFilter === "PENDING"
                            ? "bg-amber-500 text-white shadow-amber-500/20 shadow-md ring-2 ring-amber-400"
                            : "bg-card border border-border/60 hover:bg-muted/40 text-foreground"
                    )}
                >
                    <div>
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider block", statusFilter === "PENDING" ? "text-amber-100" : "text-muted-foreground")}>Pending Logs</span>
                        <span className="text-3xl font-extrabold block mt-1">{pendingCount}</span>
                    </div>
                    <div className={cn("p-2 rounded-xl", statusFilter === "PENDING" ? "bg-white/20 text-white" : "bg-amber-500/10 text-amber-600 dark:text-amber-400")}>
                        <Clock className="w-6 h-6" />
                    </div>
                </div>

                {/* Submitted Logs */}
                <div
                    onClick={() => setStatusFilter("SUBMITTED")}
                    className={cn(
                        "p-5 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-sm flex items-center justify-between",
                        statusFilter === "SUBMITTED"
                            ? "bg-yellow-500 text-white shadow-yellow-500/20 shadow-md ring-2 ring-yellow-400"
                            : "bg-card border border-border/60 hover:bg-muted/40 text-foreground"
                    )}
                >
                    <div>
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider block", statusFilter === "SUBMITTED" ? "text-yellow-100" : "text-muted-foreground")}>Submitted Logs</span>
                        <span className="text-3xl font-extrabold block mt-1">{submittedCount}</span>
                    </div>
                    <div className={cn("p-2 rounded-xl", statusFilter === "SUBMITTED" ? "bg-white/20 text-white" : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400")}>
                        <Send className="w-6 h-6" />
                    </div>
                </div>

                {/* Approved Logs */}
                <div
                    onClick={() => setStatusFilter("APPROVED")}
                    className={cn(
                        "p-5 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-sm flex items-center justify-between",
                        statusFilter === "APPROVED"
                            ? "bg-emerald-600 text-white shadow-emerald-500/20 shadow-md ring-2 ring-emerald-400"
                            : "bg-card border border-border/60 hover:bg-muted/40 text-foreground"
                    )}
                >
                    <div>
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider block", statusFilter === "APPROVED" ? "text-emerald-100" : "text-muted-foreground")}>Approved Logs</span>
                        <span className="text-3xl font-extrabold block mt-1">{completedCount}</span>
                    </div>
                    <div className={cn("p-2 rounded-xl", statusFilter === "APPROVED" ? "bg-white/20 text-white" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400")}>
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* DEPARTMENT-WISE DOWNTIME SUMMARY */}
            <Collapsible open={!summaryMinimized} onOpenChange={(v) => setSummaryMinimized(!v)} className="space-y-2">
                <Card className="border-border/60 bg-card shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-md font-bold uppercase text-blue-600 dark:text-blue-400">Department-wise Downtime Summary</CardTitle>
                            <CardDescription className="text-xs">Summary of downtime events split across departments</CardDescription>
                        </div>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                {summaryMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                            </Button>
                        </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                        <CardContent className="pt-0">
                            {loading ? (
                                <Skeleton className="h-28 w-full" />
                            ) : (
                                <CommonTable
                                    data={departmentSummary}
                                    columns={summaryColumns}
                                    enableFiltering={false}
                                    enableExport={true}
                                    exportFileName={`AC_DOWNTIME_SUMMARY_${filterLine}_${fromDate}_${toDate}.csv`}
                                    noDataMessage="No department-wise summaries logged"
                                    showTotal={true}
                                    initialPageSize={5}
                                />
                            )}
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>

            {/* LIST LOG TABLE */}
            <Card className="border-border/60 shadow-sm bg-card">
                <CardHeader className="pb-2">
                    <CardTitle className="text-md font-bold uppercase text-blue-600 dark:text-blue-400">Downtime Log Details</CardTitle>
                    <CardDescription className="text-xs">Individual logged downtime observations and approval status highlights</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">{error}</AlertDescription>
                        </Alert>
                    )}

                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-8 w-full" />
                            ))}
                        </div>
                    ) : (
                        <CommonTable
                            data={finalTableData}
                            columns={columns}
                            enableFiltering={true}
                            enableExport={true}
                            exportFileName={
                                departmentFilter !== "All"
                                    ? `AC_DOWNTIME_${filterLine}_${departmentFilter.toUpperCase()}_${fromDate}_${toDate}.csv`
                                    : `AC_DOWNTIME_${filterLine}_${fromDate}_${toDate}.csv`
                            }
                            noDataMessage="No downtime events recorded for this period"
                            initialPageSize={10}
                            rowClassName={getRowClassName}
                        />
                    )}
                </CardContent>
            </Card>

            {/* DOWNTIME DYNAMIC ENTRY / EDIT DIALOG */}
            <CommonDialog
                open={modalOpen}
                onOpenChange={setModalOpen}
                title={isEdit ? "Update Downtime Entry" : "Record Line Downtime"}
                description="Specify down slots, root reasons, and responsibility."
                className="sm:max-w-[500px]"
            >
                {formFeedback.message && (
                    <Alert variant={formFeedbackFeedback(formFeedback.type)} className="text-xs py-2 px-3 mb-3">
                        <div className="flex gap-2 items-center">
                            {formFeedback.type === "success" ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : <AlertCircle className="w-4 h-4" />}
                            <span className="text-xs font-semibold">{formFeedback.message}</span>
                        </div>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-0.5">Date *</Label>
                            <DatePicker
                                value={formDate}
                                onChange={(dateStr) => setFormDate(dateStr)}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-0.5">Line *</Label>
                            <Select value={formLine} onValueChange={(v: any) => setFormLine(v)}>
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-0.5">Downtime Type *</Label>
                            <Select value={formType} onValueChange={setFormType}>
                                <SelectTrigger className="w-full bg-background border-border h-9 text-xs">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="AVAILABILITY">AVAILABILITY</SelectItem>
                                    <SelectItem value="PERFORMANCE">PERFORMANCE</SelectItem>
                                    <SelectItem value="QUALITY">QUALITY</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-0.5">Hour Slot *</Label>
                            <Select value={formHourSlot} onValueChange={setFormHourSlot}>
                                <SelectTrigger className="w-full bg-background border-border h-9 text-xs">
                                    <SelectValue placeholder="Slot" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hourSlots.length > 0 ? (
                                        hourSlots.map(o => (
                                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="_" disabled className="text-xs">No slots available</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-0.5">Downtime Reason *</Label>
                            <Select value={formReason} onValueChange={setFormReason}>
                                <SelectTrigger className="w-full bg-background border-border h-9 text-xs">
                                    <SelectValue placeholder="Reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    {reasonOptions.length > 0 ? (
                                        reasonOptions.map(o => (
                                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="_" disabled className="text-xs">No reasons loaded</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-0.5">Downtime Minutes *</Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="e.g. 15"
                                value={formDuration}
                                onChange={(e) => setFormDuration(e.target.value)}
                                className="bg-background border-border h-9 text-xs"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-0.5">Person In-charge</Label>
                            <Select value={formIncharge} onValueChange={setFormIncharge}>
                                <SelectTrigger className="w-full bg-background border-border h-9 text-xs">
                                    <SelectValue placeholder="Select Incharge" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employeeOptions.map(o => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-0.5">HOD</Label>
                            <Select value={formHod} onValueChange={setFormHod}>
                                <SelectTrigger className="w-full bg-background border-border h-9 text-xs">
                                    <SelectValue placeholder="Select HOD" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hodOptions.map(o => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-0.5">Remarks / Notes</Label>
                        <Textarea
                            placeholder="Describe the downtime event in detail..."
                            value={formRemarks}
                            onChange={(e) => setFormRemarks(e.target.value)}
                            className="bg-background border-border text-xs min-h-[60px]"
                        />
                    </div>

                    <div className="flex w-full justify-end gap-2 pt-4 border-t border-border/20">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setModalOpen(false)}
                            className="text-xs h-9"
                            disabled={formSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={formSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 min-w-[90px]"
                        >
                            {formSubmitting ? (
                                <span className="flex items-center gap-1.5 justify-center">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Submitting...
                                </span>
                            ) : (
                                "Submit Log"
                            )}
                        </Button>
                    </div>
                </form>
            </CommonDialog>

            {/* DELETE CONFIRMATION DIALOG */}
            <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Confirm Deletion"
                description="Are you sure you want to delete this downtime entry? This action is permanent."
                onConfirm={handleDeleteConfirm}
                loading={deleteSubmitting}
                confirmText="Yes, Delete"
            >
                {itemToDelete && (
                    <div className="text-xs py-2 bg-muted/40 p-3 rounded-lg border border-border/40 text-foreground">
                        <div><span className="font-bold">Reason:</span> {itemToDelete.reason}</div>
                        <div><span className="font-bold">Duration:</span> {itemToDelete.duration} mins</div>
                        <div><span className="font-bold">Line:</span> {itemToDelete.line}</div>
                    </div>
                )}
            </ConfirmDialog>
        </div>
    );
}

// ==========================================
// FORM HELPER UTILITIES
// ==========================================
function formFeedbackFeedback(type: string) {
    if (type === "success") return "default";
    return "destructive";
}
