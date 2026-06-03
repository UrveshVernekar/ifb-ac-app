"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    Calendar,
    CalendarRange,
    Package,
    BarChart3,
    ArrowRight,
    Sparkles,
    Sliders,
    TrendingUp
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

export default function PlanningHub() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const sections: Section[] = [
        {
            title: "Production Scheduling",
            icon: <Sliders className="w-5 h-5 text-blue-500" />,
            tiles: [
                {
                    title: "3-Day Plan",
                    icon: Calendar,
                    iconColor: "text-blue-500",
                    bgColor: "bg-blue-500/10 border-blue-500/20",
                    path: "/planning/n-days",
                    description: "View live 3-day assembly line schedule plans and execution sequences",
                    status: "live"
                },
                {
                    title: "Monthly Plan",
                    icon: CalendarRange,
                    iconColor: "text-indigo-500",
                    bgColor: "bg-indigo-500/10 border-indigo-500/20",
                    path: "#",
                    description: "Long-term monthly production targets, capacity planning, and forecasting",
                    status: "planned"
                }
            ]
        },
        // {
        //     title: "Resource & Material Planning",
        //     icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
        //     tiles: [
        //         {
        //             title: "Material Reservation",
        //             icon: Package,
        //             iconColor: "text-orange-500",
        //             bgColor: "bg-orange-500/10 border-orange-500/20",
        //             path: "#",
        //             description: "Reserve, track, and manage raw material allocations for production runs",
        //             status: "planned"
        //         },
        //         {
        //             title: "Capacity Analysis",
        //             icon: BarChart3,
        //             iconColor: "text-amber-500",
        //             bgColor: "bg-amber-500/10 border-amber-500/20",
        //             path: "#",
        //             description: "Analyze machine load, labor availability, and line constraints",
        //             status: "planned"
        //         }
        //     ]
        // }
    ];

    const getStatusBadge = (status?: Tile["status"]) => {
        switch (status) {
            case "live":
                return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">LIVE</Badge>;
            case "warning":
                return <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-xs">ATTENTION</Badge>;
            case "completed":
                return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">COMPLETED</Badge>;
            case "planned":
                return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs">PLANNED</Badge>;
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
                            AC Planning Division
                        </Badge>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter">
                        Planning Hub
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Schedule execution, resource planning, and raw material allocations.
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
                                const isPlanned = tile.status === "planned";

                                const cardContent = (
                                    <Card className={`h-full border border-border/60 hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col bg-card ${isPlanned
                                        ? "opacity-80 hover:border-border cursor-not-allowed"
                                        : "hover:border-blue-500/50 cursor-pointer"
                                        }`}>
                                        {/* HOVER EFFECT */}
                                        {!isPlanned && (
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        )}

                                        <CardHeader className="pb-4">
                                            <div className="flex items-start justify-between">
                                                <div className={`p-3 rounded-2xl border ${isPlanned ? "bg-muted border-border/50" : tile.bgColor}`}>
                                                    <IconComp className={`w-6 h-6 ${isPlanned ? "text-muted-foreground/60" : tile.iconColor}`} />
                                                </div>
                                                {getStatusBadge(tile.status)}
                                            </div>
                                        </CardHeader>

                                        <CardContent className="flex-1 flex flex-col">
                                            <CardTitle className={`text-xl font-semibold transition-colors duration-300 ${isPlanned
                                                ? "text-muted-foreground/80"
                                                : "group-hover:text-blue-600"
                                                }`}>
                                                {tile.title}
                                            </CardTitle>

                                            <CardDescription className="mt-2 text-sm leading-relaxed text-muted-foreground flex-1">
                                                {tile.description}
                                            </CardDescription>

                                            {!isPlanned ? (
                                                <div className="mt-6 flex items-center text-blue-600 text-sm font-medium transition-all duration-300">
                                                    Open Module
                                                    <ArrowRight className="w-4 h-4 ml-1.5 transition-transform duration-300 group-hover:translate-x-1" />
                                                </div>
                                            ) : (
                                                <div className="mt-6 flex items-center text-muted-foreground/50 text-sm font-medium">
                                                    Coming Soon
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );

                                return isPlanned ? (
                                    <div key={tile.title} className="block h-full select-none">
                                        {cardContent}
                                    </div>
                                ) : (
                                    <Link
                                        key={tile.title}
                                        href={tile.path}
                                        className="group block h-full"
                                    >
                                        {cardContent}
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