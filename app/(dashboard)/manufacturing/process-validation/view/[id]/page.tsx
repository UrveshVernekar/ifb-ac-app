// app/(dashboard)/manufacturing/process-validation/view/[id]/page.tsx
"use client";

import React, { useState, useEffect, use } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    FileText,
    CheckCircle2,
    AlertCircle,
    Download,
    Edit,
    Clock,
    User,
    Eye
} from "lucide-react";

const API_HOST = "http://10.0.7.26:3003";

const adminEmails = ["arya_naik@ifbglobal.com", "shreyas_athalye@ifbglobal.com", "shubham_naroji@ifbglobal.com"];

const reasonOptions = [
    { key: "newSupplier", label: "NEW SUPPLIER (LOCALISED / ALTERNATE)" },
    { key: "designChange", label: "DESIGN CHANGE" },
    { key: "fieldIssue", label: "FIELD ISSUE" },
    { key: "newPart", label: "NEW PART" },
    { key: "lineTrial", label: "LINE TRIAL" },
    { key: "newModel", label: "NEW MODEL" },
    { key: "fourMSupplier", label: "4M : SUPPLIER" },
    { key: "fourMInhouse", label: "4M : INHOUSE" },
    { key: "newTool", label: "NEW TOOL" },
    { key: "duplicateTool", label: "DUPLICATE TOOL" },
    { key: "fitmentTrial", label: "FITMENT TRIAL" },
    { key: "other", label: "OTHER" },
];

const docOptions = [
    { key: "sirReport", label: "SIR APPROVAL REPORT" },
    { key: "reliabilityReport", label: "RELIABILITY TEST REPORT" },
    { key: "dqaReport", label: "DQA TEST REPORT" },
    { key: "approvedECN", label: "APPROVED ECN" },
    { key: "pds", label: "PRODUCT DATA SHEET (PDS)" },
    { key: "trialReport", label: "TRIAL REPORT" },
    { key: "approved4M", label: "APPROVED 4M" },
    { key: "other", label: "OTHER" },
];

