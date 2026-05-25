// app/(dashboard)/manufacturing/process-validation/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Plus,
    Search,
    Download,
    RefreshCw,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    FileText
} from "lucide-react";

const API_HOST = "http://10.0.7.26:3003";

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

export default function ProcessValidationListPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // User sessions
    const [userEmail, setUserEmail] = useState("");

    // Data lists
    const [pvRequests, setPvRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        part_number: "",
        part_name: "",
        reason: "",
        requestor_name: "",
        request_date: "",
        product: "ALL",
        status: "ALL"
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Modal
    const [openInitiateModal, setOpenInitiateModal] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== "undefined") {
            setUserEmail(sessionStorage.getItem("employee_email") || "");
        }
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_HOST}/api/process-validation/get-pv-requests`);
            setPvRequests(Array.isArray(res.data) ? res.data : res.data.data || []);
        } catch (err) {
            console.error("Error fetching process validation requests:", err);
            setError("Failed to fetch process validation requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) {
            fetchRequests();
        }
    }, [refreshTrigger, mounted]);

    // Handle filter adjustments
    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const uniqueProducts = useMemo(() => {
        return Array.from(new Set(pvRequests.map(item => item.product).filter(Boolean)));
    }, [pvRequests]);

    const sortedAndFilteredData = useMemo(() => {
        let items = [...pvRequests];

        // Global Search
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            items = items.filter((item) => {
                return (
                    item.id?.toString().toLowerCase().includes(lowerSearch) ||
                    item.part_number?.toLowerCase().includes(lowerSearch) ||
                    item.part_name?.toLowerCase().includes(lowerSearch) ||
                    item.supplier_type?.toLowerCase().includes(lowerSearch) ||
                    item.requestor_name?.toLowerCase().includes(lowerSearch) ||
                    item.department?.toLowerCase().includes(lowerSearch) ||
                    item.product?.toLowerCase().includes(lowerSearch)
                );
            });
        }

        // Column Filters
        if (filters.part_number) {
            items = items.filter(item => item.part_number?.toLowerCase().includes(filters.part_number.toLowerCase()));
        }
        if (filters.part_name) {
            items = items.filter(item => item.part_name?.toLowerCase().includes(filters.part_name.toLowerCase()));
        }
        if (filters.reason) {
            items = items.filter(item => {
                const reasonLabels = (item.reasons || []).map((rKey: string) =>
                    reasonOptions.find(opt => opt.key === rKey)?.label || rKey
                ).join(" ");
                return reasonLabels.toLowerCase().includes(filters.reason.toLowerCase());
            });
        }
        if (filters.requestor_name) {
            items = items.filter(item => item.requestor_name?.toLowerCase().includes(filters.requestor_name.toLowerCase()));
        }
        if (filters.request_date) {
            items = items.filter(item => item.request_date && item.request_date.startsWith(filters.request_date));
        }
        if (filters.product !== "ALL") {
            items = items.filter(item => item.product === filters.product);
        }
        if (filters.status !== "ALL") {
            items = items.filter(item => {
                const approvals = item.approvals || [];
                const approvedCount = approvals.filter((a: any) => String(a.status) === "1").length;
                const percent = approvals.length ? Math.round((approvedCount / approvals.length) * 100) : 0;

                if (filters.status === "COMPLETED") return percent === 100;
                if (filters.status === "PENDING") return percent < 100;
                return true;
            });
        }
        return items;
    }, [pvRequests, searchTerm, filters]);

    // Reset pagination to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filters]);

    // Pagination calculations
    const totalPages = Math.ceil(sortedAndFilteredData.length / itemsPerPage);
    const displayedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedAndFilteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedAndFilteredData, currentPage]);

    // Date Format Helpers
    const formatDateTime = (dateString: string) => {
        if (!dateString) return "—";
        try {
            const d = new Date(dateString);
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const day = d.getDate().toString().padStart(2, '0');
            const month = months[d.getMonth()];
            const year = d.getFullYear();
            const hrs = d.getHours().toString().padStart(2, '0');
            const mins = d.getMinutes().toString().padStart(2, '0');
            const secs = d.getSeconds().toString().padStart(2, '0');
            return `${day}-${month}-${year} ${hrs}:${mins}:${secs}`;
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-2">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/manufacturing">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
                            Process Validation Requests
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Manage, validate, and signoff product line trials and modifications
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <Button onClick={() => setRefreshTrigger(p => !p)} variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                        <RefreshCw className="w-4 h-4" />
                    </Button>

                    <Button onClick={() => setOpenInitiateModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-md">
                        <Plus className="w-4 h-4" /> Initiate PV
                    </Button>
                </div>
            </div>

            {/* List log container */}
            <Card className="border-border/60 shadow-sm bg-card">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="text-md font-bold uppercase tracking-tight text-foreground/80">Validation Log Entries</CardTitle>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search requests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-background border-border text-xs h-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    {error && (
                        <Alert variant="destructive" className="mb-4 text-xs py-2 px-3">
                            <div className="flex gap-2 items-center">
                                <AlertCircle className="w-4 h-4" />
                                <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
                            </div>
                        </Alert>
                    )}

                    <div className="overflow-x-auto border border-border/40 rounded-lg">
                        <Table>
                            <TableHeader className="bg-slate-900/50">
                                <TableRow>
                                    <TableHead className="text-xs font-bold py-3 text-center w-[50px]">SR.NO</TableHead>
                                    <TableHead className="text-xs font-bold py-3 text-center w-[80px]">BRAND</TableHead>

                                    <TableHead className="text-xs font-bold py-3 min-w-[120px]">
                                        <div className="flex flex-col gap-1">
                                            <span>Part Number</span>
                                            <Input
                                                placeholder="Filter..."
                                                value={filters.part_number}
                                                onChange={e => handleFilterChange("part_number", e.target.value)}
                                                className="h-6 text-[10px] py-0 px-2 font-normal border-slate-700 bg-background max-w-[100px]"
                                            />
                                        </div>
                                    </TableHead>

                                    <TableHead className="text-xs font-bold py-3 min-w-[150px]">
                                        <div className="flex flex-col gap-1">
                                            <span>Part Name</span>
                                            <Input
                                                placeholder="Filter..."
                                                value={filters.part_name}
                                                onChange={e => handleFilterChange("part_name", e.target.value)}
                                                className="h-6 text-[10px] py-0 px-2 font-normal border-slate-700 bg-background max-w-[130px]"
                                            />
                                        </div>
                                    </TableHead>

                                    <TableHead className="text-xs font-bold py-3 text-center">Supplier</TableHead>

                                    <TableHead className="text-xs font-bold py-3 min-w-[160px]">
                                        <div className="flex flex-col gap-1">
                                            <span>Reason</span>
                                            <Input
                                                placeholder="Filter..."
                                                value={filters.reason}
                                                onChange={e => handleFilterChange("reason", e.target.value)}
                                                className="h-6 text-[10px] py-0 px-2 font-normal border-slate-700 bg-background max-w-[130px]"
                                            />
                                        </div>
                                    </TableHead>

                                    <TableHead className="text-xs font-bold py-3">
                                        <div className="flex flex-col gap-1">
                                            <span>Requestor</span>
                                            <Input
                                                placeholder="Filter..."
                                                value={filters.requestor_name}
                                                onChange={e => handleFilterChange("requestor_name", e.target.value)}
                                                className="h-6 text-[10px] py-0 px-2 font-normal border-slate-700 bg-background max-w-[100px]"
                                            />
                                        </div>
                                    </TableHead>

                                    <TableHead className="text-xs font-bold py-3 min-w-[110px]">
                                        <div className="flex flex-col gap-1">
                                            <span>Created At</span>
                                            <Input
                                                type="date"
                                                value={filters.request_date}
                                                onChange={e => handleFilterChange("request_date", e.target.value)}
                                                className="h-6 text-[10px] py-0 px-1 font-normal border-slate-700 bg-background w-full max-w-[100px]"
                                            />
                                        </div>
                                    </TableHead>

                                    <TableHead className="text-xs font-bold py-3">
                                        <div className="flex flex-col gap-1">
                                            <span>Product</span>
                                            <select
                                                value={filters.product}
                                                onChange={e => handleFilterChange("product", e.target.value)}
                                                className="h-6 text-[10px] py-0 px-1 border border-slate-700 bg-background rounded-md max-w-[90px]"
                                            >
                                                <option value="ALL">All</option>
                                                {uniqueProducts.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                    </TableHead>

                                    <TableHead className="text-xs font-bold py-3 min-w-[120px] text-center">
                                        <div className="flex flex-col gap-1 items-center">
                                            <span>Status</span>
                                            <select
                                                value={filters.status}
                                                onChange={e => handleFilterChange("status", e.target.value)}
                                                className="h-6 text-[10px] py-0 px-1 border border-slate-700 bg-background rounded-md w-full max-w-[90px]"
                                            >
                                                <option value="ALL">All</option>
                                                <option value="PENDING">Pending</option>
                                                <option value="COMPLETED">Completed</option>
                                            </select>
                                        </div>
                                    </TableHead>

                                    <TableHead className="text-xs font-bold py-3 text-center">Download</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(6)].map((_, i) => (
                                        <TableRow key={i}>
                                            {[...Array(11)].map((_, j) => (
                                                <TableCell key={j} className="py-3 text-center">
                                                    <Skeleton className="h-4 w-full" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : displayedData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={11} className="text-center py-8 text-sm text-muted-foreground italic">
                                            No requests found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    displayedData.map((item, i) => {
                                        const userApproval = item.approvals?.find((app: any) => app.in_charge === userEmail);
                                        const isUserInCharge = !!userApproval;
                                        const isUserApproved = userApproval && String(userApproval.status) === "1";

                                        // Global SR.NO (not per-page)
                                        const globalSrNo = (currentPage - 1) * itemsPerPage + i + 1;

                                        // Calculate percentage approval
                                        const validApprovals = (item.approvals || []).filter((a: any) => a.name !== "NA");
                                        const approvedCount = validApprovals.filter((a: any) => String(a.status) === "1").length;
                                        const approvalPercent = validApprovals.length > 0
                                            ? Math.round((approvedCount / validApprovals.length) * 100)
                                            : 0;

                                        const allApproved = validApprovals.length > 0 && validApprovals.every((app: any) => app.status === "1");

                                        // Styling classes
                                        let rowBgClass = "hover:bg-muted/50 transition-colors cursor-pointer text-xs";
                                        if (isUserApproved) {
                                            rowBgClass = "bg-emerald-500/10 hover:bg-emerald-500/15 border-l-4 border-l-emerald-500 text-emerald-950 dark:text-emerald-300 transition-colors cursor-pointer text-xs";
                                        } else if (isUserInCharge) {
                                            rowBgClass = "bg-amber-500/10 hover:bg-amber-500/15 border-l-4 border-l-amber-500 text-amber-950 dark:text-amber-300 transition-colors cursor-pointer text-xs";
                                        }

                                        return (
                                            <TableRow
                                                key={item.id}
                                                className={rowBgClass}
                                                onClick={() => router.push(`/manufacturing/process-validation/view/${item.id}`)}
                                            >
                                                <TableCell className="text-center font-bold py-3">{globalSrNo}</TableCell>
                                                <TableCell className="text-center font-bold py-3">{item.pv_type}</TableCell>
                                                <TableCell className="py-3 font-semibold">{item.part_number}</TableCell>
                                                <TableCell className="py-3 max-w-[200px] truncate" title={item.part_name}>
                                                    {item.part_name}
                                                </TableCell>
                                                <TableCell className="py-3 text-center">
                                                    <Badge variant={item.supplier_type === "Inhouse" ? "default" : "secondary"}>
                                                        {item.supplier_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    {reasonOptions.find(opt => opt.key === item.reasons?.[0])?.label || item.reasons?.[0]}
                                                </TableCell>
                                                <TableCell className="py-3 font-medium">{item.requestor_name}</TableCell>
                                                <TableCell className="py-3 text-muted-foreground whitespace-nowrap">{formatDateTime(item.created_at)}</TableCell>
                                                <TableCell className="py-3">{item.product}</TableCell>
                                                <TableCell className="py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex flex-col items-center justify-center gap-1 w-full max-w-[100px] mx-auto">
                                                        <span className="text-[10px] font-bold">
                                                            {approvalPercent}%
                                                        </span>
                                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                                            <div
                                                                className={`h-1.5 rounded-full ${allApproved ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                                style={{ width: `${approvalPercent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center py-3" onClick={(e) => e.stopPropagation()}>
                                                    {allApproved ? (
                                                        <Link href={`/manufacturing/process-validation/download/${item.id}`}>
                                                            <Button
                                                                size="icon"
                                                                variant="outline"
                                                                className="h-7 w-7 text-blue-500 border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-600"
                                                                title="Download Signoff Document"
                                                            >
                                                                <Download className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </Link>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground italic">Pending</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center pt-4 text-xs">
                            <div className="text-muted-foreground font-medium">
                                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedAndFilteredData.length)} of {sortedAndFilteredData.length} entries
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                {[...Array(totalPages)].map((_, i) => (
                                    <Button
                                        key={i}
                                        variant={currentPage === i + 1 ? "default" : "outline"}
                                        className="h-8 w-8 text-xs"
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </Button>
                                ))}

                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Initiate PV Modal */}
            <Dialog open={openInitiateModal} onOpenChange={setOpenInitiateModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-md font-bold uppercase text-center text-slate-800 dark:text-slate-100">Select PV Brand Type</DialogTitle>
                        <DialogDescription className="text-xs text-center">
                            Select the product brand under trial for this validation request.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-3 gap-3 py-4">
                        {[
                            { name: "IFB", icon: "❄️" },
                            { name: "CRUISE", icon: "❄️" },
                            { name: "SHARP", icon: "❄️" },
                            { name: "TCL", icon: "❄️" },
                            { name: "JCB", icon: "❄️" },
                            { name: "ABANS", icon: "❄️" }
                        ].map((item) => (
                            <div
                                key={item.name}
                                className="border border-border/80 rounded-xl p-4 cursor-pointer text-center font-bold text-slate-800 dark:text-slate-100 bg-muted/40 hover:border-blue-500 hover:bg-blue-500/5 hover:-translate-y-1 transition-all duration-200"
                                onClick={() => {
                                    sessionStorage.setItem("pv_request_type", item.name);
                                    setOpenInitiateModal(false);
                                    router.push("/manufacturing/process-validation/form");
                                }}
                            >
                                <div className="text-2xl mb-2">{item.icon}</div>
                                <div className="text-xs">{item.name}</div>
                            </div>
                        ))}
                    </div>

                    <DialogFooter className="sm:justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => setOpenInitiateModal(false)}
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
