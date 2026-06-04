// app/(dashboard)/manufacturing/downtime-logs/[id]/page.tsx
"use client";

import { useState, useEffect, use } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ArrowLeft,
    Save,
    CheckCircle,
    RefreshCw,
    Plus,
    Trash2,
    AlertCircle,
    Play,
    Lock,
    HelpCircle,
    X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// const API_HOST = "http://10.0.7.26:3003";
const API_HOST = process.env.NEXT_PUBLIC_API_BASE_URL;

interface ActionItem {
    id: number | null;
    action: string;
    incharge: string; // Employee value name
    target: string; // date YYYY-MM-DD
    status: string; // OPEN | CLOSE
}

export default function DowntimeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    // Load states
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error" | ""; message: string }>({ type: "", message: "" });

    // Downtime base record
    const [record, setRecord] = useState<any | null>(null);
    const [employeeOptions, setEmployeeOptions] = useState<{ label: string; value: string; email?: string }[]>([]);

    // Form inputs
    const [why1, setWhy1] = useState("");
    const [why2, setWhy2] = useState("");
    const [why3, setWhy3] = useState("");
    const [why4, setWhy4] = useState("");
    const [why5, setWhy5] = useState("");

    const [tempActions, setTempActions] = useState<ActionItem[]>([{ id: null, action: "", incharge: "", target: "", status: "OPEN" }]);
    const [permActions, setPermActions] = useState<ActionItem[]>([{ id: null, action: "", incharge: "", target: "", status: "OPEN" }]);
    const [filledBy, setFilledBy] = useState("");

    // Load initial data
    const fetchRecordAndOptions = async () => {
        setLoading(true);
        setError(null);
        try {
            // Load employee list options
            const empRes = await axios.get(`${API_HOST}/ac/hr/employees/employee-options`);
            if (empRes.data.success) {
                setEmployeeOptions(empRes.data.data);
            }

            // Load downtime record
            const { data } = await axios.get(`${API_HOST}/production/downtime/record?downtimeId=${id}`);
            if (data.success && data.data?.length > 0) {
                const rec = data.data[0];
                setRecord(rec);

                // Populate 5 whys
                setWhy1(rec.analysisData?.find((a: any) => a.level === 1)?.reason || "");
                setWhy2(rec.analysisData?.find((a: any) => a.level === 2)?.reason || "");
                setWhy3(rec.analysisData?.find((a: any) => a.level === 3)?.reason || "");
                setWhy4(rec.analysisData?.find((a: any) => a.level === 4)?.reason || "");
                setWhy5(rec.analysisData?.find((a: any) => a.level === 5)?.reason || "");

                // Populate Temporary actions
                const tempRaw = rec.actionsData?.filter((a: any) => a.action_type === "TEMPORARY") || [];
                if (tempRaw.length > 0) {
                    setTempActions(tempRaw.map((a: any) => ({
                        id: a.id,
                        action: a.action || "",
                        incharge: a.person_incharge || "",
                        target: a.target_date || "",
                        status: a.status || "OPEN"
                    })));
                } else {
                    setTempActions([{ id: null, action: "", incharge: "", target: "", status: "OPEN" }]);
                }

                // Populate Permanent actions
                const permRaw = rec.actionsData?.filter((a: any) => a.action_type === "PERMANENT") || [];
                if (permRaw.length > 0) {
                    setPermActions(permRaw.map((a: any) => ({
                        id: a.id,
                        action: a.action || "",
                        incharge: a.person_incharge || "",
                        target: a.target_date || "",
                        status: a.status || "OPEN"
                    })));
                } else {
                    setPermActions([{ id: null, action: "", incharge: "", target: "", status: "OPEN" }]);
                }

                setFilledBy(rec.filled_by || "");
            } else {
                setError("Downtime record not found.");
            }
        } catch (err) {
            console.error("Downtime record fetch error:", err);
            setError("Failed to load downtime record information.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchRecordAndOptions();
        }
    }, [id]);

    // Handle Saving Analysis & Corrective Actions
    const handleSave = async () => {
        if (!record) return;
        setSaving(true);
        setActionFeedback({ type: "", message: "" });

        const whyAnalysis = [
            { downtimeId: record.id, level: 1, reason: why1.trim() || null },
            { downtimeId: record.id, level: 2, reason: why2.trim() || null },
            { downtimeId: record.id, level: 3, reason: why3.trim() || null },
            { downtimeId: record.id, level: 4, reason: why4.trim() || null },
            { downtimeId: record.id, level: 5, reason: why5.trim() || null },
        ].filter(item => item.reason !== null);

        const employeeName = typeof window !== "undefined" ? sessionStorage.getItem("employee_name") || "DEFAULT" : "DEFAULT";

        const payload = {
            ...record,
            filled_by: filledBy || employeeName,
            whyAnalysis: whyAnalysis,
            temporaryActions: tempActions.map((item, idx) => {
                const emp = employeeOptions.find(o => o.value === item.incharge);
                return {
                    action: item.action.trim(),
                    incharge: item.incharge,
                    inchargeEmail: emp?.email || "",
                    target: item.target || null,
                    status: item.status,
                    type: "TEMPORARY",
                    level: idx + 1
                };
            }).filter(item => item.action),
            permanentActions: permActions.map((item, idx) => {
                const emp = employeeOptions.find(o => o.value === item.incharge);
                return {
                    action: item.action.trim(),
                    incharge: item.incharge,
                    inchargeEmail: emp?.email || "",
                    target: item.target || null,
                    status: item.status,
                    type: "PERMANENT",
                    level: idx + 1
                };
            }).filter(item => item.action),
            updatedBy: employeeName
        };

        try {
            const { data } = await axios.post(`${API_HOST}/production/downtime/analysis`, payload);
            if (data.success) {
                setActionFeedback({ type: "success", message: "5 Why analysis saved successfully!" });
                fetchRecordAndOptions();
            } else {
                setActionFeedback({ type: "error", message: data.message || "Failed to save analysis." });
            }
        } catch (err) {
            console.error("Save analysis error:", err);
            setActionFeedback({ type: "error", message: "Error occurred while saving analysis." });
        } finally {
            setSaving(false);
        }
    };

    // Handle HOD Approve / Reject / Reopen
    const handleApprove = async (status: "CLOSE" | "REOPEN" | "REJECT") => {
        if (!record) return;
        try {
            await axios.post(`${API_HOST}/production/downtime/approve`, { downtimeID: record.id, status });
            let message = "";
            if (status === "CLOSE") message = "Record approved and closed successfully!";
            else if (status === "REJECT") message = "Record rejected successfully!";
            else message = "Record reopened successfully!";

            setActionFeedback({
                type: "success",
                message
            });
            fetchRecordAndOptions();
        } catch (err) {
            console.error("Approval error:", err);
            setActionFeedback({ type: "error", message: "Failed to update record approval status." });
        }
    };

    // Actions table grid management
    const addActionRow = (type: "temp" | "perm") => {
        const newItem = { id: null, action: "", incharge: "", target: "", status: "OPEN" };
        if (type === "temp") setTempActions([...tempActions, newItem]);
        else setPermActions([...permActions, newItem]);
    };

    const removeActionRow = (type: "temp" | "perm", idx: number) => {
        if (type === "temp") {
            const updated = tempActions.filter((_, i) => i !== idx);
            setTempActions(updated.length > 0 ? updated : [{ id: null, action: "", incharge: "", target: "", status: "OPEN" }]);
        } else {
            const updated = permActions.filter((_, i) => i !== idx);
            setPermActions(updated.length > 0 ? updated : [{ id: null, action: "", incharge: "", target: "", status: "OPEN" }]);
        }
    };

    const updateActionField = (type: "temp" | "perm", idx: number, key: keyof ActionItem, val: string) => {
        if (type === "temp") {
            const updated = tempActions.map((item, i) => i === idx ? { ...item, [key]: val } : item);
            setTempActions(updated);
        } else {
            const updated = permActions.map((item, i) => i === idx ? { ...item, [key]: val } : item);
            setPermActions(updated);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 max-w-8xl mx-auto p-2">
                <Skeleton className="h-10 w-44" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (error || !record) {
        return (
            <div className="space-y-6 max-w-8xl mx-auto p-2">
                <Link href="/manufacturing/downtime-logs">
                    <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                </Link>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error || "Record not found"}</AlertDescription>
                </Alert>
            </div>
        );
    }

    // Role checks
    const currentEmail = typeof window !== "undefined" ? sessionStorage.getItem("employee_email") : "";
    const isApproved = record.approved === 1;
    const isRejected = record.approved === 2;
    const isPersonInCharge = record.person_incharge_email === currentEmail;
    const isDepartmentInCharge = record.department_incharge_email === currentEmail;
    const canEdit = !isApproved && !isRejected && (isPersonInCharge || isDepartmentInCharge);

    return (
        <div className="space-y-6 max-w-8xl mx-auto p-2">
            {/* Action Bar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/manufacturing/downtime-logs">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-foreground uppercase tracking-tight">
                            5 Why Analysis
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Investigate downtime causes and log permanent counter-measures
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        onClick={handleSave}
                        disabled={saving || !canEdit}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 gap-1.5"
                    >
                        {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save Analysis
                    </Button>

                    {/* HOD Approvals */}
                    {record.created_by_email === currentEmail && ![1, 2].includes(record.approved) && (
                        <>
                            <Button
                                onClick={() => handleApprove("CLOSE")}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 gap-1.5"
                            >
                                <CheckCircle className="w-3.5 h-3.5" /> Approve & Close
                            </Button>
                            <Button
                                onClick={() => handleApprove("REJECT")}
                                variant="destructive"
                                className="font-semibold text-xs h-9 gap-1.5"
                            >
                                <X className="w-3.5 h-3.5" /> Reject
                            </Button>
                        </>
                    )}

                    {record.created_by_email === currentEmail && (record.approved === 1 || record.approved === 2) && (
                        <Button
                            onClick={() => handleApprove("REOPEN")}
                            variant="default"
                            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-9 gap-1.5"
                        >
                            <Play className="w-3.5 h-3.5 rotate-90" /> Reopen Record
                        </Button>
                    )}
                </div>
            </div>

            {actionFeedback.message && (
                <Alert variant={actionFeedback.type === "success" ? "default" : "destructive"} className="text-xs py-2 px-3">
                    <div className="flex gap-2 items-center">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <AlertDescription className="text-xs font-semibold">{actionFeedback.message}</AlertDescription>
                    </div>
                </Alert>
            )}

            {/* Event Summary Grid */}
            <Card className="border-border/60 bg-card shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Downtime Event Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
                        <div>
                            <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[10px]">Date</span>
                            <span className="font-semibold text-foreground">{record.date}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[10px]">Time Slot</span>
                            <span className="font-semibold text-foreground">{record.time || "N/A"}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[10px]">Line</span>
                            <span className="font-semibold text-foreground">{record.line}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[10px]">Duration</span>
                            <span className="font-bold text-rose-500">{record.duration} Minutes</span>
                        </div>
                        <div className="col-span-2 md:col-span-full lg:col-span-2">
                            <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[10px]">Downtime Reason</span>
                            <span className="font-semibold text-foreground">{record.reason}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[10px]">Person In-charge</span>
                            <span className="font-semibold text-foreground block leading-tight">{record.person_incharge || "N/A"}</span>
                            {record.person_incharge_email && <span className="text-muted-foreground text-[10px] block">{record.person_incharge_email}</span>}
                        </div>
                        <div>
                            <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[10px]">Dept In-charge</span>
                            <span className="font-semibold text-foreground block leading-tight">{record.department_incharge || "N/A"}</span>
                            {record.department_incharge_email && <span className="text-muted-foreground text-[10px] block">{record.department_incharge_email}</span>}
                        </div>
                        <div>
                            <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[10px]">Raised By</span>
                            <span className="font-semibold text-foreground block leading-tight">{record.created_by || "N/A"}</span>
                            {record.created_by_email && <span className="text-muted-foreground text-[10px] block">{record.created_by_email}</span>}
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[10px]">Status</span>
                            <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] inline-block mt-0.5 ${isApproved
                                ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                : isRejected
                                    ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                }`}>
                                {isApproved ? "CLOSED & APPROVED" : isRejected ? "REJECTED" : "OPEN / PENDING APPROVAL"}
                            </span>
                        </div>
                        {record.remarks && (
                            <div className="col-span-full pt-2 border-t">
                                <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[10px]">Remarks / Log notes</span>
                                <p className="text-muted-foreground italic mt-0.5">{record.remarks}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 5 Why inputs */}
            <Card className="border-border/60 bg-card shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-md font-bold uppercase tracking-tight">5 Why Analysis</CardTitle>
                    <CardDescription className="text-xs">Drill down sequentially to identify the true root cause</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-1">
                    {[
                        { label: "Why 1: What is the direct observation/failure?", val: why1, setVal: setWhy1 },
                        { label: "Why 2: Why did that Direct failure happen?", val: why2, setVal: setWhy2 },
                        { label: "Why 3: Why did that secondary condition occur?", val: why3, setVal: setWhy3 },
                        { label: "Why 4: Why was that previous issue not prevented?", val: why4, setVal: setWhy4 },
                        { label: "Why 5: What is the underlying systemic root cause?", val: why5, setVal: setWhy5 },
                    ].map((step, idx) => (
                        <div key={idx} className="space-y-1">
                            <Label className="text-xs font-bold text-foreground/80">{step.label}</Label>
                            <Input
                                placeholder={`Enter analysis step ${idx + 1}`}
                                value={step.val}
                                onChange={(e) => step.setVal(e.target.value)}
                                disabled={!canEdit}
                                className="bg-background border-border text-xs h-9"
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Actions Grid Tables */}
            {[
                { title: "Temporary Corrective Actions", key: "temp" as const, list: tempActions, setList: setTempActions },
                { title: "Permanent Corrective Actions", key: "perm" as const, list: permActions, setList: setPermActions },
            ].map((sec) => (
                <Card key={sec.title} className="border-border/60 bg-card shadow-sm">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-md font-bold uppercase tracking-tight">{sec.title}</CardTitle>
                        {canEdit && (
                            <Button onClick={() => addActionRow(sec.key)} variant="outline" size="sm" className="h-8 gap-1 text-xs border-blue-500/20 text-blue-600 hover:bg-blue-500/5">
                                <Plus className="w-3.5 h-3.5" /> Add Action
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="overflow-x-auto border border-border/40 rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs font-bold py-2.5">Corrective Action Measure</TableHead>
                                        <TableHead className="text-xs font-bold py-2.5 w-[200px]">Person In-charge</TableHead>
                                        <TableHead className="text-xs font-bold py-2.5 w-[160px]">Target Date</TableHead>
                                        <TableHead className="text-xs font-bold py-2.5 w-[120px]">Status</TableHead>
                                        {canEdit && <TableHead className="text-xs font-bold py-2.5 text-center w-[80px]">Remove</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sec.list.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="py-2.5">
                                                <Input
                                                    placeholder="Enter corrective action details..."
                                                    value={item.action}
                                                    onChange={(e) => updateActionField(sec.key, idx, "action", e.target.value)}
                                                    disabled={!canEdit}
                                                    className="bg-background border-border text-xs h-8"
                                                />
                                            </TableCell>
                                            <TableCell className="py-2.5">
                                                <Select
                                                    value={item.incharge}
                                                    onValueChange={(val) => updateActionField(sec.key, idx, "incharge", val)}
                                                    disabled={!canEdit}
                                                >
                                                    <SelectTrigger className="bg-background border-border h-8 text-xs">
                                                        <SelectValue placeholder="Select Incharge" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {employeeOptions.map(emp => (
                                                            <SelectItem key={emp.value} value={emp.value}>{emp.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="py-2.5">
                                                <Input
                                                    type="date"
                                                    value={item.target ? item.target.split("T")[0] : ""}
                                                    onChange={(e) => updateActionField(sec.key, idx, "target", e.target.value)}
                                                    disabled={!canEdit}
                                                    className="bg-background border-border h-8 text-xs"
                                                />
                                            </TableCell>
                                            <TableCell className="py-2.5">
                                                <Select
                                                    value={item.status}
                                                    onValueChange={(val) => updateActionField(sec.key, idx, "status", val)}
                                                    disabled={!canEdit}
                                                >
                                                    <SelectTrigger className="bg-background border-border h-8 text-xs">
                                                        <SelectValue placeholder="Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="OPEN">OPEN</SelectItem>
                                                        <SelectItem value="CLOSE">CLOSE</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            {canEdit && (
                                                <TableCell className="py-2.5 text-center">
                                                    <Button onClick={() => removeActionRow(sec.key, idx)} variant="ghost" size="icon" className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Filled By */}
            <Card className="border-border/60 bg-card shadow-sm">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Analysis Filled By</Label>
                            <Select
                                value={filledBy}
                                onValueChange={setFilledBy}
                                disabled={!canEdit}
                            >
                                <SelectTrigger className="bg-background border-border h-9 text-xs max-w-md">
                                    <SelectValue placeholder="Select who compiled this analysis" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employeeOptions.map(emp => (
                                        <SelectItem key={emp.value} value={emp.value}>{emp.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {!canEdit && (
                            <div className="flex gap-2 items-center text-xs text-muted-foreground md:justify-end">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Record is read-only (unauthorized or closed).</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
