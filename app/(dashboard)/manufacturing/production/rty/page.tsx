// app/(dashboard)/manufacturing/production/rty/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import axios from "axios";
import {
    ResponsiveContainer,
    ComposedChart,
    BarChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
    Cell,
    PieChart,
    Pie,
    LabelList
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    RefreshCw,
    Download,
    CheckCircle2,
    Edit,
    AlertCircle,
    TrendingUp,
    Star,
    Layers,
    ChevronRight,
    MapPin
} from "lucide-react";
import Link from "next/link";
import { DatePicker } from "@/components/manufacturing/DatePicker";

// const API_HOST = "http://10.0.7.26:3003";
const API_HOST = process.env.NEXT_PUBLIC_API_BASE_URL;

interface ProductionStatus {
    label: string;
    value: number;
    target: number;
    type: "text" | "rate";
}

interface ApiResponse {
    dailyRTYChartData?: {
        labels: string[];
        actuals: number[];
        targets: number[];
    };
    dailyRTYStackedChartData?: {
        dates: string[];
        series: any[];
    };
    rtyStatus?: ProductionStatus[];
    rty?: number;
    rtyByArea?: Record<string, number>;
    defectDetails?: Record<string, any[]>;
}

const PIE_COLORS = [
    "#3b82f6",
    "#ef4444",
    "#f59e0b",
    "#22c55e",
    "#a855f7",
    "#06b6d4",
    "#f97316",
    "#ec4899",
    "#14b8a6",
    "#6366f1",
];

