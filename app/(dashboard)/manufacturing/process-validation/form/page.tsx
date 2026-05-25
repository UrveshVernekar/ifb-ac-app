// app/(dashboard)/manufacturing/process-validation/form/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
// import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
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
    Upload,
    X,
    FileText,
    CheckCircle2,
    AlertCircle,
    Plus,
    Paperclip
} from "lucide-react";

const API_HOST = "http://10.0.7.26:3003";

const supplierOptions = [
    { value: "Supplier", label: "Supplier" },
    { value: "Inhouse", label: "Inhouse" },
];

const departmentOptions = [
    { value: "PED", label: "PED" },
    { value: "R&D", label: "R&D" },
    { value: "Quality", label: "Quality" },
    { value: "Sourcing", label: "Sourcing" },
    { value: "Manufacturing", label: "Manufacturing" },
    { value: "MHI", label: "MHI" },
];

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
    { key: "cpl", label: "CHANGE PART LIST" },
    { key: "other", label: "OTHER" },
];

const depts = ["R&D", "Sourcing", "IQA", "Store", "Manufacturing", "PQC", "OQC", "Field Quality", "NPI/DQA", "PED", "Mnfg Head1", "Mnfg Head2", "Quality Head", "Plant Head"];

function FormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const idParam = searchParams.get("id");

    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingEditData, setFetchingEditData] = useState(false);

    // Page contexts
    const [pvType, setPvType] = useState("");
    const [id, setId] = useState<number | null>(null);

    // Form inputs
    const [partNumber, setPartNumber] = useState("");
    const [partName, setPartName] = useState("");
    const [supplier, setSupplier] = useState("Supplier");
    const [requestorName, setRequestorName] = useState("");
    const [department, setDepartment] = useState("PED");
    const [requestDate, setRequestDate] = useState("");
    const [product, setProduct] = useState("AC-IDU");
    const [trialQuantity, setTrialQuantity] = useState("");
    const [reasons, setReasons] = useState("");
    const [reasonRemark, setReasonRemark] = useState("");
    const [docRemark, setDocRemark] = useState("");
    const [before, setBefore] = useState("");
    const [after, setAfter] = useState("");

    const [docs, setDocs] = useState<Record<string, boolean>>({
        sirReport: false,
        pds: false,
        reliabilityReport: false,
        trialReport: false,
        dqaReport: false,
        approved4M: false,
        approvedECN: false,
        cpl: false,
        other: false,
    });

    const [docImages, setDocImages] = useState<Record<string, any[]>>({});
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [approvals, setApprovals] = useState<Record<string, any>>(
        depts.reduce((acc, d) => ({ ...acc, [d]: null }), {})
    );
    const [originalApprovals, setOriginalApprovals] = useState<Record<string, string>>({});

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setMounted(true);
        if (typeof window !== "undefined") {
            setPvType(sessionStorage.getItem("pv_request_type") || "IFB");
            const employeeName = sessionStorage.getItem("employee_name") || "";
            setRequestorName(employeeName);
        }
    }, []);

    // Load users list
    useEffect(() => {
        if (!mounted) return;

        axios.get(`${API_HOST}/api/department-list/get-dept-contacts`)
            .then((res) => {
                if (res.data && Array.isArray(res.data)) {
                    const mappedUsers = res.data.map((u: any) => ({
                        value: u.email || u.id || u.name,
                        label: u.name,
                        dept: u.department || u.dept || u.Department,
                    }));
                    setAllUsers(mappedUsers);
                }
            })
            .catch((err) => {
                console.error("Error fetching users list:", err);
            });
    }, [mounted]);

    // Handle filtered user list per department
    const getFilteredOptions = (dept: string) => {
        if (!allUsers || allUsers.length === 0) return [];

        const filtered = allUsers.filter((u) => {
            const userDept = (u.dept || "").trim().toLowerCase();
            const targetDept = (dept || "").trim().toLowerCase();

            if (userDept === targetDept) return true;

            if (targetDept === "npi/dqa" && (userDept === "dqa" || userDept === "npi")) return true;

            if ((targetDept === "mnfg head1" || targetDept === "mnfg head2") && (userDept === "mnfg head")) return true;
            if (targetDept === "quality head" && (userDept === "quality" || userDept === "quality head")) return true;
            if (targetDept === "plant head" && (userDept === "plant" || userDept === "plant head")) return true;
            if (targetDept === "field quality" && (userDept === "field" || userDept === "field quality")) return true;

            return false;
        });

        // unique by email value
        return Array.from(new Map(filtered.map(item => [item['value'], item])).values());
    };

    // Auto-populate single choice HOD approvals
    useEffect(() => {
        if (allUsers.length > 0) {
            const heads = ['Plant Head', 'Quality Head', 'Mnfg Head1', 'Mnfg Head2'];
            setApprovals(prev => {
                const newApprovals = { ...prev };
                heads.forEach(dept => {
                    const options = getFilteredOptions(dept);
                    if (options.length === 1 && !newApprovals[dept]) {
                        newApprovals[dept] = options[0];
                    }
                });
                return newApprovals;
            });
        }
    }, [allUsers]);

    // Load existing record for Edit Mode
    useEffect(() => {
        if (!mounted || !idParam || allUsers.length === 0) return;

        const loadEditData = async () => {
            setFetchingEditData(true);
            try {
                const res = await axios.get(`${API_HOST}/api/process-validation/get-pv-requests`);
                const allData = Array.isArray(res.data) ? res.data : res.data.data || [];
                const editData = allData.find((item: any) => item.id.toString() === idParam);

                if (editData) {
                    setId(editData.id);
                    setPartNumber(editData.part_number || "");
                    setPartName(editData.part_name || "");
                    setSupplier(editData.supplier_type || "Supplier");
                    setRequestorName(editData.requestor_name || "");
                    setDepartment(editData.department || "PED");
                    setPvType(editData.pv_type || "IFB");

                    if (editData.request_date) {
                        const date = new Date(editData.request_date);
                        setRequestDate(date.toISOString().split('T')[0]);
                    }

                    setProduct(editData.product || "AC-IDU");
                    setTrialQuantity(editData.trial_quantity || "");
                    setReasons(editData.reasons?.[0] || "");
                    setReasonRemark(editData.reason_remark || "");

                    if (editData.docs) {
                        const updatedDocs = { ...docs };
                        editData.docs.forEach((docKey: string) => {
                            updatedDocs[docKey] = true;
                        });
                        setDocs(updatedDocs);
                    }
                    setDocRemark(editData.doc_remark || "");
                    setBefore(editData.before_text || "");
                    setAfter(editData.after_text || "");

                    if (editData.approvals) {
                        const updatedApprovals = { ...approvals };
                        const origMap: Record<string, string> = {};
                        editData.approvals.forEach((app: any) => {
                            const user = allUsers.find(u => u.value === app.in_charge);
                            if (user) {
                                updatedApprovals[app.department] = user;
                                origMap[app.department] = user.value;
                            }
                        });
                        setApprovals(updatedApprovals);
                        setOriginalApprovals(origMap);
                    }

                    // Files grouping
                    if (editData.files && editData.files.length > 0) {
                        const groupedFiles: Record<string, any[]> = {};
                        editData.files.forEach((file: any) => {
                            if (!groupedFiles[file.doc_key]) {
                                groupedFiles[file.doc_key] = [];
                            }
                            groupedFiles[file.doc_key].push({
                                ...file,
                                isExisting: true,
                                file: {
                                    name: file.file_name,
                                    size: file.file_size
                                }
                            });
                        });
                        setDocImages(groupedFiles);
                    }
                }
            } catch (err) {
                console.error("Error loading request for edit:", err);
            } finally {
                setFetchingEditData(false);
            }
        };

        loadEditData();
    }, [idParam, allUsers, mounted]);

    const handleDocChange = (name: string, checked: boolean) => {
        setDocs(prev => ({ ...prev, [name]: checked }));
    };

    const handleFileChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const filesArray = Array.from(e.target.files);
        const newImages = filesArray.map(file => ({
            file: file,
            isExisting: false,
            file_name: file.name,
            file_size: file.size
        }));
        setDocImages(prev => ({
            ...prev,
            [key]: [...(prev[key] || []), ...newImages]
        }));
    };

    const handleRemoveFile = (key: string, index: number) => {
        setDocImages(prev => {
            const list = [...(prev[key] || [])];
            list.splice(index, 1);
            return {
                ...prev,
                [key]: list
            };
        });
    };

    const handleApprovalChange = (dept: string, val: any) => {
        setApprovals((prev) => ({ ...prev, [dept]: val }));
    };

    const handleSubmit = async () => {
        const newErrors: Record<string, string> = {};

        if (!partNumber) newErrors.partNumber = "Part Number is required";
        if (!partName) newErrors.partName = "Part Name is required";
        if (!supplier) newErrors.supplier = "Supplier / Inhouse type is required";
        if (!requestorName) newErrors.requestorName = "Requestor Name is required";
        if (!department) newErrors.department = "Department is required";
        if (!requestDate) newErrors.requestDate = "Request Date is required";
        if (!trialQuantity) newErrors.trialQuantity = "Trial Quantity is required";

        if (!reasons) {
            newErrors.reasons = "Please select a Reason for Request.";
        } else if (reasons === "other" && !reasonRemark) {
            newErrors.reasonRemark = "Please provide a remark for 'Other' reason.";
        }

        if (!before) newErrors.before = "Before process analysis is required";
        if (!after) newErrors.after = "After process analysis is required";

        const unassignedDepts = depts.filter(d => !approvals[d]);
        if (unassignedDepts.length > 0) {
            newErrors.approvals = "Please select an In-charge for all departments.";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            alert("Please fill in all required fields highlighted in red.");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                id,
                pvType,
                partNumber,
                partName,
                supplier: supplier,
                requestorName,
                department: department,
                requestDate,
                product,
                trialQuantity: parseInt(trialQuantity, 10) || 0,
                reasons: reasons ? [reasons] : [],
                reasonRemark: reasons === "other" ? reasonRemark : "",
                docs: Object.keys(docs).filter((k) => docs[k]),
                docRemark: docs.other ? docRemark : "",
                before,
                after,
                approvals: Object.fromEntries(
                    Object.entries(approvals).map(([k, v]) => [k, v?.value])
                ),
                changedDepartments: id
                    ? Object.entries(approvals)
                        .filter(([dept, v]) => v?.value !== originalApprovals[dept])
                        .map(([dept]) => dept)
                    : [],
                existingFiles: Object.entries(docImages).flatMap(([key, images]) =>
                    images
                        .filter(img => img.isExisting)
                        .map(img => ({
                            id: img.id,
                            doc_key: key,
                            file_name: img.file_name,
                            file_path: img.file_path
                        }))
                ),
            };

            const formData = new FormData();
            formData.append("data", JSON.stringify(payload));

            for (const key in docImages) {
                docImages[key].forEach((img, index) => {
                    if (img.file && !img.isExisting) {
                        formData.append(
                            `files[${key}][${index}]`,
                            img.file,
                            img.file.name
                        );
                    }
                });
            }

            const endpoint = id
                ? `${API_HOST}/api/process-validation/update-pv-request/${id}`
                : `${API_HOST}/api/process-validation/submit-pv-request`;

            const response = await fetch(endpoint, {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Something went wrong");
            }

            alert(id ? "Request updated successfully!" : "Request submitted successfully!");
            router.push("/manufacturing/process-validation");

        } catch (error) {
            console.error("Error submitting PV:", error);
            alert("Failed to submit request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (fetchingEditData) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto p-2">
                <Skeleton className="h-10 w-44" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-2">
            {/* Header / Action Bar */}
            <div className="flex items-center gap-3">
                <Link href="/manufacturing/process-validation">
                    <Button variant="outline" size="icon" className="h-9 w-9">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
                        {id ? `Edit Signoff Form` : `${pvType} Signoff Form`}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {id ? "Modify existing process validation details and parameters" : "Complete registration fields to request validation sign-off"}
                    </p>
                </div>
            </div>

            {/* Basic Info Fields */}
            <Card className="border-border/60 bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Part Number <span className="text-rose-500">*</span></Label>
                            <Input
                                value={partNumber}
                                onChange={(e) => setPartNumber(e.target.value)}
                                className={`bg-background border-border text-xs ${errors.partNumber ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                                placeholder="Enter part number"
                            />
                            {errors.partNumber && <small className="text-rose-500 text-[10px]">{errors.partNumber}</small>}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Part Name <span className="text-rose-500">*</span></Label>
                            <Input
                                value={partName}
                                onChange={(e) => setPartName(e.target.value)}
                                className={`bg-background border-border text-xs ${errors.partName ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                                placeholder="Enter part name"
                            />
                            {errors.partName && <small className="text-rose-500 text-[10px]">{errors.partName}</small>}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Supplier / Inhouse <span className="text-rose-500">*</span></Label>
                            <select
                                value={supplier}
                                onChange={(e) => setSupplier(e.target.value)}
                                className="w-full bg-background border border-border rounded-md h-9 text-xs px-3 focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                {supplierOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            {errors.supplier && <small className="text-rose-500 text-[10px]">{errors.supplier}</small>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Requestor Name <span className="text-rose-500">*</span></Label>
                            <Input
                                value={requestorName}
                                onChange={(e) => setRequestorName(e.target.value)}
                                className={`bg-background border-border text-xs ${errors.requestorName ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                                placeholder="Enter requestor name"
                            />
                            {errors.requestorName && <small className="text-rose-500 text-[10px]">{errors.requestorName}</small>}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Department <span className="text-rose-500">*</span></Label>
                            <select
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                className="w-full bg-background border border-border rounded-md h-9 text-xs px-3 focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                {departmentOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            {errors.department && <small className="text-rose-500 text-[10px]">{errors.department}</small>}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Request Date <span className="text-rose-500">*</span></Label>
                            <Input
                                type="date"
                                value={requestDate}
                                onChange={(e) => setRequestDate(e.target.value)}
                                className={`bg-background border-border text-xs ${errors.requestDate ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                            />
                            {errors.requestDate && <small className="text-rose-500 text-[10px]">{errors.requestDate}</small>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Product Type <span className="text-rose-500">*</span></Label>
                            <div className="flex gap-4 items-center pt-2">
                                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={product === "AC-IDU"}
                                        onChange={() => setProduct("AC-IDU")}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    AC-IDU
                                </label>
                                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={product === "AC-ODU"}
                                        onChange={() => setProduct("AC-ODU")}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    AC-ODU
                                </label>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Trial Quantity <span className="text-rose-500">*</span></Label>
                            <Input
                                type="number"
                                value={trialQuantity}
                                onChange={(e) => setTrialQuantity(e.target.value)}
                                className={`bg-background border-border text-xs ${errors.trialQuantity ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                                placeholder="Enter trial quantity"
                            />
                            {errors.trialQuantity && <small className="text-rose-500 text-[10px]">{errors.trialQuantity}</small>}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Reasons and Backup Docs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reason Selection */}
                <Card className="border-border/60 bg-card shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Reason of Request</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {reasonOptions.map((opt) => (
                                <label key={opt.key} className="flex items-start gap-2 cursor-pointer py-1 text-foreground/80 hover:text-foreground">
                                    <input
                                        type="radio"
                                        name="reasonOfRequest"
                                        value={opt.key}
                                        checked={reasons === opt.key}
                                        onChange={(e) => setReasons(e.target.value)}
                                        className="h-3.5 w-3.5 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
                                    />
                                    <span className="leading-tight">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                        {reasons === "other" && (
                            <div className="space-y-1 pt-2">
                                <Label className="text-xs font-semibold">Remark for Other Reason <span className="text-rose-500">*</span></Label>
                                <Textarea
                                    value={reasonRemark}
                                    onChange={(e) => setReasonRemark(e.target.value)}
                                    placeholder="Please describe reason..."
                                    className={`bg-background border-border text-xs min-h-[60px] ${errors.reasonRemark ? "border-rose-500" : ""}`}
                                />
                                {errors.reasonRemark && <small className="text-rose-500 text-[10px]">{errors.reasonRemark}</small>}
                            </div>
                        )}
                        {errors.reasons && <small className="text-rose-500 text-[10px] block pt-1">{errors.reasons}</small>}
                    </CardContent>
                </Card>

                {/* Attached Backup Documents */}
                <Card className="border-border/60 bg-card shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Attached Backup Documents</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                            {docOptions.map((opt) => (
                                <div key={opt.key} className="flex flex-col gap-1.5 p-2 rounded-lg border bg-slate-900/10 dark:bg-slate-900/30">
                                    <label className="flex items-center gap-2 cursor-pointer text-foreground/80 hover:text-foreground font-semibold">
                                        <input
                                            type="checkbox"
                                            checked={docs[opt.key] || false}
                                            onChange={(e) => handleDocChange(opt.key, e.target.checked)}
                                            className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>{opt.label}</span>
                                    </label>
                                    {docs[opt.key] && (
                                        <div className="pl-5 space-y-2">
                                            {opt.key === "other" && (
                                                <Input
                                                    placeholder="Specify remark..."
                                                    value={docRemark}
                                                    onChange={(e) => setDocRemark(e.target.value)}
                                                    className="h-7 text-[10px] py-1 bg-background"
                                                />
                                            )}

                                            <div className="flex items-center gap-1.5">
                                                <Label htmlFor={`file-${opt.key}`} className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] px-2 py-1 rounded flex items-center gap-1">
                                                    <Upload className="w-3 h-3" /> Select File
                                                </Label>
                                                <input
                                                    id={`file-${opt.key}`}
                                                    type="file"
                                                    multiple
                                                    className="hidden"
                                                    onChange={(e) => handleFileChange(opt.key, e)}
                                                />
                                            </div>

                                            {/* Files list */}
                                            {docImages[opt.key] && docImages[opt.key].length > 0 && (
                                                <div className="space-y-1 pt-1 max-h-36 overflow-y-auto">
                                                    {docImages[opt.key].map((img, idx) => (
                                                        <div key={idx} className="flex items-center justify-between border bg-background rounded p-1 text-[10px] gap-2">
                                                            <div className="flex items-center gap-1 flex-1 min-w-0">
                                                                <Paperclip className="w-3 h-3 text-muted-foreground shrink-0" />
                                                                <span className="truncate" title={img.file_name || img.file?.name}>
                                                                    {img.isExisting ? img.file_name : img.file?.name}
                                                                </span>
                                                                <span className="text-[9px] text-muted-foreground shrink-0">
                                                                    ({((img.isExisting ? img.file_size : img.file?.size) / 1024).toFixed(1)} KB)
                                                                </span>
                                                                {img.isExisting && <Badge className="text-[8px] h-3.5 px-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold shrink-0">Existing</Badge>}
                                                            </div>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-4 w-4 text-rose-500 hover:text-rose-600"
                                                                onClick={() => handleRemoveFile(opt.key, idx)}
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Before / After Processes */}
            <Card className="border-border/60 bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Process Analysis Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold">Before process details <span className="text-rose-500">*</span></Label>
                        <Textarea
                            rows={8}
                            placeholder="Enter process details prior to trial/modification..."
                            value={before}
                            onChange={(e) => setBefore(e.target.value)}
                            className={`bg-background border-border text-xs min-h-[140px] ${errors.before ? "border-rose-500" : ""}`}
                        />
                        {errors.before && <small className="text-rose-500 text-[10px]">{errors.before}</small>}
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-semibold">After process details <span className="text-rose-500">*</span></Label>
                        <Textarea
                            rows={8}
                            placeholder="Enter process details expected/achieved after trial/modification..."
                            value={after}
                            onChange={(e) => setAfter(e.target.value)}
                            className={`bg-background border-border text-xs min-h-[140px] ${errors.after ? "border-rose-500" : ""}`}
                        />
                        {errors.after && <small className="text-rose-500 text-[10px]">{errors.after}</small>}
                    </div>
                </CardContent>
            </Card>

            {/* Approvals Config Table */}
            <Card className="border-border/60 bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Department Approvals Configuration</CardTitle>
                    <CardDescription className="text-xs">Assign in-charge personnel responsible for signing off on this request.</CardDescription>
                </CardHeader>
                <CardContent>
                    {errors.approvals && <div className="mb-2"><small className="text-rose-500 text-xs font-bold">{errors.approvals}</small></div>}
                    <div className="overflow-x-auto border border-border/40 rounded-lg">
                        <Table>
                            <TableHeader className="bg-slate-900/50">
                                <TableRow>
                                    <TableHead className="text-xs font-bold py-2 w-[40%]">Department</TableHead>
                                    <TableHead className="text-xs font-bold py-2">Assigned In-charge <span className="text-rose-500">*</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {depts.map((dept) => (
                                    <TableRow key={dept} className="hover:bg-muted/30">
                                        <TableCell className="text-xs font-bold py-2.5">{dept}</TableCell>
                                        <TableCell className="py-2.5">
                                            <select
                                                value={approvals[dept]?.value || ""}
                                                onChange={(e) => {
                                                    const selectedVal = e.target.value;
                                                    const matchedUser = getFilteredOptions(dept).find(u => u.value === selectedVal);
                                                    handleApprovalChange(dept, matchedUser || null);
                                                }}
                                                className="w-full max-w-md bg-background border border-border rounded-md h-8 text-xs px-2 focus:ring-1 focus:ring-ring focus:outline-none"
                                            >
                                                <option value="">Select Incharge...</option>
                                                {getFilteredOptions(dept).map(u => (
                                                    <option key={u.value} value={u.value}>{u.label}</option>
                                                ))}
                                            </select>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex justify-end gap-3 pt-6">
                        <Link href="/manufacturing/process-validation">
                            <Button variant="outline" size="sm" className="text-xs">
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9"
                        >
                            {loading ? "Saving..." : (id ? "Update Request" : "Submit Signoff Form")}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ProcessValidationFormPage() {
    return (
        <Suspense fallback={
            <div className="space-y-6 max-w-7xl mx-auto p-2">
                <Skeleton className="h-10 w-44" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        }>
            <FormContent />
        </Suspense>
    );
}
