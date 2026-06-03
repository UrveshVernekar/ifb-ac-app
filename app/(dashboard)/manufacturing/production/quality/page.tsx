// app/(dashboard)/manufacturing/production/quality/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useTheme } from "next-themes";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    ArrowLeft,
    RefreshCw,
    AlertCircle,
    TrendingUp,
    CheckCircle2,
    Layers,
    Cpu,
    PieChart as PieIcon,
    AlertTriangle,
} from "lucide-react";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, LabelList, Cell, CartesianGrid, PieChart, Pie, Legend } from "recharts";
import Link from "next/link";

const API_HOST = "http://10.0.7.26:3003";

// === TYPES ===
interface DailyQualityItem {
    date: string;
    value: number;
    [key: string]: any;
}

interface DefectRow {
    "DEFECT NAME"?: string;
    defectName?: string;
    defectname?: string;
    "DEFECT COUNT"?: number;
    defectCount?: number;
    defectcount?: number;
    [key: string]: any;
}

interface DefectChartItem {
    name: string;
    value: number;
    [key: string]: any;
}

interface PpmCardItem {
    label: string;
    value: number;
    target: number;
    type?: string;
}

interface ApiResponse {
    oee?: number;
    oeeTarget?: number;
    quality?: number;
    dailyQuality?: DailyQualityItem[];
    topDefects?: DefectRow[];
    topDefectChart?: DefectChartItem[];

    qualityCheckDefectStatus?: PpmCardItem[];
    functionalTestingDefectStatus?: PpmCardItem[];
    qualityNGModelData?: {
        headers: string[];
        data: any[];
    };
    functionalNGComposition?: DefectChartItem[];
    visionStatus?: PpmCardItem[];
}

