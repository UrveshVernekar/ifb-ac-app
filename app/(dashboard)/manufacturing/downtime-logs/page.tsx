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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    ArrowLeft,
    RefreshCw,
    Plus,
    Edit,
    Trash2,
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";

const API_HOST = "http://10.0.7.26:3003";

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
}

export default function DowntimeLogsPage() {
    const [mounted, setMounted] = useState(false);

    // LIST FILTERS
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [filterLine, setFilterLine] = useState<"ODU-Line" | "IDU-Line">("ODU-Line");

    // DATA LISTS
    const [logs, setLogs] = useState<DowntimeLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(false);

    // FORM/MODAL STATES
    const [modalOpen, setModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // FORM FIELDS
    const [formDate, setFormDate] = useState("");
    const [formLine, setFormLine] = useState<"ODU-Line" | "IDU-Line">("ODU-Line");
    const [formType, setFormType] = useState("AVAILABILITY");
    const [formHourSlot, setFormHourSlot] = useState("");
    const [formReason, setFormReason] = useState("");
    const [formDuration, setFormDuration] = useState("");
    const [formRemarks, setFormRemarks] = useState("");
    const [formIncharge, setFormIncharge] = useState("");
    const [formHod, setFormHod] = useState("");

    // DROPDOWN OPTIONS
    const [hourSlots, setHourSlots] = useState<{ label: string; value: string }[]>([]);
    const [reasonOptions, setReasonOptions] = useState<{ label: string; value: string }[]>([]);
    const [employeeOptions, setEmployeeOptions] = useState<{ label: string; value: string; email?: string }[]>([]);
    const [hodOptions, setHodOptions] = useState<{ label: string; value: string; email?: string }[]>([]);

    // FORM SUBMISSION FEEDBACK
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formFeedback, setFormFeedback] = useState<{ type: "success" | "error" | ""; message: string }>({ type: "", message: "" });

    // DELETE CONFIRMATION STATES
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<DowntimeLogItem | null>(null);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);

    // INITIALIZE DATES & SESSION
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

    // FETCH DOWNTIME LOGS
    const fetchLogs = useCallback(async () => {
        if (!fromDate || !toDate) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_HOST}/api/production/downtime`, {
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
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.type === "AVAILABILITY"
                    ? "bg-rose-500/10 text-rose-500"
                    : row.type === "PERFORMANCE"
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-blue-500/10 text-blue-500"
                    }`}>
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
            header: "Person Incharge",
            accessorKey: "person_incharge",
            isFilterable: true,
            isSortable: true,
            className: "max-w-[120px] truncate",
            cell: (row) => row.person_incharge || "N/A",
        },
        {
            header: "Remarks",
            accessorKey: "remarks",
            className: "max-w-[150px] truncate text-muted-foreground",
            cell: (row) => <span title={row.remarks}>{row.remarks || "-"}</span>,
        },
        {
            header: "Actions",
            accessorKey: "id",
            isFilterable: false,
            isSortable: false,
            cell: (row) => (
                <div className="flex items-center justify-center gap-1">
                    <Button onClick={() => handleOpenEdit(row)} variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">
                        <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button onClick={() => handleOpenDelete(row)} variant="ghost" size="icon" className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10">
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <Link href={`/manufacturing/downtime-logs/${row.id}`}>
                        <Button variant="outline" size="xs" className="h-7 px-2 border-blue-500/30 text-blue-600 hover:bg-blue-500/10 text-[10px] font-bold">
                            5 Why
                        </Button>
                    </Link>
                </div>
            )
        }
    ], []);

    useEffect(() => {
        if (mounted) {
            fetchLogs();
        }
    }, [fetchLogs, refreshTrigger, mounted]);

    // LOAD FORM DYNAMIC OPTIONS
    useEffect(() => {
        if (!mounted || !modalOpen) return;

        const loadHourSlots = async () => {
            if (!formDate) return;
            try {
                const res = await axios.get(`${API_HOST}/api/production/downtime/hour-slots`, {
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
                const res = await axios.get(`${API_HOST}/api/production/downtime/downtime-reasons`, {
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
                    axios.get(`${API_HOST}/api/ac/hr/employees/employee-options`),
                    axios.get(`${API_HOST}/api/ac/hr/employees/department-heads`)
                ]);
                if (empRes.data.success) setEmployeeOptions(empRes.data.data);
                if (hodRes.data.success) setHodOptions(hodRes.data.data);
            } catch (e) {
                console.error("Failed to load employee/hod lists", e);
            }
        };

        loadEmployees();
    }, [modalOpen, mounted]);

    // HANDLE OPEN CREATION MODAL
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

    // HANDLE OPEN EDIT MODAL
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

    // HANDLE SUBMIT FORM
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
            const endpoint = isEdit ? "/api/production/downtime/update" : "/api/production/downtime";
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

    // OPEN DELET CONFIRMATION
    const handleOpenDelete = (item: DowntimeLogItem) => {
        setItemToDelete(item);
        setDeleteOpen(true);
    };

    // SUBMIT DELETE REQUES
    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;
        setDeleteSubmitting(true);
        try {
            const res = await axios.post(`${API_HOST}/api/production/downtime/delete`, itemToDelete);
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
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">From</span>
                                <Input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => {
                                        setFromDate(e.target.value);
                                        sessionStorage.setItem("acDowntimeFromDate", e.target.value);
                                    }}
                                    className="w-auto bg-background border-border h-8 text-[11px] py-1"
                                />
                            </div>

                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">To</span>
                                <Input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => {
                                        setToDate(e.target.value);
                                        sessionStorage.setItem("acDowntimeToDate", e.target.value);
                                    }}
                                    className="w-auto bg-background border-border h-8 text-[11px] py-1"
                                />
                            </div>

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

                            <Button onClick={() => setRefreshTrigger(p => !p)} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    )}

                    <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 gap-1.5">
                        <Plus className="w-4 h-4" /> Record Downtime
                    </Button>
                </div>
            </div>

            {/* LIST LOG TABLE */}
            <Card className="border-border/60 shadow-sm bg-card">
                <CardContent className="pt-6">
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
                            data={logs}
                            columns={columns}
                            enableFiltering={true}
                            enableExport={true}
                            exportFileName="Downtime_Logs.csv"
                            noDataMessage="No downtime events recorded for this period"
                            initialPageSize={5}
                        />
                    )}
                </CardContent>
            </Card>

            {/* DOWNTIME DYNAMIC ENTRY / EDIT DIALOG */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[500px] border-border/80">
                    <DialogHeader>
                        <DialogTitle className="text-md font-bold uppercase">{isEdit ? "Update Downtime Entry" : "Record Line Downtime"}</DialogTitle>
                        <DialogDescription className="text-xs">Specify down slots, root reasons, and responsibility.</DialogDescription>
                    </DialogHeader>

                    {formFeedback.message && (
                        <Alert variant={formFeedback.type === "success" ? "default" : "destructive"} className="text-xs py-2 px-3">
                            <div className="flex gap-2 items-center">
                                {formFeedback.type === "success" ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : <AlertCircle className="w-4 h-4" />}
                                <span className="text-xs font-semibold">{formFeedback.message}</span>
                            </div>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-0.5">Date *</Label>
                                <Input
                                    type="date"
                                    value={formDate}
                                    onChange={(e) => setFormDate(e.target.value)}
                                    className="bg-background border-border h-9 text-xs"
                                    required
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
                                            <SelectItem value="_" disabled>No slots available</SelectItem>
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
                                            <SelectItem value="_" disabled>No reasons loaded</SelectItem>
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
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-0.5">Remarks / Remarks</Label>
                            <Textarea
                                placeholder="Describe the downtime event in detail..."
                                value={formRemarks}
                                onChange={(e) => setFormRemarks(e.target.value)}
                                className="bg-background border-border text-xs min-h-[60px]"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => setModalOpen(false)}
                                className="font-semibold text-xs text-white h-9 bg-rose-500 hover:bg-rose-600 hover:text-white dark:bg-rose-500 dark:hover:bg-rose-600"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={formSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9">
                                {formSubmitting ? "Submitting..." : "Submit Log"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRMATION DIALOG */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold uppercase">Confirm Deletion</DialogTitle>
                        <DialogDescription className="text-xs">
                            Are you sure you want to delete this downtime entry? This action is permanent.
                        </DialogDescription>
                    </DialogHeader>
                    {itemToDelete && (
                        <div className="text-xs py-2 bg-muted/40 p-3 rounded-lg border">
                            <div><span className="font-bold">Reason:</span> {itemToDelete.reason}</div>
                            <div><span className="font-bold">Duration:</span> {itemToDelete.duration} mins</div>
                            <div><span className="font-bold">Line:</span> {itemToDelete.line}</div>
                        </div>
                    )}
                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setDeleteOpen(false)} className="text-xs">
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleDeleteConfirm} disabled={deleteSubmitting} variant="destructive" size="sm" className="text-xs">
                            {deleteSubmitting ? "Deleting..." : "Yes, Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
