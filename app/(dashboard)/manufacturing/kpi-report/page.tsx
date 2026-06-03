// app/(dashboard)/manufacturing/kpi-report/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import ReactECharts from "echarts-for-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    RefreshCw,
    Coins,
    Users,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

const API_HOST = "http://10.0.7.26:3003";

export default function KPIReportPage() {
    const [mounted, setMounted] = useState(false);

    // FILTER CONTROLS
    const [line, setLine] = useState("IDU-Line");
    const [fyYear, setFyYear] = useState("2027");

    // LOADING & STATE MANAGEMENT
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(false);

    // DIALOG INPUTS
    const [showCostInput, setShowCostInput] = useState(false);
    const [costModalOpen, setCostModalOpen] = useState(false);
    const [costLine, setCostLine] = useState("IDU-Line");
    const [costYear, setCostYear] = useState("");
    const [costMonth, setCostMonth] = useState("Apr");
    const [costValue, setCostValue] = useState("");
    const [costUnitTarget, setCostUnitTarget] = useState("");
    const [costType, setCostType] = useState("CONSUMABLE");
    const [costSubmitting, setCostSubmitting] = useState(false);
    const [costFeedback, setCostFeedback] = useState({ type: "", message: "" });

    const [showManpowerInput, setShowManpowerInput] = useState(false);
    const [mpModalOpen, setMpModalOpen] = useState(false);
    const [mpLine, setMpLine] = useState("IDU-Line");
    const [mpYear, setMpYear] = useState("");
    const [mpMonth, setMpMonth] = useState("Apr");
    const [mpAbsenteeism, setMpAbsenteeism] = useState("");
    const [mpSubmitting, setMpSubmitting] = useState(false);
    const [mpFeedback, setMpFeedback] = useState({ type: "", message: "" });

    // KPI DATA STRUCTURES
    const [yearlyProd, setYearlyProd] = useState<any>({ plan: [], actual: [], achievement: [], labels: [] });
    const [monthlyProd, setMonthlyProd] = useState<any>({ plan: [], actual: [], achievement: [], labels: [] });
    const [costData, setCostData] = useState<any>({ consumable: [], power: [], manpower: [], scrap: [], target: [], unitCost: [], labels: [] });
    const [oeeData, setOeeData] = useState<any>({ target: [], oee: [], labels: [] });
    const [uphData, setUphData] = useState<any>({ uphTarget: [], uph: [], upphTarget: [], upph: [], labels: [] });
    const [manpowerData, setManpowerData] = useState<any>({ rates: [], labels: [] });
    const [rtyData, setRtyData] = useState<any>({ rates: [], labels: [] });

    const { resolvedTheme } = useTheme();
    const isDark = mounted && resolvedTheme === "dark";

    const textColor = isDark ? '#a1a1aa' : '#71717a';
    const lineColor = isDark ? '#27272a' : '#e4e4e7';
    const splitLineColor = isDark ? '#27272a' : '#f4f4f5';
    const tooltipBg = isDark ? '#18181b' : '#ffffff';
    const tooltipBorder = isDark ? '#27272a' : '#e4e4e7';
    const titleColor = isDark ? '#f4f4f5' : '#18181b';

    useEffect(() => {
        setMounted(true);
        const savedLine = sessionStorage.getItem("ACKPI_REPORT_LINE") || "IDU-Line";
        const savedYear = sessionStorage.getItem("ACKPI_REPORT_FY_YEAR") || "2027";
        setLine(savedLine);
        setFyYear(savedYear);

        try {
            const login = JSON.parse(sessionStorage.getItem("logindata") || "{}");
            const hasInputRights = login?.id === "10010082" || login?.id === "10008141" || login?.plant_head === 1;
            setShowCostInput(hasInputRights);
            setShowManpowerInput(hasInputRights);
        } catch (e) {
            setShowCostInput(true);
            setShowManpowerInput(true);
        }
    }, []);

    // FETCH KPI METRICS DATA
    const fetchKPIData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_HOST}/api/production/kpi-data`, {
                params: { area: line, year: fyYear }
            });
            const data = res.data.data || res.data;

            setYearlyProd({
                plan: data.yearlyData?.map((item: any) => item?.plan) || [],
                actual: data.yearlyData?.map((item: any) => item?.production) || [],
                achievement: data.yearlyData?.map((item: any) => item?.achievement) || [],
                labels: data.yearlyData?.map((item: any) => item?.financial_year) || [],
            });

            setMonthlyProd({
                plan: data.monthlyData?.map((item: any) => item?.plan) || [],
                actual: data.monthlyData?.map((item: any) => item?.production) || [],
                achievement: data.monthlyData?.map((item: any) => item?.achievement) || [],
                labels: data.monthlyData?.map((item: any) => item?.month) || [],
            });

            setCostData({
                consumable: data.costDetails?.consumableData || [],
                power: data.costDetails?.powerData || [],
                manpower: data.costDetails?.manpowerData || [],
                scrap: data.costDetails?.scrapData || [],
                target: data.costDetails?.targetData || [],
                unitCost: data.costDetails?.unitCostData || [],
                labels: data.costDetails?.labelsData || [],
            });

            setOeeData({
                target: data.oeeDetails?.targetData || [],
                oee: data.oeeDetails?.oeeData || [],
                labels: data.oeeDetails?.labelsData || [],
            });

            setUphData({
                uphTarget: data.uphDetails?.uphTargetData || [],
                uph: data.uphDetails?.uphData || [],
                upphTarget: data.uphDetails?.upphTargetData || [],
                upph: data.uphDetails?.upphData || [],
                labels: data.uphDetails?.labelsData || [],
            });

            setManpowerData({
                rates: data.manpowerData?.manpowerData || [],
                labels: data.manpowerData?.labelsData || [],
            });

            setRtyData({
                rates: data.rtyDetails?.rtyData || [],
                labels: data.rtyDetails?.labelsData || [],
            });
        } catch (err) {
            console.error("KPI fetch error:", err);
            setError("Failed to load shopfloor KPI reports from API.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) {
            fetchKPIData();
        }
    }, [line, fyYear, refreshTrigger, mounted]);

    const getUpperLimit = (values: number[]) => {
        if (!values || values.length === 0) return 100;
        const max = Math.max(...values);
        if (max <= 0) return 100;
        const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
        const coefficient = max / magnitude;
        const niceCoefficient = coefficient <= 1 ? 1 : coefficient <= 2 ? 2 : coefficient <= 5 ? 5 : 10;
        return niceCoefficient * magnitude;
    };

    const getProductionChartOptions = (pData: any, isMonthly = false) => {
        const maxVal = getUpperLimit([...pData.plan, ...pData.actual]);
        return {
            backgroundColor: "transparent",
            tooltip: {
                trigger: "axis",
                axisPointer: { type: "shadow" },
            },
            legend: {
                data: ["Plan", "Actual", "Achievement"],
                bottom: 0,
                textStyle: { color: textColor }
            },
            grid: { top: 30, left: 50, right: 50, bottom: 45 },
            xAxis: {
                type: "category",
                data: pData.labels,
                axisLine: { lineStyle: { color: lineColor } },
                axisLabel: { color: textColor }
            },
            yAxis: [
                {
                    type: "value",
                    name: "Count",
                    min: 0,
                    max: maxVal,
                    splitLine: { lineStyle: { color: splitLineColor } },
                    axisLabel: { color: textColor }
                },
                {
                    type: "value",
                    name: "Achievement",
                    min: 0,
                    max: 100,
                    axisLabel: { formatter: "{value}%", color: textColor },
                    splitLine: { show: false }
                }
            ],
            series: [
                {
                    name: "Plan",
                    type: "bar",
                    data: pData.plan,
                    itemStyle: { color: "#3b82f6", borderRadius: [3, 3, 0, 0] },
                },
                {
                    name: "Actual",
                    type: "bar",
                    data: pData.actual,
                    itemStyle: { color: "#f87171", borderRadius: [3, 3, 0, 0] },
                },
                {
                    name: "Achievement",
                    type: "line",
                    smooth: true,
                    yAxisIndex: 1,
                    data: pData.achievement,
                    itemStyle: { color: "#10b981" },
                    lineStyle: { width: 3 }
                }
            ]
        };
    };

    const getUphChartOptions = () => {
        return {
            backgroundColor: "transparent",
            tooltip: { trigger: "axis", backgroundColor: tooltipBg, borderColor: tooltipBorder, textStyle: { color: titleColor } },
            legend: {
                data: ["UPH Plan", "UPH Actual", "UPPH Plan", "UPPH Actual"],
                bottom: 0,
                textStyle: { color: textColor }
            },
            grid: { top: 30, left: 50, right: 50, bottom: 45 },
            xAxis: {
                type: "category",
                data: uphData.labels,
                axisLine: { lineStyle: { color: lineColor } },
                axisLabel: { color: textColor }
            },
            yAxis: [
                {
                    type: "value",
                    name: "UPH",
                    min: 0,
                    max: 250,
                    splitLine: { lineStyle: { color: splitLineColor } },
                    axisLabel: { color: textColor }
                },
                {
                    type: "value",
                    name: "UPPH",
                    min: 0,
                    max: getUpperLimit([...uphData.upphTarget, ...uphData.upph]),
                    axisLabel: { color: textColor },
                    splitLine: { show: false }
                }
            ],
            series: [
                { name: "UPH Plan", type: "bar", data: uphData.uphTarget, itemStyle: { color: "#3b82f6", borderRadius: [3, 3, 0, 0] } },
                { name: "UPH Actual", type: "bar", data: uphData.uph, itemStyle: { color: "#f87171", borderRadius: [3, 3, 0, 0] } },
                { name: "UPPH Plan", type: "line", smooth: true, yAxisIndex: 1, data: uphData.upphTarget, itemStyle: { color: "#10b981" } },
                { name: "UPPH Actual", type: "line", smooth: true, yAxisIndex: 1, data: uphData.upph, itemStyle: { color: "#8b5cf6" } }
            ]
        };
    };

    const getRatesChartOptions = (rData: any, title: string, color = "#3b82f6", isLine = false) => {
        return {
            backgroundColor: "transparent",
            tooltip: { trigger: "axis", backgroundColor: tooltipBg, borderColor: tooltipBorder, textStyle: { color: titleColor } },
            legend: { data: [title], bottom: 0, textStyle: { color: textColor } },
            grid: { top: 30, left: 50, right: 30, bottom: 45 },
            xAxis: {
                type: "category",
                data: rData.labels,
                axisLine: { lineStyle: { color: lineColor } },
                axisLabel: { color: textColor }
            },
            yAxis: {
                type: "value",
                min: 0,
                max: 100,
                axisLabel: { formatter: "{value}%", color: textColor },
                splitLine: { lineStyle: { color: splitLineColor } }
            },
            series: [{
                name: title,
                type: isLine ? "line" : "bar",
                smooth: isLine,
                data: rData.rates,
                itemStyle: { color: color, borderRadius: isLine ? [0] : [3, 3, 0, 0] },
                lineStyle: { width: 3 }
            }]
        };
    };

    const getOeeChartOptions = () => {
        return {
            backgroundColor: "transparent",
            tooltip: { trigger: "axis", backgroundColor: tooltipBg, borderColor: tooltipBorder, textStyle: { color: titleColor } },
            legend: { data: ["OEE Plan", "OEE Actual"], bottom: 0, textStyle: { color: textColor } },
            grid: { top: 30, left: 50, right: 30, bottom: 45 },
            xAxis: {
                type: "category",
                data: oeeData.labels,
                axisLine: { lineStyle: { color: lineColor } },
                axisLabel: { color: textColor }
            },
            yAxis: {
                type: "value",
                min: 0,
                max: 100,
                axisLabel: { formatter: "{value}%", color: textColor },
                splitLine: { lineStyle: { color: splitLineColor } }
            },
            series: [
                { name: "OEE Plan", type: "line", smooth: true, data: oeeData.target, itemStyle: { color: "#3b82f6" }, lineStyle: { width: 3 } },
                { name: "OEE Actual", type: "line", smooth: true, data: oeeData.oee, itemStyle: { color: "#ec4899" }, lineStyle: { width: 3 } }
            ]
        };
    };

    const getCostChartOptions = () => {
        const consumableData = costData.consumable || [];
        const powerData = costData.power || [];
        const manpowerData = costData.manpower || [];
        const scrapData = costData.scrap || [];
        const targetData = costData.target || [];
        const unitCostData = costData.unitCost || [];
        const labels = costData.labels || [];

        const totalCostsPerMonth = labels.map((_: any, index: number) => {
            return (
                (consumableData[index] || 0) +
                (powerData[index] || 0) +
                (manpowerData[index] || 0) +
                (scrapData[index] || 0)
            );
        });

        const max1 = getUpperLimit(totalCostsPerMonth);
        const max2 = getUpperLimit([...targetData, ...unitCostData]);
        return {
            backgroundColor: "transparent",
            tooltip: { trigger: "axis", backgroundColor: tooltipBg, borderColor: tooltipBorder, textStyle: { color: titleColor } },
            legend: {
                data: [
                    "Consumable Cost",
                    "Power Cost",
                    "Manpower Cost",
                    "Scrap Cost",
                    "Target Cost/Unit",
                    "Actual Cost/Unit"
                ],
                bottom: 0,
                textStyle: { color: textColor }
            },
            grid: { top: 30, left: 55, right: 55, bottom: 80 },
            xAxis: {
                type: "category",
                data: labels,
                axisLine: { lineStyle: { color: lineColor } },
                axisLabel: { color: textColor }
            },
            yAxis: [
                {
                    type: "value",
                    name: "Total Cost",
                    min: 0,
                    max: max1,
                    axisLabel: { formatter: "₹{value}", color: textColor },
                    splitLine: { lineStyle: { color: splitLineColor } }
                },
                {
                    type: "value",
                    name: "Unit Cost",
                    min: 0,
                    max: max2,
                    axisLabel: { formatter: "₹{value}", color: textColor },
                    splitLine: { show: false }
                }
            ],
            series: [
                {
                    name: "Consumable Cost",
                    type: "bar",
                    stack: "Cost",
                    data: consumableData,
                    itemStyle: { color: "#3b82f6" },
                },
                {
                    name: "Power Cost",
                    type: "bar",
                    stack: "Cost",
                    data: powerData,
                    itemStyle: { color: "#eab308" },
                },
                {
                    name: "Manpower Cost",
                    type: "bar",
                    stack: "Cost",
                    data: manpowerData,
                    itemStyle: { color: "#8b5cf6" },
                },
                {
                    name: "Scrap Cost",
                    type: "bar",
                    stack: "Cost",
                    data: scrapData,
                    itemStyle: { color: "#f97316", borderRadius: [3, 3, 0, 0] },
                },
                {
                    name: "Target Cost/Unit",
                    type: "line",
                    smooth: true,
                    yAxisIndex: 1,
                    data: targetData,
                    itemStyle: { color: "#10b981" },
                    lineStyle: { width: 2.5, type: "dashed" }
                },
                {
                    name: "Actual Cost/Unit",
                    type: "line",
                    smooth: true,
                    yAxisIndex: 1,
                    data: unitCostData,
                    itemStyle: { color: "#f87171" },
                    lineStyle: { width: 3 }
                }
            ]
        };
    };

    // SUBMISSIONS
    const handleCostSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCostFeedback({ type: "", message: "" });
        if (!costYear || !costValue || !costUnitTarget) {
            setCostFeedback({ type: "error", message: "Please fill in all inputs." });
            return;
        }

        setCostSubmitting(true);
        try {
            const res = await axios.post(`${API_HOST}/api/production/kpi-data/cost-data`, {
                area: costLine,
                year: Number(costYear),
                month: costMonth,
                cost: Number(costValue),
                costType: costType,
                unitTarget: Number(costUnitTarget)
            });
            if (res.data.success) {
                setCostFeedback({ type: "success", message: "Cost data recorded successfully!" });
                setRefreshTrigger(prev => !prev);
                setTimeout(() => {
                    setCostModalOpen(false);
                    setCostValue("");
                    setCostUnitTarget("");
                    setCostYear("");
                    setCostType("CONSUMABLE");
                }, 1500);
            }
        } catch (err) {
            console.error(err);
            setCostFeedback({ type: "error", message: "Submitting cost metrics failed." });
        } finally {
            setCostSubmitting(false);
        }
    };

    const handleManpowerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMpFeedback({ type: "", message: "" });
        if (!mpYear || !mpAbsenteeism) {
            setMpFeedback({ type: "error", message: "Please enter Year and Absenteeism rate." });
            return;
        }

        setMpSubmitting(true);
        try {
            const res = await axios.post(`${API_HOST}/api/production/kpi-data/manpower-data`, {
                area: mpLine,
                year: Number(mpYear),
                month: mpMonth,
                absenteeism: Number(mpAbsenteeism)
            });
            if (res.data.success) {
                setMpFeedback({ type: "success", message: "Absenteeism data recorded successfully!" });
                setRefreshTrigger(prev => !prev);
                setTimeout(() => {
                    setMpModalOpen(false);
                    setMpAbsenteeism("");
                    setMpYear("");
                }, 1500);
            }
        } catch (err) {
            console.error(err);
            setMpFeedback({ type: "error", message: "Submitting absenteeism failed." });
        } finally {
            setMpSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-8xl mx-auto p-2">
            {/* HEADER SECTION */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/manufacturing">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
                            KPI Report
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Periodical and annual shopfloor KPI analysis reports
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-end">
                    {/* PERIOD FILTERS */}
                    {mounted && (
                        <div className="flex items-center gap-2 bg-card border p-2 rounded-xl shadow-sm h-9">
                            <Select value={fyYear} onValueChange={(v) => {
                                setFyYear(v);
                                sessionStorage.setItem("ACKPI_REPORT_FY_YEAR", v);
                            }}>
                                <SelectTrigger className="w-[100px] border-none bg-transparent h-7 text-xs">
                                    <SelectValue placeholder="FY Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2022">FY 22</SelectItem>
                                    <SelectItem value="2023">FY 23</SelectItem>
                                    <SelectItem value="2024">FY 24</SelectItem>
                                    <SelectItem value="2025">FY 25</SelectItem>
                                    <SelectItem value="2026">FY 26</SelectItem>
                                    <SelectItem value="2027">FY 27</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="w-px h-5 bg-border" />

                            <Select value={line} onValueChange={(v) => {
                                setLine(v);
                                sessionStorage.setItem("ACKPI_REPORT_LINE", v);
                            }}>
                                <SelectTrigger className="w-[110px] border-none bg-transparent h-7 text-xs">
                                    <SelectValue placeholder="Area" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="IDU-Line">IDU LINE</SelectItem>
                                    <SelectItem value="ODU-Line">ODU LINE</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button onClick={() => setRefreshTrigger(p => !p)} variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                                <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    )}

                    {/* INPUT LOGS BUTTONS */}
                    {showManpowerInput && (
                        <Button onClick={() => setMpModalOpen(true)} variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-semibold">
                            <Users className="w-4 h-4 text-blue-500" /> Absenteeism Data
                        </Button>
                    )}

                    {showCostInput && (
                        <Button onClick={() => setCostModalOpen(true)} variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-semibold">
                            <Coins className="w-4 h-4 text-amber-500" /> Consumable Cost
                        </Button>
                    )}
                </div>
            </div>

            {/* ERROR ALERTS */}
            {error && (
                <Alert variant="destructive" className="max-w-md mx-auto">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
            )}

            {/* KPI CHARTS GRID */}
            {loading && !yearlyProd.plan.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="p-6">
                            <Skeleton className="h-6 w-40 mb-4" />
                            <Skeleton className="h-[340px] w-full" />
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 1. YEARLY PRODUCTION */}
                    <Card className="border-border/60 bg-card shadow-sm col-span-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-wide">Yearly Production Achievement</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {yearlyProd.plan.length > 0 ? (
                                <ReactECharts option={getProductionChartOptions(yearlyProd)} style={{ height: "350px" }} />
                            ) : (
                                <div className="flex h-[350px] items-center justify-center text-xs text-muted-foreground">No yearly data logs</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 2. MONTHLY PRODUCTION */}
                    <Card className="border-border/60 bg-card shadow-sm col-span-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-wide">Monthly Production Target achievement</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {monthlyProd.plan.length > 0 ? (
                                <ReactECharts option={getProductionChartOptions(monthlyProd, true)} style={{ height: "350px" }} />
                            ) : (
                                <div className="flex h-[350px] items-center justify-center text-xs text-muted-foreground">No monthly data logs</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 3. UPH / UPPH */}
                    <Card className="border-border/60 bg-card shadow-sm col-span-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-wide">UPH & UPPH Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {uphData.uph.length > 0 ? (
                                <ReactECharts option={getUphChartOptions()} style={{ height: "350px" }} />
                            ) : (
                                <div className="flex h-[350px] items-center justify-center text-xs text-muted-foreground">No UPH/UPPH logs</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 4. ABSENTEEISM */}
                    <Card className="border-border/60 bg-card shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-wide">Manpower Absenteeism Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {manpowerData.rates.length > 0 ? (
                                <ReactECharts option={getRatesChartOptions(manpowerData, "Avg. Absenteeism %", "#3b82f6")} style={{ height: "300px" }} />
                            ) : (
                                <div className="flex h-[300px] items-center justify-center text-xs text-muted-foreground">No absenteeism logs</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 5. RTY */}
                    <Card className="border-border/60 bg-card shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-wide">Rolled Throughput Yield (RTY)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {rtyData.rates.length > 0 ? (
                                <ReactECharts option={getRatesChartOptions(rtyData, "RTY %", "#10b981", true)} style={{ height: "300px" }} />
                            ) : (
                                <div className="flex h-[300px] items-center justify-center text-xs text-muted-foreground">No RTY yield logs</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 6. OEE */}
                    <Card className="border-border/60 bg-card shadow-sm col-span-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-wide">Average OEE Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {oeeData.oee.length > 0 ? (
                                <ReactECharts option={getOeeChartOptions()} style={{ height: "350px" }} />
                            ) : (
                                <div className="flex h-[350px] items-center justify-center text-xs text-muted-foreground">No OEE logs</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 7. COST CONSUMABLES */}
                    <Card className="border-border/60 bg-card shadow-sm col-span-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-wide">Consumable Cost Trends</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {costData.consumable && costData.consumable.length > 0 ? (
                                <ReactECharts option={getCostChartOptions()} style={{ height: "350px" }} />
                            ) : (
                                <div className="flex h-[350px] items-center justify-center text-xs text-muted-foreground">No cost logs</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* COST RECORDING DIALOG */}
            <Dialog open={costModalOpen} onOpenChange={setCostModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold uppercase">Consumable Cost Entry</DialogTitle>
                        <DialogDescription className="text-xs">Record monthly consumable costs and unit targets.</DialogDescription>
                    </DialogHeader>

                    {costFeedback.message && (
                        <Alert variant={costFeedback.type === "success" ? "default" : "destructive"} className="text-xs py-2 px-3">
                            <div className="flex gap-2 items-center">
                                {costFeedback.type === "success" ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : <AlertCircle className="w-4 h-4" />}
                                <span className="text-xs font-semibold">{costFeedback.message}</span>
                            </div>
                        </Alert>
                    )}

                    <form onSubmit={handleCostSubmit} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground block">Line</Label>
                                <Select value={costLine} onValueChange={setCostLine}>
                                    <SelectTrigger className="bg-background border-border h-9 text-xs">
                                        <SelectValue placeholder="Line" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="IDU-Line">IDU LINE</SelectItem>
                                        <SelectItem value="ODU-Line">ODU LINE</SelectItem>
                                        <SelectItem value="Paint Shop">PAINT SHOP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground block">Month</Label>
                                <Select value={costMonth} onValueChange={setCostMonth}>
                                    <SelectTrigger className="bg-background border-border h-9 text-xs">
                                        <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground block">Year *</Label>
                            <Input
                                type="number"
                                placeholder="e.g. 2027"
                                value={costYear}
                                onChange={(e) => setCostYear(e.target.value)}
                                className="bg-background border-border h-9 text-xs"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground block">Cost Type *</Label>
                            <Select value={costType} onValueChange={setCostType}>
                                <SelectTrigger className="bg-background border-border h-9 text-xs">
                                    <SelectValue placeholder="Cost Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CONSUMABLE">CONSUMABLE</SelectItem>
                                    <SelectItem value="POWER">POWER</SelectItem>
                                    <SelectItem value="MANPOWER">MANPOWER</SelectItem>
                                    <SelectItem value="SCRAP">SCRAP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground block">Total Monthly Cost (₹) *</Label>
                            <Input
                                type="number"
                                placeholder="Total Consumable Cost"
                                value={costValue}
                                onChange={(e) => setCostValue(e.target.value)}
                                className="bg-background border-border h-9 text-xs"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground block">Target Cost Per Unit (₹) *</Label>
                            <Input
                                type="number"
                                placeholder="Target Per Unit Cost"
                                value={costUnitTarget}
                                onChange={(e) => setCostUnitTarget(e.target.value)}
                                className="bg-background border-border h-9 text-xs"
                                required
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setCostModalOpen(false)} className="text-xs">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={costSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9">
                                {costSubmitting ? "Submitting..." : "Submit Cost"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MANPOWER RECORDING DIALOG */}
            <Dialog open={mpModalOpen} onOpenChange={setMpModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold uppercase">Absenteeism Data Entry</DialogTitle>
                        <DialogDescription className="text-xs">Record monthly manpower absenteeism percentage rate.</DialogDescription>
                    </DialogHeader>

                    {mpFeedback.message && (
                        <Alert variant={mpFeedback.type === "success" ? "default" : "destructive"} className="text-xs py-2 px-3">
                            <div className="flex gap-2 items-center">
                                {mpFeedback.type === "success" ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : <AlertCircle className="w-4 h-4" />}
                                <span className="text-xs font-semibold">{mpFeedback.message}</span>
                            </div>
                        </Alert>
                    )}

                    <form onSubmit={handleManpowerSubmit} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground block">Line</Label>
                                <Select value={mpLine} onValueChange={setMpLine}>
                                    <SelectTrigger className="bg-background border-border h-9 text-xs">
                                        <SelectValue placeholder="Line" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="IDU-Line">IDU LINE</SelectItem>
                                        <SelectItem value="ODU-Line">ODU LINE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground block">Month</Label>
                                <Select value={mpMonth} onValueChange={setMpMonth}>
                                    <SelectTrigger className="bg-background border-border h-9 text-xs">
                                        <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground block">Year *</Label>
                            <Input
                                type="number"
                                placeholder="e.g. 2027"
                                value={mpYear}
                                onChange={(e) => setMpYear(e.target.value)}
                                className="bg-background border-border h-9 text-xs"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground block">Absenteeism Rate (%) *</Label>
                            <Input
                                type="number"
                                step="any"
                                min="0"
                                max="100"
                                placeholder="e.g. 8.5"
                                value={mpAbsenteeism}
                                onChange={(e) => setMpAbsenteeism(e.target.value)}
                                className="bg-background border-border h-9 text-xs"
                                required
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setMpModalOpen(false)} className="text-xs">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={mpSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9">
                                {mpSubmitting ? "Submitting..." : "Submit Rate"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
