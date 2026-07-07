"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function AddReconditionPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [loginData, setLoginData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Tools list states
    const [toolsData, setToolsData] = useState<any>({});
    const [toolOptions, setToolOptions] = useState<any[]>([]);

    // Form inputs
    const [selectedType, setSelectedType] = useState("IMM-MOULD");
    const [toolCode, setToolCode] = useState("");
    const [tmStrat, setTmStrat] = useState("");
    const [reCon, setReCon] = useState("");
    const [newToolReq, setNewToolReq] = useState("");

    // Confirmation dialog state
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
                console.error("Error loading tools data:", error);
                toast.error("Failed to load tools database.");
            } finally {
                setLoading(false);
            }
        };
        fetchTools();
    }, [apiBase]);

    // Track options mappings
    useEffect(() => {
        if (toolsData[selectedType]) {
            const list = toolsData[selectedType] || [];
            let options: any[] = [];

            if (selectedType === "IMM-MOULD") {
                options = list.map((t: any) => ({
                    value: String(t.S_No),
                    label: t.Mould_Name
                }));
            } else if (selectedType === "PRESS-TOOL") {
                options = list.map((t: any) => ({
                    value: String(t.S_No),
                    label: t.Press_Tool_Code
                }));
            } else if (selectedType === "LINE-TOOL") {
                options = list.map((t: any) => ({
                    value: String(t.S_No),
                    label: `${t.Tool} - ${t.Machine}`
                }));
            }
            setToolOptions(options);
        } else {
            setToolOptions([]);
        }
        setToolCode("");
    }, [selectedType, toolsData]);

    const handleSubmitTrigger = (e: React.FormEvent) => {
        e.preventDefault();

        if (!toolCode || !tmStrat || !reCon || !newToolReq) {
            toast.error("Required Fields Missing", {
                description: "Please fill out all inputs before submitting."
            });
            return;
        }

        setConfirmOpen(true);
    };

    const handleConfirmSubmit = async () => {
        setSubmitting(true);
        const payload = {
            S_No: toolCode,
            TM_Strat: tmStrat,
            Re_con: reCon,
            New_tool_req: newToolReq,
            Punched_By: loginData?.name || "System"
        };

        try {
            await axios.post(`${apiBase}/production/toolroom/addrecondition`, payload);
            toast.success("Reconditioning plan scheduled successfully!");
            setConfirmOpen(false);
            router.back();
        } catch (error: any) {
            console.error("Error submitting recondition plan:", error);
            toast.error(error?.response?.data?.message || "Failed to submit reconditioning plan.");
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
                        Add Recondition Plan
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Document and schedule reconditioning strategies for your manufacturing assets.
                    </p>
                </div>
            </div>

            {/* Form */}
            <Card className="border border-border/60 bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wide">Plan Specifications</CardTitle>
                    <CardDescription className="text-xs">Specify strategy targets, physical conditioning steps, and new tool requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmitTrigger} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Tool Type */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Tool Type *</label>
                                <select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
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
                                    {selectedType === "IMM-MOULD" ? "Mould Name *" : selectedType === "PRESS-TOOL" ? "Press Tool Code *" : "Line Tool Name *"}
                                </label>
                                <SearchSelect
                                    options={toolOptions}
                                    value={toolCode}
                                    placeholder={`Select a ${selectedType.replace("-", " ").toLowerCase()}...`}
                                    onChange={(opt) => setToolCode(opt.value)}
                                />
                            </div>

                            {/* Tool Management Strategy */}
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-bold text-foreground">Tool Management Strategy *</label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter strategy description (e.g. core cavity inserts overhaul, replace ejector pins)..."
                                    value={tmStrat}
                                    onChange={(e) => setTmStrat(e.target.value)}
                                    className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            {/* Reconditioning Plan */}
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-bold text-foreground">Reconditioning Plan *</label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter reconditioning steps and scheduled details..."
                                    value={reCon}
                                    onChange={(e) => setReCon(e.target.value)}
                                    className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            {/* New Tool Requirement/Decision Required */}
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-bold text-foreground">New Tool Requirement / Critical Decision Required *</label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter requirements for new tooling, capital approval details, or crucial action blocks..."
                                    value={newToolReq}
                                    onChange={(e) => setNewToolReq(e.target.value)}
                                    className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            {/* Punched by */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Punched By</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={loginData?.name || ""}
                                    className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-muted text-muted-foreground cursor-not-allowed outline-none"
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-4 border-t border-border flex justify-end">
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5">
                                Schedule Plan
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Submission Confirmation Dialog */}
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Schedule Reconditioning Plan"
                description="Are you sure you want to log this reconditioning plan?"
                onConfirm={handleConfirmSubmit}
                loading={submitting}
                confirmText="Confirm Strategy"
                cancelText="Cancel"
            />
        </div>
    );
}
