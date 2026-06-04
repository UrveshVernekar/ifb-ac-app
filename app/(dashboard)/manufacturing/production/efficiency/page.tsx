// app/(dashboard)/manufacturing/production/efficiency/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    RefreshCw,
    AlertCircle,
    TrendingUp,
    Percent,
    Target,
    Layers,
    Cpu,
} from "lucide-react";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, LabelList, Cell, CartesianGrid, PieChart, Pie } from "recharts";
import { DatePicker } from "@/components/manufacturing/DatePicker";
import Link from "next/link";

// const API_HOST = "http://10.0.7.26:3003";
const API_HOST = process.env.NEXT_PUBLIC_API_BASE_URL;

// === TYPES ===
interface EfficiencyStatus {
    label: string;
    value: number;
    target: number;
    type: "text" | "rate";
}

interface DailyOEEItem {
    date: string;
    value: number;
    [key: string]: any;
}

interface OeeComposition {
    name: string;
    value: number;
    color: string;
}

interface ApiResponse {
    success: boolean;
    data: {
        oee?: number;
        oeeTarget?: number;
        efficiencyStatus?: EfficiencyStatus[];
        dailyOEE?: DailyOEEItem[];
        oeeComposition?: any;
        availability?: number;
        performance?: number;
        quality?: number;
    };
}

