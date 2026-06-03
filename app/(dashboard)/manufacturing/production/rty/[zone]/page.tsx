// app/(dashboard)/manufacturing/production/rty/[zone]/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import axios from "axios";
import ReactECharts from "echarts-for-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ArrowLeft,
    RefreshCw,
    Download,
    AlertCircle,
    PieChart,
    ListFilter,
    ChevronLeft,
    ChevronRight,
    MapPin,
    BarChart3,
} from "lucide-react";

const API_HOST = "http://10.0.7.26:3003";

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

interface DefectEntry {
    name?: string;
    count?: number;
    machineserial?: string;
    area?: string;
    source?: string;
    defect?: string;
    gas_qty?: string | number;
    remarks?: string;
    timestamp?: string;
    [key: string]: any;
}

interface ApiData {
    defectByArea?: Record<string, { name: string; value: number }[]>;
    defectDetails?: Record<string, DefectEntry[]>;
    rtyByArea?: Record<string, number>;
}

const DefectPieChart = ({
    data,
    zone,
    theme,
}: {
    data: { name: string; value: number }[];
    zone: string;
    theme: string;
}) => {
    const isDark = theme === "dark";
    const textColor = isDark ? "#a1a1aa" : "#71717a";
    const tooltipBg = isDark ? "#18181b" : "#ffffff";
    const tooltipBorder = isDark ? "#27272a" : "#e4e4e7";

    const top5 = [...(data || [])]
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .map((item, idx) => ({
            ...item,
            itemStyle: { color: PIE_COLORS[idx % PIE_COLORS.length] },
        }));

    const total = top5.reduce((sum, d) => sum + (d.value || 0), 0);

    const option = {
        backgroundColor: "transparent",
        tooltip: {
            trigger: "item",
            backgroundColor: tooltipBg,
            borderColor: tooltipBorder,
            textStyle: { color: isDark ? "#f4f4f5" : "#18181b" },
            formatter: (params: any) =>
                `<b>${params.name}</b><br/>Count: <b>${params.value}</b> (${params.percent}%)`,
        },
        legend: {
            orient: "horizontal",
            bottom: 0,
            left: "center",
            textStyle: { color: textColor, fontSize: 11 },
            formatter: (name: string) => {
                const item = top5.find((d) => d.name === name);
                return item
                    ? `${name.length > 24 ? name.substring(0, 24) + "…" : name} (${item.value})`
                    : name;
            },
        },
        graphic: [
            {
                type: "text",
                left: "center",
                top: "38%",
                style: {
                    text: `${total}`,
                    fontSize: 28,
                    fontWeight: "bold",
                    fill: isDark ? "#f4f4f5" : "#18181b",
                    textAlign: "center",
                },
            },
            {
                type: "text",
                left: "center",
                top: "50%",
                style: {
                    text: "Total",
                    fontSize: 12,
                    fill: textColor,
                    textAlign: "center",
                },
            },
        ],
        series: [
            {
                name: `${zone.toUpperCase()} Top Defects`,
                type: "pie",
                radius: ["42%", "65%"],
                center: ["50%", "46%"],
                avoidLabelOverlap: true,
                itemStyle: {
                    borderRadius: 6,
                    borderColor: isDark ? "#18181b" : "#ffffff",
                    borderWidth: 2,
                },
                label: { show: false },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 13,
                        fontWeight: "bold",
                        color: isDark ? "#f4f4f5" : "#18181b",
                    },
                    itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: "rgba(0,0,0,0.3)" },
                },
                labelLine: { show: false },
                data: top5,
            },
        ],
    };

    return <ReactECharts option={option} style={{ height: "320px", width: "100%" }} />;
};

