"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

// Reusable SearchSelect
const SearchSelect = ({
    options,
    value,
    onChange,
    placeholder,
    className = "",
    disabled = false
}: {
    options: { label: string; value: string; [key: string]: any }[];
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

export default function AddBreakdownPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [loginData, setLoginData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // Tools list state
    const [toolsData, setToolsData] = useState<any>({});
    const [toolOptions, setToolOptions] = useState<any[]>([]);

    // Form states
    const [type, setType] = useState("IMM-MOULD");
    const [toolCode, setToolCode] = useState("");
    const [sNo, setSNo] = useState("");
    const [toolName, setToolName] = useState("");
    const [operation, setOperation] = useState("");
    const [breakdownDate, setBreakdownDate] = useState(new Date().toISOString().split("T")[0]);
    const [breakdownTime, setBreakdownTime] = useState("");
    const [breakdownDetail, setBreakdownDetail] = useState("");
    const [breakdownReason, setBreakdownReason] = useState("");
    const [actionTaken, setActionTaken] = useState("");
    const [permanentAction, setPermanentAction] = useState("");
    const [statusAfterRepair, setStatusAfterRepair] = useState("CLOSED"); // CLOSED = Operational, OPEN = Not Operational
    const [why1, setWhy1] = useState("");
    const [why2, setWhy2] = useState("");
    const [why3, setWhy3] = useState("");
    const [why4, setWhy4] = useState("");
    const [why5, setWhy5] = useState("");

    // Confirmation dialog states
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";

    useEffect(() => {
        setMounted(true);
        const dataStr = sessionStorage.getItem("logindata");
        if (dataStr) {
            setLoginData(JSON.parse(dataStr));
        }

        const fetchTools = async () => {
            try {
                const response = await axios.get(`${apiBase}/production/toolroom/get-toolslist`);
                setToolsData(response.data || {});
            } catch (error) {
                console.error("Error fetching tools list:", error);
                toast.error("Failed to load tools database.");
            } finally {
                setLoading(false);
            }
        };
        fetchTools();
    }, [apiBase]);

    // Map tool options when type or toolsData changes
    useEffect(() => {
        if (toolsData[type]) {
            const list = toolsData[type] || [];
            let options: any[] = [];
            if (type === "IMM-MOULD") {
                options = list.map((tool: any) => ({
                    value: tool.Mould_Name,
                    label: tool.Mould_Name,
                    S_No: tool.S_No
                }));
            } else if (type === "PRESS-TOOL") {
                options = list.map((tool: any) => ({
                    value: tool.Press_Tool_Code,
                    label: tool.Press_Tool_Code,
                    S_No: tool.S_No
                }));
            } else if (type === "LINE-TOOL") {
                options = list.map((tool: any) => ({
                    value: `${tool.Tool} - ${tool.Machine}`,
                    label: `${tool.Tool} - ${tool.Machine}`,
                    S_No: tool.S_No
                }));
            }
            setToolOptions(options);
        } else {
            setToolOptions([]);
        }
        // Reset selections
        setToolCode("");
        setSNo("");
        setToolName("");
        setOperation("");
    }, [type, toolsData]);

    const handleToolChange = (option: any) => {
        setToolCode(option.value);
        setSNo(option.S_No);

        if (type === "PRESS-TOOL") {
            const list = toolsData["PRESS-TOOL"] || [];
            const selected = list.find((tool: any) => tool.Press_Tool_Code === option.value);
            if (selected) {
                setToolName(selected.Press_Tool_Name || "");
                setOperation(selected.Opeartion || "");
            }
        } else {
            setToolName("");
            setOperation("");
        }
    };

    const handleSubmitTrigger = (e: React.FormEvent) => {
        e.preventDefault();

        if (!type || !toolCode || !breakdownDate || !breakdownTime || !breakdownDetail || !breakdownReason || !actionTaken || !statusAfterRepair) {
            toast.error("Required Fields Missing", {
                description: "Please fill out all the mandatory fields marked with an asterisk (*)."
            });
            return;
        }

        setConfirmOpen(true);
    };

    const handleConfirmSubmit = async () => {
        setSubmitting(true);
        const payload = {
            type,
            tool_code: toolCode,
            S_No: sNo,
            tool_name: toolName,
            operation,
            date: breakdownDate,
            breakdown_time: Number(breakdownTime),
            breakdown_detail: breakdownDetail,
            breakdown_reason: breakdownReason,
            action_taken: actionTaken,
            permanent_action: permanentAction,
            status_after_repair: statusAfterRepair,
            punched_by: loginData?.name || "System",
            why_1: why1 || null,
            why_2: why2 || null,
            why_3: why3 || null,
            why_4: why4 || null,
            why_5: why5 || null,
        };

        try {
            await axios.post(`${apiBase}/production/toolroom/addbreakdown`, payload);
            toast.success("Breakdown logged successfully!");
            setConfirmOpen(false);
            router.push("/manufacturing/toolroom/breakdown-analytics");
        } catch (error: any) {
            console.error("Error submitting breakdown:", error);
            toast.error(error?.response?.data?.message || "Failed to submit breakdown ticket.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!mounted) return null;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                <p className="text-sm font-semibold tracking-wide text-muted-foreground animate-pulse">Loading Tools Database...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6">
            {/* Navigation Header */}
            <div className="flex items-center gap-3 border-b border-border pb-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">
                        Add Breakdown
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Log tool failures, repair logs, and document 5-Why root-cause resolutions.
                    </p>
                </div>
            </div>

            {/* Form Container */}
            <Card className="border border-border/60 bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wide">Breakdown Parameters</CardTitle>
                    <CardDescription className="text-xs">Provide details regarding tool malfunction and active fixes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmitTrigger} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Tool Type */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Tool Type *</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="IMM-MOULD">IMM Mould</option>
                                    <option value="PRESS-TOOL">Press Tool</option>
                                    <option value="LINE-TOOL">Line Tool</option>
                                </select>
                            </div>

                            {/* Tool Select */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">
                                    {type === "IMM-MOULD" ? "Mould Name *" : type === "PRESS-TOOL" ? "Press Tool Code *" : "Line Tool Name *"}
                                </label>
                                <SearchSelect
                                    options={toolOptions}
                                    value={toolCode}
                                    placeholder={`Select a ${type.replace("-", " ").toLowerCase()}...`}
                                    onChange={handleToolChange}
                                />
                            </div>

                            {/* Press-specific metadata */}
                            {type === "PRESS-TOOL" && (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground">Tool Name</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={toolName}
                                            className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-muted text-muted-foreground outline-none cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground">Operation</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={operation}
                                            className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-muted text-muted-foreground outline-none cursor-not-allowed"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Breakdown Date */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Breakdown Date *</label>
                                <input
                                    type="date"
                                    value={breakdownDate}
                                    onChange={(e) => setBreakdownDate(e.target.value)}
                                    className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            {/* Breakdown Time (mins) */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Breakdown Duration (Minutes) *</label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Enter duration in minutes"
                                    value={breakdownTime}
                                    onChange={(e) => setBreakdownTime(e.target.value)}
                                    className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            {/* Status after repair */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Status After Repair *</label>
                                <select
                                    value={statusAfterRepair}
                                    onChange={(e) => setStatusAfterRepair(e.target.value)}
                                    className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="CLOSED">Operational (Closed)</option>
                                    <option value="OPEN">Not Operational (Open)</option>
                                </select>
                            </div>

                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Breakdown Detail */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">Breakdown Details *</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Describe the failure description and details..."
                                        value={breakdownDetail}
                                        onChange={(e) => setBreakdownDetail(e.target.value)}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Breakdown Reason */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">Breakdown Reason *</label>
                                    <textarea
                                        rows={3}
                                        placeholder="What caused the failure..."
                                        value={breakdownReason}
                                        onChange={(e) => setBreakdownReason(e.target.value)}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Action Taken */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">Action Taken *</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Explain the temporary/immediate fix actions..."
                                        value={actionTaken}
                                        onChange={(e) => setActionTaken(e.target.value)}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Permanent Action */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">Permanent Countermeasures</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Explain preventive/permanent action items..."
                                        value={permanentAction}
                                        onChange={(e) => setPermanentAction(e.target.value)}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 5 Why Section */}
                        <div className="border-t border-border/60 pt-4 space-y-4">
                            <div>
                                <h3 className="text-sm font-bold text-foreground">5 Why Root Cause Analysis</h3>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Iterate why queries to discover root failure pathways.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[{ val: why1, setVal: setWhy1, num: 1 },
                                  { val: why2, setVal: setWhy2, num: 2 },
                                  { val: why3, setVal: setWhy3, num: 3 },
                                  { val: why4, setVal: setWhy4, num: 4 },
                                  { val: why5, setVal: setWhy5, num: 5 }].map((item) => (
                                    <div key={item.num} className="space-y-1.5">
                                        <label className="text-[11px] font-semibold text-foreground">Why {item.num}</label>
                                        <input
                                            type="text"
                                            placeholder={`Answer Why ${item.num}...`}
                                            value={item.val}
                                            onChange={(e) => item.setVal(e.target.value)}
                                            className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                ))}

                                {/* Punched by */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-foreground">Logged By (User)</label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={loginData?.name || ""}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-muted text-muted-foreground cursor-not-allowed outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 border-t border-border flex justify-end">
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5">
                                Log Breakdown
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Submission Confirmation Dialog */}
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Log Breakdown"
                description="Are you sure you want to submit this breakdown report?"
                onConfirm={handleConfirmSubmit}
                loading={submitting}
                confirmText="Submit Report"
                cancelText="Cancel"
            />
        </div>
    );
}
