// app/(dashboard)/manufacturing/production/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
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
    CheckCircle2,
    Edit,
    ChevronLeft,
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
import { Badge } from "@/components/ui/badge";

const API_HOST = "http://10.0.7.26:3003";

// === TYPES ===
interface ProductionStatus {
    label: string;
    value: number;
    target: number;
    type: "text" | "rate";
    onClick?: {
        status: boolean;
        url: string;
    };
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
        dailyStatus?: ProductionStatus[];
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
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
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
    const [searchTerm, setSearchTerm] = useState("");

    // Pagination states
    const [modelDetailsPage, setModelDetailsPage] = useState(1);
    const [modelDetailsPageSize, setModelDetailsPageSize] = useState(5);
    const [modelDataPage, setModelDataPage] = useState(1);
    const [modelDataPageSize, setModelDataPageSize] = useState(5);
    const [downtimePage, setDowntimePage] = useState(1);
    const [downtimePageSize, setDowntimePageSize] = useState(5);

    useEffect(() => {
        setModelDetailsPage(1);
        setModelDataPage(1);
        setDowntimePage(1);
    }, [area, fromDate, toDate, selectedLines, selectedSubMachines, searchTerm]);

    const filteredModelDetails = useMemo(() => {
        if (!data?.modelDetails) return [];
        return data.modelDetails.filter((row: any) => {
            const code = row.modelCode || row.model_code || row["MODEL CODE"] || "";
            const name = row.modelName || row.model_name || row["MODEL NAME"] || "";
            const desc = row.model_description || row.modelDescription || "";
            const term = searchTerm.toLowerCase();
            return String(code).toLowerCase().includes(term) ||
                String(name).toLowerCase().includes(term) ||
                String(desc).toLowerCase().includes(term);
        });
    }, [data?.modelDetails, searchTerm]);

    const paginatedModelDetails = useMemo(() => {
        const startIndex = (modelDetailsPage - 1) * modelDetailsPageSize;
        return filteredModelDetails.slice(startIndex, startIndex + modelDetailsPageSize);
    }, [filteredModelDetails, modelDetailsPage, modelDetailsPageSize]);

    const totalModelDetailsPages = Math.ceil(filteredModelDetails.length / modelDetailsPageSize);

    const paginatedModelData = useMemo(() => {
        if (!data?.modelData) return [];
        const startIndex = (modelDataPage - 1) * modelDataPageSize;
        return data.modelData.slice(startIndex, startIndex + modelDataPageSize);
    }, [data?.modelData, modelDataPage, modelDataPageSize]);

    const totalModelDataPages = Math.ceil((data?.modelData?.length || 0) / modelDataPageSize);

    const paginatedDowntimeData = useMemo(() => {
        if (!downtimeData) return [];
        const startIndex = (downtimePage - 1) * downtimePageSize;
        return downtimeData.slice(startIndex, startIndex + downtimePageSize);
    }, [downtimeData, downtimePage, downtimePageSize]);

    const totalDowntimePages = Math.ceil(downtimeData.length / downtimePageSize);

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

        // Prepopulate lines based on area and saved selection
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