const DefectBarChart = ({
    data,
    theme,
}: {
    data: { name: string; value: number }[];
    theme: string;
}) => {
    const isDark = theme === "dark";
    const textColor = isDark ? "#a1a1aa" : "#71717a";
    const tooltipBg = isDark ? "#18181b" : "#ffffff";
    const tooltipBorder = isDark ? "#27272a" : "#e4e4e7";
    const splitLineColor = isDark ? "#27272a" : "#f4f4f5";

    const sorted = [...(data || [])].sort((a, b) => b.value - a.value).slice(0, 10);

    const option = {
        backgroundColor: "transparent",
        tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            backgroundColor: tooltipBg,
            borderColor: tooltipBorder,
            textStyle: { color: isDark ? "#f4f4f5" : "#18181b" },
        },
        grid: {
            left: "2%",
            right: "5%",
            bottom: "5%",
            top: "5%",
            containLabel: true,
        },
        xAxis: {
            type: "value",
            splitLine: { lineStyle: { color: splitLineColor, type: "dashed" } },
            axisLabel: { color: textColor, fontSize: 10 },
        },
        yAxis: {
            type: "category",
            data: sorted.map((d) =>
                d.name.length > 28 ? d.name.substring(0, 28) + "…" : d.name
            ),
            inverse: true,
            axisLabel: { color: textColor, fontSize: 10 },
            axisLine: { lineStyle: { color: isDark ? "#3f3f46" : "#e4e4e7" } },
        },
        series: [
            {
                type: "bar",
                data: sorted.map((d, idx) => ({
                    value: d.value,
                    itemStyle: { color: PIE_COLORS[idx % PIE_COLORS.length], borderRadius: [0, 4, 4, 0] },
                })),
                label: {
                    show: true,
                    position: "right",
                    color: textColor,
                    fontSize: 10,
                    fontWeight: "bold",
                    formatter: (params: any) => params.value,
                },
            },
        ],
    };

    return <ReactECharts option={option} style={{ height: "280px", width: "100%" }} />;
};

