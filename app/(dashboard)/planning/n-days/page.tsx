// app/(dashboard)/planning/n-days/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import {
    Calendar,
    RefreshCw,
    Clock,
    ArrowLeft,
    AlertCircle,
    LayoutDashboard,
    TrendingUp
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import MachineComponent from "../components/MachineComponent";
import PlanTable from "../components/PlanTable";

const API_HOST = "http://10.0.7.26:3003";

interface PlanItem {
    sequence: number | string;
    modelName: string;
    plan: number | string;
    [key: string]: string | number;
}

interface DayPlan {
    headers: string[];
    plan: PlanItem[];
}

interface PlanningData {
    planDay1?: DayPlan;
    planDay2?: DayPlan;
    planDay3?: DayPlan;
    updateTimestamp?: string;
}

export default function PlanningPage() {
    const [mounted, setMounted] = useState(false);
    const [selectedMachine, setSelectedMachine] = useState<string>("ODU");
    const [planningData, setPlanningData] = useState<PlanningData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState<boolean>(false);

    // MOUNT & RESTORE MACHINE SELECTION
    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
            const savedMachine = sessionStorage.getItem("machineSessionAC");
            if (savedMachine) {
                try {
                    const parsed = JSON.parse(savedMachine);
                    if (Array.isArray(parsed) && parsed[0]?.value) {
                        setSelectedMachine(parsed[0].value);
                    } else if (typeof parsed === "string") {
                        setSelectedMachine(parsed);
                    }
                } catch (e) {
                    console.error("Failed to parse saved machine", e);
                }
            }
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    const handleMachineChange = (machine: string) => {
        setSelectedMachine(machine);
        const legacyFormat = [{ value: machine, label: machine === "ODU" ? "ODU LINE" : "IDU LINE" }];
        sessionStorage.setItem("machineSessionAC", JSON.stringify(legacyFormat));
        sessionStorage.setItem("manufacturingMachinesAC", machine);
    };

    const fetchPlanningData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_HOST}/api/planning/data/dashboard`, {
                params: { area: "ASSEMBLY LINES", machine: selectedMachine },
            });

            if (response.data?.result) {
                setPlanningData(response.data.result);
            } else {
                setError("No planning data received from server.");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load planning data. Please check server connection.");
        } finally {
            setLoading(false);
        }
    }, [selectedMachine]);

    useEffect(() => {
        if (!mounted) return;

        const timer = setTimeout(fetchPlanningData, 100);
        const interval = setInterval(fetchPlanningData, 60000);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [mounted, refreshTrigger, fetchPlanningData]);

    const calculateTotal = (plan: PlanItem[] = []) =>
        plan.reduce((sum, item) => sum + Number(item.plan || 0), 0);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-background pb-10">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
                {/* HEADER SECTION */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <Link href="/planning">
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl shrink-0">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                                <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
                                Production Planning
                            </h1>
                            <p className="text-sm sm:text-base text-muted-foreground mt-1">
                                3-Day Assembly Line Schedule
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {planningData?.updateTimestamp && (
                            <Badge
                                variant="outline"
                                className="px-3 py-1.5 text-xs sm:text-sm flex items-center gap-2 bg-card whitespace-nowrap w-full sm:w-auto"
                            >
                                <Clock className="w-4 h-4" />
                                <span className="hidden sm:inline">Updated:</span>
                                {planningData.updateTimestamp}
                            </Badge>
                        )}
                        <Button
                            onClick={() => setRefreshTrigger(prev => !prev)}
                            variant="default"
                            size="lg"
                            disabled={loading}
                            className="gap-2 w-full sm:w-auto"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* LINE SELECTION */}
                <Card className="border shadow-sm">
                    <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                                <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                                Production Line
                            </CardTitle>
                            <CardDescription className="text-sm">
                                Select the line to view its 3-day production plan
                            </CardDescription>
                        </div>
                        <div className="shrink-0">
                            <MachineComponent
                                selectedMachine={selectedMachine}
                                onMachineChange={handleMachineChange}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* ERROR ALERT */}
                {error && (
                    <Alert variant="destructive" className="text-sm">
                        <AlertCircle className="h-5 w-5" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* 3-DAY PLANS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {loading && !planningData ? (
                        // MOBILE-FRIENDLY LOADING SKELETONS
                        [...Array(3)].map((_, i) => (
                            <Card key={i} className="overflow-hidden">
                                <CardHeader className="bg-muted/60 pb-4">
                                    <Skeleton className="h-7 w-32 mx-auto" />
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4 px-4 sm:px-6">
                                    {[...Array(5)].map((_, j) => (
                                        <Skeleton key={j} className="h-12 w-full rounded-lg" />
                                    ))}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <>
                            {["planDay1", "planDay2", "planDay3"].map((key, index) => {
                                const dayPlan = planningData?.[key as keyof PlanningData] as DayPlan | undefined;
                                const dayNumber = index + 1;

                                return (
                                    <Card
                                        key={key}
                                        className="flex flex-col overflow-hidden border shadow-sm hover:shadow transition-all duration-200 pt-0"
                                    >
                                        <CardHeader className="bg-gradient-to-br from-blue-600/30 via-violet-500/30 to-violet-900/30 text-center py-2">
                                            <CardTitle className="text-2xl font-semibold tracking-tight">
                                                DAY {dayNumber}
                                            </CardTitle>
                                            <CardDescription>
                                                {dayPlan?.plan?.length || 0} models scheduled
                                            </CardDescription>
                                        </CardHeader>

                                        <CardContent className="flex-1 pt-6 px-3 sm:px-6">
                                            <PlanTable
                                                headers={dayPlan?.headers || ["Seq", "Model Name", "Plan Qty"]}
                                                rows={dayPlan?.plan || []}
                                            />
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </>
                    )}
                </div>

                {/* SUMMARY STATS */}
                {!loading && planningData && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { day: "Day 1", data: planningData.planDay1, color: "blue" },
                            { day: "Day 2", data: planningData.planDay2, color: "violet" },
                            { day: "Day 3", data: planningData.planDay3, color: "emerald" }
                        ].map(({ day, data, color }, idx) => {
                            const total = calculateTotal(data?.plan);
                            return (
                                <Card key={idx} className="overflow-hidden">
                                    <CardHeader className={`bg-gradient-to-r from-${color}-500/10 to-transparent pb-3`}>
                                        <CardTitle className="text-base uppercase sm:text-lg">{day}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl sm:text-4xl font-bold text-foreground">
                                                {total.toLocaleString()}
                                            </span>
                                            <span className="text-sm sm:text-base text-muted-foreground">units</span>
                                        </div>
                                        <div className="text-xs sm:text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                                            <TrendingUp className="w-4 h-4 text-green-500" />
                                            Total Planned Quantity
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}