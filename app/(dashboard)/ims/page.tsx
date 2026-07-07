"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  Network,
  History,
  Edit,
  CheckSquare,
  ChevronRight,
  BookOpen
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

export default function IMSDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [loginData, setLoginData] = useState<any>(null);
  const [hasAccessEdit, setHasAccessEdit] = useState(false);
  const [hasAccessApproval, setHasAccessApproval] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const dataStr = sessionStorage.getItem("logindata");
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr);
        setLoginData(data);
      } catch (e) {
        console.error("Error parsing login data:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted || !loginData?.id) return;

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";

    setIsLoading(true);
    Promise.all([
      axios.get(`${apiBase}/quality/ims/nodal-officers`),
      axios.get(`${apiBase}/quality/ims/get-approval`)
    ])
      .then(([nodalRes, approvalRes]) => {
        const nodalOfficers = nodalRes.data || [];
        const approvalRequests = approvalRes.data || [];

        // Check edit access: login ID matches one of the nodal officer IDs
        const hasEdit = nodalOfficers.some((officer: any) => officer.id === loginData.id);
        setHasAccessEdit(hasEdit);

        // Check approval access: login ID matches initiator, HOD, or HR approvals
        const hasApproval = approvalRequests.some((request: any) =>
          [request.initiated_by, request.approval_hod, request.approval_hr1, request.approval_hr2]
            .includes(loginData.id)
        );
        setHasAccessApproval(hasApproval);
      })
      .catch((error) => {
        console.error("Error fetching IMS dashboard permissions:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [mounted, loginData]);

  if (!mounted) return null;

  const sections: Section[] = [
    {
      title: "Organization Structure",
      icon: <Network className="w-5 h-5 text-blue-500" />,
      tiles: [
        {
          title: "Organization Chart",
          icon: Network,
          iconColor: "text-blue-500",
          bgColor: "bg-blue-500/10 border-blue-500/20",
          path: "/ims/org-chart",
          description: "Interactive visual rendering of the complete AC organization hierarchy and dotted reporting relations.",
          status: "live"
        },
        {
          title: "Organization History",
          icon: History,
          iconColor: "text-amber-500",
          bgColor: "bg-amber-500/10 border-amber-500/20",
          path: "/ims/org-history",
          description: "Chronological log of additions, deletions, updates, and structural alignments made in the organization.",
          status: "live"
        },
        ...(hasAccessEdit
          ? [
              {
                title: "Edit Organization",
                icon: Edit,
                iconColor: "text-emerald-500",
                bgColor: "bg-emerald-500/10 border-emerald-500/20",
                path: "/ims/edit-org",
                description: "Propose new members, dotted relations, updates, or removals in the structural hierarchy.",
                status: "live" as const
              }
            ]
          : []),
        ...(hasAccessApproval
          ? [
              {
                title: "Approval Requests",
                icon: CheckSquare,
                iconColor: "text-rose-500",
                bgColor: "bg-rose-500/10 border-rose-500/20",
                path: "/ims/approval",
                description: "Review pending structural changes and verify authorizations from HODs and Human Resources.",
                status: "live" as const
              }
            ]
          : [])
      ]
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 px-3 py-1 font-semibold text-[10px]">
              Integrated Management System
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight text-foreground flex items-center gap-2.5">
            <BookOpen className="w-8 h-8 text-blue-500" />
            IMS Portal
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage organization hierarchy, approvals, historical adjustments, and nodal operations.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="h-44 border border-border/60 animate-pulse bg-muted/20">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 bg-muted rounded-xl" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
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
      )}
    </div>
  );
}
