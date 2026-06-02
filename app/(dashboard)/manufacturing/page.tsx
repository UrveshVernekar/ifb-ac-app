"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    Factory,
    Settings,
    AlertTriangle,
    BarChart3,
    Package,
    ArrowLeftRight,
    CheckCircle2,
    Layers,
    ArrowRight,
    Gauge,
    ShieldCheck,
    Activity
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Tile {
    title: string;
    icon: React.ComponentType<any>;
    iconColor: string;
    bgColor: string;
    path: string;
    description: string;
    status?: "live" | "warning" | "completed" | "planned";
}

interface Section {
    title: string;
    icon: React.ReactNode;
    tiles: Tile[];
}

export default function ManufacturingHub() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const sections: Section[] = [
        {
            title: "Production Control",
            icon: <Gauge className="w-5 h-5 text-blue-500" />,
            tiles: [
                {
                    title: "Production Report",
                    icon: Factory,
                    iconColor: "text-blue-500",
                    bgColor: "bg-blue-500/10 border-blue-500/20",
                    path: "/manufacturing/production",
                    description: "View real-time and historical production line data",
                    status: "live"
                },
                {
                    title: "Shift Config",
                    icon: Settings,
                    iconColor: "text-purple-500",
                    bgColor: "bg-purple-500/10 border-purple-500/20",
                    path: "/manufacturing/shift-config",
                    description: "Manage shifts, extension hours, and production schedules"
                },
                {
                    title: "Downtime Logs",
                    icon: AlertTriangle,
                    iconColor: "text-rose-500",
                    bgColor: "bg-rose-500/10 border-rose-500/20",
                    path: "/manufacturing/downtime-logs",
                    description: "Track, analyze, and log machine/line downtime events",
                    status: "warning"
                },
                {
                    title: "KPI Report",
                    icon: BarChart3,
                    iconColor: "text-amber-500",
                    bgColor: "bg-amber-500/10 border-amber-500/20",
                    path: "/manufacturing/kpi-report",
                    description: "One-stop area-wise key performance indicator reporting"
                }
            ]
        },
        {
            title: "Material Management",
            icon: <Package className="w-5 h-5 text-orange-500" />,
            tiles: [
                {
                    title: "Material Reservation",
                    icon: Package,
                    iconColor: "text-orange-500",
                    bgColor: "bg-orange-500/10 border-orange-500/20",
                    path: "/planning",
                    description: "Reserve, track, and manage raw material allocation"
                },
                {
                    title: "Stock Transfer",
                    icon: ArrowLeftRight,
                    iconColor: "text-cyan-500",
                    bgColor: "bg-cyan-500/10 border-cyan-500/20",
                    path: "/manufacturing/stock-transfer",
                    description: "Log and transfer stock/inventory between locations"
                }
            ]
        },
        {
            title: "Quality & Validation",
            icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
            tiles: [
                {
                    title: "Process Validation",
                    icon: CheckCircle2,
                    iconColor: "text-emerald-500",
                    bgColor: "bg-emerald-500/10 border-emerald-500/20",
                    path: "/manufacturing/process-validation",
                    description: "Validate manufacturing trial runs and process parameters",
                    status: "completed"
                },
                {
                    title: "Accessory Validation",
                    icon: Layers,
                    iconColor: "text-indigo-500",
                    bgColor: "bg-indigo-500/10 border-indigo-500/20",
                    path: "/manufacturing/accessory-validation",
                    description: "Create and manage validation mapping records"
                }
            ]
        }
    ];

    const getStatusBadge = (status?: Tile["status"]) => {
        switch (status) {
            case "live":
                return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">LIVE</Badge>;
            case "warning":
                return <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-xs">ATTENTION</Badge>;
            case "completed":
                return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">COMPLETED</Badge>;
            default:
                return null;
        }
    };

    if (!mounted) return null;

    return (
        <div className="space-y-10 max-w-8xl mx-auto p-6">
            {/* HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 px-3 py-1">
                            AC Manufacturing Division
                        </Badge>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter">
                        Manufacturing Hub
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Real-time production oversight, material flow, and quality validation.
                    </p>
                </div>
            </div>

            {/* SECTIONS */}
            <div className="space-y-12">
                {sections.map((section) => (
                    <div key={section.title} className="space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-border/60">
                            {section.icon}
                            <h2 className="text-2xl font-semibold tracking-tight">{section.title}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            {section.tiles.map((tile) => {
                                const IconComp = tile.icon;
                                return (
                                    <Link
                                        key={tile.title}
                                        href={tile.path}
                                        className="group block h-full"
                                    >
                                        <Card className="h-full border border-border/60 hover:border-blue-500/50 hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col bg-card">
                                            {/* HOVER EFFECT */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                            <CardHeader className="pb-4">
                                                <div className="flex items-start justify-between">
                                                    <div className={`p-3 rounded-2xl border ${tile.bgColor}`}>
                                                        <IconComp className={`w-6 h-6 ${tile.iconColor}`} />
                                                    </div>
                                                    {getStatusBadge(tile.status)}
                                                </div>
                                            </CardHeader>

                                            <CardContent className="flex-1 flex flex-col">
                                                <CardTitle className="text-xl font-semibold group-hover:text-blue-600 transition-colors">
                                                    {tile.title}
                                                </CardTitle>

                                                <CardDescription className="mt-2 text-sm leading-relaxed text-muted-foreground flex-1">
                                                    {tile.description}
                                                </CardDescription>

                                                <div className="mt-6 flex items-center text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
                                                    Open Module
                                                    <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}