export default function QualityDashboardPage() {
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
    const [data, setData] = useState<ApiResponse | null>(null);
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

    // FETCH QUALITY DATA
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
            const res = await axios.get(`${API_HOST}/api/production/data`, {
                params: {
                    area,
                    machines: machineQuery,
                    fromDate,
                    toDate,
                }
            });
            setData(res.data.data);
        } catch (err) {
            console.error("Fetch quality error:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch quality data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted && selectedLines.length > 0 && (area === "ASSEMBLY LINES" || selectedSubMachines.length > 0)) {
            fetchData();
        }
    }, [area, fromDate, toDate, selectedLines, selectedSubMachines, mounted]);

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

    const getOeeColor = (val: number, target: number = 85) => {
        if (val >= target) return "text-blue-500 border-blue-500/20 bg-blue-500/5";
        if (val >= 80) return "text-amber-500 border-amber-500/20 bg-amber-500/5";
        return "text-rose-500 border-rose-500/20 bg-rose-500/5";
    };

    const chartColors = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#06b6d4"];

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
                            Quality (Q)
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                            First-pass yields, quality rejections and PPM statistics
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
                    <Card className="p-6"><Skeleton className="h-20 w-full" /></Card>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6"><Skeleton className="h-64 w-full" /></Card>
                        <Card className="p-6"><Skeleton className="h-64 w-full" /></Card>
                    </div>
                </div>
            ) : (
                data && (
                    <div className="space-y-6">
                        {/* OVERALL CARD */}
                        {data.quality !== undefined && (
                            <Card className={`border shadow-sm max-w-sm ${getOeeColor(data.quality, 95)}`}>
                                <CardHeader className="pb-1 pt-4 text-center">
                                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Quality Score (First Pass)</CardTitle>
                                </CardHeader>
                                <CardContent className="pb-4 pt-1 flex flex-col items-center justify-center">
                                    <div className="text-4xl font-extrabold text-foreground">{Number(data.quality).toFixed(1)}%</div>
                                    <div className="text-[10px] font-bold text-muted-foreground mt-1">
                                        TARGET: 95%
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* DAILY QUALITY TREND */}
                        {data.dailyQuality && data.dailyQuality.length > 0 && (
                            <Card className="border border-border/60 shadow-sm bg-card">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-tight flex items-center gap-1.5">
                                        <TrendingUp className="w-4 h-4 text-blue-500" />
                                        Daily Quality Trend
                                    </CardTitle>
                                    <CardDescription className="text-xs">Day-by-day quality yield values</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-2">
                                    <div className="h-72 w-full">
                                        <ChartContainer config={{}} className="h-full w-full">
                                            <BarChart data={data.dailyQuality} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#27272a" : "#f4f4f5"} />
                                                <XAxis dataKey="date" tick={{ fontSize: 9, fill: isDark ? "#a1a1aa" : "#71717a" }} stroke={isDark ? "#27272a" : "#e4e4e7"} />
                                                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: isDark ? "#a1a1aa" : "#71717a" }} stroke={isDark ? "#27272a" : "#e4e4e7"} />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <Bar dataKey="value" name="Quality" fill="#3b82f6" radius={[3, 3, 0, 0]}>
                                                    {data.dailyQuality.map((entry, index) => {
                                                        const val = Number(entry.value);
                                                        const fillColor = val >= 95 ? "#10b981" : (val >= 80 ? "#f59e0b" : "#ef4444");
                                                        return <Cell key={`cell-${index}`} fill={fillColor} />;
                                                    })}
                                                    <LabelList dataKey="value" position="top" style={{ fontSize: 8, fill: isDark ? "#f4f4f5" : "#18181b" }} />
                                                </Bar>
                                            </BarChart>
                                        </ChartContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* TOP DEFECTS VISUAL LAYOUT */}
                        {data.topDefects && data.topDefects.length > 0 && (
                            <Card className="border border-border/60 shadow-sm bg-card">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-tight flex items-center gap-1.5">
                                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                                        Top 5 Rejection Defects
                                    </CardTitle>
                                    <CardDescription className="text-xs">Summary of recurring defect codes and counts</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                        {/* PIE CHART */}
                                        <div className="flex flex-col items-center">
                                            {data.topDefectChart && data.topDefectChart.length > 0 ? (
                                                <div className="h-64 w-full">
                                                    <ChartContainer config={{}} className="h-full w-full">
                                                        <PieChart>
                                                            <ChartTooltip content={<ChartTooltipContent />} />
                                                            <Pie
                                                                data={data.topDefectChart}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={50}
                                                                outerRadius={75}
                                                                paddingAngle={3}
                                                                dataKey="value"
                                                            >
                                                                {data.topDefectChart.map((entry, idx) => (
                                                                    <Cell key={`cell-${idx}`} fill={chartColors[idx % chartColors.length]} />
                                                                ))}
                                                            </Pie>
                                                        </PieChart>
                                                    </ChartContainer>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-muted-foreground">Defect distribution charts empty.</div>
                                            )}
                                        </div>

                                        {/* GRID DATA LIST */}
                                        <div className="overflow-x-auto border border-border/30 rounded-lg">
                                            <Table>
                                                <TableHeader className="bg-muted/30">
                                                    <TableRow>
                                                        <TableHead className="text-xs font-bold uppercase py-2">Defect Description</TableHead>
                                                        <TableHead className="text-xs font-bold uppercase py-2 text-right">Occurrence Count</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {data.topDefects.map((row, idx) => {
                                                        const name = row["DEFECT NAME"] || row.defectName || row.defectname || "N/A";
                                                        const count = row["DEFECT COUNT"] || row.defectCount || row.defectcount || 0;
                                                        return (
                                                            <TableRow key={idx}>
                                                                <TableCell className="text-xs py-2 flex items-center gap-2">
                                                                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: chartColors[idx % chartColors.length] }} />
                                                                    <span>{name}</span>
                                                                </TableCell>
                                                                <TableCell className="text-xs py-2 text-right font-medium text-rose-500">{count}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* ASSEMBLY LINES ONLY - ADVANCED PPM & FUNCTIONAL TESTING WIDGETS */}
                        {area === "ASSEMBLY LINES" && (
                            <div className="space-y-6">
                                {/* ADVANCED PPM GRIDS */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* QUALITY CHECK DEFECTS PPM */}
                                    {data.qualityCheckDefectStatus && (
                                        <Card className="border border-border/60 shadow-sm bg-card">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-bold uppercase tracking-tight">Quality Check Defects (PPM)</CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {data.qualityCheckDefectStatus.map((item) => (
                                                    <Card key={item.label} className="border border-border/40 bg-background/40">
                                                        <CardContent className="p-4">
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{item.label}</span>
                                                            <span className={`text-2xl font-bold block mt-1 ${item.value > item.target ? "text-rose-500" : "text-blue-500"}`}>{item.value} PPM</span>
                                                            <span className="text-[9px] text-muted-foreground block mt-0.5">TARGET limit: {item.target} PPM</span>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* FUNCTIONAL TEST DEFECT COMPOSITION */}
                                    {data.functionalTestingDefectStatus && (
                                        <Card className="border border-border/60 shadow-sm bg-card">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-bold uppercase tracking-tight">Functional Rejection Rates (PPM)</CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {data.functionalTestingDefectStatus.map((item) => (
                                                    <Card key={item.label} className="border border-border/40 bg-background/40">
                                                        <CardContent className="p-4">
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{item.label}</span>
                                                            <span className={`text-2xl font-bold block mt-1 ${item.value > item.target ? "text-rose-500" : "text-blue-500"}`}>{item.value} PPM</span>
                                                            <span className="text-[9px] text-muted-foreground block mt-0.5">TARGET limit: {item.target} PPM</span>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>

                                {/* MODEL-WISE FUNCTIONAL NG STATISTICS */}
                                {data.qualityNGModelData && data.qualityNGModelData.headers && (
                                    <Card className="border border-border/60 shadow-sm bg-card">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-bold uppercase tracking-tight flex items-center gap-1.5">
                                                <Layers className="w-4 h-4 text-blue-500" />
                                                MODEL-WISE FUNCTIONAL NG OUTPUT
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-2">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                                {/* LEFT SIDE COMPOSITION PIE CHART */}
                                                <div className="flex flex-col items-center">
                                                    {data.functionalNGComposition && data.functionalNGComposition.length > 0 ? (
                                                        <div className="h-64 w-full">
                                                            <ChartContainer config={{}} className="h-full w-full">
                                                                <PieChart>
                                                                    <ChartTooltip content={<ChartTooltipContent />} />
                                                                    <Pie
                                                                        data={data.functionalNGComposition}
                                                                        cx="50%"
                                                                        cy="50%"
                                                                        innerRadius={45}
                                                                        outerRadius={70}
                                                                        paddingAngle={3}
                                                                        dataKey="value"
                                                                    >
                                                                        {data.functionalNGComposition.map((entry, idx) => (
                                                                            <Cell key={`cell-${idx}`} fill={chartColors[idx % chartColors.length]} />
                                                                        ))}
                                                                    </Pie>
                                                                </PieChart>
                                                            </ChartContainer>
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-muted-foreground">NG Model distribution charts empty.</div>
                                                    )}
                                                </div>

                                                {/* RIGHT SIDE TABLE */}
                                                <div className="overflow-x-auto border border-border/30 rounded-lg">
                                                    <Table>
                                                        <TableHeader className="bg-muted/30">
                                                            <TableRow>
                                                                {data.qualityNGModelData.headers.map((h, i) => (
                                                                    <TableHead key={i} className="text-xs font-bold uppercase py-2">{h}</TableHead>
                                                                ))}
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {data.qualityNGModelData.data.map((row, idx) => (
                                                                <TableRow key={idx}>
                                                                    {data.qualityNGModelData!.headers.map((h, i) => {
                                                                        const val = row[h] !== undefined ? row[h] : (row[h.toLowerCase()] !== undefined ? row[h.toLowerCase()] : row[Object.keys(row)[i]]);
                                                                        const isCount = h.toUpperCase().includes("COUNT") || h.toUpperCase().includes("QTY") || h.toUpperCase().includes("NG");
                                                                        return (
                                                                            <TableCell key={i} className={`text-xs py-2 ${isCount ? "font-semibold text-rose-500" : ""}`}>{val}</TableCell>
                                                                        );
                                                                    })}
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* VISION DATA SYSTEM VALIDATION LOGS */}
                                {data.visionStatus && (
                                    <Card className="border border-border/60 shadow-sm bg-card mt-6">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-bold uppercase tracking-tight">Vision System PPM Statistics</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                            {data.visionStatus.map((item) => (
                                                <Card key={item.label} className="border border-border/40 bg-background/40">
                                                    <CardContent className="p-4">
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{item.label}</span>
                                                        <span className={`text-2xl font-bold block mt-1 ${item.value > item.target ? "text-rose-500" : "text-blue-500"}`}>{item.value} PPM</span>
                                                        <span className="text-[9px] text-muted-foreground block mt-0.5">TARGET limit: {item.target} PPM</span>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>
                )
            )}
        </div>
    );
}
