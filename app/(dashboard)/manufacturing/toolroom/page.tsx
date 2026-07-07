"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    PlusCircle,
    ClipboardList,
    Calendar,
    TrendingUp,
    Clock,
    Wrench,
    History,
    Lightbulb,
    Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";

export default function ToolroomDashboard() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [loginData, setLoginData] = useState<any>(null);
    const [hasAccessEdit, setHasAccessEdit] = useState(false);
    const [loading, setLoading] = useState(true);

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";

    useEffect(() => {
        setMounted(true);
        const dataStr = sessionStorage.getItem("logindata");
        if (dataStr) {
            const data = JSON.parse(dataStr);
            setLoginData(data);

            const fetchAccess = async () => {
                try {
                    const response = await axios.get(`${apiBase}/production/toolroom/get-accesslist`);
                    const list = response.data || [];
                    sessionStorage.setItem("accesslist", JSON.stringify(list));
                    
                    const idMatch = list.some((user: any) => String(user.Employee_code) === String(data.id));
                    setHasAccessEdit(idMatch);
                } catch (error) {
                    console.error("Error fetching toolroom access list:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchAccess();
        } else {
            setLoading(false);
        }
    }, [apiBase]);

    const handleRestrictedNavigation = (path: string, requiresAccess: boolean, title: string) => {
        if (!requiresAccess || hasAccessEdit) {
            router.push(path);
        } else {
            toast.error(`Access Restricted: You don't have permission to write/edit in the "${title}" module.`, {
                description: "Contact your administrator to request access."
            });
        }
    };

    if (!mounted) return null;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                <p className="text-sm font-semibold tracking-wide text-muted-foreground animate-pulse">Loading Toolroom Dashboard...</p>
            </div>
        );
    }

    const sections = [
        {
            title: "Data Entry & Operations",
            description: "Log breakdowns, submit preventive maintenance checklists, and manage reconditioning plans.",
            tiles: [
                {
                    title: "Add Breakdown",
                    icon: PlusCircle,
                    iconColor: "text-rose-500",
                    bgColor: "bg-rose-500/10 border-rose-500/20",
                    path: "/manufacturing/toolroom/add-breakdown",
                    requiresAccess: true,
                    description: "Log new tool breakdown details and perform root cause analysis"
                },
                {
                    title: "Add PM Checklist",
                    icon: ClipboardList,
                    iconColor: "text-emerald-500",
                    bgColor: "bg-emerald-500/10 border-emerald-500/20",
                    path: "/manufacturing/toolroom/add-pm-checklist",
                    requiresAccess: true,
                    description: "Submit preventative maintenance checksheets for tools or moulds"
                },
                {
                    title: "Add Recondition Plan",
                    icon: Calendar,
                    iconColor: "text-purple-500",
                    bgColor: "bg-purple-500/10 border-purple-500/20",
                    path: "/manufacturing/toolroom/add-recondition",
                    requiresAccess: true,
                    description: "Schedule mould/tool reconditioning plans and strategies"
                }
            ]
        },
        {
            title: "Analytics & Planning",
            description: "View breakdown analytics graphs and monitor PM schedules.",
            tiles: [
                {
                    title: "Breakdown Analytics",
                    icon: TrendingUp,
                    iconColor: "text-orange-500",
                    bgColor: "bg-orange-500/10 border-orange-500/20",
                    path: "/manufacturing/toolroom/breakdown-analytics",
                    requiresAccess: false,
                    description: "Analyze tool breakdown frequencies, graphical trends, and Pareto summaries"
                },
                {
                    title: "PM Schedule",
                    icon: Clock,
                    iconColor: "text-blue-500",
                    bgColor: "bg-blue-500/10 border-blue-500/20",
                    path: "/manufacturing/toolroom/pm-schedule",
                    requiresAccess: false,
                    description: "Manage preventative maintenance schedules and review weekly/yearly matrix views"
                }
            ]
        },
        {
            title: "Asset & ECN Tracking",
            description: "Browse master tools registry, view history records, and log Engineering Change Notes.",
            tiles: [
                {
                    title: "Tool List",
                    icon: Wrench,
                    iconColor: "text-slate-500 dark:text-slate-400",
                    bgColor: "bg-slate-500/10 border-slate-500/20",
                    path: "/manufacturing/toolroom/tool-list",
                    requiresAccess: false,
                    description: "Browse master registry database, update shot counts, and manage tools"
                },
                {
                    title: "Tool History Card",
                    icon: History,
                    iconColor: "text-amber-600 dark:text-amber-500",
                    bgColor: "bg-amber-500/10 border-amber-500/20",
                    path: "/manufacturing/toolroom/tool-history",
                    requiresAccess: false,
                    description: "Trace complete maintenance history records and document checks for individual tools"
                },
                {
                    title: "Planned Activity & ECN",
                    icon: Lightbulb,
                    iconColor: "text-yellow-500",
                    bgColor: "bg-yellow-500/10 border-yellow-500/20",
                    path: "/manufacturing/toolroom/ecn/view",
                    requiresAccess: false,
                    description: "Track Engineering Change Notes and planned improvement activities"
                }
            ]
        }
    ];

    return (
        <div className="space-y-8 max-w-8xl mx-auto p-4 sm:p-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push("/manufacturing")}
                            className="h-8 gap-1 border-border/80"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Back
                        </Button>
                        <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">
                            AC Plant Specific
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-foreground">
                        Toolroom Management
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Welcome back, {loginData?.name || "User"} • Manage your tools, PM schedules, and breakdown analytics.
                    </p>
                </div>
            </div>

            {/* Submodule sections */}
            <div className="space-y-10">
                {sections.map((section) => (
                    <div key={section.title} className="space-y-4">
                        <div className="border-b border-border/60 pb-2">
                            <h2 className="text-xl font-bold tracking-tight text-foreground">{section.title}</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {section.tiles.map((tile) => {
                                const Icon = tile.icon;
                                const isRestricted = tile.requiresAccess && !hasAccessEdit;
                                return (
                                    <div
                                        key={tile.title}
                                        role="button"
                                        onClick={() => handleRestrictedNavigation(tile.path, tile.requiresAccess, tile.title)}
                                        className="group block h-full cursor-pointer"
                                    >
                                        <Card className="h-full border border-border/60 hover:border-blue-500/50 hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col bg-card">
                                            {/* Accent hover background */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div className={`p-2.5 rounded-xl border ${tile.bgColor}`}>
                                                        <Icon className={`w-5.5 h-5.5 ${tile.iconColor}`} />
                                                    </div>
                                                    {isRestricted && (
                                                        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[10px] gap-1 px-2 py-0.5">
                                                            <Lock className="w-2.5 h-2.5" /> Restricted
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardHeader>

                                            <CardContent className="flex-1 flex flex-col justify-between">
                                                <div className="space-y-1.5">
                                                    <CardTitle className="text-lg font-bold group-hover:text-blue-600 transition-colors">
                                                        {tile.title}
                                                    </CardTitle>
                                                    <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                                                        {tile.description}
                                                    </CardDescription>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