export default function ProcessValidationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Session user values
    const [userEmail, setUserEmail] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);

    // Detail Data
    const [data, setData] = useState<any | null>(null);
    const [allUsers, setAllUsers] = useState<any[]>([]);

    // Approvals actions form states
    const [approvalRemarks, setApprovalRemarks] = useState<Record<number, string>>({});

    // Hold modal trigger states
    const [onHoldModal, setOnHoldModal] = useState(false);
    const [activeItem, setActiveItem] = useState<any | null>(null);
    const [responsiblePerson, setResponsiblePerson] = useState("");
    const [holdSubmitLoading, setHoldSubmitLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== "undefined") {
            const email = sessionStorage.getItem("employee_email") || "";
            setUserEmail(email);
            setIsAdmin(adminEmails.includes(email));
        }
    }, []);

    const fetchDetail = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_HOST}/api/process-validation/get-pv-requests`);
            const allData = Array.isArray(res.data) ? res.data : res.data.data || [];
            const detail = allData.find((item: any) => item.id.toString() === id);
            if (detail) {
                setData(detail);
            } else {
                setError("Validation signoff request not found.");
            }
        } catch (err) {
            console.error("Error fetching detail details:", err);
            setError("Failed to retrieve request details.");
        } finally {
            setLoading(false);
        }
    };

    // Load department users
    useEffect(() => {
        if (!mounted) return;
        fetchDetail();

        axios.get(`${API_HOST}/api/department-list/get-dept-contacts`)
            .then((res) => {
                if (res.data && Array.isArray(res.data)) {
                    const uniqueMap = new Map();
                    res.data
                        .filter((u: any) => u.name !== "NA")
                        .forEach((u: any) => {
                            const key = (u.email || u.name).toLowerCase();
                            if (!uniqueMap.has(key)) {
                                uniqueMap.set(key, {
                                    value: u.email || u.id || u.name,
                                    label: u.name,
                                    dept: u.department || u.dept || u.Department,
                                });
                            }
                        });
                    setAllUsers(Array.from(uniqueMap.values()));
                }
            })
            .catch((err) => {
                console.error("Error fetching users:", err);
            });
    }, [id, mounted]);

    const handleRemarkChange = (itemId: number, value: string) => {
        setApprovalRemarks(prev => ({
            ...prev,
            [itemId]: value
        }));
    };

    const handleAction = async (itemId: number, dept: string, actionStatus: number) => {
        const remark = approvalRemarks[itemId] || "";
        if (!remark.trim()) {
            alert(`Please enter a remark for ${dept.toUpperCase()} before taking action.`);
            return;
        }

        setActionLoading(itemId);
        try {
            await axios.put(`${API_HOST}/api/process-validation/update-approval`, {
                id: itemId,
                status: actionStatus,
                remark: remark,
                responsible_person: '',
            });
            setApprovalRemarks(prev => ({ ...prev, [itemId]: "" }));
            await fetchDetail();
            const actionText = actionStatus === 1 ? "Approve" : "Reject";
            alert(`Request ${actionText}d successfully for ${dept.toUpperCase()}.`);
        } catch (err) {
            console.error(`Error during action ${actionStatus}:`, err);
            alert(`Failed to complete action. Please try again.`);
        } finally {
            setActionLoading(null);
        }
    };

    const openOnHoldModal = (item: any) => {
        setActiveItem(item);
        setResponsiblePerson("");
        setOnHoldModal(true);
    };

    const handleOnHoldSubmit = async () => {
        if (!activeItem) return;
        const remark = approvalRemarks[activeItem.id] || "";
        if (!remark.trim()) {
            alert(`Please enter a remark before putting on hold.`);
            return;
        }
        if (!responsiblePerson) {
            alert(`Please select a responsible person.`);
            return;
        }

        setHoldSubmitLoading(true);
        try {
            await axios.put(`${API_HOST}/api/process-validation/update-approval`, {
                id: activeItem.id,
                status: 2,
                remark: remark,
                responsible_person: responsiblePerson,
                request_id: id,
            });

            setApprovalRemarks(prev => ({ ...prev, [activeItem.id]: "" }));
            setResponsiblePerson("");
            setActiveItem(null);
            setOnHoldModal(false);
            await fetchDetail();
            alert(`Request status updated to On Hold.`);
        } catch (err) {
            console.error("Error setting on hold status:", err);
            alert("Failed to put request on hold. Please try again.");
        } finally {
            setHoldSubmitLoading(false);
        }
    };

    // Date formatting functions
    const formatDate = (dateString: string) => {
        if (!dateString) return "—";
        try {
            const date = new Date(dateString.replace(' ', 'T'));
            return date.toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).replace(',', '');
        } catch (e) {
            return dateString;
        }
    };

    const formatDateOnly = (dateString: string) => {
        if (!dateString) return "—";
        try {
            const d = new Date(dateString.split('T')[0]);
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${d.getDate().toString().padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
        } catch (e) {
            return dateString;
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto p-2">
                <Skeleton className="h-10 w-44" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto p-2">
                <Link href="/manufacturing/process-validation">
                    <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                </Link>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error || "Record not found."}</AlertDescription>
                </Alert>
            </div>
        );
    }

    const approvalsList = data.approvals || [];
    const validApprovals = approvalsList.filter((item: any) => item.name !== "NA");
    const allApproved = validApprovals.length > 0 && validApprovals.every((item: any) => item.status === "1");
    const hasHold = validApprovals.some((item: any) => item.status === "0" || item.status === "2");

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-2">
            {/* Header Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/manufacturing/process-validation">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-foreground uppercase tracking-tight">
                            {reasonOptions.find(opt => opt.key === data.reasons?.[0])?.label || data.reasons?.[0]} Details
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Review signatures, details, and download signoff forms
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {isAdmin && (
                        <Button
                            onClick={() => router.push(`/manufacturing/process-validation/form?id=${data.id}`)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-9 gap-1.5"
                        >
                            <Edit className="w-3.5 h-3.5" /> Edit Request
                        </Button>
                    )}

                    {allApproved && (
                        <Link href={`/manufacturing/process-validation/download/${data.id}`}>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 gap-1.5">
                                <Download className="w-3.5 h-3.5" /> Download Signoff
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Overall Status Banner */}
            <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${allApproved
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : hasHold
                    ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                }`}>
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                        {allApproved
                            ? "ALL DEPARTMENTS SIGNED OFF & APPROVED"
                            : hasHold
                                ? "ON HOLD - PENDING REMEDIATION MEASURES"
                                : "PENDING SIGNATURES AND REVIEW"}
                    </span>
                </div>
                <Badge variant={allApproved ? "default" : hasHold ? "destructive" : "secondary"}>
                    {allApproved ? "APPROVED" : hasHold ? "ON HOLD" : "PENDING"}
                </Badge>
            </div>

            {/* Basic Info Fields Grid */}
            <Card className="border-border/60 bg-card shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Request Parameters</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
                        <div>
                            <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[10px]">Part Number</span>
                            <span className="font-semibold text-foreground">{data.part_number}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[10px]">Part Name</span>
                            <span className="font-semibold text-foreground">{data.part_name}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[10px]">Supplier Type</span>
                            <span className="font-semibold text-foreground">
                                <Badge variant="outline">{data.supplier_type}</Badge>
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[10px]">OEM Brand</span>
                            <span className="font-semibold text-foreground">{data.pv_type}</span>
                        </div>

                        <div>
                            <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[10px]">Requestor Name</span>
                            <span className="font-semibold text-foreground">{data.requestor_name}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[10px]">Requestor Department</span>
                            <span className="font-semibold text-foreground">{data.department}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[10px]">Request Date</span>
                            <span className="font-semibold text-foreground">{formatDateOnly(data.request_date)}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[10px]">Product / Trial Qty</span>
                            <span className="font-semibold text-foreground">{data.product} ({data.trial_quantity} Units)</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Reasons / remarks & Backup attachments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-border/60 bg-card shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Reason For Trial</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2 text-xs space-y-3">
                        <div className="font-semibold text-foreground">
                            {data.reasons?.map((r: string) => reasonOptions.find(opt => opt.key === r)?.label || r).join(", ")}
                        </div>
                        {data.reason_remark && (
                            <div className="bg-slate-900/10 dark:bg-slate-900/30 p-3 rounded-lg border text-muted-foreground">
                                <span className="font-bold text-[10px] block text-foreground uppercase tracking-wide mb-1">Reason Remark:</span>
                                <p>{data.reason_remark}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border/60 bg-card shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Backup Documents & Files</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2 text-xs space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                            {data.docs?.map((d: string, i: number) => (
                                <Badge key={i} variant="outline" className="border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                                    {docOptions.find(opt => opt.key === d)?.label || d}
                                </Badge>
                            ))}
                            {(!data.docs || data.docs.length === 0) && <span className="text-muted-foreground italic">No document types selected</span>}
                        </div>

                        {data.files && data.files.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2 pt-2">
                                {data.files.map((file: any, i: number) => (
                                    <div key={i} className="border border-border/60 bg-background rounded-lg p-2 flex items-center justify-between gap-3 shadow-xs">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-[11px] truncate text-foreground" title={file.file_name}>
                                                    {file.file_name}
                                                </p>
                                                <span className="text-[9px] text-muted-foreground">
                                                    {((file.file_size || 0) / 1024).toFixed(1)} KB • {file.doc_key}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-[10px] gap-1 px-2 border-blue-500/20 text-blue-500 hover:bg-blue-500/10 shrink-0"
                                            onClick={() => window.open(`${API_HOST}/api/process-validation/download/${encodeURIComponent(file.file_path.split(/[\\/]/).pop())}`, '_blank')}
                                        >
                                            <Download className="w-3 h-3" /> Get File
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic text-xs pt-1">No backing files uploaded.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Before / After Columns */}
            <Card className="border-border/60 bg-card shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Process Analysis</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="border bg-slate-900/10 dark:bg-slate-900/30 p-4 rounded-xl">
                        <span className="text-[10px] font-bold block text-rose-500 uppercase tracking-widest mb-2 border-b pb-1">Before Change Process</span>
                        <p className="text-xs whitespace-pre-wrap leading-relaxed text-foreground/80">{data.before_text || "N/A"}</p>
                    </div>

                    <div className="border bg-slate-900/10 dark:bg-slate-900/30 p-4 rounded-xl">
                        <span className="text-[10px] font-bold block text-emerald-500 uppercase tracking-widest mb-2 border-b pb-1">After Change Process</span>
                        <p className="text-xs whitespace-pre-wrap leading-relaxed text-foreground/80">{data.after_text || "N/A"}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Approvals Signatures Actions Table */}
            <Card className="border-border/60 bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="text-md font-bold uppercase tracking-tight">Approvals Signatures log</CardTitle>
                    <CardDescription className="text-xs">Submit comments, approvals, or request hold actions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto border border-border/40 rounded-lg">
                        <Table>
                            <TableHeader className="bg-slate-900/50">
                                <TableRow>
                                    <TableHead className="text-xs font-bold py-3 w-[15%]">Department</TableHead>
                                    <TableHead className="text-xs font-bold py-3 w-[20%]">Incharge Incharge</TableHead>
                                    <TableHead className="text-xs font-bold py-3 w-[45%]">Remarks History</TableHead>
                                    <TableHead className="text-xs font-bold py-3 text-center w-[20%]">Actions / Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* Initiator Base Row */}
                                <TableRow className="hover:bg-muted/20">
                                    <TableCell className="text-xs font-bold py-3.5">INITIATOR</TableCell>
                                    <TableCell className="text-xs py-3.5 font-semibold text-foreground/80">{data.requestor_name}</TableCell>
                                    <TableCell className="text-xs py-3.5 text-muted-foreground italic">
                                        Request submitted on {formatDate(data.created_at)}
                                    </TableCell>
                                    <TableCell className="text-center py-3.5">
                                        <Badge className="bg-emerald-500 text-white border-none font-bold text-[9px] px-2 py-0.5">SUBMITTED</Badge>
                                    </TableCell>
                                </TableRow>

                                {/* Approvals Rows */}
                                {validApprovals.map((item: any, idx: number) => {
                                    const canApprove = isAdmin || userEmail === item.in_charge;
                                    const isHoldOrPending = item.status === null || item.status === "0" || item.status === "2";

                                    return (
                                        <TableRow key={idx} className="hover:bg-muted/20">
                                            <TableCell className="text-xs font-bold py-3.5 uppercase">{item.department}</TableCell>
                                            <TableCell className="text-xs py-3.5 font-medium">{item.name || <span className="text-muted-foreground italic text-[10px]">Not Assigned</span>}</TableCell>
                                            <TableCell className="text-xs py-3.5">
                                                <div className="space-y-2">
                                                    {/* History remarks list */}
                                                    {item.history && item.history.length > 0 ? (
                                                        <div className="space-y-1.5 max-w-lg">
                                                            {item.history.map((h: any, hIdx: number) => (
                                                                <div key={hIdx} className="p-2 bg-slate-900/10 dark:bg-slate-900/40 rounded-r-md border-l-2 border-blue-500 text-[11px]">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <Badge className={`text-[8px] font-bold h-4 px-1.5 ${h.status === "1" ? "bg-emerald-500" : "bg-rose-500"
                                                                            }`}>
                                                                            {h.status === "1" ? "APPROVED" : "ON HOLD"}
                                                                        </Badge>
                                                                        <span className="text-[9px] text-muted-foreground">{formatDate(h.created_at)}</span>
                                                                    </div>
                                                                    <p className="text-foreground/80 whitespace-pre-wrap">{h.remark}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : item.remark ? (
                                                        <div className="p-2 bg-slate-900/10 dark:bg-slate-900/40 border rounded text-[11px] max-w-lg text-foreground/80">
                                                            {item.remark}
                                                        </div>
                                                    ) : null}

                                                    {/* Signoff inline inputs */}
                                                    {canApprove && isHoldOrPending && (
                                                        <div className="pt-1.5 max-w-md">
                                                            <Textarea
                                                                placeholder="Enter sign-off comments or reasons for hold..."
                                                                value={approvalRemarks[item.id] || ""}
                                                                onChange={(e) => handleRemarkChange(item.id, e.target.value)}
                                                                rows={2}
                                                                className="text-xs bg-background"
                                                            />
                                                        </div>
                                                    )}

                                                    {!canApprove && !item.remark && (!item.history || item.history.length === 0) && (
                                                        <span className="text-muted-foreground italic text-[10px]">Waiting for review</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center py-3.5">
                                                {/* Actions or Status label */}
                                                {item.status === "1" ? (
                                                    <div className="space-y-1">
                                                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[9px] px-2.5 py-0.5">APPROVED</Badge>
                                                        <div className="text-[9px] text-muted-foreground block">{formatDate(item.last_updated)}</div>
                                                    </div>
                                                ) : item.status === "0" || item.status === "2" ? (
                                                    <div className="space-y-2">
                                                        <div>
                                                            <Badge className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-[9px] px-2.5 py-0.5">ON HOLD</Badge>
                                                            <div className="text-[9px] text-muted-foreground block mt-0.5">{formatDate(item.last_updated)}</div>
                                                        </div>
                                                        {canApprove && (
                                                            <div className="flex gap-1.5 justify-center">
                                                                <Button
                                                                    onClick={() => handleAction(item.id, item.department, 1)}
                                                                    disabled={actionLoading === item.id}
                                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] h-7 px-2.5"
                                                                >
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    onClick={() => openOnHoldModal(item)}
                                                                    disabled={actionLoading === item.id}
                                                                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] h-7 px-2.5"
                                                                >
                                                                    Hold
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : item.in_charge ? (
                                                    canApprove ? (
                                                        <div className="flex flex-col gap-1.5 items-center justify-center max-w-[120px] mx-auto">
                                                            <Button
                                                                onClick={() => handleAction(item.id, item.department, 1)}
                                                                disabled={actionLoading === item.id}
                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] h-7 w-full"
                                                            >
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                onClick={() => openOnHoldModal(item)}
                                                                disabled={actionLoading === item.id}
                                                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] h-7 w-full"
                                                            >
                                                                On Hold
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Badge variant="outline" className="text-muted-foreground text-[9px]">PENDING ASSIGNEE</Badge>
                                                    )
                                                ) : (
                                                    <Badge variant="secondary" className="text-[9px] font-bold">UNASSIGNED</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Custom On-Hold Dialog using Shadcn Dialog */}
            <Dialog open={onHoldModal} onOpenChange={setOnHoldModal}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="text-md font-bold uppercase">Assign Hold Remediation Action</DialogTitle>
                        <DialogDescription className="text-xs">
                            Specify who is responsible for resolving the line Trial blocker and record corrective actions.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Responsible In-charge Person <span className="text-rose-500">*</span></Label>
                            <select
                                value={responsiblePerson}
                                onChange={(e) => setResponsiblePerson(e.target.value)}
                                className="w-full bg-background border border-border rounded-md h-9 text-xs px-3 focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                <option value="">Select Responsible Person...</option>
                                {allUsers.map((user) => (
                                    <option key={user.value} value={user.value}>
                                        {user.label} ({user.dept || "N/A"})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Corrective Actions Blocker Remark <span className="text-rose-500">*</span></Label>
                            <Textarea
                                placeholder="Explain why this PV trial is put on hold and what resolution measures are required..."
                                value={activeItem ? approvalRemarks[activeItem.id] || "" : ""}
                                onChange={(e) => activeItem && handleRemarkChange(activeItem.id, e.target.value)}
                                rows={3}
                                className="text-xs bg-background"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOnHoldModal(false)}
                            className="text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleOnHoldSubmit}
                            disabled={holdSubmitLoading}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-9"
                        >
                            {holdSubmitLoading ? "Updating..." : "Confirm Blocker"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
