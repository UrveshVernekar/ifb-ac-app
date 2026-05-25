// app/(dashboard)/manufacturing/production/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertCircle,
    Package,
    Target,
    Clock,
    TrendingUp,
    Star,
    LogOut,
    RefreshCw,
    ArrowLeft,
    Layers,
    Cpu,
    Calendar,
    ChevronRight,
} from "lucide-react";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, LabelList, Legend, Cell, CartesianGrid, Line, ComposedChart } from "recharts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

const API_HOST = "http://10.0.7.26:3003";

// === TYPES ===
interface ProductionStatus {
    label: string;
    value: number;
    target: number;
    type: "text" | "rate";
}

interface HourlyData {
    labels: string[];
    actuals: number[];
    targets: number[];
}

interface ApiResponse {
    data: {
        productionStatus: ProductionStatus[];
        hourlyData?: HourlyData;
        oee?: number;
        oeeTarget?: number;
        efficiencyStatus?: ProductionStatus[];
        modelDetails?: any[];
        runningModel?: number;
        dailyData?: { date: string; count: number }[];
        machineTrendData?: { name: string; count?: number; value?: number;[key: string]: any }[];
        modelData?: any[];
        singleDay?: boolean;
        hourlyChartData?: Record<string, { labels: string[]; counts: number[]; hourlyTarget: number[] }>;
    };
}