export default function ZoneRtyPage() {
    const params = useParams();
    const zone = (params?.zone as string) || "";
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // FILTER STATES
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [selectedLine, setSelectedLine] = useState("ODU-Line");

    // API STATES
    const [apiData, setApiData] = useState<ApiData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // PAGINATION CONFIG
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

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
            const res = await axios.get(`${API_HOST}/api/production/data`, {
                params: {
                    area: "ASSEMBLY LINES",
                    machines: selectedLine,
                    fromDate,
                    toDate,
                },
            });
            setApiData(res.data.data);
            setCurrentPage(1);
        } catch (err) {
            console.error("Zone RTY fetch error:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load zone defect data."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted && fromDate && toDate) {
            fetchData();
        }
    }, [fromDate, toDate, selectedLine, mounted]);

    const pieData = useMemo<{ name: string; value: number }[]>(() => {
        if (!apiData?.defectByArea || !zone) return [];
        const raw = apiData.defectByArea[zone] || apiData.defectByArea[zone.toLowerCase()] || [];
        return raw;
    }, [apiData, zone]);

    const defectRows = useMemo<DefectEntry[]>(() => {
        if (!apiData?.defectDetails || !zone) return [];
        return (
            apiData.defectDetails[zone] ||
            apiData.defectDetails[zone.toLowerCase()] ||
            []
        );
    }, [apiData, zone]);

    const zoneYield = useMemo(() => {
        if (!apiData?.rtyByArea || !zone) return null;
        return apiData.rtyByArea[zone] ?? apiData.rtyByArea[zone.toLowerCase()] ?? null;
    }, [apiData, zone]);

    const totalPages = Math.ceil(defectRows.length / pageSize);
    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return defectRows.slice(start, start + pageSize);
    }, [defectRows, currentPage, pageSize]);

    // CSV EXPORT
    const handleExport = () => {
        if (!defectRows.length) {
            alert("No defect data available to export.");
            return;
        }
        const headers = [
            "Machine Serial",
            "Area",
            "Source",
            "Defect",
            "Gas Qty",
            "Remarks",
            "Timestamp",
        ];
        const csvRows = [headers.join(",")];
        for (const row of defectRows) {
            const values = [
                row.machineserial || "",
                row.area || zone || "",
                row.source || "",
                row.defect || "",
                row.gas_qty ?? "",
                row.remarks || "",
                row.timestamp || "",
            ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
            csvRows.push(values.join(","));
        }
        const blob = new Blob([csvRows.join("\n")], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `${zone}_defects_${fromDate}_${toDate}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const isDark = mounted && resolvedTheme === "dark";
    const theme = mounted ? resolvedTheme || "light" : "light";

    const yieldColor =
        zoneYield !== null
            ? zoneYield >= 95
                ? "text-emerald-500"
                : zoneYield >= 85
                    ? "text-amber-500"
                    : "text-rose-500"
            : "text-muted-foreground";

    return (
        <div className="space-y-6 max-w-8xl mx-auto p-2">
            {/* HEADER SECTION */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => router.push("/manufacturing/production/rty")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-blue-500" />
                            {zone.toUpperCase()} Zone
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide">
                            Defect Composition &amp; Details
                            {zoneYield !== null && (
                                <span className={`ml-2 font-bold ${yieldColor}`}>
                                    FPY: {Number(zoneYield).toFixed(1)}%
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* FILTERS & EXPORT */}
                {mounted && (
                    <div className="flex flex-wrap gap-2.5 items-end bg-card p-3 rounded-xl border border-border/60 shadow-sm">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block ml-0.5">
                                Line
                            </span>
                            <Select
                                value={selectedLine}
                                onValueChange={(v) => {
                                    setSelectedLine(v);
                                    sessionStorage.setItem("manufacturingMachines", v);
                                }}
                            >
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
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block ml-0.5">
                                From
                            </span>
                            <Input
                                type="date"
                                value={fromDate}
                                onChange={(e) => {
                                    setFromDate(e.target.value);
                                    sessionStorage.setItem(
                                        "manufacturingFromDate",
                                        e.target.value
                                    );
                                }}
                                className="w-auto bg-background border-border h-9 text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block ml-0.5">
                                To
                            </span>
                            <Input
                                type="date"
                                value={toDate}
                                onChange={(e) => {
                                    setToDate(e.target.value);
                                    sessionStorage.setItem(
                                        "manufacturingToDate",
                                        e.target.value
                                    );
                                }}
                                className="w-auto bg-background border-border h-9 text-xs"
                            />
                        </div>

                        <Button
                            onClick={fetchData}
                            variant="secondary"
                            size="sm"
                            className="h-9 gap-1 text-xs"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Reload
                        </Button>

                        <Button
                            onClick={handleExport}
                            variant="outline"
                            size="sm"
                            className="h-9 gap-1 text-xs border-blue-500/20 text-blue-500 hover:bg-blue-500/5"
                        >
                            <Download className="w-3.5 h-3.5" /> Export
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

            {/* LOADING SKELETON */}
            {loading && !apiData ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardContent className="pt-6">
                                <Skeleton className="h-72 w-full" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <Skeleton className="h-72 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                    <Card>
                        <CardContent className="pt-6">
                            <Skeleton className="h-64 w-full" />
                        </CardContent>
                    </Card>
                </div>
            ) : apiData ? (
                <div className="space-y-6">
                    {/* CHARTS ROW */}
                    {pieData.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* DONUT PIE */}
                            <Card className="border-border/60 shadow-sm bg-card">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-tight flex items-center gap-1.5">
                                        <PieChart className="w-4 h-4 text-blue-500" />
                                        Top 5 Defect Composition
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        {zone.toUpperCase()} zone – defect distribution by count
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-1">
                                    <DefectPieChart
                                        data={pieData}
                                        zone={zone}
                                        theme={theme}
                                    />
                                </CardContent>
                            </Card>

                            {/* HORIZONTAL BAR */}
                            <Card className="border-border/60 shadow-sm bg-card">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-tight flex items-center gap-1.5">
                                        <BarChart3 className="w-4 h-4 text-blue-500" />
                                        Top 10 Defect Frequency
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Ranked defects by occurrence count
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-1">
                                    <DefectBarChart data={pieData} theme={theme} />
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <Card className="border-border/60 bg-card">
                            <CardContent className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
                                <PieChart className="h-8 w-8 opacity-30" />
                                <p className="text-sm font-medium">
                                    No defect composition data available for{" "}
                                    <span className="font-bold text-foreground">
                                        {zone.toUpperCase()}
                                    </span>{" "}
                                    in the selected period.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* DEFECT DETAILS TABLE */}
                    <Card className="border-border/60 shadow-sm bg-card">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                    <CardTitle className="text-sm font-bold uppercase tracking-tight flex items-center gap-1.5">
                                        <ListFilter className="w-4 h-4 text-blue-500" />
                                        Defect Details
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-0.5">
                                        All defect entries recorded for {zone.toUpperCase()} zone
                                    </CardDescription>
                                </div>
                                <span className="text-xs text-muted-foreground font-medium bg-muted px-2.5 py-1 rounded-md">
                                    {defectRows.length} records
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                            {defectRows.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/40">
                                                    <TableHead className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
                                                        #
                                                    </TableHead>
                                                    <TableHead className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
                                                        Machine Serial
                                                    </TableHead>
                                                    <TableHead className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
                                                        Area
                                                    </TableHead>
                                                    <TableHead className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
                                                        Source
                                                    </TableHead>
                                                    <TableHead className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
                                                        Defect
                                                    </TableHead>
                                                    <TableHead className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap text-right">
                                                        Gas Qty
                                                    </TableHead>
                                                    <TableHead className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
                                                        Remarks
                                                    </TableHead>
                                                    <TableHead className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
                                                        Timestamp
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {paginatedRows.map((row, idx) => {
                                                    const rowNum =
                                                        (currentPage - 1) * pageSize + idx + 1;
                                                    return (
                                                        <TableRow
                                                            key={idx}
                                                            className="hover:bg-muted/30 transition-colors"
                                                        >
                                                            <TableCell className="text-xs py-2 text-muted-foreground">
                                                                {rowNum}
                                                            </TableCell>
                                                            <TableCell className="text-xs py-2 font-mono">
                                                                {row.machineserial || "—"}
                                                            </TableCell>
                                                            <TableCell className="text-xs py-2">
                                                                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[10px] font-bold uppercase">
                                                                    {row.area || zone}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-xs py-2">
                                                                {row.source || "—"}
                                                            </TableCell>
                                                            <TableCell className="text-xs py-2 max-w-[200px]">
                                                                <span
                                                                    className="block truncate"
                                                                    title={row.defect}
                                                                >
                                                                    {row.defect || "—"}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-xs py-2 text-right">
                                                                {row.gas_qty ?? "—"}
                                                            </TableCell>
                                                            <TableCell className="text-xs py-2 max-w-[160px]">
                                                                <span
                                                                    className="block truncate text-muted-foreground"
                                                                    title={row.remarks}
                                                                >
                                                                    {row.remarks || "—"}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-xs py-2 whitespace-nowrap text-muted-foreground">
                                                                {row.timestamp || "—"}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* PAGINATION UI */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pt-4 border-t text-xs">
                                        <span className="text-xs text-muted-foreground">
                                            Showing{" "}
                                            {defectRows.length > 0
                                                ? (currentPage - 1) * pageSize + 1
                                                : 0}{" "}
                                            –{" "}
                                            {Math.min(
                                                currentPage * pageSize,
                                                defectRows.length
                                            )}{" "}
                                            of {defectRows.length} entries
                                        </span>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    Rows per page:
                                                </span>
                                                <Select
                                                    value={String(pageSize)}
                                                    onValueChange={(v) => {
                                                        setPageSize(Number(v));
                                                        setCurrentPage(1);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-16 h-8 text-xs bg-background border-border">
                                                        <SelectValue
                                                            placeholder={String(pageSize)}
                                                        />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[10, 20, 50, 100].map((size) => (
                                                            <SelectItem
                                                                key={size}
                                                                value={String(size)}
                                                            >
                                                                {size}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() =>
                                                        setCurrentPage((p) => Math.max(p - 1, 1))
                                                    }
                                                    disabled={currentPage === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <span className="text-xs font-semibold px-2">
                                                    Page {currentPage} of {totalPages || 1}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() =>
                                                        setCurrentPage((p) =>
                                                            Math.min(p + 1, totalPages)
                                                        )
                                                    }
                                                    disabled={
                                                        currentPage === totalPages ||
                                                        totalPages === 0
                                                    }
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
                                    <ListFilter className="h-8 w-8 opacity-30" />
                                    <p className="text-sm font-medium">
                                        No defect detail records found for{" "}
                                        <span className="font-bold text-foreground">
                                            {zone.toUpperCase()}
                                        </span>
                                        .
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                // NO DATA STATE
                <Card className="border-border/60 bg-card">
                    <CardContent className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
                        <AlertCircle className="h-10 w-10 opacity-20" />
                        <p className="text-sm font-medium">
                            No data loaded. Adjust the filters and click Reload.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
