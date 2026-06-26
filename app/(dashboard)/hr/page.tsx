"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  BarChart3,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard
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
  status?: "live" | "planned" | "warning";
}

interface Section {
  title: string;
  icon: React.ReactNode;
  tiles: Tile[];
}

export default function HRDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [access, setAccess] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const storedData = sessionStorage.getItem("logindata");
    if (storedData) {
      try {
        setAccess(JSON.parse(storedData));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const hasWriteAccess = access?.hr_access === 1 || access?.production_access === 1;

  const sections: Section[] = [
    {
      title: "Workforce & Attendance",
      icon: <Users className="w-5 h-5 text-blue-500" />,
      tiles: [
        {
          title: "Shopfloor Attendance",
          icon: ClipboardCheck,
          iconColor: "text-blue-500",
          bgColor: "bg-blue-500/10 border-blue-500/20",
          path: "/hr/line-attendance",
          description: "Real-time dashboard showing headcount, presence, and absence status across assembly lines.",
          status: "live"
        },
        {
          title: "Register Employee",
          icon: UserPlus,
          iconColor: "text-emerald-500",
          bgColor: "bg-emerald-500/10 border-emerald-500/20",
          path: "/hr/line-attendance/register",
          description: "Add new contractual team members, manage active rosters, and define daily pool worker allocations.",
          status: "live"
        }
      ]
    },
    {
      title: "Manpower Performance & Analysis",
      icon: <LayoutDashboard className="w-5 h-5 text-amber-500" />,
      tiles: [
        {
          title: "Manpower Analytics",
          icon: BarChart3,
          iconColor: "text-amber-500",
          bgColor: "bg-amber-500/10 border-amber-500/20",
          path: "/hr/manpower-analytics",
          description: "View trend lines, absence rates, and status distributions over custom date ranges.",
          status: "live"
        }
      ]
    }
  ];

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5 gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold uppercase tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="w-8 h-8 text-blue-500" />
            HR Portal
          </h1>
          <p className="text-xs text-muted-foreground">
            Monitor shopfloor attendance, register contractual workers, and analyze manpower utilization.
          </p>
        </div>
      </div>

      {/* OPERATIONS TILES */}
      <div className="space-y-12">
        {sections.map((section) => (
          <div key={section.title} className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-border/60">
              {section.icon}
              <h2 className="text-xl font-bold tracking-tight text-foreground">{section.title}</h2>
            </div>

            {/* Tile Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {section.tiles.map((tile) => {
                const IconComp = tile.icon;
                const isRestricted = tile.title === "Register Employee" && !hasWriteAccess;

                if (isRestricted) {
                  return (
                    <div
                      key={tile.title}
                      className="block h-full opacity-60"
                    >
                      <Card className="h-full border border-border/60 relative overflow-hidden flex flex-col bg-muted/20">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="p-2.5 rounded-xl border bg-muted border-border">
                              <IconComp className="w-5.5 h-5.5 text-muted-foreground" />
                            </div>
                            <Badge className="bg-muted text-muted-foreground border-border text-[10px] font-bold">
                              RESTRICTED
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col">
                          <CardTitle className="text-lg font-bold text-muted-foreground">
                            {tile.title}
                          </CardTitle>

                          <CardDescription className="mt-2 text-xs leading-relaxed text-muted-foreground flex-1">
                            {tile.description}
                          </CardDescription>

                          <div className="mt-5 flex items-center text-muted-foreground text-xs font-bold">
                            Access Restricted
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                }

                return (
                  <Link
                    key={tile.title}
                    href={tile.path}
                    className="group block h-full cursor-pointer"
                  >
                    <Card className="h-full border border-border/60 hover:border-blue-500/40 hover:shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col bg-card">
                      {/* Interactive hover background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className={`p-2.5 rounded-xl border ${tile.bgColor}`}>
                            <IconComp className={`w-5.5 h-5.5 ${tile.iconColor}`} />
                          </div>
                          {tile.status === "live" && (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold">
                              LIVE
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="flex-1 flex flex-col">
                        <CardTitle className="text-lg font-bold group-hover:text-blue-600 transition-colors">
                          {tile.title}
                        </CardTitle>

                        <CardDescription className="mt-2 text-xs leading-relaxed text-muted-foreground flex-1">
                          {tile.description}
                        </CardDescription>

                        <div className="mt-5 flex items-center text-blue-600 dark:text-blue-400 text-xs font-bold group-hover:gap-2 transition-all">
                          Open Sub-Module
                          <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
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