    // Handle area change
    const handleAreaChange = (newArea: "ASSEMBLY LINES" | "STAMPING" | "COILSHOP") => {
        setArea(newArea);
        sessionStorage.setItem("areaValue", newArea);
        setSelectedSubMachines([]);

        if (newArea === "ASSEMBLY LINES") {
            setSelectedLines(["ODU-Line"]);
            sessionStorage.setItem("manufacturingMachines", "ODU-Line");
        } else if (newArea === "STAMPING") {
            setSelectedLines(["AUTO LINE", "TANDEM LINE"]);
            // Autofill submachines
            const allSub = [...stampingAutoOptions, ...stampingTandemOptions];
            setSelectedSubMachines(allSub);
            setStampingActiveMachine(stampingAutoOptions[0]);
            sessionStorage.setItem("subMachineSession", allSub.join(","));
        } else if (newArea === "COILSHOP") {
            setSelectedLines(["COILSHOP IDU"]);
            const allCSIDU = coilshopIDUOptions.map(o => o.value);
            setSelectedSubMachines(allCSIDU);
            sessionStorage.setItem("subMachineSession", allCSIDU.join(","));
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
        sessionStorage.setItem("manufacturingMachines", updatedLines.join(","));

        // Reset or adjust submachines
        if (area === "STAMPING") {
            const validSubs: string[] = [];
            if (updatedLines.includes("AUTO LINE")) validSubs.push(...stampingAutoOptions);
            if (updatedLines.includes("TANDEM LINE")) validSubs.push(...stampingTandemOptions);
            setSelectedSubMachines(validSubs);
            sessionStorage.setItem("subMachineSession", validSubs.join(","));
            if (validSubs.length > 0 && !validSubs.includes(stampingActiveMachine)) {
                setStampingActiveMachine(validSubs[0]);
            }
        } else if (area === "COILSHOP") {
            const validSubs: string[] = [];
            if (updatedLines.includes("COILSHOP IDU")) coilshopIDUOptions.forEach(o => validSubs.push(o.value));
            if (updatedLines.includes("COILSHOP ODU")) coilshopODUOptions.forEach(o => validSubs.push(o.value));
            setSelectedSubMachines(validSubs);
            sessionStorage.setItem("subMachineSession", validSubs.join(","));
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
        sessionStorage.setItem("subMachineSession", updated.join(","));
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
        const isClickable = item.onClick?.status;
        const handleClick = () => {
            if (isClickable && item.onClick?.url) {
                // replace /ac prefix with empty string if present
                const targetUrl = item.onClick.url.replace(/^\/ac/, "");
                router.push(targetUrl);
            }
        };

        return (
            <Card
                key={item.label}
                className={`transition-all bg-card border-border/60 ${isClickable ? "cursor-pointer hover:shadow-md hover:border-blue-500/50 hover:-translate-y-0.5" : "hover:shadow-sm"}`}
                onClick={handleClick}
            >
                <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {item.label}
                    </CardTitle>
                    {icon}
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <div className="text-xl sm:text-2xl font-bold text-foreground">
                        {value}
                    </div>
                </CardContent>
            </Card>
        );
    };

    const isTodaySelected = useMemo(() => {
        const today = new Date().toLocaleDateString("en-CA"); // "YYYY-MM-DD"
        return fromDate === today && toDate === today;
    }, [fromDate, toDate]);

    const getAchievementBadge = (achieved: string, plan: number) => {
        const value = parseFloat(achieved);
        let variant = "";
        if (value >= 100)
            variant = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        else if (value >= 70)
            variant = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
        else
            variant = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";

        if (plan === 0) {
            return "";
        } else {
            return <Badge className={variant}>{achieved}%</Badge>;
        }
    };

    // Chart Configuration for Assembly Lines hourly
    const hourlyChartData = useMemo(() => {
        if (!data?.hourlyData?.labels) return [];
        return data.hourlyData.labels.map((label, i) => ({
            hour: label,
            actual: Number(data.hourlyData?.actuals?.[i]) || 0,
            target: Number(data.hourlyData?.targets?.[i]) || 0,
        }));
    }, [data]);

    // Chart Configuration for Stamping Active Machine hourly
    const stampingHourlyChartData = useMemo(() => {
        if (!data?.hourlyChartData || !stampingActiveMachine || !data.hourlyChartData[stampingActiveMachine]) return [];
        const mData = data.hourlyChartData[stampingActiveMachine];
        if (!mData?.labels) return [];
        return mData.labels.map((label, i) => ({
            hour: label,
            actual: Number(mData.counts?.[i]) || 0,
            target: Number(mData.hourlyTarget?.[i]) || 0,
        }));
    }, [data, stampingActiveMachine]);

    return (
        <div className="space-y-6 max-w-8xl mx-auto p-2">
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
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
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

                        {/* Sub machines checkboxes (for Stamping & Coilshop) */}
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
                                                size="xs"
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
                        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
                            {data.productionStatus?.map((item) => {
                                const icons: Record<string, React.ReactNode> = {
                                    ACTUAL: <Package className="h-4 w-4 text-blue-500" />,
                                    PLAN: <Target className="h-4 w-4 text-purple-500" />,
                                    BACKFLUSH: <Package className="h-4 w-4 text-indigo-500" />,
                                    COMPLETE: <TrendingUp className="h-4 w-4 text-blue-500" />,
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
                                        ? "bg-blue-500/5 border-blue-500/20"
                                        : data.oee >= 80
                                            ? "bg-amber-500/5 border-amber-500/20"
                                            : "bg-rose-500/5 border-rose-500/20"
                                        }`}
                                    onClick={() => router.push("/manufacturing/production/efficiency")}
                                >
                                    <CardHeader className="pb-1 pt-4 text-center">
                                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Overall OEE</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-4 pt-1 flex flex-col items-center justify-center">
                                        <div className={`text-4xl font-extrabold ${Number(data.oee) >= (data.oeeTarget || 85)
                                            ? "text-blue-500"
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
                                            className={`cursor-pointer hover:shadow-md transition-shadow ${eff.value >= eff.target
                                                ? "bg-blue-500/5 border-blue-500/20"
                                                : eff.value >= 80
                                                    ? "bg-amber-500/5 border-amber-500/20"
                                                    : "bg-rose-500/5 border-rose-500/20"
                                                }`}
                                            onClick={() => router.push(`/manufacturing/production/${eff.label.toLowerCase()}`)}
                                        >
                                            <CardHeader className="pb-1 pt-4 text-center">
                                                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{eff.label}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="pb-4 pt-1 flex flex-col items-center justify-center">
                                                <div className={`text-3xl font-bold ${Number(eff.value) >= eff.target
                                                    ? "text-blue-500"
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

                        {/* Daily Status (Assembly lines) */}
                        {area === "ASSEMBLY LINES" && data.dailyStatus && data.dailyStatus.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Daily Status</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {data.dailyStatus.map((item) => {
                                        const icons: Record<string, React.ReactNode> = {
                                            "OK": <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
                                            "REWORK": <Edit className="h-4 w-4 text-amber-500" />,
                                            "REJECT": <AlertCircle className="h-4 w-4 text-rose-500" />,
                                            "TOTAL DEFECT": <AlertCircle className="h-4 w-4 text-rose-400" />,
                                            "YIELD %": <TrendingUp className="h-4 w-4 text-blue-500" />,
                                        };
                                        return renderKpiCard(item, icons[item.label.toUpperCase()] || <Star className="h-4 w-4 text-blue-500" />);
                                    })}
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
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#27272a" : "#f4f4f5"} />
                                                        <XAxis dataKey="hour" tick={{ fontSize: 10, fill: isDark ? "#a1a1aa" : "#71717a" }} stroke={isDark ? "#27272a" : "#e4e4e7"} />
                                                        <YAxis tick={{ fontSize: 10, fill: isDark ? "#a1a1aa" : "#71717a" }} stroke={isDark ? "#27272a" : "#e4e4e7"} />
                                                        <ChartTooltip content={<ChartTooltipContent />} />
                                                        <Bar dataKey="target" name="Target" fill="#3b82f6" radius={[3, 3, 0, 0]}>
                                                            <LabelList dataKey="target" position="top" style={{ fontSize: 8, fill: isDark ? "#f4f4f5" : "#18181b" }} />
                                                        </Bar>
                                                        <Bar dataKey="actual" name="Actual" radius={[3, 3, 0, 0]}>
                                                            {hourlyChartData.map((entry, index) => {
                                                                const fillColor = entry.actual >= entry.target ? "#10b981" : (entry.actual >= entry.target * 0.8 ? "#f59e0b" : "#ef4444");
                                                                return <Cell key={`cell-${index}`} fill={fillColor} />;
                                                            })}
                                                            <LabelList dataKey="actual" position="top" style={{ fontSize: 8, fill: isDark ? "#f4f4f5" : "#18181b" }} />
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
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <div>
                                                    <CardTitle className="text-gray-900 font-bold text-2xl dark:text-white">
                                                        PRODUCTION PLAN
                                                    </CardTitle>
                                                </div>
                                                <Input
                                                    placeholder="Search model name or model code..."
                                                    value={searchTerm}
                                                    onChange={(e) => {
                                                        setSearchTerm(e.target.value);
                                                        setModelDetailsPage(1);
                                                    }}
                                                    className="w-full sm:w-64 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                                />
                                            </div>
                                        </CardHeader>
                                        <div className="p-6 pt-0">
                                            <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="dark:border-gray-700">
                                                            <TableHead className="text-gray-900 dark:text-gray-100">Seq</TableHead>
                                                            <TableHead className="text-gray-900 dark:text-gray-100">Plan Order</TableHead>
                                                            <TableHead className="text-gray-900 dark:text-gray-100">Model Code</TableHead>
                                                            <TableHead className="text-gray-900 dark:text-gray-100">Model Description</TableHead>
                                                            <TableHead className="text-gray-900 dark:text-gray-100">Model Name</TableHead>
                                                            <TableHead className="text-center text-gray-900 dark:text-gray-100">Plan</TableHead>
                                                            <TableHead className="text-center text-gray-900 dark:text-gray-100">Initial</TableHead>
                                                            <TableHead className="text-center text-gray-900 dark:text-gray-100">Prod</TableHead>
                                                            <TableHead className="text-center text-gray-900 dark:text-gray-100">Backflush</TableHead>
                                                            <TableHead className="text-center text-gray-900 dark:text-gray-100">Progress</TableHead>
                                                            <TableHead className="text-center text-gray-900 dark:text-gray-100">Achieved (%)</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {paginatedModelDetails.map((row, rIdx) => {
                                                            const plan = Number(row.plan || row.PLAN || 0);
                                                            const prod = Number(row.production || row.PRODUCTION || 0);
                                                            const initial = Number(row.initial_count || row.initialCount || row.INITIAL_COUNT || 0);
                                                            const bf = Number(row.backFlush || row.back_flush || row.backflush || row["BACK FLUSH"] || 0);

                                                            const code = row.modelCode || row.model_code || row["MODEL CODE"] || "";
                                                            const name = row.modelName || row.model_name || row["MODEL NAME"] || "";
                                                            const desc = row.model_description || row.modelDescription || row["MODEL DESCRIPTION"] || "-";
                                                            const seq = row.sequence || row.seq || row.SEQUENCE || ((modelDetailsPage - 1) * modelDetailsPageSize + rIdx + 1);
                                                            const planOrder = row.planOrder || row.plan_order || row.PLAN_ORDER || "-";

                                                            const percent = plan > 0 ? ((prod / plan) * 100).toFixed(1) : "0.0";
                                                            const achievedStr = row.achieved || percent;

                                                            let progress = 0;
                                                            if (plan === 0) {
                                                                progress = prod > 0 ? (bf / prod) * 100 : 0;
                                                            } else {
                                                                progress = (prod / plan) * 100;
                                                            }

                                                            const isRunning = data.runningModel && String(code) === String(data.runningModel) && isTodaySelected && plan !== prod;

                                                            return (
                                                                <TableRow
                                                                    key={rIdx}
                                                                    className={`dark:border-gray-700 transition-colors duration-200
                                                                        ${isRunning ? "row-breathe font-semibold border-l-2 border-blue-500" : "hover:bg-gray-50 dark:hover:bg-gray-800"}
                                                                    `}
                                                                >
                                                                    <TableCell className="font-medium text-gray-900 dark:text-white">{seq}</TableCell>
                                                                    <TableCell className="text-gray-900 dark:text-white">{planOrder}</TableCell>
                                                                    <TableCell className="text-gray-900 dark:text-white">{code}</TableCell>
                                                                    <TableCell className="text-gray-900 dark:text-white max-w-xs truncate" title={name}>{name}</TableCell>
                                                                    <TableCell className="text-gray-900 dark:text-white max-w-xs truncate" title={desc}>
                                                                        {desc} {isRunning && <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded ml-2 animate-pulse font-bold">RUNNING</span>}
                                                                    </TableCell>
                                                                    <TableCell className="text-center font-medium text-gray-900 dark:text-white">{plan.toLocaleString()}</TableCell>
                                                                    <TableCell className="text-center font-medium text-gray-900 dark:text-white">{initial.toLocaleString()}</TableCell>
                                                                    <TableCell className="text-center font-medium text-gray-900 dark:text-white">{prod.toLocaleString()}</TableCell>
                                                                    <TableCell className="text-center text-gray-900 dark:text-white">{bf.toLocaleString()}</TableCell>
                                                                    <TableCell>
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-24">
                                                                                <div
                                                                                    className={`h-2 rounded-full transition-all ${progress >= 100
                                                                                        ? "bg-green-600"
                                                                                        : progress >= 75
                                                                                            ? "bg-blue-600"
                                                                                            : progress >= 50
                                                                                                ? "bg-yellow-600"
                                                                                                : "bg-red-600"
                                                                                        }`}
                                                                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                                                                />
                                                                            </div>
                                                                            <span className="text-xs text-gray-600 dark:text-gray-400 w-12 text-right">
                                                                                {progress.toFixed(0)}%
                                                                            </span>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        {getAchievementBadge(achievedStr, plan)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </div>

                                            {/* Pagination UI */}
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pt-4 border-t text-xs">
                                                <span className="text-xs text-muted-foreground">
                                                    Showing {filteredModelDetails.length > 0 ? (modelDetailsPage - 1) * modelDetailsPageSize + 1 : 0} to {Math.min(modelDetailsPage * modelDetailsPageSize, filteredModelDetails.length)} of {filteredModelDetails.length} entries
                                                </span>
                                                <div className="flex flex-wrap items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">Rows per page:</span>
                                                        <Select value={String(modelDetailsPageSize)} onValueChange={(v) => { setModelDetailsPageSize(Number(v)); setModelDetailsPage(1); }}>
                                                            <SelectTrigger className="w-16 h-8 text-xs bg-background border-border">
                                                                <SelectValue placeholder={String(modelDetailsPageSize)} />
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
                                                            onClick={() => setModelDetailsPage((p) => Math.max(p - 1, 1))}
                                                            disabled={modelDetailsPage === 1}
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </Button>
                                                        <span className="text-xs font-semibold px-2">Page {modelDetailsPage} of {totalModelDetailsPages || 1}</span>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => setModelDetailsPage((p) => Math.min(p + 1, totalModelDetailsPages))}
                                                            disabled={modelDetailsPage === totalModelDetailsPages || totalModelDetailsPages === 0}
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                )}
                            </>
                        )}

                        {/* SECTION: STAMPING TRENDS & MACHINE WISE VIEWS */}
                        {area === "STAMPING" && (
                            <>
                                {/* Stamping charts – expand to full width when only one chart has data */}
                                {(data.hourlyChartData && Object.keys(data.hourlyChartData).length > 0) ||
                                    (data.machineTrendData && data.machineTrendData.length > 0) ? (
                                    <div className={`grid gap-6 ${(data.hourlyChartData && Object.keys(data.hourlyChartData).length > 0) &&
                                        (data.machineTrendData && data.machineTrendData.length > 0)
                                        ? "grid-cols-1 lg:grid-cols-2"
                                        : "grid-cols-1"
                                        }`}>
                                        {/* Machine Hourly Trend */}
                                        {data.hourlyChartData && Object.keys(data.hourlyChartData).length > 0 && (
                                            <Card className="border-border/60 shadow-sm bg-card">
                                                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 flex-wrap gap-2">
                                                    <div>
                                                        <CardTitle className="text-md font-bold uppercase tracking-tight">Machine Hourly Trend</CardTitle>
                                                        <CardDescription className="text-xs">Hour-by-hour output vs targets</CardDescription>
                                                    </div>
                                                    <Select value={stampingActiveMachine} onValueChange={setStampingActiveMachine}>
                                                        <SelectTrigger className="w-[130px] h-8 text-[11px] bg-background border-border">
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
                                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#27272a" : "#f4f4f5"} />
                                                                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: isDark ? "#a1a1aa" : "#71717a" }} stroke={isDark ? "#27272a" : "#e4e4e7"} />
                                                                    <YAxis tick={{ fontSize: 10, fill: isDark ? "#a1a1aa" : "#71717a" }} stroke={isDark ? "#27272a" : "#e4e4e7"} />
                                                                    <ChartTooltip content={<ChartTooltipContent />} />
                                                                    <Bar dataKey="actual" name="Actual" fill="#10b981" radius={[3, 3, 0, 0]} />
                                                                    <Line type="monotone" dataKey="target" name="Target" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                                                </ComposedChart>
                                                            </ChartContainer>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                                                            No hourly data available for the selected machine
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Machine-wise production overview */}
                                        {data.machineTrendData && data.machineTrendData.length > 0 && (
                                            <Card className="border-border/60 shadow-sm bg-card">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-md font-bold uppercase tracking-tight">Machine-Wise Production</CardTitle>
                                                    <CardDescription className="text-xs">Comparative machine outputs</CardDescription>
                                                </CardHeader>
                                                <CardContent className="pt-2">
                                                    <div className="h-64 w-full">
                                                        <ChartContainer config={{}} className="h-full w-full">
                                                            <BarChart data={data.machineTrendData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#27272a" : "#f4f4f5"} />
                                                                <XAxis dataKey="machine" tick={{ fontSize: 10, fill: isDark ? "#a1a1aa" : "#71717a" }} stroke={isDark ? "#27272a" : "#e4e4e7"} />
                                                                <YAxis tick={{ fontSize: 10, fill: isDark ? "#a1a1aa" : "#71717a" }} stroke={isDark ? "#27272a" : "#e4e4e7"} />
                                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                                <Bar dataKey="count" name="Output" fill="#8b5cf6" radius={[3, 3, 0, 0]}>
                                                                    <LabelList dataKey="count" position="top" style={{ fontSize: 8, fill: isDark ? "#f4f4f5" : "#18181b" }} />
                                                                </Bar>
                                                            </BarChart>
                                                        </ChartContainer>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                ) : null}


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
                                                        {paginatedModelData.map((row, rIdx) => (
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

                                            {/* Pagination UI */}
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pt-4 border-t text-xs">
                                                <span className="text-xs text-muted-foreground">
                                                    Showing {data.modelData.length > 0 ? (modelDataPage - 1) * modelDataPageSize + 1 : 0} to {Math.min(modelDataPage * modelDataPageSize, data.modelData.length)} of {data.modelData.length} entries
                                                </span>
                                                <div className="flex flex-wrap items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">Rows per page:</span>
                                                        <Select value={String(modelDataPageSize)} onValueChange={(v) => { setModelDataPageSize(Number(v)); setModelDataPage(1); }}>
                                                            <SelectTrigger className="w-16 h-8 text-xs bg-background border-border">
                                                                <SelectValue placeholder={String(modelDataPageSize)} />
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
                                                            onClick={() => setModelDataPage((p) => Math.max(p - 1, 1))}
                                                            disabled={modelDataPage === 1}
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </Button>
                                                        <span className="text-xs font-semibold px-2">Page {modelDataPage} of {totalModelDataPages || 1}</span>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => setModelDataPage((p) => Math.min(p + 1, totalModelDataPages))}
                                                            disabled={modelDataPage === totalModelDataPages || totalModelDataPages === 0}
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
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
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#27272a" : "#f4f4f5"} />
                                                        <XAxis dataKey="machine" tick={{ fontSize: 10, fill: isDark ? "#a1a1aa" : "#71717a" }} stroke={isDark ? "#27272a" : "#e4e4e7"} />
                                                        <YAxis tick={{ fontSize: 10, fill: isDark ? "#a1a1aa" : "#71717a" }} stroke={isDark ? "#27272a" : "#e4e4e7"} />
                                                        <ChartTooltip content={<ChartTooltipContent />} />
                                                        <Bar dataKey="count" name="Output" fill="#06b6d4" radius={[3, 3, 0, 0]}>
                                                            <LabelList dataKey="count" position="top" style={{ fontSize: 8, fill: isDark ? "#f4f4f5" : "#18181b" }} />
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
                                                        {paginatedModelData.map((row, rIdx) => (
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

                                            {/* Pagination UI */}
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pt-4 border-t text-xs">
                                                <span className="text-xs text-muted-foreground">
                                                    Showing {data.modelData.length > 0 ? (modelDataPage - 1) * modelDataPageSize + 1 : 0} to {Math.min(modelDataPage * modelDataPageSize, data.modelData.length)} of {data.modelData.length} entries
                                                </span>
                                                <div className="flex flex-wrap items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">Rows per page:</span>
                                                        <Select value={String(modelDataPageSize)} onValueChange={(v) => { setModelDataPageSize(Number(v)); setModelDataPage(1); }}>
                                                            <SelectTrigger className="w-16 h-8 text-xs bg-background border-border">
                                                                <SelectValue placeholder={String(modelDataPageSize)} />
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
                                                            onClick={() => setModelDataPage((p) => Math.max(p - 1, 1))}
                                                            disabled={modelDataPage === 1}
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </Button>
                                                        <span className="text-xs font-semibold px-2">Page {modelDataPage} of {totalModelDataPages || 1}</span>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => setModelDataPage((p) => Math.min(p + 1, totalModelDataPages))}
                                                            disabled={modelDataPage === totalModelDataPages || totalModelDataPages === 0}
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        )}

                        {/* Downtime logger list table */}
                        {/* {downtimeData.length > 0 && (
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
                                                {paginatedDowntimeData.map((row, rIdx) => (
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

                                    // Pagination UI
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pt-4 border-t text-xs">
                                        <span className="text-xs text-muted-foreground">
                                            Showing {downtimeData.length > 0 ? (downtimePage - 1) * downtimePageSize + 1 : 0} to {Math.min(downtimePage * downtimePageSize, downtimeData.length)} of {downtimeData.length} entries
                                        </span>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">Rows per page:</span>
                                                <Select value={String(downtimePageSize)} onValueChange={(v) => { setDowntimePageSize(Number(v)); setDowntimePage(1); }}>
                                                    <SelectTrigger className="w-16 h-8 text-xs bg-background border-border">
                                                        <SelectValue placeholder={String(downtimePageSize)} />
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
                                                    onClick={() => setDowntimePage((p) => Math.max(p - 1, 1))}
                                                    disabled={downtimePage === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <span className="text-xs font-semibold px-2">Page {downtimePage} of {totalDowntimePages || 1}</span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => setDowntimePage((p) => Math.min(p + 1, totalDowntimePages))}
                                                    disabled={downtimePage === totalDowntimePages || totalDowntimePages === 0}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )} */}
                    </div>
                )
            )}
        </div>
    );
}
