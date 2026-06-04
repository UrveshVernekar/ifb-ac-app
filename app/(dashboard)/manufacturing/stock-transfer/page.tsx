// app/(dashboard)/manufacturing/stock-transfer/page.tsx
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, RefreshCw, Send, ArrowLeftRight, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { DatePicker } from "@/components/manufacturing/DatePicker";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";

// const API_HOST = "http://10.0.7.26:3003";
const API_HOST = process.env.NEXT_PUBLIC_API_BASE_URL;

interface StockTransferRow {
    postingDate: string;
    partCode: string;
    partDesc: string;
    quantity: number;
    source: string;
    destination: string;
    status: string;
    remarks: string;
    createdBy: string;
    createdAt: string;
    [key: string]: any;
}

export default function StockTransferPage() {
    const [mounted, setMounted] = useState(false);

    // Filter controls
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [location, setLocation] = useState("");

    // Option lists
    const [partOptions, setPartOptions] = useState<{ label: string; value: string }[]>([]);
    const [locationOptions, setLocationOptions] = useState<{ label: string; value: string }[]>([]);

    // Log list data
    const [rows, setRows] = useState<StockTransferRow[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(false);

    // Form/Modal states
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formSourceLoc, setFormSourceLoc] = useState("");
    const [formPartCode, setFormPartCode] = useState("");
    const [formQty, setFormQty] = useState("");
    const [formRemarks, setFormRemarks] = useState("");
    const [formFeedback, setFormFeedback] = useState({ type: "", message: "" });
    const [formSubmitting, setFormSubmitting] = useState(false);

    useEffect(() => {
        setMounted(true);
        const todayStr = new Date().toISOString().split("T")[0];

        const savedFrom = sessionStorage.getItem("acStockTransferFromDate") || todayStr;
        const savedTo = sessionStorage.getItem("acStockTransferToDate") || todayStr;
        const savedLoc = sessionStorage.getItem("locationValue") || "1004";

        setFromDate(savedFrom);
        setToDate(savedTo);
        setLocation(savedLoc);
    }, []);

    // Load static mappings (location options, part options)
    useEffect(() => {
        if (!mounted) return;
        const fetchMapping = async () => {
            try {
                const res = await axios.get(`${API_HOST}/stock-transfer/data/get-mapping`);
                if (res.data.success) {
                    const locs = res?.data?.data?.locationOptions?.map((item: any) => ({
                        label: item.label,
                        value: item.value,
                    })) || [];
                    const parts = res?.data?.data?.partOptions?.map((item: any) => ({
                        label: item.label,
                        value: item.value,
                    })) || [];
                    setLocationOptions(locs);
                    setPartOptions(parts);

                    if (!location && locs && locs.length > 0) {
                        setLocation(locs[0].value);
                        sessionStorage.setItem("locationValue", locs[0].value);
                    }
                }
            } catch (err) {
                console.error("Mapping fetch error:", err);
            }
        };

        fetchMapping();
    }, [mounted]);

    // Fetch Stock logs
    const fetchStockLogs = async () => {
        if (!location || !fromDate || !toDate) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_HOST}/stock-transfer/data/get-stock`, {
                params: {
                    fromDate,
                    toDate,
                    sourceLocation: location
                }
            });
            if (res.data.success) {
                // Map API properties to row format
                const mapped = (res.data.data || []).map((row: any) => ({
                    postingDate: row["POSTING DATE"] || row.postingDate || row.PostingDate || "",
                    partCode: row["PART CODE"] || row.partCode || row.PartCode || "",
                    partDesc: row["PART DESC"] || row.partDesc || row.PartDesc || "",
                    quantity: row["QUANTITY"] || row.quantity || row.Quantity || 0,
                    source: row["SOURCE"] || row.source || row.Source || "",
                    destination: row["DESTINATION"] || row.destination || row.Destination || "",
                    status: row["STATUS"] || row.status || row.Status || "",
                    remarks: row["REMARKS"] || row.remarks || row.Remarks || "",
                    createdBy: row["CREATED BY"] || row.createdBy || row.CreatedBy || "",
                    createdAt: row["CREATED AT"] || row.createdAt || row.CreatedAt || "",
                }));
                setRows(mapped);
            } else {
                setRows([]);
            }
        } catch (err) {
            console.error("Stock logs fetch error:", err);
            setError("Failed to retrieve stock transfer logs.");
        } finally {
            setLoading(false);
        }
    };

    const columns = React.useMemo<ColumnConfig<StockTransferRow>[]>(() => [
        {
            header: "Posting Date",
            accessorKey: "postingDate",
            isFilterable: true,
            isSortable: true,
            cell: (row: StockTransferRow) => {
                let postDate = row.postingDate;
                try {
                    const d = new Date(row.postingDate);
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    postDate = `${d.getDate().toString().padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
                } catch (e) { }
                return postDate;
            }
        },
        {
            header: "Part Code",
            accessorKey: "partCode",
            isFilterable: true,
            isSortable: true,
            className: "font-semibold",
        },
        {
            header: "Part Description",
            accessorKey: "partDesc",
            isFilterable: true,
            isSortable: true,
        },
        {
            header: "Qty",
            accessorKey: "quantity",
            className: "text-right font-bold text-blue-600",
            cell: (row: StockTransferRow) => row.quantity,
        },
        {
            header: "Source",
            accessorKey: "source",
            isFilterable: true,
            isSortable: true,
        },
        {
            header: "Destination",
            accessorKey: "destination",
            isFilterable: true,
            isSortable: true,
        },
        {
            header: "Status",
            accessorKey: "status",
            isFilterable: true,
            isSortable: true,
            cell: (row: StockTransferRow) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.status === "S"
                    ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                    : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                    }`}>
                    {row.status === "S" ? "SUCCESS" : "ERROR"}
                </span>
            ),
        },
        {
            header: "Remarks",
            accessorKey: "remarks",
            className: "max-w-[120px] truncate text-muted-foreground",
            cell: (row: StockTransferRow) => <span title={row.remarks}>{row.remarks || "-"}</span>,
        },
        {
            header: "Created By",
            accessorKey: "createdBy",
            isFilterable: true,
            isSortable: true,
        }
    ], []);

    useEffect(() => {
        if (mounted && location) {
            fetchStockLogs();
        }
    }, [fromDate, toDate, location, refreshTrigger, mounted]);

    // Submit Stock Transfer
    const handleTransferSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormFeedback({ type: "", message: "" });

        if (!formPartCode || !formQty || !formSourceLoc) {
            setFormFeedback({ type: "error", message: "Please fill out all fields." });
            return;
        }

        const selectedOption = partOptions.find(o => o.value === formPartCode);
        if (!selectedOption) return;

        // Split "partCode - partDescription"
        const [partCode, partDescription] = selectedOption.label.split(" - ");
        const employeeName = typeof window !== "undefined" ? JSON.parse(sessionStorage.getItem("logindata") || "{}")?.name || "DEFAULT" : "DEFAULT";

        const payload = {
            plantCode: "1035",
            partCode,
            partDescription,
            sourceLocation: formSourceLoc,
            tranferQuantity: formQty,
            remarks: formRemarks,
            requestedBy: employeeName,
        };

        setFormSubmitting(true);
        try {
            const res = await axios.post(`${API_HOST}/stock-transfer/data/post-stock`, payload);
            if (res.data.success) {
                if (res.data.postStatus === "S") {
                    setFormFeedback({ type: "success", message: "Stock transferred successfully." });
                    setRefreshTrigger(prev => !prev);
                    setTimeout(() => {
                        setDialogOpen(false);
                        setFormPartCode("");
                        setFormQty("");
                        setFormRemarks("");
                        setFormSourceLoc("");
                    }, 1500);
                } else if (res.data.postStatus === "E") {
                    setFormFeedback({ type: "error", message: res.data.message || "Deficit Stock / insufficient inventory." });
                }
            } else {
                setFormFeedback({ type: "error", message: res.data.message || "Transfer request failed." });
            }
        } catch (err) {
            console.error("Submit transfer error:", err);
            setFormFeedback({ type: "error", message: "Network error occurred." });
        } finally {
            setFormSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-8xl mx-auto p-2">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/manufacturing">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
                            Stock Transfer
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Move and audit inventory stock values between store locations
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-end">
                    {mounted && (
                        <div className="flex items-center gap-2 bg-card border p-2 rounded-xl shadow-sm h-9">
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">From</span>
                                {/* <Input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => {
                                        setFromDate(e.target.value);
                                        sessionStorage.setItem("acStockTransferFromDate", e.target.value);
                                    }}
                                    className="w-auto bg-background border-none h-7 text-[11px] py-1"
                                /> */}

                                <DatePicker
                                    value={fromDate}
                                    onChange={(dateStr) => {
                                        setFromDate(dateStr);
                                        sessionStorage.setItem("acStockTransferFromDate", dateStr);
                                    }}
                                />
                            </div>

                            <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">To</span>
                                {/* <Input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => {
                                        setToDate(e.target.value);
                                        sessionStorage.setItem("acStockTransferToDate", e.target.value);
                                    }}
                                    className="w-auto bg-background border-none h-7 text-[11px] py-1"
                                /> */}

                                <DatePicker
                                    value={toDate}
                                    onChange={(dateStr) => {
                                        setToDate(dateStr);
                                        sessionStorage.setItem("acStockTransferToDate", dateStr);
                                    }}
                                />
                            </div>

                            <div className="w-px h-5 bg-border" />

                            <Select value={location} onValueChange={(v) => {
                                setLocation(v);
                                sessionStorage.setItem("locationValue", v);
                            }}>
                                <SelectTrigger className="w-[120px] border-none bg-transparent h-7 text-xs">
                                    <SelectValue placeholder="Location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locationOptions.map(o => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button onClick={() => setRefreshTrigger(p => !p)} variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                                <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    )}

                    <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-md">
                        <ArrowLeftRight className="w-4 h-4" /> Transfer Stock
                    </Button>
                </div>
            </div>

            {/* logs table */}
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
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-8 w-full" />
                            ))}
                        </div>
                    ) : (
                        <CommonTable
                            data={rows}
                            columns={columns}
                            enableFiltering={true}
                            enableExport={true}
                            exportFileName="Stock_Transfers.csv"
                            noDataMessage="No stock transfers logged for this period"
                            initialPageSize={5}
                        />
                    )}
                </CardContent>
            </Card>

            {/* STOCK TRANSFER DIALOG */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold uppercase">Execute Stock Transfer</DialogTitle>
                        <DialogDescription className="text-xs">Select source warehouse, part details, and quantities.</DialogDescription>
                    </DialogHeader>

                    {formFeedback.message && (
                        <Alert variant={formFeedback.type === "success" ? "default" : "destructive"} className="text-xs py-2 px-3">
                            <div className="flex gap-2 items-center">
                                {formFeedback.type === "success" ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : <AlertCircle className="w-4 h-4" />}
                                <span className="text-xs font-semibold">{formFeedback.message}</span>
                            </div>
                        </Alert>
                    )}

                    <form onSubmit={handleTransferSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground block">Source Store Location *</Label>
                            <Select value={formSourceLoc} onValueChange={setFormSourceLoc}>
                                <SelectTrigger className="bg-background border-border h-9 text-xs">
                                    <SelectValue placeholder="Select Source Location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locationOptions.map(o => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground block">Select Part *</Label>
                            <Select value={formPartCode} onValueChange={setFormPartCode}>
                                <SelectTrigger className="bg-background border-border h-9 text-xs">
                                    <SelectValue placeholder="Select Part" />
                                </SelectTrigger>
                                <SelectContent>
                                    {partOptions.map(o => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground block">Transfer Quantity *</Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="Quantity"
                                value={formQty}
                                onChange={(e) => setFormQty(e.target.value)}
                                className="bg-background border-border h-9 text-xs"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground block">Remarks</Label>
                            <Input
                                placeholder="Transfer log remarks..."
                                value={formRemarks}
                                onChange={(e) => setFormRemarks(e.target.value)}
                                className="bg-background border-border h-9 text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="text-xs">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={formSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9">
                                {formSubmitting ? "Transferring..." : "Submit"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
