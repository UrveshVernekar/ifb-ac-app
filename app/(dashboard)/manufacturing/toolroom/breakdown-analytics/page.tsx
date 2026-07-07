"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Eye, FileText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Cell
} from "recharts";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";

export default function BreakdownAnalyticsPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);

    // Grouped by activeCategory
    const [rawData, setRawData] = useState<any>({
        "PRESS-TOOL": [],
        "IMM-MOULD": [],
        "LINE-TOOL": []
    });

    // Filter states
    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split("T")[0];
    });
    const [activeCategory, setActiveCategory] = useState("PRESS-TOOL"); // PRESS-TOOL, IMM-MOULD, LINE-TOOL
    const [activeSubTab, setActiveSubTab] = useState("graphical"); // graphical, tabular, detailed

    // Modal dialog state for 5-Why
    const [selectedBreakdown, setSelectedBreakdown] = useState<any>(null);
    const [isWhyModalOpen, setIsWhyModalOpen] = useState(false);

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";

    const fetchBreakdowns = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${apiBase}/production/toolroom/get-breakdownslist`);
            setRawData(response.data || { "PRESS-TOOL": [], "IMM-MOULD": [], "LINE-TOOL": [] });
        } catch (error) {
            console.error("Error loading breakdown list:", error);
            toast.error("Failed to load breakdown entries.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchBreakdowns();
    }, [apiBase]);

    if (!mounted) return null;

    // Filter data based on date ranges
    const categoryData = rawData[activeCategory] || [];
    const filteredData = categoryData.filter((item: any) => {
        const dateStr = item.Date || item.date;
        if (!dateStr) return false;

        const itemDate = new Date(dateStr).getTime();
        const start = new Date(startDate + "T00:00:00").getTime();
        const end = new Date(endDate + "T23:59:59").getTime();

        return itemDate >= start && itemDate <= end;
    });

    // Helper: resolve display names for tools in raw logs
    const getToolDisplayName = (item: any) => {
        const toolCode = item.Tool_Code || item.tool_code || "N/A";
        const toolName = item.Tool_Name || item.tool_name || "";
        const op = item.Operation || item.operation || "";

        if (activeCategory === "IMM-MOULD") {
            return toolCode;
        } else if (activeCategory === "PRESS-TOOL") {
            return `${toolCode} - ${toolName} - ${op}`;
        } else if (activeCategory === "LINE-TOOL") {
            return toolCode;
        }
        return toolCode;
    };

    // Calculate aggregated graphical data: sum breakdown time for each unique tool
    const getChartData = () => {
        const aggregates: { [key: string]: number } = {};
        filteredData.forEach((item: any) => {
            const name = getToolDisplayName(item);
            const duration = Number(item.Breakdown_time || item.breakdown_time) || 0;
            aggregates[name] = (aggregates[name] || 0) + duration;
        });

        return Object.entries(aggregates).map(([name, value]) => ({
            name: name.length > 25 ? name.substring(0, 22) + "..." : name,
            fullName: name,
            minutes: value
        })).sort((a, b) => b.minutes - a.minutes);
    };

    const chartData = getChartData();
    const totalMinutes = filteredData.reduce((acc: number, curr: any) => acc + (Number(curr.Breakdown_time || curr.breakdown_time) || 0), 0);
    const isTargetExceeded = totalMinutes > 600;

    // Export tabular logs to CSV format
    const handleCsvExport = () => {
        if (filteredData.length === 0) {
            toast.error("No Data to Export");
            return;
        }

        const headers = ["Date", "Tool/Mould Details", "Malfunction Details", "Cause/Reason", "Action Taken", "Status", "Duration (Mins)"];
        const rows = filteredData.map((item: any) => [
            (item.Date || item.date) ? new Date(item.Date || item.date).toLocaleDateString("en-GB") : "",
            getToolDisplayName(item).replace(/,/g, " "),
            (item.Breakdown_Detail || item.breakdown_detail || "").replace(/,/g, " ").replace(/\n/g, " "),
            (item.Breakdown_Reason || item.breakdown_reason || "").replace(/,/g, " ").replace(/\n/g, " "),
            (item.Action_taken || item.action_taken || "").replace(/,/g, " ").replace(/\n/g, " "),
            item.status_after_repair || item.Status_after_repair || "Closed",
            item.Breakdown_time || item.breakdown_time || 0
        ]);

        const csvContent = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Breakdown_Report_${activeCategory}_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV report exported successfully!");
    };

    // Columns config for Tabular Summary view
    const summaryColumns: ColumnConfig<any>[] = [
        {
            header: "S.No",
            accessorKey: "index",
            className: "text-center w-16",
            headerClassName: "text-center",
            cell: (_item: any, index: number) => <span className="font-bold text-muted-foreground">{index + 1}</span>
        },
        {
            header: "Tool / Mould Identification Details",
            accessorKey: "fullName",
            isSortable: true,
            className: "font-semibold text-foreground text-left"
        },
        {
            header: "Total Failure Time (Mins)",
            accessorKey: "minutes",
            isSortable: true,
            className: "text-center font-bold text-slate-800 dark:text-slate-200 w-48",
            headerClassName: "text-center"
        }
    ];

    // Columns config for Detailed Logs view
    const detailedColumns: ColumnConfig<any>[] = [
        {
            header: "Date",
            accessorKey: "Date",
            isSortable: true,
            className: "text-center font-semibold whitespace-nowrap w-24",
            headerClassName: "text-center",
            cell: (item: any) => {
                const dt = item.Date || item.date;
                return dt ? new Date(dt).toLocaleDateString("en-GB") : "N/A";
            }
        },
        {
            header: "Asset Details",
            accessorKey: "Tool_Code",
            isSortable: true,
            cell: (item: any) => {
                const code = item.Tool_Code || item.tool_code;
                const name = item.Tool_Name || item.tool_name;
                const op = item.Operation || item.operation;
                return (
                    <div>
                        <div className="font-bold text-foreground">{code}</div>
                        {(name || op) && (
                            <div className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">
                                {name} • Op: {op}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            header: "Cause / Malfunction reason",
            accessorKey: "Breakdown_Reason",
            className: "max-w-[200px] truncate",
            cell: (item: any) => {
                const val = item.Breakdown_Reason || item.breakdown_reason || "N/A";
                return <span title={val}>{val}</span>;
            }
        },
        {
            header: "Observations & Actions",
            accessorKey: "Breakdown_Detail",
            className: "max-w-[220px]",
            cell: (item: any) => {
                const obs = item.Breakdown_Detail || item.breakdown_detail;
                const act = item.Action_taken || item.action_taken;
                return (
                    <div>
                        <div className="font-medium text-foreground truncate" title={obs}>
                            Obs: {obs}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate mt-0.5" title={act}>
                            Act: {act}
                        </div>
                    </div>
                );
            }
        },
        {
            header: "Status",
            accessorKey: "status_after_repair",
            isSortable: true,
            className: "text-center w-28",
            headerClassName: "text-center",
            cell: (item: any) => {
                const val = item.status_after_repair || item.Status_after_repair || "N/A";
                const isClosed = String(val).toUpperCase() === "CLOSED";
                return (
                    <Badge variant="outline" className={`text-[10px] font-bold ${isClosed ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        }`}>
                        {val}
                    </Badge>
                );
            }
        },
        {
            header: "Duration (Mins)",
            accessorKey: "Breakdown_time",
            isSortable: true,
            className: "text-center font-bold text-slate-800 dark:text-slate-200 w-28",
            headerClassName: "text-center",
            cell: (item: any) => item.Breakdown_time || item.breakdown_time || 0
        },
        {
            header: "5-Why",
            accessorKey: "why",
            className: "text-center w-24",
            headerClassName: "text-center",
            cell: (item: any) => (
                <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-lg mx-auto"
                    onClick={() => {
                        setSelectedBreakdown(item);
                        setIsWhyModalOpen(true);
                    }}
                >
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-6 max-w-8xl mx-auto p-4 sm:p-6">
            {/* Page Header */}
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
                        <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
                            Analytics Hub
                        </Badge>
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight mt-2 text-foreground">
                        Breakdown Analytics
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Filter tool breakdowns by date ranges, trace analytical trends, and review detailed root-cause records.
                    </p>
                </div>
            </div>

            {/* Filter controls panel */}
            <Card className="border border-border/60 bg-card/65 backdrop-blur shadow-sm">
                <CardContent className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={fetchBreakdowns}
                            disabled={loading}
                            className="flex-1 text-xs h-9 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-slate-200"
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleCsvExport}
                            className="h-9 gap-1 text-xs font-bold border-border/80"
                        >
                            <Download className="w-3.5 h-3.5" /> Export
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Category tabs selection */}
            <div className="flex border-b border-border bg-muted/40 p-1 rounded-xl gap-1 shrink-0 max-w-md">
                {[
                    { label: "Press Tools", value: "PRESS-TOOL" },
                    { label: "IMM Moulds", value: "IMM-MOULD" },
                    { label: "Line Tools", value: "LINE-TOOL" }
                ].map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setActiveCategory(tab.value)}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center ${activeCategory === tab.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-background/30"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Sub-view switcher card */}
            <Card className="border border-border/60 bg-card shadow-sm">
                <CardHeader className="pb-3 border-b border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle className="text-sm font-bold uppercase tracking-wider">Breakdown Summaries</CardTitle>
                        <CardDescription className="text-xs">
                            Active logs in category: <strong className="text-foreground">{activeCategory}</strong>
                        </CardDescription>
                    </div>

                    {/* Sub tabs selectors */}
                    <div className="flex border border-border bg-muted/30 p-0.5 rounded-lg text-[11px] font-bold">
                        <button
                            onClick={() => setActiveSubTab("graphical")}
                            className={`px-3 py-1 rounded-md transition-all ${activeSubTab === "graphical"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-background/20"
                                }`}
                        >
                            Graphical
                        </button>
                        <button
                            onClick={() => setActiveSubTab("tabular")}
                            className={`px-3 py-1 rounded-md transition-all ${activeSubTab === "tabular"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-background/20"
                                }`}
                        >
                            Tabular Summary
                        </button>
                        <button
                            onClick={() => setActiveSubTab("detailed")}
                            className={`px-3 py-1 rounded-md transition-all ${activeSubTab === "detailed"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-background/20"
                                }`}
                        >
                            Detailed Logs
                        </button>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                            <p className="text-xs text-muted-foreground">Generating views...</p>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Info className="w-10 h-10 text-muted-foreground/60 mb-3" />
                            <h3 className="text-sm font-bold text-foreground">No Breakdown Logs Recorded</h3>
                            <p className="text-xs text-muted-foreground max-w-sm mt-1">
                                No tool breakdown reports fall within the selected dates ({startDate} to {endDate}) for {activeCategory}.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Sub view: Graphical */}
                            {activeSubTab === "graphical" && (
                                <div className="space-y-6">
                                    {/* Breakdown threshold gauge summary card */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <Card className={`border ${isTargetExceeded ? 'border-rose-200 bg-rose-500/5' : 'border-emerald-200 bg-emerald-500/5'}`}>
                                            <CardContent className="p-4 space-y-1.5 text-center">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Overall Breakdown Minutes</span>
                                                <div className={`text-2xl font-black ${isTargetExceeded ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                    {totalMinutes} Mins
                                                </div>
                                                <div className="flex justify-center">
                                                    <Badge className={`text-[10px] font-bold ${isTargetExceeded ? 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/10' : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10'}`}>
                                                        {isTargetExceeded ? "TARGET EXCEEDED" : "WITHIN TARGET"}
                                                    </Badge>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-1">Max target breakdown allowance: 600 minutes</p>
                                            </CardContent>
                                        </Card>

                                        <Card className="border border-border/60 bg-muted/20">
                                            <CardContent className="p-4 space-y-1 text-center">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Malfunctioning Tools Count</span>
                                                <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
                                                    {chartData.length}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground">Unique asset ids logged under failures</p>
                                            </CardContent>
                                        </Card>

                                        <Card className="border border-border/60 bg-muted/20">
                                            <CardContent className="p-4 space-y-1 text-center">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Average Duration per Breakdown</span>
                                                <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
                                                    {(totalMinutes / filteredData.length).toFixed(1)} Mins
                                                </div>
                                                <p className="text-[10px] text-muted-foreground">Based on {filteredData.length} breakdown logs</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Recharts chart */}
                                    <div className="h-96 w-full border border-border/60 rounded-xl p-4 bg-muted/5">
                                        <h3 className="text-xs font-bold text-foreground mb-4 uppercase tracking-wider text-center">
                                            Failure Minutes Comparison by Tool
                                        </h3>
                                        <ResponsiveContainer width="100%" height="90%">
                                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/40" />
                                                <XAxis
                                                    dataKey="name"
                                                    tick={{ fontSize: 9 }}
                                                    interval={0}
                                                    angle={-15}
                                                    textAnchor="end"
                                                />
                                                <YAxis tick={{ fontSize: 10 }} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: "hsl(var(--popover))",
                                                        borderColor: "hsl(var(--border))",
                                                        borderRadius: "8px",
                                                        fontSize: "11px"
                                                    }}
                                                    formatter={(value: any, name: any, props: any) => [
                                                        `${value} Minutes`,
                                                        props.payload.fullName
                                                    ]}
                                                />
                                                <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                                                    {chartData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.minutes > 200 ? "#f43f5e" : "#3b82f6"}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Sub view: Tabular */}
                            {activeSubTab === "tabular" && (
                                <CommonTable
                                    data={chartData}
                                    columns={summaryColumns}
                                    enableFiltering={false}
                                    showColumnVisibility={false}
                                    initialPageSize={10}
                                />
                            )}

                            {/* Sub view: Detailed */}
                            {activeSubTab === "detailed" && (
                                <CommonTable
                                    data={filteredData}
                                    columns={detailedColumns}
                                    enableFiltering={false}
                                    showColumnVisibility={true}
                                    initialPageSize={10}
                                />
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Why-Why Analysis Detail Modal */}
            {isWhyModalOpen && selectedBreakdown && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="max-w-xl w-full border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="pb-4 border-b border-border/40">
                            <CardTitle className="text-base font-bold flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-blue-500" />
                                Root Cause (5-Why) Analysis
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Asset: <strong>{selectedBreakdown.Tool_Code || selectedBreakdown.tool_code}</strong> • Logged on {(selectedBreakdown.Date || selectedBreakdown.date) ? new Date(selectedBreakdown.Date || selectedBreakdown.date).toLocaleDateString("en-GB") : "N/A"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4 max-h-[60vh] overflow-y-auto">
                            {/* Whys chain */}
                            <div className="space-y-2.5">
                                <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">5-Why Chain:</h4>
                                <div className="space-y-2 border-l-2 border-blue-500/30 pl-3">
                                    {[1, 2, 3, 4, 5].map((num) => {
                                        const ans = selectedBreakdown[`why_${num}`];
                                        return (
                                            <div key={num} className="text-xs">
                                                <span className="font-bold text-blue-500 mr-1.5">Why {num}:</span>
                                                <span className="text-foreground">{ans || <em className="text-muted-foreground">Not documented</em>}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Additional metadata info */}
                            <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-4 text-xs">
                                <div className="space-y-1">
                                    <span className="font-semibold text-muted-foreground">Permanent Countermeasure:</span>
                                    <p className="text-foreground leading-snug font-medium">
                                        {selectedBreakdown.permanent_action || "None documented"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="font-semibold text-muted-foreground">Logged By:</span>
                                    <p className="text-foreground font-semibold">
                                        {selectedBreakdown.Punched_By || selectedBreakdown.punched_by || "System"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                        <div className="p-4 border-t border-border/40 flex justify-end">
                            <Button
                                size="sm"
                                onClick={() => {
                                    setIsWhyModalOpen(false);
                                    setSelectedBreakdown(null);
                                }}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                            >
                                Close
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
