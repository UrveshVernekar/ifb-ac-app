"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, Wrench, ShieldAlert, AlertCircle, Info, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";

// Reusable SearchSelect
const SearchSelect = ({
    options,
    value,
    onChange,
    placeholder,
    className = "",
    disabled = false
}: {
    options: { label: string; value: string;[key: string]: any }[];
    value: string;
    onChange: (option: any) => void;
    placeholder: string;
    className?: string;
    disabled?: boolean;
}) => {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const selectedOption = options.find((o) => String(o.value) === String(value));
    const displayValue = selectedOption ? selectedOption.label : query;

    const filtered = options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className={`relative w-full ${className}`} ref={containerRef}>
            <input
                type="text"
                disabled={disabled}
                className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                placeholder={placeholder}
                value={isOpen ? query : displayValue}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => {
                    setQuery("");
                    setIsOpen(true);
                }}
            />
            {isOpen && !disabled && (
                <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-popover text-popover-foreground border border-border rounded-lg shadow-lg z-50 py-1">
                    {filtered.length > 0 ? (
                        filtered.map((opt) => (
                            <div
                                key={opt.value}
                                className="px-3 py-2 text-[11px] hover:bg-accent hover:text-accent-foreground cursor-pointer truncate"
                                onClick={() => {
                                    onChange(opt);
                                    setIsOpen(false);
                                    setQuery("");
                                }}
                            >
                                {opt.label}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                            No results found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

function HistoryExplorer() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialTab = searchParams.get("activeTab") || "PRESS-TOOL";
    const initialSNo = searchParams.get("S_No") || "";

    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [historyRaw, setHistoryRaw] = useState<any>({});

    // Tab states (matching original category tabs)
    const [activeTab, setActiveTab] = useState(initialTab); // IMM-MOULD, LINE-TOOL, PRESS-TOOL
    const [selectedSNo, setSelectedSNo] = useState<string>(initialSNo);

    // Dropdown choices options
    const [dropdownOptions, setDropdownOptions] = useState<any[]>([]);

    // Modal dialog trigger states
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [detailType, setDetailType] = useState<"checklist" | "breakdown" | "ecn">("checklist");
    const [detailPayload, setDetailPayload] = useState<any>(null);

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${apiBase}/production/toolroom/get-toolhistory`);
            setHistoryRaw(response.data || {});
        } catch (error) {
            console.error("Error loading tool history:", error);
            toast.error("Failed to load tool history logs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchHistory();
    }, [apiBase]);

    // Update active S_No if query params changes
    useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
        if (initialSNo) setSelectedSNo(initialSNo);
    }, [initialTab, initialSNo]);

    // Map tool dropdown options whenever tab or raw data changes
    useEffect(() => {
        if (historyRaw[activeTab]) {
            const group = historyRaw[activeTab] || {};
            const options = Object.entries(group).map(([sNo, item]: [string, any]) => {
                let label = "Unknown Tool";
                if (activeTab === "IMM-MOULD") {
                    label = item.Mould_Name || "Mould";
                } else if (activeTab === "LINE-TOOL") {
                    label = `${item.Tool || ""} - ${item.Machine || ""}`;
                } else if (activeTab === "PRESS-TOOL") {
                    label = `${item.Press_Tool_Code || ""} - ${item.Press_Tool_Name || ""} - ${item.Operation || ""}`;
                }
                return { value: sNo, label };
            });
            setDropdownOptions(options);
        } else {
            setDropdownOptions([]);
        }
    }, [activeTab, historyRaw]);

    // Resolve date and time styling
    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return "N/A";
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;
        const formattedTime = date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true });

        return (
            <div className="text-center font-medium">
                <div>{formattedDate}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{formattedTime}</div>
            </div>
        );
    };

    const handleOpenDetail = (entry: any, type: "checklist" | "breakdown" | "ecn") => {
        setDetailType(type);
        setDetailPayload(entry);
        setIsDetailOpen(true);
    };

    // Calculate logs count and records list for active SNo
    const getLogsAndStats = () => {
        const toolHistoryItem = historyRaw[activeTab]?.[selectedSNo];
        if (!toolHistoryItem) return { stats: { checklist: 0, breakdown: 0, ecn: 0 }, logs: [] };

        const logs: any[] = [];
        let checklistCount = 0;
        let breakdownCount = 0;
        let ecnCount = 0;

        // Group into entries
        Object.entries(toolHistoryItem).forEach(([key, val]: [string, any]) => {
            if (!val || typeof val !== "object") return;
            const hasChecklist = val.checklist?.checkpoints?.length > 0;
            const hasBreakdowns = val.breakdowns?.length > 0;
            const hasEcn = val.ecn?.length > 0;

            if (hasChecklist) {
                checklistCount++;
                logs.push({
                    key,
                    Entry_time: val.Entry_time,
                    Punched_By: val.Punched_By,
                    type: "checklist",
                    payload: val.checklist
                });
            }
            if (hasBreakdowns) {
                breakdownCount++;
                logs.push({
                    key,
                    Entry_time: val.Entry_time,
                    Punched_By: val.Punched_By,
                    type: "breakdown",
                    payload: val.breakdowns
                });
            }
            if (hasEcn) {
                ecnCount++;
                logs.push({
                    key,
                    Entry_time: val.Entry_time,
                    Punched_By: val.Punched_By,
                    type: "ecn",
                    payload: val.ecn
                });
            }
        });

        // Sort by Entry_time descending
        logs.sort((a, b) => {
            const da = a.Entry_time ? new Date(a.Entry_time).getTime() : 0;
            const db = b.Entry_time ? new Date(b.Entry_time).getTime() : 0;
            return db - da;
        });

        return {
            stats: { checklist: checklistCount, breakdown: breakdownCount, ecn: ecnCount },
            logs
        };
    };

    const { stats, logs } = getLogsAndStats();

    // Column Config for CommonTable logs view
    const logColumns: ColumnConfig<any>[] = [
        {
            header: "Entry Time",
            accessorKey: "Entry_time",
            isSortable: true,
            className: "text-center w-36",
            headerClassName: "text-center",
            cell: (item: any) => formatDateTime(item.Entry_time)
        },
        {
            header: "Logged By",
            accessorKey: "Punched_By",
            isSortable: true,
            className: "font-semibold text-foreground",
            cell: (item: any) => item.Punched_By || "System User"
        },
        {
            header: "Document Trigger",
            accessorKey: "type",
            className: "text-center w-56",
            headerClassName: "text-center",
            cell: (item: any) => {
                if (item.type === "checklist") {
                    return (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] font-bold border-blue-500/30 text-blue-600 hover:text-blue-500 bg-blue-500/5 hover:bg-blue-500/10 w-44 mx-auto"
                            onClick={() => handleOpenDetail(item.payload, "checklist")}
                        >
                            VIEW PM CHECKSHEET
                        </Button>
                    );
                }
                if (item.type === "breakdown") {
                    return (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] font-bold border-rose-500/30 text-rose-600 hover:text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 w-44 mx-auto"
                            onClick={() => handleOpenDetail(item.payload[0], "breakdown")}
                        >
                            VIEW BREAKDOWN
                        </Button>
                    );
                }
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] font-bold border-amber-500/30 text-amber-600 hover:text-amber-500 bg-amber-500/5 hover:bg-amber-500/10 w-44 mx-auto"
                        onClick={() => handleOpenDetail(item.payload[0], "ecn")}
                    >
                        VIEW PLANNED ACT / ECN
                    </Button>
                );
            }
        }
    ];

    if (!mounted) return null;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                <p className="text-sm font-semibold tracking-wide text-muted-foreground animate-pulse">Loading Tool History Logs...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
            {/* Header section */}
            <div className="flex items-center gap-3 border-b border-border pb-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">
                        Tool History Card
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Audit full tool maintenance chronicles including checksheets, failures, and planned design changes.
                    </p>
                </div>
            </div>

            {/* Category tabs */}
            <div className="flex border-b border-border bg-muted/40 p-1 rounded-xl gap-1 shrink-0 max-w-sm">
                {[
                    { label: "IMM Mould", value: "IMM-MOULD" },
                    { label: "Line Tool", value: "LINE-TOOL" },
                    { label: "Press Tool", value: "PRESS-TOOL" }
                ].map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => {
                            setActiveTab(tab.value);
                            setSelectedSNo("");
                        }}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center ${activeTab === tab.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-background/30"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tool searchable dropdown */}
            <Card className="border border-border/60 bg-card/65 shadow-sm overflow-visible">
                <CardContent className="p-4 space-y-2 overflow-visible">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Select Active Asset Target</label>
                    <SearchSelect
                        options={dropdownOptions}
                        value={selectedSNo}
                        placeholder="Search tool or mould to view history..."
                        onChange={(opt) => setSelectedSNo(opt.value)}
                    />
                </CardContent>
            </Card>

            {selectedSNo ? (
                logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 text-center border border-dashed rounded-xl border-border/60 bg-muted/5">
                        <Info className="w-9 h-9 text-muted-foreground/60 mb-2" />
                        <h3 className="text-sm font-bold text-foreground">No History Records Documented</h3>
                        <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
                            This asset target has no recorded PM checksheets, failures, or improvement ECN changes.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {/* Summary count badges */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="border border-border/50 bg-blue-500/5 text-center">
                                <CardContent className="p-3.5 space-y-0.5">
                                    <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase">PM Checksheets</span>
                                    <div className="text-lg font-black text-blue-700 dark:text-blue-400">{stats.checklist}</div>
                                </CardContent>
                            </Card>
                            <Card className="border border-border/50 bg-amber-500/5 text-center">
                                <CardContent className="p-3.5 space-y-0.5">
                                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase">Planned Activities / ECN</span>
                                    <div className="text-lg font-black text-amber-700 dark:text-amber-400">{stats.ecn}</div>
                                </CardContent>
                            </Card>
                            <Card className="border border-border/50 bg-rose-500/5 text-center">
                                <CardContent className="p-3.5 space-y-0.5">
                                    <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase">Total Breakdowns</span>
                                    <div className="text-lg font-black text-rose-700 dark:text-rose-400">{stats.breakdown}</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Logs ledger table */}
                        <Card className="border border-border/60 bg-card shadow-sm">
                            <CardContent className="p-4 sm:p-6">
                                <CommonTable
                                    data={logs}
                                    columns={logColumns}
                                    enableFiltering={false}
                                    showColumnVisibility={false}
                                    initialPageSize={10}
                                />
                            </CardContent>
                        </Card>
                    </div>
                )
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl border-border/60 bg-muted/5">
                    <Wrench className="w-10 h-10 text-muted-foreground/60 mb-2" />
                    <h3 className="text-sm font-bold text-foreground">Select a Tool</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
                        Please search and select a specific tool above to inspect its maintenance logs history card.
                    </p>
                </div>
            )}

            {/* Document Detail dialog modal */}
            {isDetailOpen && detailPayload && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="max-w-2xl w-full border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="pb-4 border-b border-border/40">
                            <CardTitle className="text-base font-bold flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-blue-500" />
                                {detailType === "checklist" && "PM Checksheet Logs"}
                                {detailType === "breakdown" && "Breakdown Log Details"}
                                {detailType === "ecn" && "Planned Activity / ECN"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4 max-h-[60vh] overflow-y-auto">
                            {/* Sub view: PM Checksheet */}
                            {detailType === "checklist" && (
                                <div className="space-y-4">
                                    <div className="overflow-x-auto border border-border/50 rounded-lg">
                                        <table className="w-full text-xs text-left border-collapse">
                                            <thead>
                                                <tr className="bg-muted text-muted-foreground font-bold border-b border-border">
                                                    <th className="p-2 w-10 text-center">No</th>
                                                    <th className="p-2">Checkpoint Item</th>
                                                    <th className="p-2 text-center w-28">Observation</th>
                                                    <th className="p-2 w-44">Action Taken</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {(detailPayload.checkpoints || []).map((cp: any, idx: number) => (
                                                    <tr key={idx}>
                                                        <td className="p-2 text-center text-muted-foreground">{idx + 1}</td>
                                                        <td className="p-2 font-medium text-foreground">{cp.checkpoint || cp.predefined_checkpoint || "Observation checkpoint"}</td>
                                                        <td className="p-2 text-center font-semibold text-slate-800 dark:text-slate-200">{cp.observation || "Checked"}</td>
                                                        <td className="p-2 text-muted-foreground">{cp.action_taken || "-"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        <span className="font-bold text-foreground">Remarks:</span>
                                        <p className="text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/50 leading-snug">
                                            {detailPayload.remarks || "No comments documented."}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Sub view: Breakdown Details */}
                            {detailType === "breakdown" && (
                                <div className="overflow-x-auto border border-border/50 rounded-lg text-xs">
                                    <table className="w-full text-left border-collapse divide-y divide-border">
                                        <tbody>
                                            {[
                                                { label: "Log Date", val: detailPayload.Date || "N/A" },
                                                { label: "Breakdown Cause", val: detailPayload.Breakdown_Reason || "N/A" },
                                                { label: "Malfunction Details", val: detailPayload.Breakdown_Detail || "N/A" },
                                                { label: "Action Taken (Temporary)", val: detailPayload.Action_taken || "N/A" },
                                                { label: "Permanent Countermeasure", val: detailPayload.permanent_action || "None documented" },
                                                { label: "Status After Repair", val: detailPayload.Status_after_repair || "Closed" },
                                                { label: "Breakdown Duration", val: `${detailPayload.Breakdown_time || 0} Minutes` }
                                            ].map((row, idx) => (
                                                <tr key={idx} className="hover:bg-muted/10">
                                                    <td className="p-3 font-bold text-muted-foreground w-44 bg-muted/20 border-r border-border">{row.label}</td>
                                                    <td className="p-3 font-medium text-foreground leading-relaxed">{row.val}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Sub view: ECN details */}
                            {detailType === "ecn" && (
                                <div className="space-y-4">
                                    <div className="overflow-x-auto border border-border/50 rounded-lg text-xs">
                                        <table className="w-full text-left border-collapse divide-y divide-border">
                                            <tbody>
                                                {[
                                                    {
                                                        label: "Work Type",
                                                        val: detailPayload.doc_type === "Planned-Activity" ? "Planned / Improvement Activity" : detailPayload.doc_type || "N/A"
                                                    },
                                                    {
                                                        label: detailPayload.doc_type === "Planned-Activity" ? "Planned Date" : "Implementation Date",
                                                        val: detailPayload.ecn_implement_date || "N/A"
                                                    },
                                                    {
                                                        label: "Work details description",
                                                        val: detailPayload.ecn_detail || "N/A"
                                                    },
                                                    ...(detailPayload.doc_type !== "Planned-Activity" ? [
                                                        { label: "ECN Number ID", val: detailPayload.ecn_no || "N/A" }
                                                    ] : [
                                                        { label: "Current Status", val: detailPayload.status || "Planned" },
                                                        { label: "Completed Date", val: detailPayload.plan_complete_date || "Not completed yet" }
                                                    ])
                                                ].map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-muted/10">
                                                        <td className="p-3 font-bold text-muted-foreground w-44 bg-muted/20 border-r border-border">{row.label}</td>
                                                        <td className="p-3 font-medium text-foreground leading-relaxed">{row.val}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Attachment button */}
                                    {detailPayload.attachment && (
                                        <div className="flex justify-start">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs font-bold gap-1"
                                                onClick={() => window.open(detailPayload.attachment, "_blank")}
                                            >
                                                View Attachment
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                        <div className="p-4 border-t border-border/40 flex justify-end">
                            <Button
                                size="sm"
                                onClick={() => {
                                    setIsDetailOpen(false);
                                    setDetailPayload(null);
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

export default function ToolHistoryPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                <p className="text-sm font-semibold tracking-wide text-muted-foreground animate-pulse">Loading Page...</p>
            </div>
        }>
            <HistoryExplorer />
        </Suspense>
    );
}
