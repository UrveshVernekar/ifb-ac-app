"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Plus, CheckCircle, ExternalLink, Calendar, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";

export default function EcnListPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [ecnData, setEcnData] = useState<any>({
        "Planned-Activity": [],
        "ECN": []
    });
    const [hasAccessEdit, setHasAccessEdit] = useState(false);
    const [loginData, setLoginData] = useState<any>(null);

    // Categories tabs: Planned-Activity, ECN
    const [activeTab, setActiveTab] = useState("Planned-Activity"); // Planned-Activity, ECN
    const [searchTerm, setSearchTerm] = useState("");

    // Complete activity modal date trigger
    const [completeOpen, setCompleteOpen] = useState(false);
    const [selectedEcn, setSelectedEcn] = useState<any>(null);
    const [completionDate, setCompletionDate] = useState(() => new Date().toISOString().split("T")[0]);

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";

    const fetchEcnLogs = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${apiBase}/production/toolroom/get-ecn`);
            setEcnData(response.data || { "Planned-Activity": [], "ECN": [] });
        } catch (error) {
            console.error("Error loading ECN logs:", error);
            toast.error("Failed to load planned activities/ECN logs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        const dataStr = sessionStorage.getItem("logindata");
        if (dataStr) {
            const data = JSON.parse(dataStr);
            setLoginData(data);

            const accessStr = sessionStorage.getItem("accesslist");
            if (accessStr) {
                const list = JSON.parse(accessStr);
                const idMatch = list.some((user: any) => String(user.Employee_code) === String(data.id));
                setHasAccessEdit(idMatch);
            }
        }
        fetchEcnLogs();
    }, [apiBase]);

    if (!mounted) return null;

    // Filter data based on category and search query
    const getFilteredEcn = () => {
        const filtered = ecnData[activeTab] || [];

        // Sort descending by date
        const sorted = [...filtered].sort((a: any, b: any) => {
            const da = a.ecn_implement_date ? new Date(a.ecn_implement_date).getTime() : 0;
            const db = b.ecn_implement_date ? new Date(b.ecn_implement_date).getTime() : 0;
            return db - da;
        });

        if (!searchTerm) return sorted;

        const term = searchTerm.toLowerCase();
        return sorted.filter((item: any) => {
            const tool = String(item.tool_code || "").toLowerCase();
            const detail = String(item.ecn_detail || "").toLowerCase();
            const number = String(item.ecn_no || "").toLowerCase();
            const status = String(item.status || "").toLowerCase();

            return tool.includes(term) || detail.includes(term) || number.includes(term) || status.includes(term);
        });
    };

    const filteredLogs = getFilteredEcn();

    const handleMarkAsDone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEcn || !completionDate) {
            toast.error("Please pick a valid completion date.");
            return;
        }

        try {
            await axios.post(`${apiBase}/production/toolroom/updateecn`, {
                ecn_id: selectedEcn.ecn_id,
                plan_complete_date: completionDate,
                punched_by: loginData?.name || "System"
            });
            toast.success("Planned activity status updated successfully!");
            setCompleteOpen(false);
            setSelectedEcn(null);
            fetchEcnLogs();
        } catch (error) {
            console.error("Error updating ECN status:", error);
            toast.error("Failed to update activity status.");
        }
    };

    // Columns config for CommonTable
    const columns: ColumnConfig<any>[] = [
        {
            header: "Date",
            accessorKey: "ecn_implement_date",
            isSortable: true,
            className: "text-center w-28",
            headerClassName: "text-center",
            cell: (item: any) => item.ecn_implement_date ? new Date(item.ecn_implement_date).toLocaleDateString("en-GB") : "-"
        },
        {
            header: "Tool Code ID",
            accessorKey: "tool_code",
            isSortable: true,
            className: "font-semibold text-foreground w-44"
        },
        ...(activeTab === "ECN" ? [{
            header: "ECN Number",
            accessorKey: "ecn_no",
            isSortable: true,
            className: "font-mono font-medium w-36"
        }] : []),
        {
            header: "Work Detail",
            accessorKey: "ecn_detail",
            className: "leading-relaxed whitespace-pre-wrap"
        },
        ...(activeTab === "Planned-Activity" ? [
            {
                header: "Status",
                accessorKey: "status",
                isSortable: true,
                className: "text-center w-28",
                headerClassName: "text-center",
                cell: (item: any) => {
                    const isDone = String(item.status).toLowerCase() === "done";
                    return (
                        <Badge variant="outline" className={`text-[10px] font-bold ${
                            isDone ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        }`}>
                            {item.status || "Planned"}
                        </Badge>
                    );
                }
            },
            {
                header: "Completed Date",
                accessorKey: "plan_complete_date",
                isSortable: true,
                className: "text-center w-32",
                headerClassName: "text-center",
                cell: (item: any) => item.plan_complete_date ? new Date(item.plan_complete_date).toLocaleDateString("en-GB") : "-"
            }
        ] : []),
        {
            header: "Attachment",
            accessorKey: "attachment",
            className: "text-center w-36",
            headerClassName: "text-center",
            cell: (item: any) => item.attachment ? (
                <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] font-bold gap-1 border-border/80 text-blue-600 dark:text-blue-400"
                    onClick={() => window.open(item.attachment, "_blank")}
                >
                    <ExternalLink className="w-3 h-3" /> View file
                </Button>
            ) : (
                <span className="text-[10px] text-muted-foreground font-semibold">No File</span>
            )
        },
        ...(activeTab === "Planned-Activity" && hasAccessEdit ? [{
            header: "Actions",
            accessorKey: "actions",
            className: "text-center w-28",
            headerClassName: "text-center",
            cell: (item: any) => {
                const isDone = String(item.status).toLowerCase() === "done";
                return !isDone ? (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[9px] font-bold border-green-500/35 text-green-600 hover:text-green-500 bg-green-500/5 hover:bg-green-500/10 gap-0.5"
                        onClick={() => {
                            setSelectedEcn(item);
                            setCompletionDate(new Date().toISOString().split("T")[0]);
                            setCompleteOpen(true);
                        }}
                    >
                        <CheckCircle className="w-3 h-3" /> Done
                    </Button>
                ) : (
                    <span className="text-[10px] text-muted-foreground font-semibold">-</span>
                );
            }
        }] : [])
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push("/manufacturing/toolroom")}
                            className="h-8 gap-1 border-border/80"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Back
                        </Button>
                        <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
                            ECN & Improvements
                        </Badge>
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight mt-2 text-foreground">
                        Planned Activities & ECN
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Document and monitor engineering change notes, and mark planned improvement activities.
                    </p>
                </div>

                {hasAccessEdit && (
                    <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-9 gap-1"
                        onClick={() => router.push("/manufacturing/toolroom/ecn/add")}
                    >
                        <Plus className="w-4 h-4" /> Add Activity / ECN
                    </Button>
                )}
            </div>

            {/* Category tabs & Search bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex border-b border-border bg-muted/40 p-1 rounded-xl gap-1 shrink-0 w-full sm:max-w-xs">
                    {[
                        { value: "Planned-Activity", label: "Planned Activity" },
                        { value: "ECN", label: "ECN" }
                    ].map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => {
                                setActiveTab(tab.value);
                                setSearchTerm("");
                            }}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                                activeTab === tab.value
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-background/30"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:max-w-xs text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none"
                />
            </div>

            {/* Table */}
            <Card className="border border-border/60 bg-card shadow-sm">
                <CardContent className="p-4 sm:p-6">
                    {loading ? (
                        <div className="text-center py-12 text-xs text-muted-foreground">Loading logs...</div>
                    ) : (
                        <CommonTable
                            data={filteredLogs}
                            columns={columns}
                            enableFiltering={false}
                            showColumnVisibility={true}
                            initialPageSize={10}
                            noDataMessage="No records found matching criteria"
                        />
                    )}
                </CardContent>
            </Card>

            {/* Mark as Done date picker modal */}
            {completeOpen && selectedEcn && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="pb-4 border-b border-border/40">
                            <CardTitle className="text-sm font-bold uppercase tracking-wide">Complete Planned Activity</CardTitle>
                            <CardDescription className="text-xs">Specify the final completion date for this project.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleMarkAsDone}>
                            <CardContent className="pt-4 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">Completion Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={completionDate}
                                        onChange={(e) => setCompletionDate(e.target.value)}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none"
                                    />
                                </div>
                            </CardContent>
                            <div className="p-4 border-t border-border/40 flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setCompleteOpen(false);
                                        setSelectedEcn(null);
                                    }}
                                    className="font-bold text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                                >
                                    Confirm Done
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