export default function ProductionDashboardPage() {
    const [mounted, setMounted] = useState(false);

    // Filters & Navigation controls
    const [area, setArea] = useState<"ASSEMBLY LINES" | "STAMPING" | "COILSHOP">("ASSEMBLY LINES");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [selectedLines, setSelectedLines] = useState<string[]>([]);
    const [selectedSubMachines, setSelectedSubMachines] = useState<string[]>([]);
    const [stampingActiveMachine, setStampingActiveMachine] = useState<string>("");

    // API Data
    const [data, setData] = useState<ApiResponse["data"] | null>(null);
    const [downtimeData, setDowntimeData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initial default dates and session restore
    useEffect(() => {
        setMounted(true);
        const todayStr = new Date().toISOString().split("T")[0];

        // Restore from session storage
        const savedArea = sessionStorage.getItem("areaValue") as any;
        const savedFrom = sessionStorage.getItem("manufacturingFromDate");
        const savedTo = sessionStorage.getItem("manufacturingToDate");

        const activeArea = savedArea || "ASSEMBLY LINES";
        setArea(activeArea);

        const fDate = savedFrom || todayStr;
        const tDate = savedTo || todayStr;
        setFromDate(fDate);
        setToDate(tDate);

        // Prepopulate lines based on area
        if (activeArea === "ASSEMBLY LINES") {
            setSelectedLines(["ODU-Line"]);
        } else if (activeArea === "STAMPING") {
            setSelectedLines(["AUTO LINE", "TANDEM LINE"]);
        } else if (activeArea === "COILSHOP") {
            setSelectedLines(["COILSHOP IDU"]);
        }
    }, []);

    // Options mapping
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

    // Compute sub options based on selected main lines
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

    // Handle area change
    const handleAreaChange = (newArea: "ASSEMBLY LINES" | "STAMPING" | "COILSHOP") => {
        setArea(newArea);
        sessionStorage.setItem("areaValue", newArea);
        setSelectedSubMachines([]);

        if (newArea === "ASSEMBLY LINES") {
            setSelectedLines(["ODU-Line"]);
        } else if (newArea === "STAMPING") {
            setSelectedLines(["AUTO LINE", "TANDEM LINE"]);
            // Autofill submachines
            const allSub = [...stampingAutoOptions, ...stampingTandemOptions];
            setSelectedSubMachines(allSub);
            setStampingActiveMachine(stampingAutoOptions[0]);
        } else if (newArea === "COILSHOP") {
            setSelectedLines(["COILSHOP IDU"]);
            const allCSIDU = coilshopIDUOptions.map(o => o.value);
            setSelectedSubMachines(allCSIDU);
        }
    };

    // Main lines change handler
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

        // Reset or adjust submachines
        if (area === "STAMPING") {
            const validSubs: string[] = [];
            if (updatedLines.includes("AUTO LINE")) validSubs.push(...stampingAutoOptions);
            if (updatedLines.includes("TANDEM LINE")) validSubs.push(...stampingTandemOptions);
            setSelectedSubMachines(validSubs);
            if (validSubs.length > 0 && !validSubs.includes(stampingActiveMachine)) {
                setStampingActiveMachine(validSubs[0]);
            }
        } else if (area === "COILSHOP") {
            const validSubs: string[] = [];
            if (updatedLines.includes("COILSHOP IDU")) coilshopIDUOptions.forEach(o => validSubs.push(o.value));
            if (updatedLines.includes("COILSHOP ODU")) coilshopODUOptions.forEach(o => validSubs.push(o.value));
            setSelectedSubMachines(validSubs);
        }
    };

    // Sub machine toggle handler
    const handleSubMachineToggle = (value: string) => {
        let updated = [...selectedSubMachines];
        if (updated.includes(value)) {
            updated = updated.filter(v => v !== value);
        } else {
            updated.push(value);
        }
        setSelectedSubMachines(updated);
    };

    // Fetch live dashboard data
    const fetchData = async () => {
        if (!fromDate || !toDate) return;
        setLoading(true);
        setError(null);

        // Prepare machine query string
        let machineQuery = "";
        if (area === "ASSEMBLY LINES") {
            machineQuery = selectedLines[0] || "ODU-Line";
        } else if (area === "STAMPING") {
            machineQuery = selectedSubMachines.join(",");
        } else if (area === "COILSHOP") {
            machineQuery = selectedSubMachines.join(",");
        }

        try {
            const [res, downtimeRes] = await Promise.all([
                axios.get(`${API_HOST}/api/production/data`, {
                    params: {
                        area,
                        machines: machineQuery,
                        fromDate,
                        toDate,
                    }
                }),
                axios.get(`${API_HOST}/api/production/downtime`, {
                    params: {
                        line: area === "ASSEMBLY LINES" ? machineQuery : (area === "STAMPING" ? "AUTO LINE" : "COILSHOP IDU"),
                        fromDate,
                        toDate,
                    }
                })
            ]);

            setData(res.data.data);

            if (res.data.data && res.data.data.hourlyChartData) {
                const machinesList = Object.keys(res.data.data.hourlyChartData);
                if (machinesList.length > 0 && !machinesList.includes(stampingActiveMachine)) {
                    setStampingActiveMachine(machinesList[0]);
                }
            }

            if (downtimeRes.data.success) {
                setDowntimeData(downtimeRes.data.data);
            } else {
                setDowntimeData([]);
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted && selectedLines.length > 0 && (area === "ASSEMBLY LINES" || selectedSubMachines.length > 0)) {
            fetchData();
        }
    }, [area, fromDate, toDate, selectedLines, selectedSubMachines, mounted]);

    // KPI Card Helper
    const renderKpiCard = (item: ProductionStatus, icon: React.ReactNode) => {
        const isRate = item.type === "rate";
        const value = isRate ? `${item.value}%` : Number(item.value).toLocaleString();
        return (
            <Card key={item.label} className="hover:shadow-md transition-shadow bg-card border-border/60">
                <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {item.label}
                    </CardTitle>
                    {icon}
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <div className="text-2xl font-bold text-foreground">
                        {value}
                    </div>
                </CardContent>
            </Card>
        );
    };

    // Chart Configuration for Assembly Lines hourly
    const hourlyChartData = useMemo(() => {
        if (!data?.hourlyData) return [];
        return data.hourlyData.labels.map((label, i) => ({
            hour: label,
            actual: Number(data.hourlyData?.actuals[i]) || 0,
            target: Number(data.hourlyData?.targets[i]) || 0,
        }));
    }, [data]);

    // Chart Configuration for Stamping Active Machine hourly
    const stampingHourlyChartData = useMemo(() => {
        if (!data?.hourlyChartData || !stampingActiveMachine || !data.hourlyChartData[stampingActiveMachine]) return [];
        const mData = data.hourlyChartData[stampingActiveMachine];
        return mData.labels.map((label, i) => ({
            hour: label,
            actual: Number(mData.counts[i]) || 0,
            target: Number(mData.hourlyTarget[i]) || 0,
        }));
    }, [data, stampingActiveMachine]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-2">
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
                            Production Dashboard
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live shopfloor performance tracking
                        </p>
                    </div>
                </div>

                {/* Filter / Dates controls */}
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
                            <Input
                                type="date"
                                value={fromDate}
                                onChange={(e) => {
                                    setFromDate(e.target.value);
                                    sessionStorage.setItem("manufacturingFromDate", e.target.value);
                                }}
                                className="w-auto bg-background border-border h-9 text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block ml-0.5">To</span>
                            <Input
                                type="date"
                                value={toDate}
                                onChange={(e) => {
                                    setToDate(e.target.value);
                                    sessionStorage.setItem("manufacturingToDate", e.target.value);
                                }}
                                className="w-auto bg-background border-border h-9 text-xs"
                            />
                        </div>

                        <Button onClick={fetchData} variant="secondary" size="sm" className="h-9 gap-1 text-xs">
                            <RefreshCw className="w-3.5 h-3.5" /> Reload
                        </Button>
                    </div>
                )}
            </div>

            {/* Line / Machine Selector Segment */}
            {mounted && (
                <Card className="border-border/60 shadow-sm bg-card p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Main Lines selection */}
                        <div className="space-y-2">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-emerald-500" />
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
                                            className={active ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-border text-muted-foreground hover:text-foreground"}
                                        >
                                            {line.label}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sub machines checkboxes (for Stamping & Coilshop) */}
                        {subOptions.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1.5">
                                    <Cpu className="w-4 h-4 text-emerald-500" />
                                    {area === "STAMPING" ? "Select Stamping Machines" : "Select Coilshop Machines"}
                                </span>
                                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-1 border border-border/30 rounded-lg bg-background">
                                    {subOptions.map((sub) => {
                                        const active = selectedSubMachines.includes(sub.value);
                                        return (
                                            <Button
                                                key={sub.value}
                                                variant={active ? "secondary" : "ghost"}
                                                size="xs"
                                                onClick={() => handleSubMachineToggle(sub.value)}
                                                className={`text-[10px] font-bold h-7 py-1 px-2.5 rounded-md ${active ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30" : "text-muted-foreground hover:bg-muted"}`}
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

            {/* Error boundary status */}
            {error && (
                <Card className="border-destructive/20 bg-destructive/5">
                    <CardContent className="flex items-center gap-2 text-destructive pt-6">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                    </CardContent>
                </Card>
            )}

            {/* MAIN DASHBOARD LOADING / DATA VIEWS */}
            {loading && !data ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
                        ))}
                    </div>
                    <Card className="p-6"><Skeleton className="h-64 w-full" /></Card>
                </div>
            ) : (
                data && (
                    <div className="space-y-6">
                        {/* KPI Status Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            {data.productionStatus?.map((item) => {
                                const icons: Record<string, React.ReactNode> = {
                                    ACTUAL: <Package className="h-4 w-4 text-blue-500" />,
                                    PLAN: <Target className="h-4 w-4 text-purple-500" />,
                                    BACKFLUSH: <Package className="h-4 w-4 text-indigo-500" />,
                                    COMPLETE: <TrendingUp className="h-4 w-4 text-emerald-500" />,
                                    LOSS: <Clock className="h-4 w-4 text-orange-500" />,
                                    EXPECTED: <Star className="h-4 w-4 text-red-500" />,
                                    DISPATCH: <LogOut className="h-4 w-4 text-emerald-400" />,
                                    "AVG. UPH": <RefreshCw className="h-4 w-4 text-amber-500" />,
                                };
                                return renderKpiCard(item, icons[item.label] || null);
                            })}
                        </div>

                        {/* OEE speedometer & efficiency status cards (Assembly / Coilshop) */}
                        {data.oee !== undefined && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Card
                                    className={`cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden ${data.oee >= (data.oeeTarget || 85)
                                        ? "bg-emerald-500/5 border-emerald-500/20"
                                        : data.oee >= 80
                                            ? "bg-amber-500/5 border-amber-500/20"
                                            : "bg-rose-500/5 border-rose-500/20"
                                        }`}
                                    onClick={() => window.location.href = "/manufacturing/production/efficiency"}
                                >
                                    <CardHeader className="pb-1 pt-4 text-center">
                                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Overall OEE</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-4 pt-1 flex flex-col items-center justify-center">
                                        <div className={`text-4xl font-extrabold ${Number(data.oee) >= (data.oeeTarget || 85)
                                            ? "text-emerald-500"
                                            : Number(data.oee) >= 80
                                                ? "text-amber-500"
                                                : "text-rose-500"
                                            }`}>
                                            {Number(data.oee).toFixed(1)}%
                                        </div>
                                        <div className="text-[10px] font-bold text-muted-foreground mt-1 flex items-center gap-1">
                                            TARGET: {data.oeeTarget || 85}% <Target className="w-3 h-3 text-muted-foreground/60" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {data.efficiencyStatus?.map((eff) => (
                                        <Card
                                            key={eff.label}
                                            className={`cursor-pointer hover:shadow-md transition-shadow ${
                                                eff.value >= eff.target
                                                    ? "bg-emerald-500/5 border-emerald-500/20"
                                                    : eff.value >= 80
                                                        ? "bg-amber-500/5 border-amber-500/20"
                                                        : "bg-rose-500/5 border-rose-500/20"
                                            }`}
                                            onClick={() => window.location.href = `/manufacturing/production/${eff.label.toLowerCase()}`}
                                        >
                                            <CardHeader className="pb-1 pt-4 text-center">
                                                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{eff.label}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="pb-4 pt-1 flex flex-col items-center justify-center">
                                                <div className={`text-3xl font-bold ${Number(eff.value) >= eff.target
                                                    ? "text-emerald-500"
                                                    : Number(eff.value) >= 80
                                                        ? "text-amber-500"
                                                        : "text-rose-500"
                                                    }`}>
                                                    {Number(eff.value).toFixed(1)}%
                                                </div>
                                                <div className="text-[10px] font-bold text-muted-foreground mt-1">
                                                    TARGET: {eff.target}%
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SECTION: ASSEMBLY LINES HOURLY TREND & PLANS */}
                        {area === "ASSEMBLY LINES" && (
                            <>
                                {/* Hourly bar trend */}
                                {hourlyChartData.length > 0 && (
                                    <Card className="border-border/60 shadow-sm bg-card">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-md font-bold uppercase tracking-tight">Hourly Production Trend</CardTitle>
                                            <CardDescription className="text-xs">Actual vs Target production per shift hour</CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-2">
                                            <div className="h-72 w-full">
                                                <ChartContainer config={{}} className="h-full w-full">
                                                    <BarChart data={hourlyChartData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted-foreground/15" />
                                                        <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="var(--border)" className="text-muted-foreground" />
                                                        <YAxis tick={{ fontSize: 10 }} stroke="var(--border)" className="text-muted-foreground" />
                                                        <ChartTooltip content={<ChartTooltipContent />} />
                                                        <Bar dataKey="target" name="Target" fill="#3b82f6" radius={[3, 3, 0, 0]}>
                                                            <LabelList dataKey="target" position="top" style={{ fontSize: 8, fill: "var(--foreground)" }} />
                                                        </Bar>
                                                        <Bar dataKey="actual" name="Actual" radius={[3, 3, 0, 0]}>
                                                            {hourlyChartData.map((entry, index) => {
                                                                const fillColor = entry.actual >= entry.target ? "#10b981" : (entry.actual >= entry.target * 0.8 ? "#f59e0b" : "#ef4444");
                                                                return <Cell key={`cell-${index}`} fill={fillColor} />;
                                                            })}
                                                            <LabelList dataKey="actual" position="top" style={{ fontSize: 8, fill: "var(--foreground)" }} />
                                                        </Bar>
                                                    </BarChart>
                                                </ChartContainer>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Production model plan details */}
                                {data.modelDetails && data.modelDetails.length > 0 && (
                                    <Card className="border-border/60 shadow-sm bg-card">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-md font-bold uppercase tracking-tight">Production Plans & Backflush</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-2">
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider">Sequence</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider">Model Code</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider">Model Name</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider text-right">Plan</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider text-right">Production</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider text-right">Achieved (%)</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider text-right">Back Flush</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {data.modelDetails.map((row, rIdx) => {
                                                            const plan = row.plan || row.PLAN || 0;
                                                            const prod = row.production || row.PRODUCTION || 0;
                                                            const percent = plan > 0 ? ((prod / plan) * 100).toFixed(1) : "0.0";
                                                            const code = row.modelCode || row.model_code || row["MODEL CODE"] || "";
                                                            const name = row.modelName || row.model_name || row["MODEL NAME"] || "";
                                                            const seq = row.sequence || row.seq || row.SEQUENCE || (rIdx + 1);
                                                            const bf = row.backFlush || row.back_flush || row["BACK FLUSH"] || 0;

                                                            return (
                                                                <TableRow key={rIdx} className={row.model_code === data.runningModel ? "bg-emerald-500/5 font-semibold" : ""}>
                                                                    <TableCell className="text-xs py-2">{seq}</TableCell>
                                                                    <TableCell className="text-xs py-2">{code}</TableCell>
                                                                    <TableCell className="text-xs py-2">{name} {row.model_code === data.runningModel && <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded ml-2">RUNNING</span>}</TableCell>
                                                                    <TableCell className="text-xs py-2 text-right">{plan}</TableCell>
                                                                    <TableCell className="text-xs py-2 text-right">{prod}</TableCell>
                                                                    <TableCell className="text-xs py-2 text-right">{percent}%</TableCell>
                                                                    <TableCell className="text-xs py-2 text-right">{bf}</TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        )}

                        {/* SECTION: STAMPING TRENDS & MACHINE WISE VIEWS */}
                        {area === "STAMPING" && (
                            <>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Hourly validation line trend for selected Stamping Machine */}
                                    {data.hourlyChartData && Object.keys(data.hourlyChartData).length > 0 && (
                                        <Card className="border-border/60 shadow-sm bg-card col-span-1">
                                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                                <div>
                                                    <CardTitle className="text-md font-bold uppercase tracking-tight">Machine Hourly Trend</CardTitle>
                                                    <CardDescription className="text-xs">Hour-by-hour output vs targets</CardDescription>
                                                </div>
                                                <Select value={stampingActiveMachine} onValueChange={setStampingActiveMachine}>
                                                    <SelectTrigger className="w-[120px] h-8 text-[11px] bg-background">
                                                        <SelectValue placeholder="Select Machine" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.keys(data.hourlyChartData).map((mName) => (
                                                            <SelectItem key={mName} value={mName}>{mName}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </CardHeader>
                                            <CardContent className="pt-2">
                                                {stampingHourlyChartData.length > 0 ? (
                                                    <div className="h-64 w-full">
                                                        <ChartContainer config={{}} className="h-full w-full">
                                                            <ComposedChart data={stampingHourlyChartData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted-foreground/15" />
                                                                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="var(--border)" className="text-muted-foreground" />
                                                                <YAxis tick={{ fontSize: 10 }} stroke="var(--border)" className="text-muted-foreground" />
                                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                                <Bar dataKey="actual" name="Actual" fill="#10b981" radius={[3, 3, 0, 0]} />
                                                                <Line dataKey="target" name="Target" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 4 }} />
                                                            </ComposedChart>
                                                        </ChartContainer>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                                                        No hourly data available
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Machine-wise production overview */}
                                    {data.machineTrendData && data.machineTrendData.length > 0 && (
                                        <Card className="border-border/60 shadow-sm bg-card col-span-1">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-md font-bold uppercase tracking-tight">Machine-Wise Production</CardTitle>
                                                <CardDescription className="text-xs">Comparative machine outputs</CardDescription>
                                            </CardHeader>
                                            <CardContent className="pt-2">
                                                <div className="h-64 w-full">
                                                    <ChartContainer config={{}} className="h-full w-full">
                                                        <BarChart data={data.machineTrendData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted-foreground/15" />
                                                            <XAxis dataKey="machine" tick={{ fontSize: 10 }} stroke="var(--border)" className="text-muted-foreground" />
                                                            <YAxis tick={{ fontSize: 10 }} stroke="var(--border)" className="text-muted-foreground" />
                                                            <ChartTooltip content={<ChartTooltipContent />} />
                                                            <Bar dataKey="count" name="Output" fill="#8b5cf6" radius={[3, 3, 0, 0]}>
                                                                <LabelList dataKey="count" position="top" style={{ fontSize: 8, fill: "var(--foreground)" }} />
                                                            </Bar>
                                                        </BarChart>
                                                    </ChartContainer>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>

                                {/* Model-wise production log */}
                                {data.modelData && data.modelData.length > 0 && (
                                    <Card className="border-border/60 shadow-sm bg-card">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-md font-bold uppercase tracking-tight">Model-Wise Production Log</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-2">
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider">Date</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider">Line</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider">Machine</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider">Model Name</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider">Start Time</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider">End Time</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider text-right font-bold">Count</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider text-right font-bold">SPM</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {data.modelData.map((row, rIdx) => (
                                                            <TableRow key={rIdx}>
                                                                <TableCell className="text-xs py-2">{row.date || row.DATE || ""}</TableCell>
                                                                <TableCell className="text-xs py-2">{row.line || row.LINE || ""}</TableCell>
                                                                <TableCell className="text-xs py-2">{row.machine || row.MACHINE || ""}</TableCell>
                                                                <TableCell className="text-xs py-2">{row.modelName || row.model_name || row["MODEL NAME"] || ""}</TableCell>
                                                                <TableCell className="text-xs py-2">{row.startTime || row.start_time || row["START TIME"] || ""}</TableCell>
                                                                <TableCell className="text-xs py-2">{row.endTime || row.end_time || row["END TIME"] || ""}</TableCell>
                                                                <TableCell className="text-xs py-2 text-right font-semibold">{row.count || row.COUNT || 0}</TableCell>
                                                                <TableCell className="text-xs py-2 text-right">{row.spm || row.SPM || 0}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        )}

                        {/* SECTION: COILSHOP TRENDS & COMPONENT DETAILS */}
                        {area === "COILSHOP" && (
                            <>
                                {/* Coilshop machine trend */}
                                {data.machineTrendData && data.machineTrendData.length > 0 && (
                                    <Card className="border-border/60 shadow-sm bg-card">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-md font-bold uppercase tracking-tight">Machine-Wise Production Trend</CardTitle>
                                            <CardDescription className="text-xs">Outputs by individual coilshop machines</CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-2">
                                            <div className="h-72 w-full">
                                                <ChartContainer config={{}} className="h-full w-full">
                                                    <BarChart data={data.machineTrendData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted-foreground/15" />
                                                        <XAxis dataKey="machine" tick={{ fontSize: 10 }} stroke="var(--border)" className="text-muted-foreground" />
                                                        <YAxis tick={{ fontSize: 10 }} stroke="var(--border)" className="text-muted-foreground" />
                                                        <ChartTooltip content={<ChartTooltipContent />} />
                                                        <Bar dataKey="count" name="Output" fill="#06b6d4" radius={[3, 3, 0, 0]}>
                                                            <LabelList dataKey="count" position="top" style={{ fontSize: 8, fill: "var(--foreground)" }} />
                                                        </Bar>
                                                    </BarChart>
                                                </ChartContainer>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Coilshop detailed logs */}
                                {data.modelData && data.modelData.length > 0 && (
                                    <Card className="border-border/60 shadow-sm bg-card">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-md font-bold uppercase tracking-tight">Model-Wise Coilshop Logs</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-2">
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider">Date</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider">Shift</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider">Line</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider">Machine</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider">Model Name</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider text-right font-bold">Plan</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider text-right font-bold">Production</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider text-right">A (%)</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider text-right">P (%)</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider text-right">Q (%)</TableHead>
                                                            <TableHead className="text-xs uppercase font-bold tracking-wider text-right font-bold">OEE (%)</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {data.modelData.map((row, rIdx) => (
                                                            <TableRow key={rIdx}>
                                                                <TableCell className="text-xs py-2">{row.date || row.DATE || ""}</TableCell>
                                                                <TableCell className="text-xs py-2">{row.shift || row.SHIFT || ""}</TableCell>
                                                                <TableCell className="text-xs py-2">{row.line || row.LINE || ""}</TableCell>
                                                                <TableCell className="text-xs py-2">{row.machine || row.MACHINE || ""}</TableCell>
                                                                <TableCell className="text-xs py-2">{row.modelName || row.model_name || row["MODEL NAME"] || ""}</TableCell>
                                                                <TableCell className="text-xs py-2 text-right">{row.plan || row.PLAN || 0}</TableCell>
                                                                <TableCell className="text-xs py-2 text-right font-semibold">{row.production || row.PRODUCTION || 0}</TableCell>
                                                                <TableCell className="text-xs py-2 text-right">{row.a || row.A || 0}%</TableCell>
                                                                <TableCell className="text-xs py-2 text-right">{row.p || row.P || 0}%</TableCell>
                                                                <TableCell className="text-xs py-2 text-right">{row.q || row.Q || 0}%</TableCell>
                                                                <TableCell className="text-xs py-2 text-right font-bold">{row.oee || row.OEE || 0}%</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        )}

                        {/* Downtime logger list table */}
                        {downtimeData.length > 0 && (
                            <Card className="border-border/60 shadow-sm bg-card mt-6">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-md font-bold uppercase tracking-tight">Active Downtime Events</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-2">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-xs uppercase font-bold tracking-wider">Date</TableHead>
                                                    <TableHead className="text-xs uppercase font-bold tracking-wider">Time</TableHead>
                                                    <TableHead className="text-xs uppercase font-bold tracking-wider">Line</TableHead>
                                                    <TableHead className="text-xs uppercase font-bold tracking-wider">Type</TableHead>
                                                    <TableHead className="text-xs uppercase font-bold tracking-wider">Reason</TableHead>
                                                    <TableHead className="text-xs uppercase font-bold tracking-wider text-right">Duration (min)</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {downtimeData.map((row, rIdx) => (
                                                    <TableRow key={rIdx}>
                                                        <TableCell className="text-xs py-2">{row.date || row.DATE || ""}</TableCell>
                                                        <TableCell className="text-xs py-2">{row.time || row.TIME || ""}</TableCell>
                                                        <TableCell className="text-xs py-2">{row.line || row.LINE || ""}</TableCell>
                                                        <TableCell className="text-xs py-2">{row.type || row.TYPE || ""}</TableCell>
                                                        <TableCell className="text-xs py-2">{row.reason || row.REASON || ""}</TableCell>
                                                        <TableCell className="text-xs py-2 text-right font-medium">{row.duration || row.DURATION || 0}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )
            )}
        </div>
    );
}
