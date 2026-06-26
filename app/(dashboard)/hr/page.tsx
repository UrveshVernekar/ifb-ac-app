"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Users, UserPlus, BarChart3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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

  if (!mounted) return null;

  const hasWriteAccess = access?.hr_access === 1 || access?.production_access === 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-foreground uppercase tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-500" />
          Human Resources
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitor shopfloor attendance, register contractual workers, and analyze manpower utilization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* SHOPFLOOR ATTENDANCE STATUS */}
        <Link href="/hr/line-attendance" className="group">
          <Card className="h-full border-border/60 hover:border-blue-500/80 shadow-md hover:shadow-xl transition-all duration-300 bg-card hover:bg-blue-500/[0.02] cursor-pointer">
            <CardHeader className="space-y-1">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg font-bold pt-4 uppercase text-foreground group-hover:text-blue-500 transition-colors">
                Shopfloor Attendance
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time dashboard showing headcount, presence, and absence status across assembly lines.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* REGISTER NEW EMPLOYEE */}
        {hasWriteAccess ? (
          <Link href="/hr/line-attendance/register" className="group">
            <Card className="h-full border-border/60 hover:border-emerald-500/80 shadow-md hover:shadow-xl transition-all duration-300 bg-card hover:bg-emerald-500/[0.02] cursor-pointer">
              <CardHeader className="space-y-1">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform duration-300">
                  <UserPlus className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold pt-4 uppercase text-foreground group-hover:text-emerald-500 transition-colors">
                  Register Employee
                </CardTitle>
                <CardDescription className="text-xs">
                  Add new contractual team members, manage active rosters, and define daily pool worker allocations.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ) : (
          <Card className="h-full border-border/60 opacity-60 bg-muted/20">
            <CardHeader className="space-y-1">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <UserPlus className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg font-bold pt-4 uppercase text-muted-foreground flex items-center gap-1.5">
                Register Employee
              </CardTitle>
              <CardDescription className="text-xs">
                Roster management is restricted. Administrator privileges required to register workers.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* MANPOWER ANALYTICS */}
        <Link href="/hr/manpower-analytics" className="group">
          <Card className="h-full border-border/60 hover:border-amber-500/80 shadow-md hover:shadow-xl transition-all duration-300 bg-card hover:bg-amber-500/[0.02] cursor-pointer">
            <CardHeader className="space-y-1">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg font-bold pt-4 uppercase text-foreground group-hover:text-amber-500 transition-colors">
                Manpower Analytics
              </CardTitle>
              <CardDescription className="text-xs">
                View trend lines, absence rates, and status distributions over custom date ranges.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}