// Speedometer Gauge Component using Recharts Pie
const SpeedometerChart = ({ value, theme }: { value: number; theme: string }) => {
    const isDark = theme === "dark";
    const color = value >= 85 ? "#22c55e" : value >= 70 ? "#eab308" : "#ef4444";
    const trackColor = isDark ? "#27272a" : "#e2e8f0";
    const textColor = isDark ? "#f4f4f5" : "#1a202c";

    const chartData = [
        { value: value, fill: color },
        { value: 100 - value, fill: trackColor }
    ];

    return (
        <div className="relative w-full h-[200px] flex items-center justify-center overflow-hidden">
            <div className="absolute text-center mt-12">
                <span className="text-3xl font-black block" style={{ color: textColor }}>
                    {value}%
                </span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
                <PieChart margin={{ top: 0, bottom: 0 }}>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="65%"
                        startAngle={210}
                        endAngle={-30}
                        innerRadius={60}
                        outerRadius={85}
                        dataKey="value"
                        stroke="none"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

// DAILY RTY TREND CHART
const RtyTrendChart = ({ data, theme }: { data: any; theme: string }) => {
    const isDark = theme === "dark";
    const textColor = isDark ? '#a1a1aa' : '#71717a';
    const splitLineColor = isDark ? '#27272a' : '#f4f4f5';
    const tooltipBg = isDark ? '#18181b' : '#ffffff';
    const tooltipBorder = isDark ? '#27272a' : '#e4e4e7';

    const labels = data?.labels || [];
    const actuals = data?.actuals || [];
    const targets = data?.targets || [];

    const chartData = React.useMemo(() => {
        if (!data || !labels) return [];
        return labels.map((label: string, idx: number) => ({
            name: label,
            actual: actuals[idx] || 0,
            target: targets[idx] || 95,
        }));
    }, [data, labels, actuals, targets]);

    return (
        <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={splitLineColor} vertical={false} />
                <XAxis
                    dataKey="name"
                    tick={{ fill: textColor, fontSize: 10 }}
                    tickLine={{ stroke: isDark ? "#3f3f46" : "#e4e4e7" }}
                    axisLine={{ stroke: isDark ? "#3f3f46" : "#e4e4e7" }}
                />
                <YAxis
                    domain={[50, 100]}
                    tick={{ fill: textColor, fontSize: 10 }}
                    tickLine={{ stroke: isDark ? "#3f3f46" : "#e4e4e7" }}
                    axisLine={{ stroke: isDark ? "#3f3f46" : "#e4e4e7" }}
                    tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        color: isDark ? "#f4f4f5" : "#18181b",
                        borderRadius: "8px",
                        fontSize: "12px",
                    }}
                />
                <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => <span className="text-xs font-semibold text-muted-foreground">{value}</span>}
                />
                <Bar dataKey="actual" name="RTY %" maxBarSize={30} radius={[4, 4, 0, 0]}>
                    {chartData.map((entry: any, index: number) => {
                        const val = entry.actual;
                        const targetVal = entry.target;
                        let color = "#ef4444";
                        if (val === 0) color = isDark ? "#3f3f46" : "#d1d5db";
                        else if (val >= targetVal) color = "#22c55e";
                        else if (val >= targetVal - 5) color = "#f59e0b";
                        return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                    <LabelList
                        dataKey="actual"
                        position="top"
                        formatter={(value: any) => value > 0 ? `${value}%` : ""}
                        style={{ fill: isDark ? "#f4f4f5" : "#18181b", fontSize: 10, fontWeight: "bold" }}
                    />
                </Bar>
                <Line
                    type="monotone"
                    dataKey="target"
                    name="Target"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ r: 3, fill: "#3b82f6" }}
                    activeDot={{ r: 5 }}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
};

// ZONE-WISE FPY STATUS STACKED CHART
const ZoneFpyChart = ({ series, xAxisLabels, theme }: { series: any[]; xAxisLabels: string[]; theme: string }) => {
    const isDark = theme === "dark";
    const textColor = isDark ? '#a1a1aa' : '#71717a';
    const splitLineColor = isDark ? '#27272a' : '#f4f4f5';
    const tooltipBg = isDark ? '#18181b' : '#ffffff';
    const tooltipBorder = isDark ? '#27272a' : '#e4e4e7';

    const chartData = React.useMemo(() => {
        if (!xAxisLabels) return [];
        return xAxisLabels.map((label: string, idx: number) => {
            const row: any = { name: label };
            series?.forEach((s: any) => {
                const val = s.data[idx];
                row[s.name] = (val && typeof val === 'object') ? val.value : val;
            });
            return row;
        });
    }, [series, xAxisLabels]);

    if (!series || series.length === 0) return <div className="text-center text-muted-foreground py-8">No data available</div>;

    return (
        <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={splitLineColor} vertical={false} />
                <XAxis
                    dataKey="name"
                    tick={{ fill: textColor, fontSize: 10 }}
                    tickLine={{ stroke: isDark ? "#3f3f46" : "#e4e4e7" }}
                    axisLine={{ stroke: isDark ? "#3f3f46" : "#e4e4e7" }}
                />
                <YAxis
                    tick={{ fill: textColor, fontSize: 10 }}
                    tickLine={{ stroke: isDark ? "#3f3f46" : "#e4e4e7" }}
                    axisLine={{ stroke: isDark ? "#3f3f46" : "#e4e4e7" }}
                    tickFormatter={(val) => `${val}%`}
                    label={{
                        value: "FPY %",
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle", fill: textColor }
                    }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        color: isDark ? "#f4f4f5" : "#18181b",
                        borderRadius: "8px",
                        fontSize: "12px",
                    }}
                />
                <Legend
                    type="scroll"
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => <span className="text-xs font-semibold text-muted-foreground">{value}</span>}
                />
                {series.map((serie: any, idx: number) => {
                    const isLine = serie.type === "line";
                    const color = PIE_COLORS[idx % PIE_COLORS.length];
                    if (isLine) {
                        return (
                            <Line
                                key={serie.name}
                                type="monotone"
                                dataKey={serie.name}
                                stroke={color || "#3b82f6"}
                                strokeWidth={3}
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                            />
                        );
                    } else {
                        return (
                            <Bar
                                key={serie.name}
                                dataKey={serie.name}
                                stackId="fpy"
                                fill={color}
                            />
                        );
                    }
                })}
            </ComposedChart>
        </ResponsiveContainer>
    );
};