export default function EfficiencyDashboardPage() {
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [mounted, setMounted] = useState(false);

    // SESSION STORAGE FILTERS
    const [area, setArea] = useState<"ASSEMBLY LINES" | "STAMPING" | "COILSHOP">("ASSEMBLY LINES");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [selectedLines, setSelectedLines] = useState<string[]>([]);
    const [selectedSubMachines, setSelectedSubMachines] = useState<string[]>([]);

    // API STATES
    const [data, setData] = useState<ApiResponse["data"] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        const todayStr = new Date().toISOString().split("T")[0];

        const savedArea = sessionStorage.getItem("areaValue") as any;
        const savedFrom = sessionStorage.getItem("manufacturingFromDate");
        const savedTo = sessionStorage.getItem("manufacturingToDate");

        const activeArea = savedArea || "ASSEMBLY LINES";
        setArea(activeArea);

        const fDate = savedFrom || todayStr;
        const tDate = savedTo || todayStr;
        setFromDate(fDate);
        setToDate(tDate);

        if (activeArea === "ASSEMBLY LINES") {
            const savedLines = sessionStorage.getItem("manufacturingMachines") || "ODU-Line";
            setSelectedLines(savedLines.split(","));
        } else if (activeArea === "STAMPING") {
            const savedLines = sessionStorage.getItem("subMachineSession") || "315T-A,315T-B,315T-C,315T-D,315T-E,200T-A,200T-B,200T-C,200T-D,200T-E,110T";
            setSelectedSubMachines(savedLines.split(","));
            setSelectedLines(["AUTO LINE", "TANDEM LINE"]);
        } else if (activeArea === "COILSHOP") {
            const savedLines = sessionStorage.getItem("subMachineSession") || "1";
            setSelectedSubMachines(savedLines.split(","));
            setSelectedLines(["COILSHOP IDU"]);
        }
    }, []);

    // FETCH DETAILS
    const fetchData = async () => {
        if (!fromDate || !toDate) return;
        setLoading(true);
        setError(null);

        let machineQuery = "";
        if (area === "ASSEMBLY LINES") {
            machineQuery = selectedLines[0] || "ODU-Line";
        } else {
            machineQuery = selectedSubMachines.join(",");
        }

        try {
            const res = await axios.get(`${API_HOST}/production/data`, {
                params: {
                    area,
                    machines: machineQuery,
                    fromDate,
                    toDate,
                }
            });
            setData(res.data.data);
        } catch (err) {
            console.error("Fetch OEE error:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch OEE data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted && selectedLines.length > 0 && (area === "ASSEMBLY LINES" || selectedSubMachines.length > 0)) {
            fetchData();
        }
    }, [area, fromDate, toDate, selectedLines, selectedSubMachines, mounted]);

    // OPTIONS MAPPING
    const assemblyOptions = [
        { value: "IDU-Line", label: "IDU LINE" },
        { value: "ODU-Line", label: "ODU LINE" },
    ];
    const stampingOptions = [
        { label: "AUTO LINE", value: "AUTO LINE" },
        { label: "TANDEM LINE", value: "TANDEM LINE" },
    ];
    const coilshopOptions = [
        { label: "COILSHOP IDU", value: "COILSHOP IDU" },
        { label: "COILSHOP ODU", value: "COILSHOP ODU" },
    ];

    const stampingAutoOptions = ["315T-A", "315T-B", "315T-C", "315T-D", "315T-E"];
    const stampingTandemOptions = ["200T-A", "200T-B", "200T-C", "200T-D", "200T-E", "110T"];

    const coilshopIDUOptions = [
        { label: "Finpress A", value: "3" },
        { label: "Finpress B", value: "4" },
        { label: "OMS IDU Expander", value: "6" },
        { label: "IDU HPB 1", value: "8" },
        { label: "IDU HPB 2", value: "9" },
        { label: "Auto Brazing 1", value: "12" },
    ];

    const coilshopODUOptions = [
        { label: "Finpress 60R", value: "1" },
        { label: "Finpress 72R", value: "2" },
        { label: "OMS IDU Expander", value: "5" },
        { label: "YHM Expander", value: "7" },
        { label: "ODU HPB 08R", value: "10" },
        { label: "ODU HPB 16R", value: "11" },
        { label: "Auto Brazing 2", value: "13" },
    ];

    // SUB-MACHINE SELECTION
    const subOptions = useMemo(() => {
        let result: { label: string; value: string }[] = [];
        if (area === "STAMPING") {
            if (selectedLines.includes("AUTO LINE")) {
                stampingAutoOptions.forEach(opt => result.push({ label: opt, value: opt }));
            }
            if (selectedLines.includes("TANDEM LINE")) {
                stampingTandemOptions.forEach(opt => result.push({ label: opt, value: opt }));
            }
        } else if (area === "COILSHOP") {
            if (selectedLines.includes("COILSHOP IDU")) {
                coilshopIDUOptions.forEach(opt => result.push({ label: opt.label, value: opt.value }));
            }
            if (selectedLines.includes("COILSHOP ODU")) {
                coilshopODUOptions.forEach(opt => result.push({ label: opt.label, value: opt.value }));
            }
        }
        return result;
    }, [area, selectedLines]);

    const handleAreaChange = (newArea: "ASSEMBLY LINES" | "STAMPING" | "COILSHOP") => {
        setArea(newArea);
        sessionStorage.setItem("areaValue", newArea);
        setSelectedSubMachines([]);

        if (newArea === "ASSEMBLY LINES") {
            setSelectedLines(["ODU-Line"]);
            sessionStorage.setItem("manufacturingMachines", "ODU-Line");
        } else if (newArea === "STAMPING") {
            setSelectedLines(["AUTO LINE", "TANDEM LINE"]);
            const allSub = [...stampingAutoOptions, ...stampingTandemOptions];
            setSelectedSubMachines(allSub);
            sessionStorage.setItem("subMachineSession", allSub.join(","));
        } else if (newArea === "COILSHOP") {
            setSelectedLines(["COILSHOP IDU"]);
            const allCSIDU = coilshopIDUOptions.map(o => o.value);
            setSelectedSubMachines(allCSIDU);
            sessionStorage.setItem("subMachineSession", allCSIDU.join(","));
        }
    };

    const handleLineSelect = (line: string) => {
        let updatedLines = [...selectedLines];
        if (area === "ASSEMBLY LINES") {
            updatedLines = [line];
        } else {
            if (updatedLines.includes(line)) {
                updatedLines = updatedLines.filter(l => l !== line);
            } else {
                updatedLines.push(line);
            }
        }
        setSelectedLines(updatedLines);
        sessionStorage.setItem("manufacturingMachines", updatedLines.join(","));

        if (area === "STAMPING") {
            const validSubs: string[] = [];
            if (updatedLines.includes("AUTO LINE")) validSubs.push(...stampingAutoOptions);
            if (updatedLines.includes("TANDEM LINE")) validSubs.push(...stampingTandemOptions);
            setSelectedSubMachines(validSubs);
            sessionStorage.setItem("subMachineSession", validSubs.join(","));
        } else if (area === "COILSHOP") {
            const validSubs: string[] = [];
            if (updatedLines.includes("COILSHOP IDU")) coilshopIDUOptions.forEach(o => validSubs.push(o.value));
            if (updatedLines.includes("COILSHOP ODU")) coilshopODUOptions.forEach(o => validSubs.push(o.value));
            setSelectedSubMachines(validSubs);
            sessionStorage.setItem("subMachineSession", validSubs.join(","));
        }
    };

    const handleSubMachineToggle = (value: string) => {
        let updated = [...selectedSubMachines];
        if (updated.includes(value)) {
            updated = updated.filter(v => v !== value);
        } else {
            updated.push(value);
        }
        setSelectedSubMachines(updated);
        sessionStorage.setItem("subMachineSession", updated.join(","));
    };

    const computedOeeComposition = useMemo<OeeComposition[]>(() => {
        if (!data) return [];
        let avail = 100;
        let perf = 100;
        let qual = 100;

        if (data.efficiencyStatus) {
            data.efficiencyStatus.forEach(item => {
                const lbl = item.label.toUpperCase();
                if (lbl.includes("AVAILABILITY")) avail = Number(item.value);
                if (lbl.includes("PERFORMANCE")) perf = Number(item.value);
                if (lbl.includes("QUALITY")) qual = Number(item.value);
            });
        } else {
            avail = data.availability !== undefined ? data.availability : 100;
            perf = data.performance !== undefined ? data.performance : 100;
            qual = data.quality !== undefined ? data.quality : 100;
        }

        const availLoss = Math.max(0, 100 - avail);
        const perfLoss = Math.max(0, 100 - perf);
        const qualLoss = Math.max(0, 100 - qual);
        const totalLoss = availLoss + perfLoss + qualLoss;

        if (totalLoss === 0) {
            return [
                { name: "Availability Loss Contribution", value: 33.3, color: "#ef4444" },
                { name: "Performance Loss Contribution", value: 33.3, color: "#f59e0b" },
                { name: "Quality Loss Contribution", value: 33.3, color: "#3b82f6" }
            ];
        }

        return [
            { name: "Availability Loss Contribution", value: Number(((availLoss / totalLoss) * 100).toFixed(1)), color: "#ef4444" },
            { name: "Performance Loss Contribution", value: Number(((perfLoss / totalLoss) * 100).toFixed(1)), color: "#f59e0b" },
            { name: "Quality Loss Contribution", value: Number(((qualLoss / totalLoss) * 100).toFixed(1)), color: "#3b82f6" }
        ];
    }, [data]);

    const getOeeColor = (val: number, target: number = 85) => {
        if (val >= target) return "text-blue-500 border-blue-500/20 bg-blue-500/5";
        if (val >= 80) return "text-amber-500 border-amber-500/20 bg-amber-500/5";
        return "text-rose-500 border-rose-500/20 bg-rose-500/5";
    };

    return (
        <div className="space-y-6 max-w-8xl mx-auto p-2">
            {/* HEADER SECTION */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/manufacturing/production">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
                            Overall Equipment Efficiency (OEE)
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Percent className="w-3.5 h-3.5 text-blue-500" />
                            Production OEE logs and loss breakdowns
                        </p>
                    </div>
                </div>

                {/* FILTERS */}
                {mounted && (
                    <div className="flex flex-wrap gap-2.5 items-end bg-card p-3 rounded-xl border border-border/60 shadow-sm">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block ml-0.5">Area</span>
                            <Select value={area} onValueChange={(v) => handleAreaChange(v as any)}>
                                <SelectTrigger className="w-[150px] bg-background border-border h-9 text-xs">
                                    <SelectValue placeholder="Select Area" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ASSEMBLY LINES">ASSEMBLY LINES</SelectItem>
                                    <SelectItem value="STAMPING">STAMPING</SelectItem>
                                    <SelectItem value="COILSHOP">COILSHOP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block ml-0.5">From</span>
                            {/* <Input
                                type="date"
                                value={fromDate}
                                onChange={(e) => {
                                    setFromDate(e.target.value);
                                    sessionStorage.setItem("manufacturingFromDate", e.target.value);
                                }}
                                className="w-auto bg-background border-border h-9 text-xs"
                            /> */}

                            <DatePicker
                                value={fromDate}
                                onChange={(dateStr) => {
                                    setFromDate(dateStr);
                                    sessionStorage.setItem("manufacturingFromDate", dateStr);
                                }}
                            />
                        </div>

                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block ml-0.5">To</span>
                            {/* <Input
                                type="date"
                                value={toDate}
                                onChange={(e) => {
                                    setToDate(e.target.value);
                                    sessionStorage.setItem("manufacturingToDate", e.target.value);
                                }}
                                className="w-auto bg-background border-border h-9 text-xs"
                            /> */}

                            <DatePicker
                                value={toDate}
                                onChange={(dateStr) => {
                                    setToDate(dateStr);
                                    sessionStorage.setItem("manufacturingToDate", dateStr);
                                }}
                            />
                        </div>

                        <Button onClick={fetchData} variant="secondary" size="sm" className="h-9 gap-1 text-xs">
                            <RefreshCw className="w-3.5 h-3.5" /> Reload
                        </Button>
                    </div>
                )}
            </div>

            {/* LINE / MACHINE SELECTOR SEGMENT */}
            {mounted && (
                <Card className="border-border/60 shadow-sm bg-card p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* MAIN LINES SELECTION */}
                        <div className="space-y-2">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-blue-500" />
                                {area === "ASSEMBLY LINES" ? "Select Assembly Line" : area === "STAMPING" ? "Select Main Lines" : "Select Coilshop Types"}
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {(area === "ASSEMBLY LINES" ? assemblyOptions : area === "STAMPING" ? stampingOptions : coilshopOptions).map((line) => {
                                    const active = selectedLines.includes(line.value);
                                    return (
                                        <Button
                                            key={line.value}
                                            variant={active ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleLineSelect(line.value)}
                                            className={active ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-border text-muted-foreground hover:text-foreground"}
                                        >
                                            {line.label}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* SUB-MACHINE CHECKBOXES */}
                        {subOptions.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1.5">
                                    <Cpu className="w-4 h-4 text-blue-500" />
                                    {area === "STAMPING" ? "Select Stamping Machines" : "Select Coilshop Machines"}
                                </span>
                                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-1 border border-border/30 rounded-lg bg-background">
                                    {subOptions.map((sub) => {
                                        const active = selectedSubMachines.includes(sub.value);
                                        return (
                                            <Button
                                                key={sub.value}
                                                variant={active ? "secondary" : "ghost"}
                                                size="sm"
                                                onClick={() => handleSubMachineToggle(sub.value)}
                                                className={`text-[10px] font-bold h-7 py-1 px-2.5 rounded-md ${active ? "bg-blue-500/10 text-blue-600 border border-blue-500/30" : "text-muted-foreground hover:bg-muted"}`}
                                            >
                                                {sub.label}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* ERROR ALERT */}
            {error && (
                <Card className="border-destructive/20 bg-destructive/5">
                    <CardContent className="flex items-center gap-2 text-destructive pt-6">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                    </CardContent>
                </Card>
            )}

            {/* LOADING SKELETON */}
            {loading && !data ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6"><Skeleton className="h-64 w-full" /></Card>
                        <Card className="p-6"><Skeleton className="h-64 w-full" /></Card>
                    </div>
                </div>
            ) : (
                data && (
                    <div className="space-y-6">
                        {/* SUMMARY STATUS CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* OEE SPEEDOMETER CARD */}
                            {data.oee !== undefined && (
                                <Card className={`border shadow-sm text-center ${getOeeColor(data.oee, data.oeeTarget)}`}>
                                    <CardHeader className="pb-1 pt-4">
                                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Overall OEE</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-4 pt-1 flex flex-col items-center justify-center">
                                        <div className="text-4xl font-extrabold">{Number(data.oee).toFixed(1)}%</div>
                                        <div className="text-[10px] font-bold text-muted-foreground mt-1 flex items-center gap-1 justify-center">
                                            TARGET: {data.oeeTarget || 85}% <Target className="w-3 h-3 text-muted-foreground/60" />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* DIMENSION CARDS */}
                            {data.efficiencyStatus?.map((eff) => (
                                <Card
                                    key={eff.label}
                                    className={`border shadow-sm cursor-pointer hover:shadow-md transition-shadow ${getOeeColor(eff.value, eff.target)}`}
                                    onClick={() => router.push(`/manufacturing/production/${eff.label.toLowerCase()}`)}
                                >
                                    <CardHeader className="pb-1 pt-4 text-center">
                                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{eff.label}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-4 pt-1 flex flex-col items-center justify-center">
                                        <div className="text-3xl font-bold text-foreground">{Number(eff.value).toFixed(1)}%</div>
                                        <div className="text-[10px] font-bold text-muted-foreground mt-1">
                                            TARGET: {eff.target}%
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* VISUAL GRAPHS */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* OEE DAILY TREND CHART */}
                            <Card className="border border-border/60 shadow-sm bg-card">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-tight flex items-center gap-1.5">
                                        <TrendingUp className="w-4 h-4 text-blue-500" />
                                        Daily OEE Trend
                                    </CardTitle>
                                    <CardDescription className="text-xs">Performance trajectory over select timeframe</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-2">
                                    {data.dailyOEE && data.dailyOEE.length > 0 ? (
                                        <div className="h-72 w-full">
                                            <ChartContainer config={{}} className="h-full w-full">
                                                <BarChart data={data.dailyOEE} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#27272a" : "#f4f4f5"} />
                                                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: isDark ? "#a1a1aa" : "#71717a" }} stroke={isDark ? "#27272a" : "#e4e4e7"} />
                                                    <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: isDark ? "#a1a1aa" : "#71717a" }} stroke={isDark ? "#27272a" : "#e4e4e7"} />
                                                    <ChartTooltip content={<ChartTooltipContent />} />
                                                    <Bar dataKey="value" name="OEE" fill="#10b981" radius={[3, 3, 0, 0]}>
                                                        {data.dailyOEE.map((entry, index) => {
                                                            const oeeVal = Number(entry.value);
                                                            const fillColor = oeeVal >= (data.oeeTarget || 85) ? "#10b981" : (oeeVal >= 80 ? "#f59e0b" : "#ef4444");
                                                            return <Cell key={`cell-${index}`} fill={fillColor} />;
                                                        })}
                                                        <LabelList dataKey="value" position="top" style={{ fontSize: 8, fill: isDark ? "#f4f4f5" : "#18181b" }} />
                                                    </Bar>
                                                </BarChart>
                                            </ChartContainer>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-72 text-xs text-muted-foreground">
                                            No daily trend logs recorded.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* OEE LOSS COMPOSITION CHART */}
                            <Card className="border border-border/60 shadow-sm bg-card">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-tight flex items-center gap-1.5">
                                        <Percent className="w-4 h-4 text-blue-500" />
                                        OEE Loss Breakdown
                                    </CardTitle>
                                    <CardDescription className="text-xs">Relative contribution of availability, performance, and quality losses</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-2 flex flex-col items-center">
                                    {computedOeeComposition.length > 0 ? (
                                        <div className="h-72 w-full flex flex-col md:flex-row items-center justify-center gap-6">
                                            <div className="h-56 w-56">
                                                <ChartContainer config={{}} className="h-full w-full">
                                                    <PieChart>
                                                        <ChartTooltip content={<ChartTooltipContent />} />
                                                        <Pie
                                                            data={computedOeeComposition}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={80}
                                                            paddingAngle={4}
                                                            dataKey="value"
                                                        >
                                                            {computedOeeComposition.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                    </PieChart>
                                                </ChartContainer>
                                            </div>

                                            {/* CUSTOM LEGEND */}
                                            <div className="space-y-2 text-xs">
                                                {computedOeeComposition.map((entry, index) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
                                                        <span className="text-muted-foreground">{entry.name}:</span>
                                                        <span className="font-bold text-foreground">{entry.value}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-72 text-xs text-muted-foreground">
                                            Loss breakdown details unavailable.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
