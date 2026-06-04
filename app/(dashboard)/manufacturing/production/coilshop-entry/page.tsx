// app/(dashboard)/manufacturing/production/coilshop-entry/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Clock, Zap, CheckCircle, Save, Loader2, Target, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTheme } from "next-themes";
import { toast } from "sonner";

// const API_HOST = "http://10.0.7.26:3003";
const API_HOST = process.env.NEXT_PUBLIC_API_BASE_URL;

const categoryStyles: Record<string, { bg: string, border: string, icon: React.ReactNode }> = {
    Availability: { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-500", icon: <Clock className="w-5 h-5 text-blue-500" /> },
    Performance: { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-500", icon: <Zap className="w-5 h-5 text-amber-500" /> },
    Quality: { bg: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-500", icon: <CheckCircle className="w-5 h-5 text-rose-500" /> },
};

export default function CoilshopDataEntry() {
    const router = useRouter();
    const { resolvedTheme } = useTheme();

    // DATA STATES
    const [allMachines, setAllMachines] = useState<any[]>([]);
    const [allModels, setAllModels] = useState<any[]>([]);
    const [lossData, setLossData] = useState<any[]>([]);

    // FORM STATES
    const [downtime, setDowntime] = useState<Record<string, number | string>>({});
    const [lossRemarks, setLossRemarks] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        line: "",
        date: "",
        shift: "",
        shiftIncharge: "",
        machine: "",
        model: "",
        plannedTime: 0,
        plannedShutdown: 0,
        actualProduction: 0,
        spm: 0,
    });

    const lineOptions = [
        { label: "IDU", value: "IDU" },
        { label: "ODU", value: "ODU" },
    ];

    const shiftOptions = [
        { label: "A", value: "1" },
        { label: "B", value: "2" },
        { label: "C", value: "3" },
        { label: "G", value: "4" },
    ];

    const shiftInchargeOptions = [
        { label: "Rajat RK", value: "Rajat RK" },
        { label: "Tejnarayan Das", value: "Tejnarayan Das" },
        { label: "Yash Chopdekar", value: "Yash Chopdekar" },
        { label: "Dakshant Sawant", value: "Dakshant Sawant" },
        { label: "Sombir", value: "Sombir" },
        { label: "Andrew Pereira", value: "Andrew Pereira" },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${API_HOST}/production/coilshop/details`);
                setAllMachines(res?.data?.data?.machineData || []);
                setAllModels(res?.data?.data?.modelData || []);
                setLossData(res?.data?.data?.lossData || []);
            } catch (err) {
                console.error("Error fetching dependencies:", err);
                toast.error("Failed to fetch initial data");
            }
        };
        fetchData();
    }, []);

    const handleChange = (key: string, value: string | number) => {
        setForm((prev) => {
            const updated = { ...prev, [key]: value };

            if (["date", "line", "shift"].includes(key)) {
                updated.machine = "";
                updated.plannedTime = 0;
                updated.actualProduction = 0;
                setDowntime({});
                setLossRemarks({});
            }
            return updated;
        });
    };

    const handleDowntimeChange = (key: string, value: string) => {
        const numValue = Number(value);
        if (numValue < 0) return;
        setDowntime((prev) => ({ ...prev, [key]: value }));
    };

    const handleLossRemarksChange = (key: string, value: string) => {
        setLossRemarks((prev) => ({ ...prev, [key]: value }));
    };

    const isPrimarySelected = form.date && form.line && form.shift;
    const filteredMachines = allMachines.filter((m) => m.type === form.line);
    const filteredModels = allModels.filter((m) => String(m.machine_id) === String(form.machine));
    const filteredLossData = lossData.filter((item) => String(item.machine_id) === String(form.machine));

    const groupedLossData = useMemo(() => {
        return filteredLossData.reduce((acc, item) => {
            if (!acc[item.category_name]) acc[item.category_name] = [];
            acc[item.category_name].push(item);
            return acc;
        }, {} as Record<string, any[]>);
    }, [filteredLossData]);

    const totalDowntime = Object.entries(downtime).reduce((sum, [loss_id, value]) => {
        const loss = lossData.find((l) => String(l.loss_id) === String(loss_id));
        if (!loss) return sum;
        if (loss.loss_category_id === 1 || loss.loss_category_id === 2) {
            return sum + Number(value || 0);
        }
        return sum;
    }, 0);

    const lossTime = Number(form.spm) > 0
        ? Math.floor((Number(form.plannedTime) * Number(form.spm) - Number(form.actualProduction)) / Number(form.spm))
        : 0;

    const lossAllocationDiff = lossTime - totalDowntime - Number(form.plannedShutdown);
    const isValidAllocation = lossAllocationDiff === 0 && lossTime !== 0;

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            const downtimeArray = Object.entries(downtime)
                .filter(([_, value]) => Number(value) > 0)
                .map(([loss_id, value]) => {
                    const loss = lossData.find((l) => String(l.loss_id) === String(loss_id));
                    return {
                        loss_id: loss.loss_id,
                        loss_category_id: loss.loss_category_id,
                        loss_name: loss.loss_name,
                        category_name: loss.category_name,
                        loss: Number(value),
                        remarks: lossRemarks[loss_id] || "",
                    };
                });

            const payload = {
                ...form,
                actualProduction: Number(form.actualProduction),
                spm: Number(form.spm),
                plannedTime: Number(form.plannedTime),
                plannedShutdown: Number(form.plannedShutdown),
                shift: Number(form.shift),
                downtimes: downtimeArray,
            };

            let totalDowntimeLoss = 0;
            for (let i = 0; i < downtimeArray.length; i++) {
                if (downtimeArray[i]?.loss_category_id === 1 || downtimeArray[i]?.loss_category_id === 2) {
                    totalDowntimeLoss += Number(downtimeArray[i]?.loss);
                }
            }

            if (lossTime !== (totalDowntimeLoss + Number(form.plannedShutdown))) {
                toast.error("Invalid Loss Distribution!");
                setIsSubmitting(false);
                return;
            }

            await axios.post(`${API_HOST}/production/coilshop/post`, payload);

            toast.success("Data Submitted Successfully!");

            // RESET FORM
            setForm({
                line: "",
                date: "",
                shift: "",
                shiftIncharge: "",
                machine: "",
                model: "",
                plannedTime: 0,
                actualProduction: 0,
                spm: 0,
                plannedShutdown: 0,
            });
            setDowntime({});
            setLossRemarks({});
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error: any) {
            console.error("Error", error);
            toast.error(error?.response?.data?.message || "An error occurred while submitting.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 pb-24">
            {/* HEADER SECTION */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => router.push("/manufacturing/production")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
                            Coilshop Data Entry
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Record production logs, losses, and downtime
                        </p>
                    </div>
                </div>

                {/* LOSS ALLOCATION STATUS */}
                {(form.machine && Number(form.spm) > 0) && (
                    <div className={`fixed top-20 right-6 z-50 shadow-lg backdrop-blur-md px-5 py-2.5 rounded-full border-2 flex items-center gap-3 transition-colors ${isValidAllocation ? "border-green-500 bg-green-50/90 dark:bg-green-950/80" : "border-rose-500 bg-rose-50/90 dark:bg-rose-950/80"}`}>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Unallocated Loss</span>
                            <span className={`text-xl font-bold ${isValidAllocation ? "text-green-600 dark:text-green-500" : "text-rose-600 dark:text-rose-500"}`}>
                                {lossAllocationDiff} <span className="text-xs font-normal">mins</span>
                            </span>
                        </div>
                        {isValidAllocation ? (
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        ) : (
                            <Target className="w-8 h-8 text-rose-500 animate-pulse" />
                        )}
                    </div>
                )}
            </div>

            {/* PRIMARY DETAILS */}
            <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-blue-500 rounded-full inline-block"></span>
                        Primary Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Date</Label>
                        <Input type="date" value={form.date} onChange={(e) => handleChange("date", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Line</Label>
                        <Select value={form.line} onValueChange={(v) => handleChange("line", v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Line" />
                            </SelectTrigger>
                            <SelectContent>
                                {lineOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Shift</Label>
                        <Select value={form.shift} onValueChange={(v) => handleChange("shift", v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Shift" />
                            </SelectTrigger>
                            <SelectContent>
                                {shiftOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Shift Incharge</Label>
                        <Select value={form.shiftIncharge} onValueChange={(v) => handleChange("shiftIncharge", v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Incharge" />
                            </SelectTrigger>
                            <SelectContent>
                                {shiftInchargeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* PRODUCTION DETAILS */}
            <Card className={`border-border/60 shadow-sm transition-opacity ${!isPrimarySelected ? 'opacity-50 pointer-events-none' : ''}`}>
                <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-purple-500 rounded-full inline-block"></span>
                        Production Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Machine</Label>
                        <Select value={form.machine} onValueChange={(v) => handleChange("machine", v)} disabled={!isPrimarySelected}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Machine" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredMachines.map((m, i) => <SelectItem key={m.id || m.value || i} value={String(m.id || m.value)}>{m.machine_name || m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Model</Label>
                        <Select value={form.model} onValueChange={(v) => handleChange("model", v)} disabled={!isPrimarySelected}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Model" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredModels.map((m, i) => <SelectItem key={m.model_id || m.value || i} value={String(m.value || m.model_id)}>{m.label || m.model_name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Planned Time (mins)</Label>
                        <Input type="number" min="0" value={form.plannedTime || ""} onChange={(e) => handleChange("plannedTime", e.target.value)} disabled={!isPrimarySelected} onWheel={(e) => (e.target as HTMLElement).blur()} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Planned Shutdown (mins)</Label>
                        <Input type="number" min="0" value={form.plannedShutdown || ""} onChange={(e) => handleChange("plannedShutdown", e.target.value)} disabled={!isPrimarySelected} onWheel={(e) => (e.target as HTMLElement).blur()} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Actual Production / Strokes</Label>
                        <Input type="number" min="0" value={form.actualProduction || ""} onChange={(e) => handleChange("actualProduction", e.target.value)} disabled={!isPrimarySelected} onWheel={(e) => (e.target as HTMLElement).blur()} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">SPM / HPM / HEPM</Label>
                        <Input type="number" min="0" value={form.spm || ""} onChange={(e) => handleChange("spm", e.target.value)} disabled={!isPrimarySelected} onWheel={(e) => (e.target as HTMLElement).blur()} />
                    </div>
                </CardContent>
            </Card>

            {/* LOSS ENTRY */}
            {form.machine && (
                <div className="space-y-6">
                    <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2 mt-8">
                        <span className="w-2 h-8 bg-rose-500 rounded-full inline-block"></span>
                        Loss Entry
                    </h3>

                    {Object.entries(groupedLossData).map(([category, items]) => {
                        const lossItems = items as any[];
                        const style = categoryStyles[category] || { bg: "bg-gray-50", border: "border-gray-500", icon: null };

                        return (
                            <Card key={category} className={`border-l-4 ${style.border} shadow-sm overflow-hidden`}>
                                <div className={`${style.bg} px-4 py-3 flex items-center gap-3 border-b border-border/40`}>
                                    {style.icon}
                                    <h4 className="font-bold text-sm uppercase tracking-wider">{category} Losses</h4>
                                </div>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-border/40">
                                        {lossItems.map((item) => {
                                            const key = item.loss_id;
                                            const isTimeBased = item.loss_category_id === 1 || item.loss_category_id === 2;
                                            const placeholder = isTimeBased ? "mins" : "kg/nos";
                                            const unitLabel = isTimeBased ? "min" : "qty";

                                            return (
                                                <div key={key} className="flex flex-col md:flex-row md:items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                                                    <div className="flex-1 min-w-[200px]">
                                                        <span className="font-medium text-sm block">{item.loss_name}</span>
                                                    </div>

                                                    <div className="flex items-center gap-2 w-[140px] shrink-0">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step={isTimeBased ? "1" : "0.1"}
                                                            placeholder={placeholder}
                                                            value={downtime[key] ?? ""}
                                                            onChange={(e) => handleDowntimeChange(key, e.target.value)}
                                                            onWheel={(e) => (e.target as HTMLElement).blur()}
                                                            className="text-center font-semibold bg-background"
                                                        />
                                                        <span className="text-xs text-muted-foreground font-medium w-8">{unitLabel}</span>
                                                    </div>

                                                    <div className="flex-[2]">
                                                        <Input
                                                            type="text"
                                                            placeholder="Remarks / root cause / action taken..."
                                                            value={lossRemarks[key] || ""}
                                                            onChange={(e) => handleLossRemarksChange(key, e.target.value)}
                                                            className="bg-background text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* SUBMISSION BAR */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-50 flex justify-center lg:pl-64">
                <div className="w-full max-w-4xl flex items-center justify-between gap-4">
                    <div className="hidden sm:block">
                        <span className="text-sm font-medium text-muted-foreground">Make sure your unallocated loss matches exactly 0.</span>
                    </div>
                    <Button
                        size="lg"
                        className={`w-full sm:w-64 font-bold tracking-wide transition-all ${isValidAllocation ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                        onClick={handleSubmit}
                        disabled={!form.machine || !form.plannedTime || !isValidAllocation || isSubmitting}
                    >
                        {isSubmitting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> SUBMITTING...</>
                        ) : (
                            <><Save className="mr-2 h-5 w-5" /> SUBMIT DATA</>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
