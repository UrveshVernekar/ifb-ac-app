// app/(dashboard)/manufacturing/production/performance/page.tsx
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
    Calendar,
    TrendingUp,
    Activity,
    Target,
    Layers,
    Cpu,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, LabelList, Cell, CartesianGrid, ComposedChart, Line, Legend } from "recharts";
import Link from "next/link";

const API_HOST = "http://10.0.7.26:3003";

// === TYPES ===
interface DailyPerformanceItem {
    date: string;
    value: number;
    [key: string]: any;
}

interface PerformanceLossRow {
    SRNO?: number;
    srNo?: number;
    DATE?: string;
    date?: string;
    PLAN?: number;
    plan?: number;
    ACTUAL_PRODUCTION?: number;
    actualProduction?: number;
    EXPECTED_PRODUCTION?: number;
    expectedProduction?: number;
    PERFORMANCE_LOSS?: number;
    performanceLoss?: number;
    [key: string]: any;
}

interface PerformanceTrendConfig {
    legendData: string[];
    xAxisLabels: string[];
    seriesData: {
        name: string;
        type: "bar" | "line";
        yAxisIndex: number;
        data: number[];
        valueFormatter?: string;
    }[];
    yAxisSeries?: {
        name: string;
        type: string;
        interval?: number;
        formatter?: string;
    }[];
}

interface ApiResponse {
    oee?: number;
    oeeTarget?: number;
    performance?: number;
    dailyPerformance?: DailyPerformanceItem[];
    performanceTrend?: PerformanceTrendConfig;
    performanceLoss?: PerformanceLossRow[];
}

