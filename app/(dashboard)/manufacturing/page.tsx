// app/(dashboard)/manufacturing/page.tsx
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
    ShieldCheck
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
    status?: string;
}

export default function ManufacturingHub() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const sections = [
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
                    description: "View real-time and historical production line data"
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
                    description: "Track, analyze, and log machine/line downtime events"
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
                    path: "/planning", // Map to main Planning section of Next.js app
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
                    description: "Validate manufacturing trial runs and process parameters"
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

    if (!mounted) return null;

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-2">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Module</Badge>
                    <span className="text-xs text-muted-foreground font-semibold tracking-wider uppercase">AC Manufacturing Division</span>
                </div>
                <h1 className="text-4xl font-extrabold text-foreground tracking-tight sm:text-5xl">
                    Manufacturing Dashboard
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                    Monitor real-time production, coordinate schedules, validate processes, and track line efficiency metrics.
                </p>
            </div>

            {/* Sections */}
            <div className="space-y-12">
                {sections.map((section, sIdx) => (
                    <div key={section.title} className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                            {section.icon}
                            <h2 className="text-xl font-bold tracking-tight text-foreground">{section.title}</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {section.tiles.map((tile) => {
                                const IconComp = tile.icon;
                                return (
                                    <Link key={tile.title} href={tile.path} className="group block h-full">
                                        <Card className="h-full border border-border/50 bg-card hover:border-emerald-500/40 hover:shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col">
                                            {/* Micro gradient background glow */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                            
                                            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                                                <div className={`p-2.5 rounded-xl border ${tile.bgColor}`}>
                                                    <IconComp className={`w-5 h-5 ${tile.iconColor}`} />
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-300" />
                                            </CardHeader>
                                            
                                            <CardContent className="pt-2 flex-grow flex flex-col justify-between">
                                                <div className="space-y-1.5">
                                                    <CardTitle className="text-lg font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                                                        {tile.title}
                                                    </CardTitle>
                                                    <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                                                        {tile.description}
                                                    </CardDescription>
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