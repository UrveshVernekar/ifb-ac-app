// app/(dashboard)/planning/n-days/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import {
    Calendar,
    RefreshCw,
    Clock,
    ArrowLeft,
    AlertCircle,
    LayoutDashboard
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

    // Mount check (async state update to avoid lint error)
    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
            const savedMachine = sessionStorage.getItem("machineSessionAC");
            if (savedMachine) {
                try {
                    // Legacies stored it as JSON array e.g. [{"value": "ODU", "label": "ODU LINE"}]
                    const parsed = JSON.parse(savedMachine);
                    if (Array.isArray(parsed) && parsed[0]?.value) {
                        setSelectedMachine(parsed[0].value);
                    } else if (typeof parsed === "string") {
                        setSelectedMachine(parsed);
                    }
                } catch (e) {
                    console.error("Failed to parse saved machine session", e);
                }
            }
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    // Persist machine selection in the format expected by the application
    const handleMachineChange = (machine: string) => {
        setSelectedMachine(machine);
        const legacyFormat = [{ value: machine, label: machine === "ODU" ? "ODU LINE" : "IDU LINE" }];
        sessionStorage.setItem("machineSessionAC", JSON.stringify(legacyFormat));
        sessionStorage.setItem("manufacturingMachinesAC", machine);
    };

    // Fetch live planning data
    const fetchPlanningData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_HOST}/api/planning/data/dashboard`, {
                params: {
                    area: "ASSEMBLY LINES",
                    machine: selectedMachine,
                }
            });

            if (response.data && response.data.result) {
                setPlanningData(response.data.result);
            } else {
                setError("No planning data received from the server.");
            }
        } catch (err) {
            console.error("Fetch planning data error:", err);
            setError("Failed to load planning data. Make sure the backend server is running.");
        } finally {
            setLoading(false);
        }
    }, [selectedMachine]);

    // Initial fetch and automatic polling (every 60 seconds)
    useEffect(() => {
        let timerId: NodeJS.Timeout;
        let intervalId: NodeJS.Timeout;

        if (mounted) {
            // Asynchronous call in effect to avoid synchronous setState warning
            timerId = setTimeout(() => {
                fetchPlanningData();
            }, 0);

            intervalId = setInterval(fetchPlanningData, 60000);
        }

        return () => {
            if (timerId) clearTimeout(timerId);
            if (intervalId) clearInterval(intervalId);
        };
    }, [mounted, refreshTrigger, fetchPlanningData]);

    if (!mounted) return null;

    return (
        <div className="space-y-6 max-w-8xl mx-auto p-2">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/planning">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-blue-500" />
                            Production Planning
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Live 3-day assembly line schedule plans
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {planningData?.updateTimestamp && (
                        <Badge
                            variant="outline"
                            className="bg-amber-500/5 text-amber-500 border-amber-500/20 px-2.5 py-1 text-xs flex items-center gap-1.5"
                        >
                            <Clock className="w-3.5 h-3.5" />
                            Last Updated: {planningData.updateTimestamp}
                        </Badge>
                    )}
                    <Button
                        onClick={() => setRefreshTrigger(prev => !prev)}
                        variant="secondary"
                        size="sm"
                        className="h-9 gap-1.5 text-xs font-semibold"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        Reload
                    </Button>
                </div>
            </div>

            {/* Selection Card */}
            <Card className="border-border/60 shadow-sm bg-card">
                <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4 text-blue-500" />
                        Line Configuration
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Select the production line to display current plans
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    <MachineComponent
                        selectedMachine={selectedMachine}
                        onMachineChange={handleMachineChange}
                    />
                </CardContent>
            </Card>

            {/* Error Message */}
            {error && (
                <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="text-xs font-bold uppercase">Error Loading Data</AlertTitle>
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
            )}

            {/* 3 Days Plan Display */}
            {loading && !planningData ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="border-border/60 shadow-sm bg-card">
                            <CardHeader className="pb-3 border-b border-border/40">
                                <Skeleton className="h-5 w-24 mb-1" />
                                <Skeleton className="h-3 w-40" />
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                                {[...Array(4)].map((_, j) => (
                                    <Skeleton key={j} className="h-9 w-full" />
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Day 1 Plan */}
                    <Card className="border-border/60 shadow-sm bg-card flex flex-col">
                        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
                                Day 1 Plan
                            </CardTitle>
                            <CardDescription className="text-[11px]">
                                Sequence scheduled for execution
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 flex-grow px-2 md:px-4">
                            <PlanTable
                                headers={planningData?.planDay1?.headers || ["Seq", "Model Name", "Plan Qty"]}
                                rows={planningData?.planDay1?.plan || []}
                            />
                        </CardContent>
                    </Card>

                    {/* Day 2 Plan */}
                    <Card className="border-border/60 shadow-sm bg-card flex flex-col">
                        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
                                Day 2 Plan
                            </CardTitle>
                            <CardDescription className="text-[11px]">
                                Production schedule forecast
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 flex-grow px-2 md:px-4">
                            <PlanTable
                                headers={planningData?.planDay2?.headers || ["Seq", "Model Name", "Plan Qty"]}
                                rows={planningData?.planDay2?.plan || []}
                            />
                        </CardContent>
                    </Card>

                    {/* Day 3 Plan */}
                    <Card className="border-border/60 shadow-sm bg-card flex flex-col">
                        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
                                Day 3 Plan
                            </CardTitle>
                            <CardDescription className="text-[11px]">
                                Extended production schedule forecast
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 flex-grow px-2 md:px-4">
                            <PlanTable
                                headers={planningData?.planDay3?.headers || ["Seq", "Model Name", "Plan Qty"]}
                                rows={planningData?.planDay3?.plan || []}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
