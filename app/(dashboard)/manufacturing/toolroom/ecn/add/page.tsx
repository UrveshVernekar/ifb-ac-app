"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, File } from "lucide-react";
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

export default function AddEcnPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loginData, setLoginData] = useState<any>(null);

    // Tools list
    const [toolOptions, setToolOptions] = useState<any[]>([]);

    // Form inputs
    const [docType, setDocType] = useState("Planned-Activity"); // Planned-Activity, ECN
    const [selectedToolSNo, setSelectedToolSNo] = useState("");
    const [implementDate, setImplementDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [ecnNo, setEcnNo] = useState("");
    const [ecnDetail, setEcnDetail] = useState("");
    const [file, setFile] = useState<File | null>(null);

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
                const data = response.data || {};
                
                // Combine all tools into a single options registry
                const combined: any[] = [];
                if (data["IMM-MOULD"]) {
                    data["IMM-MOULD"].forEach((t: any) => {
                        combined.push({ value: String(t.S_No), label: `IMM Mould: ${t.Mould_Name}` });
                    });
                }
                if (data["PRESS-TOOL"]) {
                    data["PRESS-TOOL"].forEach((t: any) => {
                        combined.push({ value: String(t.S_No), label: `Press Tool: ${t.Press_Tool_Code}` });
                    });
                }
                if (data["LINE-TOOL"]) {
                    data["LINE-TOOL"].forEach((t: any) => {
                        combined.push({ value: String(t.S_No), label: `Line Tool: ${t.Tool} - ${t.Machine}` });
                    });
                }
                setToolOptions(combined);
            } catch (error) {
                console.error("Error fetching tools list:", error);
                toast.error("Failed to load tools selection list.");
            } finally {
                setLoading(false);
            }
        };
        fetchTools();
    }, [apiBase]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        } else {
            setFile(null);
        }
    };

    const handleSubmitTrigger = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedToolSNo || !implementDate || !ecnDetail) {
            toast.error("Required Fields Missing", {
                description: "Please select a tool, set a date, and describe the activity details."
            });
            return;
        }

        if (docType === "ECN" && !ecnNo) {
            toast.error("ECN Number Required", {
                description: "Please specify the ECN reference number identifier."
            });
            return;
        }

        setConfirmOpen(true);
    };

    const handleConfirmSubmit = async () => {
        setSubmitting(true);
        const formData = new FormData();
        formData.append("doc_type", docType);
        formData.append("S_No", selectedToolSNo);
        formData.append("ecn_implement_date", implementDate);
        formData.append("ecn_detail", ecnDetail);
        formData.append("ecn_no", docType === "ECN" ? ecnNo : "");
        if (file) {
            formData.append("file", file);
        }
        formData.append("punched_by", loginData?.name || "System");

        try {
            await axios.post(`${apiBase}/production/toolroom/addecn`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            toast.success("Activity/ECN logged successfully!");
            setConfirmOpen(false);
            router.push("/manufacturing/toolroom/ecn/view");
        } catch (error: any) {
            console.error("Error submitting ECN entry:", error);
            toast.error(error?.response?.data?.message || "Failed to submit log entry.");
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
                        Add Activity / ECN
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Register new planned improvement activities or Engineering Change Notes.
                    </p>
                </div>
            </div>

            {/* Form */}
            <Card className="border border-border/60 bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wide">Activity specifications</CardTitle>
                    <CardDescription className="text-xs">Provide details for the proposed engineering/process change log.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmitTrigger} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Type selector */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Activity Type *</label>
                                <select
                                    value={docType}
                                    onChange={(e) => setDocType(e.target.value)}
                                    className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="Planned-Activity">Planned / Improvement Activity</option>
                                    <option value="ECN">Engineering Change Note (ECN)</option>
                                </select>
                            </div>

                            {/* Target tool */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Select Target Tool *</label>
                                <SearchSelect
                                    options={toolOptions}
                                    value={selectedToolSNo}
                                    placeholder="Search and select tool..."
                                    onChange={(opt) => setSelectedToolSNo(opt.value)}
                                />
                            </div>

                            {/* Implement date */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">
                                    {docType === "Planned-Activity" ? "Planned Action Date *" : "ECN Implementation Date *"}
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={implementDate}
                                    onChange={(e) => setImplementDate(e.target.value)}
                                    className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            {/* ECN No (only if ECN) */}
                            {docType === "ECN" && (
                                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                    <label className="text-xs font-bold text-foreground">ECN Number *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. ECN/2026/001"
                                        value={ecnNo}
                                        onChange={(e) => setEcnNo(e.target.value)}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            )}

                            {/* Detail */}
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-bold text-foreground">Activity / Change details *</label>
                                <textarea
                                    rows={4}
                                    required
                                    placeholder="Describe proposed changes or planned improvement tasks..."
                                    value={ecnDetail}
                                    onChange={(e) => setEcnDetail(e.target.value)}
                                    className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            {/* Attachment Upload selector */}
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-bold text-foreground">Attachment (Image, PDF, Docs)</label>
                                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/15 transition-colors cursor-pointer relative group">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept=".png,.jpg,.jpeg,.gif,.pdf,.doc,.docx,.xls,.xlsx"
                                    />
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <div className="p-3 bg-muted rounded-full group-hover:scale-105 transition-transform">
                                            <Upload className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        {file ? (
                                            <div className="flex items-center gap-1.5 text-xs text-foreground font-semibold">
                                                <File className="w-3.5 h-3.5 text-blue-500" />
                                                {file.name}
                                                <span className="text-[10px] text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-xs font-bold text-foreground">Choose File or Drag Here</span>
                                                <span className="text-[10px] text-muted-foreground">Max file size allowed: 10MB</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Punched by */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Logged By</label>
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
                                Submit Log Entry
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Submission Confirmation Dialog */}
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Log Activity / ECN"
                description="Are you sure you want to log this planned activity / ECN entry?"
                onConfirm={handleConfirmSubmit}
                loading={submitting}
                confirmText="Confirm Entry"
                cancelText="Cancel"
            />
        </div>
    );
}