export default function RtyDashboardPage() {
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // FILTER STATES
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [selectedLine, setSelectedLine] = useState("ODU-Line");

    // API STATES
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        const todayStr = new Date().toISOString().split("T")[0];

        const savedFrom = sessionStorage.getItem("manufacturingFromDate");
        const savedTo = sessionStorage.getItem("manufacturingToDate");
        const savedMachine = sessionStorage.getItem("manufacturingMachines") || "ODU-Line";

        setFromDate(savedFrom || todayStr);
        setToDate(savedTo || todayStr);
        setSelectedLine(savedMachine.split(",")[0]);
    }, []);

    const fetchData = async () => {
        if (!fromDate || !toDate) return;
        setLoading(true);
        setError(null);

        try {
            const res = await axios.get(`${API_HOST}/production/data`, {
                params: {
                    area: "ASSEMBLY LINES",
                    machines: selectedLine,
                    fromDate,
                    toDate,
                }
            });
            setData(res.data.data);
        } catch (err) {
            console.error("RTY fetch error:", err);
            setError(err instanceof Error ? err.message : "Failed to load RTY yield data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted && fromDate && toDate) {
            fetchData();
        }
    }, [fromDate, toDate, selectedLine, mounted]);

    const handleLineChange = (val: string) => {
        setSelectedLine(val);
        sessionStorage.setItem("manufacturingMachines", val);
    };

    const handleExport = () => {
        if (!data?.defectDetails) {
            alert("No defect data available to export.");
            return;
        }

        const flatData = Object.keys(data.defectDetails).flatMap((zoneName) => {
            const list = data.defectDetails![zoneName];
            if (!Array.isArray(list)) return [];
            return list.map((item: any) => ({
                Area: item.area || zoneName || "",
                "Machine Serial": item.machineserial || "",
                Source: item.source || "",
                Defect: item.defect || "",
                "Gas Qty": item.gas_qty || "",
                Remarks: item.remarks || "",
                Timestamp: item.timestamp || "",
            }));
        });

        if (flatData.length === 0) {
            alert("No defect entries found for the selected period.");
            return;
        }

        const headers = ["Area", "Machine Serial", "Source", "Defect", "Gas Qty", "Remarks", "Timestamp"];
        const csvRows = [];
        csvRows.push(headers.join(","));

        for (const row of flatData) {
            const values = headers.map(header => {
                const val = row[header as keyof typeof row] || "";
                const escaped = String(val).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(","));
        }

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `DefectDetails_${fromDate}_${toDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const renderKpiCard = (item: ProductionStatus, icon: React.ReactNode, href?: string) => {
        const isRate = item.type === "rate";
        const value = isRate ? `${item.value}%` : Number(item.value).toLocaleString();
        const isClickable = !!href;

        const card = (
            <Card
                key={item.label}
                className={`bg-card border-border/60 shadow-sm transition-all ${isClickable
                    ? "cursor-pointer hover:shadow-md hover:border-blue-500/50 hover:-translate-y-0.5 group"
                    : ""
                    }`}
            >
                <CardHeader className="pb-1 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {item.label}
                    </CardTitle>
                    {isClickable ? (
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                    ) : (
                        icon
                    )}
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <div className="text-xl font-bold text-foreground">
                        {value}
                    </div>
                </CardContent>
            </Card>
        );

        if (isClickable) {
            return (
                <Link href={href} key={item.label}>
                    {card}
                </Link>
            );
        }
        return card;
    };

    const isDark = mounted && resolvedTheme === "dark";

    return (
        <div className="space-y-6 max-w-8xl mx-auto p-2">
            {/* HEADER SECTION */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.push("/manufacturing/production")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
                            Rolled Throughput Yield (RTY)
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide">
                            {selectedLine === "ODU-Line" ? "ODU Assembly Line" : "IDU Assembly Line"}
                        </p>
                    </div>
                </div>

                {/* FILTERS & EXPORT */}
                {mounted && (
                    <div className="flex flex-wrap gap-2.5 items-end bg-card p-3 rounded-xl border border-border/60 shadow-sm">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block ml-0.5">Line</span>
                            <Select value={selectedLine} onValueChange={handleLineChange}>
                                <SelectTrigger className="w-[130px] bg-background border-border h-9 text-xs">
                                    <SelectValue placeholder="Select Line" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ODU-Line">ODU LINE</SelectItem>
                                    <SelectItem value="IDU-Line">IDU LINE</SelectItem>
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

                        <Button onClick={handleExport} variant="outline" size="sm" className="h-9 gap-1 text-xs border-blue-500/20 text-blue-500 hover:bg-blue-500/5">
                            <Download className="w-3.5 h-3.5" /> Export Defects
                        </Button>
                    </div>
                )}
            </div>

            {/* ERROR ALERT */}
            {error && (
                <Card className="border-destructive/20 bg-destructive/5">
                    <CardContent className="flex items-center gap-2 text-destructive pt-6">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                    </CardContent>
                </Card>
            )}

            {/* MAIN CONTAINER */}
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
                        {/* KPI CARDS GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* RTY GAUGE CARD */}
                            <Card className="border-border/60 shadow-sm bg-card lg:col-span-4 flex flex-col justify-center">
                                <CardHeader className="pb-0 pt-4 text-center">
                                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Rolled Throughput Yield
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 flex items-center justify-center h-full">
                                    <SpeedometerChart value={Math.round(data.rty || 0)} theme={resolvedTheme || "light"} />
                                </CardContent>
                            </Card>

                            {/* KPI METRICS */}
                            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {data.rtyStatus?.map((item) => {
                                    const icons: Record<string, React.ReactNode> = {
                                        "OK": <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
                                        "REWORK": <Edit className="h-4 w-4 text-amber-500" />,
                                        "REJECT": <AlertCircle className="h-4 w-4 text-rose-500" />,
                                        "TOTAL DEFECT": <AlertCircle className="h-4 w-4 text-rose-400" />,
                                        "YIELD %": <TrendingUp className="h-4 w-4 text-blue-500" />,
                                    };
                                    const labelUpper = item.label.toUpperCase();

                                    const isZoneCard = labelUpper.endsWith(" ZONE");
                                    const zoneKey = isZoneCard
                                        ? item.label.toLowerCase().replace(/\s+zone$/i, "").trim()
                                        : null;
                                    const zoneHref =
                                        zoneKey && data.rtyByArea && zoneKey in data.rtyByArea
                                            ? `/manufacturing/production/rty/${zoneKey}`
                                            : undefined;
                                    return renderKpiCard(
                                        item,
                                        icons[labelUpper] || <Star className="h-4 w-4 text-blue-500" />,
                                        zoneHref
                                    );
                                })}
                            </div>
                        </div>

                        {/* ZONE-WISE INDIVIDUAL SUMMARIES */}
                        {data.rtyByArea && Object.keys(data.rtyByArea).length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5 pl-0.5">
                                    <MapPin className="w-4 h-4 text-blue-500" />
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Zone-wise Yield Details</h3>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {Object.entries(data.rtyByArea).map(([zoneKey, yieldVal]) => {
                                        const routeUrl = `/manufacturing/production/rty/${zoneKey.toLowerCase()}`;
                                        const yieldColor = yieldVal >= 95 ? "text-emerald-500 bg-emerald-500/5 border-emerald-500/20" : (yieldVal >= 85 ? "text-amber-500 bg-amber-500/5 border-amber-500/20" : "text-rose-500 bg-rose-500/5 border-rose-500/20");
                                        return (
                                            <Link href={routeUrl} key={zoneKey}>
                                                <Card className="hover:shadow-md transition-all cursor-pointer border-border hover:border-blue-500/50 group bg-card">
                                                    <CardContent className="p-4 flex flex-row items-center justify-between">
                                                        <div className="space-y-0.5">
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{zoneKey}</span>
                                                            <span className={`text-xl font-bold ${yieldColor} px-1.5 py-0.5 rounded-md inline-block`}>
                                                                {Number(yieldVal).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* CHARTS SECTIONS */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* DAILY RTY TREND CHART */}
                            {data.dailyRTYChartData && (
                                <Card className="border-border/60 shadow-sm bg-card">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-bold uppercase tracking-tight flex items-center gap-1.5">
                                            <TrendingUp className="w-4 h-4 text-blue-500" />
                                            Daily RTY Trend
                                        </CardTitle>
                                        <CardDescription className="text-xs">Yield values and targets over dates</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-2">
                                        <RtyTrendChart data={data.dailyRTYChartData} theme={resolvedTheme || "light"} />
                                    </CardContent>
                                </Card>
                            )}

                            {/* ZONE-WISE FPY STATUS STACKED CHART */}
                            {data.dailyRTYStackedChartData && (
                                <Card className="border-border/60 shadow-sm bg-card">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-bold uppercase tracking-tight flex items-center gap-1.5">
                                            <Layers className="w-4 h-4 text-blue-500" />
                                            Zone-wise FPY Status
                                        </CardTitle>
                                        <CardDescription className="text-xs">Breakdown of yield values per zone across days</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-2">
                                        <ZoneFpyChart
                                            series={data.dailyRTYStackedChartData.series}
                                            xAxisLabels={data.dailyRTYStackedChartData.dates}
                                            theme={resolvedTheme || "light"}
                                        />
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
