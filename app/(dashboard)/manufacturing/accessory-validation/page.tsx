// app/(dashboard)/manufacturing/accessory-validation/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ChevronUp
} from "lucide-react";

const API_HOST = "http://10.0.7.26:3003";

interface AccessoryMappingItem {
    id: number;
    modelname: string;
    modelcode: string;
    modeldescription: string;
    bagpartcode: string;
    remotepartcode: string;
    vendorprefix: string;
    assemblycode: string;
    created_at: string;
    updated_by: string;
}

export default function AccessoryValidationPage() {
    const [mounted, setMounted] = useState(false);
    const [tableData, setTableData] = useState<AccessoryMappingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(false);

    // Form inputs (Create)
    const [formExpanded, setFormExpanded] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [formFeedback, setFormFeedback] = useState({ type: "", message: "" });

    const [modelName, setModelName] = useState("");
    const [modelCode, setModelCode] = useState("");
    const [modelDescription, setModelDescription] = useState("");
    const [bagPartcode, setBagPartcode] = useState("");
    const [remotePartcode, setRemotePartcode] = useState("");
    const [assemblyCode, setAssemblyCode] = useState("");
    const [vendorPrefix, setVendorPrefix] = useState("");

    const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

    // Form inputs (Edit Dialog)
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<AccessoryMappingItem | null>(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editFeedback, setEditFeedback] = useState({ type: "", message: "" });

    const [editModelName, setEditModelName] = useState("");
    const [editModelCode, setEditModelCode] = useState("");
    const [editModelDescription, setEditModelDescription] = useState("");
    const [editBagPartcode, setEditBagPartcode] = useState("");
    const [editRemotePartcode, setEditRemotePartcode] = useState("");
    const [editAssemblyCode, setEditAssemblyCode] = useState("");
    const [editVendorPrefix, setEditVendorPrefix] = useState("");

    const [editErrors, setEditErrors] = useState<Record<string, string>>({});

    // Delete Confirmation
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState<AccessoryMappingItem | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchTableData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_HOST}/api/production/data/accessory-mapping/get-data`);
            if (response.data && response.data.success) {
                setTableData(response.data.data || []);
            } else {
                setTableData([]);
            }
        } catch (err) {
            console.error("Error fetching accessory validation list:", err);
            setError("Failed to fetch accessory mappings.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) {
            fetchTableData();
        }
    }, [refreshTrigger, mounted]);

    // Validation schema helper
    const validateForm = (data: {
        modelName: string;
        modelCode: string;
        modelDescription: string;
        bagPartcode: string;
        remotePartcode: string;
        assemblyCode: string;
        vendorPrefix: string;
    }) => {
        const errs: Record<string, string> = {};

        if (!data.modelName) errs.modelName = "Model Name is required";
        else if (!/^[a-zA-Z0-9]+$/.test(data.modelName)) errs.modelName = "Must be alphanumeric";

        if (!data.modelCode) errs.modelCode = "Model Code is required";
        else if (!/^\d+$/.test(data.modelCode)) errs.modelCode = "Must be a number";
        else if (data.modelCode.length > 13) errs.modelCode = "Must be at most 13 digits";

        if (!data.modelDescription) errs.modelDescription = "Model Description is required";

        if (!data.bagPartcode) errs.bagPartcode = "Bag Partcode is required";
        else if (!/^[a-zA-Z0-9]+$/.test(data.bagPartcode)) errs.bagPartcode = "Must be alphanumeric";
        else if (data.bagPartcode.length !== 13) errs.bagPartcode = "Must be exactly 13 characters";

        if (!data.remotePartcode) errs.remotePartcode = "Remote Partcode is required";
        else if (!/^[a-zA-Z0-9]+$/.test(data.remotePartcode)) errs.remotePartcode = "Must be alphanumeric";
        else if (data.remotePartcode.length !== 13) errs.remotePartcode = "Must be exactly 13 characters";

        if (!data.assemblyCode) errs.assemblyCode = "Assembly Code is required";
        else if (!/^[a-zA-Z0-9]+$/.test(data.assemblyCode)) errs.assemblyCode = "Must be alphanumeric";
        else if (data.assemblyCode.length !== 13) errs.assemblyCode = "Must be exactly 13 characters";

        if (!data.vendorPrefix) errs.vendorPrefix = "Vendor Prefix is required";
        else if (!/^[a-zA-Z0-9]+$/.test(data.vendorPrefix)) errs.vendorPrefix = "Must be alphanumeric";
        else if (data.vendorPrefix.length !== 5) errs.vendorPrefix = "Must be exactly 5 characters";

        return errs;
    };

    // Form submit handlers
    const handleSubmitMapping = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormFeedback({ type: "", message: "" });
        setCreateErrors({});

        const formData = {
            modelName,
            modelCode,
            modelDescription,
            bagPartcode,
            remotePartcode,
            assemblyCode,
            vendorPrefix
        };

        const formErrors = validateForm(formData);
        if (Object.keys(formErrors).length > 0) {
            setCreateErrors(formErrors);
            return;
        }

        setFormLoading(true);
        try {
            const employeeName = typeof window !== "undefined" ? sessionStorage.getItem("employee_name") || "UNKNOWN" : "UNKNOWN";
            const payload = {
                ...formData,
                modelCode: Number(modelCode),
                updatedBy: employeeName
            };

            const res = await axios.post(`${API_HOST}/api/production/data/accessory-mapping/post`, payload);

            if (res.status === 200 || res.status === 201) {
                const resData = res.data;
                let message = "Data successfully mapped and saved!";
                if (resData.status === 'UPDATE') {
                    message = "Existing model mapping successfully updated!";
                } else if (resData.status === 'NEW') {
                    message = "New accessory mapping successfully created!";
                }

                setFormFeedback({ type: "success", message });

                // Clear fields
                setModelName("");
                setModelCode("");
                setModelDescription("");
                setBagPartcode("");
                setRemotePartcode("");
                setAssemblyCode("");
                setVendorPrefix("");

                setRefreshTrigger(p => !p);
            } else {
                setFormFeedback({ type: "error", message: "Unexpected response from server." });
            }
        } catch (err: any) {
            console.error("Error submitting mapping:", err);
            setFormFeedback({ type: "error", message: err.response?.data?.message || "Failed to submit accessory mapping." });
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditClick = (item: AccessoryMappingItem) => {
        setEditingItem(item);
        setEditModelName(item.modelname || "");
        setEditModelCode(item.modelcode || "");
        setEditModelDescription(item.modeldescription || "");
        setEditBagPartcode(item.bagpartcode || "");
        setEditRemotePartcode(item.remotepartcode || "");
        setEditAssemblyCode(item.assemblycode || "");
        setEditVendorPrefix(item.vendorprefix || "");

        setEditErrors({});
        setEditFeedback({ type: "", message: "" });
        setEditDialogOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;

        setEditFeedback({ type: "", message: "" });
        setEditErrors({});

        const formData = {
            modelName: editModelName,
            modelCode: editModelCode,
            modelDescription: editModelDescription,
            bagPartcode: editBagPartcode,
            remotePartcode: editRemotePartcode,
            assemblyCode: editAssemblyCode,
            vendorPrefix: editVendorPrefix
        };

        const formErrors = validateForm(formData);
        if (Object.keys(formErrors).length > 0) {
            setEditErrors(formErrors);
            return;
        }

        setEditLoading(true);
        try {
            const employeeName = typeof window !== "undefined" ? sessionStorage.getItem("employee_name") || "UNKNOWN" : "UNKNOWN";
            const payload = {
                ...formData,
                id: editingItem.id,
                modelCode: Number(editModelCode),
                updatedBy: employeeName
            };

            const res = await axios.post(`${API_HOST}/api/production/data/accessory-mapping/edit`, payload);

            if (res.data?.success || res.status === 200 || res.status === 201) {
                setEditFeedback({ type: "success", message: "Data successfully updated!" });
                setRefreshTrigger(p => !p);
                setTimeout(() => setEditDialogOpen(false), 1200);
            } else {
                setEditFeedback({ type: "error", message: "Unexpected response from server." });
            }
        } catch (err: any) {
            console.error("Error editing mapping:", err);
            setEditFeedback({ type: "error", message: err.response?.data?.message || "Failed to update accessory mapping." });
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteClick = (item: AccessoryMappingItem) => {
        setDeletingItem(item);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingItem) return;
        setDeleteLoading(true);

        try {
            const res = await axios.post(`${API_HOST}/api/production/data/accessory-mapping/delete`, { id: deletingItem.id });
            if (res.data?.success || res.status === 200) {
                setRefreshTrigger(p => !p);
                setDeleteDialogOpen(false);
            } else {
                alert("Delete request failed.");
            }
        } catch (err) {
            console.error("Delete mapping failed:", err);
            alert("An error occurred during deletion.");
        } finally {
            setDeleteLoading(false);
            setDeletingItem(null);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "—";
        try {
            const d = new Date(dateString);
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${d.getDate().toString().padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-2">
            {/* Header action bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/manufacturing">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
                            Accessory Mapping Validation
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Validate, audit, and link accessory components with production model codes
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button onClick={() => setRefreshTrigger(p => !p)} variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                        <RefreshCw className="w-4 h-4" />
                    </Button>

                    <Button
                        onClick={() => setFormExpanded(p => !p)}
                        variant="outline"
                        className="text-xs h-9 gap-1"
                    >
                        {formExpanded ? (
                            <>Collapse Form <ChevronUp className="w-3.5 h-3.5" /></>
                        ) : (
                            <>Expand Form <ChevronDown className="w-3.5 h-3.5" /></>
                        )}
                    </Button>
                </div>
            </div>

            {/* Creation Form Collapse */}
            {formExpanded && (
                <Card className="border-border/60 bg-card shadow-sm transition-all duration-300">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">New Accessory Mapping</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {formFeedback.message && (
                            <Alert variant={formFeedback.type === "success" ? "default" : "destructive"} className="text-xs py-2 px-3 mb-4">
                                <div className="flex gap-2 items-center">
                                    {formFeedback.type === "success" ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4" />
                                    )}
                                    <AlertDescription className="text-xs font-semibold">{formFeedback.message}</AlertDescription>
                                </div>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmitMapping} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Model Name *</Label>
                                    <Input
                                        placeholder="e.g. CI999SL99RGM9"
                                        value={modelName}
                                        onChange={(e) => setModelName(e.target.value)}
                                        className={`bg-background border-border text-xs ${createErrors.modelName ? "border-rose-500" : ""}`}
                                    />
                                    {createErrors.modelName && <span className="text-rose-500 text-[10px] block">{createErrors.modelName}</span>}
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Model Code *</Label>
                                    <Input
                                        placeholder="e.g. 8902387999999"
                                        maxLength={13}
                                        value={modelCode}
                                        onChange={(e) => setModelCode(e.target.value.replace(/[^0-9]/g, ''))}
                                        className={`bg-background border-border text-xs ${createErrors.modelCode ? "border-rose-500" : ""}`}
                                    />
                                    {createErrors.modelCode && <span className="text-rose-500 text-[10px] block">{createErrors.modelCode}</span>}
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Model Description *</Label>
                                    <Input
                                        placeholder="e.g. 1.0T 3S SL R 9999W MEG"
                                        value={modelDescription}
                                        onChange={(e) => setModelDescription(e.target.value)}
                                        className={`bg-background border-border text-xs ${createErrors.modelDescription ? "border-rose-500" : ""}`}
                                    />
                                    {createErrors.modelDescription && <span className="text-rose-500 text-[10px] block">{createErrors.modelDescription}</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Bag Partcode *</Label>
                                    <Input
                                        placeholder="e.g. IU999MXIAA888"
                                        maxLength={13}
                                        value={bagPartcode}
                                        onChange={(e) => setBagPartcode(e.target.value)}
                                        className={`bg-background border-border text-xs ${createErrors.bagPartcode ? "border-rose-500" : ""}`}
                                    />
                                    {createErrors.bagPartcode && <span className="text-rose-500 text-[10px] block">{createErrors.bagPartcode}</span>}
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Remote Partcode *</Label>
                                    <Input
                                        placeholder="e.g. IU999MXRMC999"
                                        maxLength={13}
                                        value={remotePartcode}
                                        onChange={(e) => setRemotePartcode(e.target.value)}
                                        className={`bg-background border-border text-xs ${createErrors.remotePartcode ? "border-rose-500" : ""}`}
                                    />
                                    {createErrors.remotePartcode && <span className="text-rose-500 text-[10px] block">{createErrors.remotePartcode}</span>}
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Assembly Code *</Label>
                                    <Input
                                        placeholder="e.g. IU999MXRAA999"
                                        maxLength={13}
                                        value={assemblyCode}
                                        onChange={(e) => setAssemblyCode(e.target.value)}
                                        className={`bg-background border-border text-xs ${createErrors.assemblyCode ? "border-rose-500" : ""}`}
                                    />
                                    {createErrors.assemblyCode && <span className="text-rose-500 text-[10px] block">{createErrors.assemblyCode}</span>}
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Vendor Prefix *</Label>
                                    <Input
                                        placeholder="e.g. LC999"
                                        maxLength={5}
                                        value={vendorPrefix}
                                        onChange={(e) => setVendorPrefix(e.target.value)}
                                        className={`bg-background border-border text-xs ${createErrors.vendorPrefix ? "border-rose-500" : ""}`}
                                    />
                                    {createErrors.vendorPrefix && <span className="text-rose-500 text-[10px] block">{createErrors.vendorPrefix}</span>}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setModelName("");
                                        setModelCode("");
                                        setModelDescription("");
                                        setBagPartcode("");
                                        setRemotePartcode("");
                                        setAssemblyCode("");
                                        setVendorPrefix("");
                                        setCreateErrors({});
                                    }}
                                    className="text-xs"
                                >
                                    Reset
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={formLoading}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9"
                                >
                                    {formLoading ? "Saving..." : "Submit Mapping"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* List Table */}
            <Card className="border-border/60 bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="text-md font-bold uppercase tracking-tight">Active Mappings</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {error && (
                        <Alert variant="destructive" className="mb-4 text-xs">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-8 w-full" />
                            ))}
                        </div>
                    ) : tableData.length > 0 ? (
                        <div className="overflow-x-auto border border-border/40 rounded-lg">
                            <Table>
                                <TableHeader className="bg-slate-900/50">
                                    <TableRow>
                                        <TableHead className="text-xs font-bold py-2.5">Model Name</TableHead>
                                        <TableHead className="text-xs font-bold py-2.5">Model Code</TableHead>
                                        <TableHead className="text-xs font-bold py-2.5">Description</TableHead>
                                        <TableHead className="text-xs font-bold py-2.5">Bag Partcode</TableHead>
                                        <TableHead className="text-xs font-bold py-2.5">Remote Partcode</TableHead>
                                        <TableHead className="text-xs font-bold py-2.5">Assembly Code</TableHead>
                                        <TableHead className="text-xs font-bold py-2.5 text-center">Vendor Prefix</TableHead>
                                        <TableHead className="text-xs font-bold py-2.5">Created At</TableHead>
                                        <TableHead className="text-xs font-bold py-2.5">Updated By</TableHead>
                                        <TableHead className="text-xs font-bold py-2.5 text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tableData.map((row) => (
                                        <TableRow key={row.id} className="hover:bg-muted/40 text-xs">
                                            <TableCell className="py-2.5 font-bold">{row.modelname}</TableCell>
                                            <TableCell className="py-2.5 font-semibold text-blue-600">{row.modelcode}</TableCell>
                                            <TableCell className="py-2.5 text-muted-foreground max-w-[150px] truncate" title={row.modeldescription}>{row.modeldescription}</TableCell>
                                            <TableCell className="py-2.5">{row.bagpartcode}</TableCell>
                                            <TableCell className="py-2.5">{row.remotepartcode}</TableCell>
                                            <TableCell className="py-2.5">{row.assemblycode}</TableCell>
                                            <TableCell className="py-2.5 text-center font-semibold text-foreground/80">{row.vendorprefix}</TableCell>
                                            <TableCell className="py-2.5 whitespace-nowrap text-muted-foreground">{formatDate(row.created_at)}</TableCell>
                                            <TableCell className="py-2.5">{row.updated_by}</TableCell>
                                            <TableCell className="py-2.5 text-center">
                                                <div className="flex gap-1 justify-center">
                                                    <Button
                                                        onClick={() => handleEditClick(row)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDeleteClick(row)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-sm text-muted-foreground italic">
                            No accessory validation mappings registered.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* EDIT DIALOG */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="text-md font-bold uppercase">Edit Accessory Mapping</DialogTitle>
                        <DialogDescription className="text-xs">
                            Modify linking parameters for this production model mapping.
                        </DialogDescription>
                    </DialogHeader>

                    {editFeedback.message && (
                        <Alert variant={editFeedback.type === "success" ? "default" : "destructive"} className="text-xs py-2 px-3 mb-2">
                            <div className="flex gap-2 items-center">
                                {editFeedback.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4" />}
                                <span className="text-xs font-semibold">{editFeedback.message}</span>
                            </div>
                        </Alert>
                    )}

                    <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Model Name *</Label>
                                <Input
                                    value={editModelName}
                                    onChange={(e) => setEditModelName(e.target.value)}
                                    className={`bg-background border-border text-xs ${editErrors.modelName ? "border-rose-500" : ""}`}
                                />
                                {editErrors.modelName && <span className="text-rose-500 text-[10px] block">{editErrors.modelName}</span>}
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Model Code *</Label>
                                <Input
                                    maxLength={13}
                                    value={editModelCode}
                                    onChange={(e) => setEditModelCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    className={`bg-background border-border text-xs ${editErrors.modelCode ? "border-rose-500" : ""}`}
                                />
                                {editErrors.modelCode && <span className="text-rose-500 text-[10px] block">{editErrors.modelCode}</span>}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Model Description *</Label>
                            <Input
                                value={editModelDescription}
                                onChange={(e) => setEditModelDescription(e.target.value)}
                                className={`bg-background border-border text-xs ${editErrors.modelDescription ? "border-rose-500" : ""}`}
                            />
                            {editErrors.modelDescription && <span className="text-rose-500 text-[10px] block">{editErrors.modelDescription}</span>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Bag Partcode *</Label>
                                <Input
                                    maxLength={13}
                                    value={editBagPartcode}
                                    onChange={(e) => setEditBagPartcode(e.target.value)}
                                    className={`bg-background border-border text-xs ${editErrors.bagPartcode ? "border-rose-500" : ""}`}
                                />
                                {editErrors.bagPartcode && <span className="text-rose-500 text-[10px] block">{editErrors.bagPartcode}</span>}
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Remote Partcode *</Label>
                                <Input
                                    maxLength={13}
                                    value={editRemotePartcode}
                                    onChange={(e) => setEditRemotePartcode(e.target.value)}
                                    className={`bg-background border-border text-xs ${editErrors.remotePartcode ? "border-rose-500" : ""}`}
                                />
                                {editErrors.remotePartcode && <span className="text-rose-500 text-[10px] block">{editErrors.remotePartcode}</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Assembly Code *</Label>
                                <Input
                                    maxLength={13}
                                    value={editAssemblyCode}
                                    onChange={(e) => setEditAssemblyCode(e.target.value)}
                                    className={`bg-background border-border text-xs ${editErrors.assemblyCode ? "border-rose-500" : ""}`}
                                />
                                {editErrors.assemblyCode && <span className="text-rose-500 text-[10px] block">{editErrors.assemblyCode}</span>}
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Vendor Prefix *</Label>
                                <Input
                                    maxLength={5}
                                    value={editVendorPrefix}
                                    onChange={(e) => setEditVendorPrefix(e.target.value)}
                                    className={`bg-background border-border text-xs ${editErrors.vendorPrefix ? "border-rose-500" : ""}`}
                                />
                                {editErrors.vendorPrefix && <span className="text-rose-500 text-[10px] block">{editErrors.vendorPrefix}</span>}
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setEditDialogOpen(false)} className="text-xs">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9">
                                {editLoading ? "Updating..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRMATION */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold uppercase text-rose-500">Confirm Deletion</DialogTitle>
                        <DialogDescription className="text-xs">
                            Are you sure you want to delete this accessory mapping? This action is permanent.
                        </DialogDescription>
                    </DialogHeader>
                    {deletingItem && (
                        <div className="text-xs py-2 bg-muted/40 p-3 rounded-lg border">
                            <div><span className="font-bold">Model Name:</span> {deletingItem.modelname}</div>
                            <div><span className="font-bold">Model Code:</span> {deletingItem.modelcode}</div>
                        </div>
                    )}
                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setDeleteDialogOpen(false)} className="text-xs">
                            No, Cancel
                        </Button>
                        <Button type="button" onClick={handleDeleteConfirm} disabled={deleteLoading} variant="destructive" size="sm" className="text-xs">
                            {deleteLoading ? "Deleting..." : "Yes, Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