export default function PerformanceDashboardPage() {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const [mounted, setMounted] = useState(false);

    // Filters from session storage
    const [area, setArea] = useState<"ASSEMBLY LINES" | "STAMPING" | "COILSHOP">("ASSEMBLY LINES");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [selectedLines, setSelectedLines] = useState<string[]>([]);
    const [selectedSubMachines, setSelectedSubMachines] = useState<string[]>([]);

    // API states
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination controls
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    useEffect(() => {
        setCurrentPage(1);
    }, [area, fromDate, toDate, selectedLines, selectedSubMachines]);

    const totalPages = Math.ceil((data?.performanceLoss?.length || 0) / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedPerformanceLoss = useMemo(() => {
        if (!data?.performanceLoss) return [];
        return data.performanceLoss.slice(startIndex, startIndex + pageSize);
    }, [data?.performanceLoss, startIndex, pageSize]);

    // Load filters from session storage
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

    // Fetch Performance Details
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
            console.error("Fetch performance error:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch performance data.");
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

    // Map ECharts series format to Recharts flat row data format
    const composedTrendData = useMemo(() => {
        if (!data?.performanceTrend || !data.performanceTrend.xAxisLabels) return [];
        const labels = data.performanceTrend.xAxisLabels;
        const seriesList = data.performanceTrend.seriesData || [];
        return labels.map((label, idx) => {
            const row: any = { name: label };
            seriesList.forEach(s => {
                row[s.name] = s.data[idx] || 0;
            });
            return row;
        });
    }, [data]);

    const getOeeColor = (val: number, target: number = 85) => {
        if (val >= target) return "text-blue-500 border-blue-500/20 bg-blue-500/5";
        if (val >= 80) return "text-amber-500 border-amber-500/20 bg-amber-500/5";
        return "text-rose-500 border-rose-500/20 bg-rose-500/5";
    };

    return (
        <div className="space-y-6 max-w-8xl mx-auto p-2">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/manufacturing/production">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
                            Performance (P)
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Activity className="w-3.5 h-3.5 text-blue-500" />
                            Production output speed, plan deviations and performance losses
                        </p>
                    </div>
                </div>

                {/* Filters */}
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

                        {/* Sub machines checkboxes */}
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

            {/* Error bound status */}
            {error && (
                <Card className="border-destructive/20 bg-destructive/5">
                    <CardContent className="flex items-center gap-2 text-destructive pt-6">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                    </CardContent>
                </Card>
            )}

            {/* Content loading / display */}
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
                        {/* Overall Card */}
                        {data.performance !== undefined && (
                            <Card className={`border shadow-sm max-w-sm ${getOeeColor(data.performance, 90)}`}>
                                <CardHeader className="pb-1 pt-4 text-center">
                                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Performance Score</CardTitle>
                                </CardHeader>
                                <CardContent className="pb-4 pt-1 flex flex-col items-center justify-center">
                                    <div className="text-4xl font-extrabold text-foreground">{Number(data.performance).toFixed(1)}%</div>
                                    <div className="text-[10px] font-bold text-muted-foreground mt-1">
                                        TARGET: 90%
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Trend charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Daily Performance Bar Chart */}
                            {data.dailyPerformance && data.dailyPerformance.length > 0 && (
                                <Card className="border border-border/60 shadow-sm bg-card">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-bold uppercase tracking-tight flex items-center gap-1.5">
                                            <TrendingUp className="w-4 h-4 text-blue-500" />
                                            Daily Performance Trend
                                        </CardTitle>
                                        <CardDescription className="text-xs">Day-wise output performance rating</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-2">
                                        <div className="h-72 w-full">
                                            <ChartContainer config={{}} className="h-full w-full">
                                                <BarChart data={data.dailyPerformance} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#27272a" : "#f4f4f5"} />
                                                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: isDark ? "#a1a1aa" : "#71717a" }} stroke={isDark ? "#27272a" : "#e4e4e7"} />
                                                    <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: isDark ? "#a1a1aa" : "#71717a" }} stroke={isDark ? "#27272a" : "#e4e4e7"} />
                                                    <ChartTooltip content={<ChartTooltipContent />} />
                                                    <Bar dataKey="value" name="Performance" fill="#f59e0b" radius={[3, 3, 0, 0]}>
                                                        {data.dailyPerformance.map((entry, index) => {
                                                            const val = Number(entry.value);
                                                            const fillColor = val >= 90 ? "#10b981" : (val >= 80 ? "#f59e0b" : "#ef4444");
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

                            {/* Composed Production & Target Trend Chart */}
                            {data.performanceTrend && data.performanceTrend.seriesData && (
                                <Card className="border border-border/60 shadow-sm bg-card">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-bold uppercase tracking-tight flex items-center gap-1.5">
                                            <Activity className="w-4 h-4 text-blue-500" />
                                            Volume output & Plans Trend
                                        </CardTitle>
                                        <CardDescription className="text-xs">Composed plan vs actual performance volume comparison</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-2">
                                        {composedTrendData.length > 0 ? (
                                            <div className="h-72 w-full">
                                                <ChartContainer config={{}} className="h-full w-full">
                                                    <ComposedChart data={composedTrendData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#27272a" : "#f4f4f5"} />
                                                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: isDark ? "#a1a1aa" : "#71717a" }} stroke={isDark ? "#27272a" : "#e4e4e7"} />
                                                        <YAxis tick={{ fontSize: 9, fill: isDark ? "#a1a1aa" : "#71717a" }} stroke={isDark ? "#27272a" : "#e4e4e7"} />
                                                        <ChartTooltip content={<ChartTooltipContent />} />
                                                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10 }} />
                                                        {data.performanceTrend.seriesData.map((s, idx) => {
                                                            const colors = ["#2563eb", "#10b981", "#ef4444", "#f97316"];
                                                            const color = colors[idx % colors.length];
                                                            if (s.type === "bar") {
                                                                return (
                                                                    <Bar key={s.name} dataKey={s.name} name={s.name} fill={color} radius={[3, 3, 0, 0]} />
                                                                );
                                                            } else {
                                                                return (
                                                                    <Line key={s.name} type="monotone" dataKey={s.name} name={s.name} stroke={color} strokeWidth={2} activeDot={{ r: 4 }} />
                                                                );
                                                            }
                                                        })}
                                                    </ComposedChart>
                                                </ChartContainer>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-72 text-xs text-muted-foreground">
                                                Volume comparison stats empty.
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Performance Losses Table */}
                        {data.performanceLoss && data.performanceLoss.length > 0 && (
                            <Card className="border border-border/60 shadow-sm bg-card mt-6">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-tight flex items-center gap-1.5">
                                        <Activity className="w-4 h-4 text-blue-500" />
                                        Performance Losses Log
                                    </CardTitle>
                                    <CardDescription className="text-xs">Summary of volume targets and actual logs</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-2">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-xs font-bold uppercase tracking-wider">Sr.No</TableHead>
                                                    <TableHead className="text-xs font-bold uppercase tracking-wider">Date</TableHead>
                                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-right">Plan Target</TableHead>
                                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-right">Actual Production</TableHead>
                                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-right">Expected Production</TableHead>
                                                    <TableHead className="text-xs font-bold uppercase tracking-wider text-right font-bold text-rose-500">Performance Loss</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {paginatedPerformanceLoss.map((row, idx) => {
                                                    const sr = row.SRNO || row.srNo || (startIndex + idx + 1);
                                                    const dt = row.DATE || row.date || "";
                                                    const plan = row.PLAN || row.plan || 0;
                                                    const actual = row.ACTUAL_PRODUCTION || row.actualProduction || 0;
                                                    const expected = row.EXPECTED_PRODUCTION || row.expectedProduction || 0;
                                                    const loss = row.PERFORMANCE_LOSS || row.performanceLoss || 0;

                                                    return (
                                                        <TableRow key={idx}>
                                                            <TableCell className="text-xs py-2">{sr}</TableCell>
                                                            <TableCell className="text-xs py-2">{dt}</TableCell>
                                                            <TableCell className="text-xs py-2 text-right">{plan.toLocaleString()}</TableCell>
                                                            <TableCell className="text-xs py-2 text-right font-medium">{actual.toLocaleString()}</TableCell>
                                                            <TableCell className="text-xs py-2 text-right">{expected.toLocaleString()}</TableCell>
                                                            <TableCell className="text-xs py-2 text-right font-bold text-rose-500">-{loss.toLocaleString()}</TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Pagination UI */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pt-4 border-t text-xs">
                                        <span className="text-xs text-muted-foreground">
                                            Showing {data.performanceLoss.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, data.performanceLoss.length)} of {data.performanceLoss.length} entries
                                        </span>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">Rows per page:</span>
                                                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                                                    <SelectTrigger className="w-16 h-8 text-xs bg-background border-border">
                                                        <SelectValue placeholder={String(pageSize)} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[5, 10, 20, 50, 100].map((size) => (
                                                            <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                                    disabled={currentPage === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <span className="text-xs font-semibold px-2">Page {currentPage} of {totalPages || 1}</span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                                    disabled={currentPage === totalPages || totalPages === 0}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
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
