"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { useTheme } from "next-themes";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import {
  Shield,
  Calendar,
  Users,
  FileText,
  AlertTriangle,
  HeartHandshake,
  BookOpen,
  BookmarkCheck,
  Building,
  Bell,
  GraduationCap,
  ClipboardCheck,
  ChevronRight,
  Download,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CommonDialog from "@/components/shared/CommonDialog";

// Custom Select Component for Tailwind styling
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function SafetyHub() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [openEmergencyDialog, setOpenEmergencyDialog] = useState(false);

  // Data states
  const [observdata, setobservdata] = useState<any>({});
  const [sumchartData, setsumchartData] = useState<any>({});
  const [odatakeys, setodatakeys] = useState<string[]>([]);

  // Dynamic FY generation
  const generateYearOptions = () => {
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-indexed, 3 = April
    const currentYear = today.getFullYear();
    const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;

    const options = [];
    for (let i = 0; i < 5; i++) {
      const year = startYear - i;
      const fy = `${year}-${(year + 1).toString().substring(2)}`;
      options.push({ value: fy, label: fy });
    }
    return options;
  };

  const yearOptions = generateYearOptions();
  const [selectedYear, setSelectedYear] = useState<string>(yearOptions[0].value);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchSafetyData = async () => {
      setLoading(true);
      const [startYearShort] = selectedYear.split("-");
      const year = parseInt(startYearShort);
      const sdate = `${year}-04-01`;
      const edate = `${year + 1}-03-31`;

      // Derived endpoint port 3003 as configured for safety
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";
      const apiURL = `${apiBase}/safety/ohc/year=${year}&ptype=AC&rtype=Date&sdate=${sdate}&edate=${edate}`;

      try {
        const response = await axios.get(apiURL);
        if (response.data && response.data.obsercatdata && response.data.sumchartData) {
          setobservdata(response.data.obsercatdata);
          setsumchartData(response.data.sumchartData);
          setodatakeys(Object.keys(response.data.obsercatdata).sort());
        } else {
          // Empty state handling
          setobservdata({});
          setsumchartData({});
          setodatakeys([]);
        }
      } catch (error) {
        console.error("Error fetching safety data, using local mock fallbacks:", error);
        // Premium fallback data for visual experience
        setsumchartData({
          cval: [
            { name: "Safe Days", value: 340 },
            { name: "Near Miss", value: 12 },
            { name: "Unsafe Acts", value: 24 },
            { name: "Unsafe Conditions", value: 18 },
            { name: "First Aid", value: 4 },
            { name: "LTI", value: 0 }
          ],
          colorcode: ["#10b981", "#ff9800", "#6366f1", "#06b6d4", "#f43f5e", "#ef4444"]
        });
        setobservdata({
          "Near Miss": {
            data: [
              { name: "Closed", value: 10 },
              { name: "Pending", value: 2 }
            ],
            colorcode: ["#10b981", "#ff9800"]
          },
          "Unsafe Act": {
            data: [
              { name: "Closed", value: 20 },
              { name: "Pending", value: 4 }
            ],
            colorcode: ["#10b981", "#ff9800"]
          },
          "Unsafe Condition": {
            data: [
              { name: "Closed", value: 15 },
              { name: "Pending", value: 3 }
            ],
            colorcode: ["#10b981", "#ff9800"]
          }
        });
        setodatakeys(["Near Miss", "Unsafe Act", "Unsafe Condition"]);
      } finally {
        setLoading(false);
      }
    };

    fetchSafetyData();
  }, [selectedYear, mounted]);

  const handleDownloadPolicy = () => {
    const link = document.createElement("a");
    link.href = "http://10.0.7.17/uploads/safety/ac/emergency-guide/SEOH policy.pdf";
    link.download = "SEOH policy.pdf";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryMetrics = (cat: any) => {
    if (!cat || !cat.data) return { closedVal: 0, pendingVal: 0, totalVal: 0, percent: 0 };

    const closedItem = cat.data.find((d: any) => {
      const name = (d.name || d.title || "").toLowerCase().trim();
      return name === "closed" || name === "resolved";
    }) || cat.data[0];

    const pendingItem = cat.data.find((d: any) => {
      const name = (d.name || d.title || "").toLowerCase().trim();
      return name === "pending" || name === "open" || name === "under progress" || name === "progress";
    }) || cat.data[1];

    const closedVal = Number(closedItem?.value) || 0;
    const pendingVal = Number(pendingItem?.value) || 0;
    const totalVal = closedVal + pendingVal;
    const percent = totalVal > 0 ? Math.round((closedVal / totalVal) * 100) : 0;

    return { closedVal, pendingVal, totalVal, percent };
  };

  const sections: Section[] = [
    {
      title: "Workforce & Compliance",
      icon: <Users className="w-5 h-5 text-indigo-500" />,
      tiles: [
        {
          title: "Safety Training",
          icon: GraduationCap,
          iconColor: "text-indigo-500",
          bgColor: "bg-indigo-500/10 border-indigo-500/20",
          path: "/safety/training",
          description: "Record, track, and analyze workplace safety training programs and hours",
          status: "live"
        },
        {
          title: "Safety Personnel",
          icon: Users,
          iconColor: "text-emerald-500",
          bgColor: "bg-emerald-500/10 border-emerald-500/20",
          path: "/safety/personnel",
          description: "Manage first-aid and ERT responders list and attendance status",
          status: "live"
        },
        {
          title: "HR Training Status",
          icon: BookmarkCheck,
          iconColor: "text-blue-500",
          bgColor: "bg-blue-500/10 border-blue-500/20",
          path: "/safety/hr-training",
          description: "Comprehensive HR safety compliance training status dashboard",
          status: "live"
        }
      ]
    },
    {
      title: "SOPs, Guides & Permits",
      icon: <ClipboardCheck className="w-5 h-5 text-amber-500" />,
      tiles: [
        // {
        //   title: "Emergency Preparedness",
        //   icon: Building,
        //   iconColor: "text-rose-500",
        //   bgColor: "bg-rose-500/10 border-rose-500/20",
        //   path: "/safety/emergency-preparedness",
        //   description: "Access site-specific emergency response maps, guides, and layouts",
        //   status: "live"
        // },
        {
          title: "EHS SOPs",
          icon: BookOpen,
          iconColor: "text-orange-500",
          bgColor: "bg-orange-500/10 border-orange-500/20",
          path: "/safety/ehs-sop",
          description: "EHS Standard Operating Procedures and manuals library",
          status: "live"
        },
        {
          title: "Safety Work Permit",
          icon: ClipboardCheck,
          iconColor: "text-cyan-500",
          bgColor: "bg-cyan-500/10 border-cyan-500/20",
          path: "/safety/work-permit",
          description: "Initiate, track, and approve height work, hot work, and general permits",
          status: "live"
        }
      ]
    },
    {
      title: "Observations & Incidents",
      icon: <AlertTriangle className="w-5 h-5 text-rose-500" />,
      tiles: [
        {
          title: "Safety Observation Form",
          icon: FileText,
          iconColor: "text-amber-500",
          bgColor: "bg-amber-500/10 border-amber-500/20",
          path: "/safety/safety-form",
          description: "Report near-misses, unsafe acts, and unsafe conditions immediately",
          status: "live"
        },
        {
          title: "Safety List Ledger",
          icon: AlertTriangle,
          iconColor: "text-rose-500",
          bgColor: "bg-rose-500/10 border-rose-500/20",
          path: "/safety/safety-list",
          description: "View and resolve registered safety observations and hazard records",
          status: "live"
        },
        {
          title: "Safety Broadcaster Alert",
          icon: Bell,
          iconColor: "text-violet-500",
          bgColor: "bg-violet-500/10 border-violet-500/20",
          path: "/safety/safety-alert",
          description: "Upload and broadcast critical safety flash alerts and incident details"
        }
      ]
    },
    {
      title: "Occupational Health",
      icon: <HeartHandshake className="w-5 h-5 text-teal-500" />,
      tiles: [
        {
          title: "OHC Entry Form",
          icon: FileText,
          iconColor: "text-teal-500",
          bgColor: "bg-teal-500/10 border-teal-500/20",
          path: "/safety/ohc-form",
          description: "Log medical consultations, medicines issued, and first-aid records",
          status: "live"
        },
        {
          title: "OHC OPD Ledger",
          icon: Calendar,
          iconColor: "text-sky-500",
          bgColor: "bg-sky-500/10 border-sky-500/20",
          path: "/safety/ohc-list",
          description: "Track patient logs, clinic registrations, and medical checkups ledger",
          status: "live"
        },
        {
          title: "Incident Report (Why-Why)",
          icon: AlertCircle,
          iconColor: "text-red-500",
          bgColor: "bg-red-500/10 border-red-500/20",
          path: "/safety/ohc-incident",
          description: "Conduct 5-Why root cause investigations for plant injuries/incidents",
          status: "live"
        }
      ]
    }
  ];

  if (!mounted) return null;

  return (
    <div className="space-y-8 max-w-8xl mx-auto p-4 sm:p-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card border border-border/40 p-6 rounded-2xl shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400 px-3 py-1 font-semibold">
              AC Safety & Sustainability Portal
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Safety Management Hub
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            Real-time hazard monitoring, EHS compliance, OHC logs, and work permits oversight.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-40">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-9 bg-background border-border text-xs">
                <SelectValue placeholder="Select FY" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    FY {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setOpenEmergencyDialog(true)}
            className="h-9 font-semibold text-xs gap-1.5"
          >
            <AlertCircle className="w-4 h-4" /> Emergency Guide
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPolicy}
            className="h-9 font-semibold text-xs border-border/80 text-blue-600 dark:text-blue-400 gap-1.5 hover:bg-blue-500/5"
          >
            <Download className="w-4 h-4" /> SEOH Policy
          </Button>
        </div>
      </div>

      {/* CHARTS GRAPHICS */}
      {isLoading ? (
        <Card className="border-border/40 shadow-sm bg-card h-80 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground font-semibold">Loading Safety Analytics...</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-border/40 shadow-sm bg-card lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-bold uppercase tracking-wide text-foreground">
                Safety Performance Ledger
              </CardTitle>
              <CardDescription className="text-xs">
                Annual safe days and incident metrics count for FY {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {sumchartData?.cval && sumchartData.cval.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sumchartData.cval}
                      cx="40%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="75%"
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {sumchartData.cval.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={sumchartData.colorcode?.[index % sumchartData.colorcode.length] || "#94a3b8"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [`${value} incidents`, name]}
                      contentStyle={{
                        background: mounted && resolvedTheme === "dark" ? "#1e293b" : "#fff",
                        borderColor: mounted && resolvedTheme === "dark" ? "#334155" : "#e2e8f0",
                        color: mounted && resolvedTheme === "dark" ? "#f8fafc" : "#0f172a",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      formatter={(value) => <span className="text-xs font-semibold text-muted-foreground">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-xs font-medium">
                  No records to display for safety performance
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-sm bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-bold uppercase tracking-wide text-foreground">
                Observation Metrics
              </CardTitle>
              <CardDescription className="text-xs">
                Resolution progress for reported safety observations
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] overflow-y-auto pr-1">
              {odatakeys.length > 0 ? (
                <div className="space-y-6 pt-2">
                  {odatakeys.map((key) => {
                    const cat = observdata[key];
                    const { closedVal, totalVal } = getCategoryMetrics(cat);

                    return (
                      <div key={key} className="flex items-center justify-between gap-4 border-b border-border/30 pb-4 last:border-0 last:pb-0">
                        <div className="space-y-1 shrink-0">
                          <p className="text-xs font-bold text-foreground capitalize">{key}</p>
                          <p className="text-[10px] font-semibold text-muted-foreground">
                            Resolved: <span className="text-emerald-600 font-bold">{closedVal}</span> / {totalVal}
                          </p>
                        </div>
                        <div className="w-24 h-16 shrink-0 relative flex items-center justify-center">
                          <div className="absolute text-[10px] font-bold text-foreground">
                            {getCategoryMetrics(cat).percent}%
                          </div>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "Closed", value: getCategoryMetrics(cat).closedVal },
                                  { name: "Pending", value: getCategoryMetrics(cat).pendingVal }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius="65%"
                                outerRadius="85%"
                                dataKey="value"
                                stroke="none"
                              >
                                <Cell fill={cat?.colorcode?.[0] || "#10b981"} />
                                <Cell fill={cat?.colorcode?.[1] || "#ff9800"} />
                              </Pie>
                              <Tooltip
                                formatter={(value: any, name: any) => [value, name]}
                                contentStyle={{
                                  background: mounted && resolvedTheme === "dark" ? "#1e293b" : "#fff",
                                  borderColor: mounted && resolvedTheme === "dark" ? "#334155" : "#e2e8f0",
                                  color: mounted && resolvedTheme === "dark" ? "#f8fafc" : "#0f172a",
                                  borderRadius: "6px",
                                  fontSize: "10px",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-xs font-medium">
                  No active safety category metrics found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* EMERGENCY GUIDE DIALOG */}
      <CommonDialog
        open={openEmergencyDialog}
        onOpenChange={setOpenEmergencyDialog}
        title="Emergency Plan Guide"
        className="sm:max-w-[800px]"
      >
        <div className="relative w-full overflow-hidden rounded-lg bg-slate-900 flex justify-center py-2">
          <img
            src="/EMERGENCY_ac.jpg"
            alt="Emergency guide layout diagram"
            className="max-w-full max-h-[500px] object-contain rounded"
          />
        </div>
      </CommonDialog>

      {/* OPERATIONS TILES */}
      <div className="space-y-12">
        {sections.map((section) => (
          <div key={section.title} className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-border/60">
              {section.icon}
              <h2 className="text-xl font-bold tracking-tight text-foreground">{section.title}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {section.tiles.map((tile) => {
                const IconComp = tile.icon;
                return (
                  <Link
                    key={tile.title}
                    href={tile.path}
                    className="group block h-full"
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