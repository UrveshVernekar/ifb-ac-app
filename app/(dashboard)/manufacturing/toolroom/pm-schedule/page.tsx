"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Plus, Trash2, Edit, Calendar, CheckSquare, AlertCircle, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

export default function PmSchedulePage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [scheduleData, setScheduleData] = useState<any>({
        immMouldData: [],
        lineToolsData: [],
        pressToolsData: []
    });
    const [toolsList, setToolsList] = useState<any>({});
    const [hasAccessEdit, setHasAccessEdit] = useState(false);
    const [loginData, setLoginData] = useState<any>(null);

    // Navigation & Tab States
    const [activeTab, setActiveTab] = useState("Press Tools"); // Press Tools, IMM Moulds, Line Tools
    const [activeSubTab, setActiveSubTab] = useState("Detailed View"); // Detailed View, Summary, Yearly View

    // Filter States
    const [selectedMonth, setSelectedMonth] = useState<string>(""); // "" = All
    const [selectedWeek, setSelectedWeek] = useState<string>("");   // "" = All
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Modal dialog trigger states
    const [checksheetOpen, setChecksheetOpen] = useState(false);
    const [selectedChecksheet, setSelectedChecksheet] = useState<any>(null);

    const [customPmOpen, setCustomPmOpen] = useState(false);
    const [customToolCode, setCustomToolCode] = useState("");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");

    const [editPmOpen, setEditPmOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [editStartDate, setEditStartDate] = useState("");
    const [editEndDate, setEditEndDate] = useState("");

    // Cancellation confirm dialog trigger states
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelingItem, setCancelingItem] = useState<any>(null);
    const [cancelingLoading, setCancelingLoading] = useState(false);

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";

    const months = [
        { label: "January", value: 0 },
        { label: "February", value: 1 },
        { label: "March", value: 2 },
        { label: "April", value: 3 },
        { label: "May", value: 4 },
        { label: "June", value: 5 },
        { label: "July", value: 6 },
        { label: "August", value: 7 },
        { label: "September", value: 8 },
        { label: "October", value: 9 },
        { label: "November", value: 10 },
        { label: "December", value: 11 }
    ];

    const years = [2024, 2025, 2026, 2027, 2028];

    const fetchPmData = async () => {
        setLoading(true);
        try {
            const [pmRes, toolsRes] = await Promise.all([
                axios.get(`${apiBase}/production/toolroom/get-pmschedule`),
                axios.get(`${apiBase}/production/toolroom/get-toolslist`)
            ]);
            const responseData = pmRes.data || {};
            setScheduleData({
                immMouldData: responseData["IMM-MOULD"] || [],
                lineToolsData: responseData["LINE-TOOL"] || [],
                pressToolsData: responseData["PRESS-TOOL"] || []
            });
            setToolsList(toolsRes.data || {});
        } catch (error) {
            console.error("Error loading PM Schedules:", error);
            toast.error("Failed to load schedules.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        const dataStr = sessionStorage.getItem("logindata");
        if (dataStr) {
            const data = JSON.parse(dataStr);
            setLoginData(data);

            // Check write access
            const accessStr = sessionStorage.getItem("accesslist");
            if (accessStr) {
                const list = JSON.parse(accessStr);
                const idMatch = list.some((user: any) => String(user.Employee_code) === String(data.id));
                setHasAccessEdit(idMatch);
            }
        }
        fetchPmData();
    }, [apiBase]);

    if (!mounted) return null;

    // Helper: resolve schedule list for active Category tab
    const getActiveCategoryData = () => {
        if (activeTab === "Press Tools") return scheduleData.pressToolsData || [];
        if (activeTab === "IMM Moulds") return scheduleData.immMouldData || [];
        return scheduleData.lineToolsData || [];
    };

    const getToolDisplayName = (item: any) => {
        if (activeTab === "IMM Moulds") return item.Mould_Name || "Mould";
        if (activeTab === "Line Tools") return `${item.Tool || ""} - ${item.Machine || ""}`;
        return item.Press_Tool_Code || item.Press_Tool_Name || "Press Tool";
    };

    // Calculate weekly number of the month (1-4)
    const getMonthlyWeekNumber = (dateStr: string) => {
        if (!dateStr) return 1;
        const date = new Date(dateStr);
        const day = date.getDate();
        if (day <= 7) return 1;
        if (day <= 14) return 2;
        if (day <= 21) return 3;
        return 4;
    };

    // Filter schedules
    const getFilteredSchedules = () => {
        const data = getActiveCategoryData();
        return data.filter((item: any) => {
            const date = new Date(item.start_date);
            if (date.getFullYear() !== selectedYear) return false;

            if (selectedMonth !== "" && date.getMonth() !== Number(selectedMonth)) return false;

            if (selectedWeek !== "") {
                const w = getMonthlyWeekNumber(item.start_date);
                if (w !== Number(selectedWeek)) return false;
            }

            if (searchTerm !== "") {
                const name = getToolDisplayName(item).toLowerCase();
                const term = searchTerm.toLowerCase();
                if (!name.includes(term) && !String(item.status).toLowerCase().includes(term)) return false;
            }

            return true;
        });
    };

    const filteredSchedules = getFilteredSchedules();

    // Summary calculation
    const getSummaryStats = (dataList: any[]) => {
        let scheduled = 0;
        let done = 0;
        let overdue = 0;
        let notDone = 0;

        dataList.forEach((item: any) => {
            const date = new Date(item.start_date);
            if (date.getFullYear() !== selectedYear) return;
            if (selectedMonth !== "" && date.getMonth() !== Number(selectedMonth)) return;
            if (selectedWeek !== "") {
                const w = getMonthlyWeekNumber(item.start_date);
                if (w !== Number(selectedWeek)) return;
            }

            const status = String(item.status).toUpperCase();
            if (status === "SCHEDULED") scheduled++;
            else if (status === "DONE" || status === "DONE (LATE)") done++;
            else if (status === "OVERDUE") overdue++;
            else if (status === "NOT DONE") notDone++;
        });

        return {
            total: scheduled + done + overdue + notDone,
            scheduled,
            done,
            overdue,
            notDone
        };
    };

    const stats = getSummaryStats(getActiveCategoryData());

    // Resolve matrix colors and text for a single schedule
    const getScheduleStatusColor = (schedule: any) => {
        if (!schedule) return { bgColor: "bg-background", textColor: "text-muted-foreground", content: "-" };
        const status = String(schedule.status).toUpperCase();
        if (status === "DONE" || status === "DONE (ON TIME)") {
            return { bgColor: "bg-emerald-500 text-white", textColor: "text-white", content: "X" };
        }
        if (status === "DONE (LATE)" || status === "LATE") {
            return { bgColor: "bg-amber-400 text-black", textColor: "text-black", content: "X" };
        }
        if (status === "OVERDUE" || status === "NOT DONE") {
            return { bgColor: "bg-rose-500 text-white", textColor: "text-white", content: "ND" };
        }
        // Scheduled
        return { bgColor: "bg-blue-500 text-white", textColor: "text-white", content: "S" };
    };

    // Excel matrix CSV exporter
    const handleMatrixExport = () => {
        const currentData = getActiveCategoryData();

        // Get unique tools in current list
        const uniqueTools: any[] = [];
        const seen = new Set();
        currentData.forEach((item: any) => {
            if (!seen.has(item.S_No)) {
                seen.add(item.S_No);
                uniqueTools.push(item);
            }
        });

        if (uniqueTools.length === 0) {
            toast.error("No Schedule Data to Export");
            return;
        }

        // CSV columns
        const headers = ["S.No", "Tool/Mould Details"];
        months.forEach((m) => {
            [1, 2, 3, 4].forEach((w) => {
                headers.push(`${m.label.slice(0, 3)}-W${w}`);
            });
        });

        const rows = uniqueTools.map((tool, idx) => {
            const toolRow = [idx + 1, getToolDisplayName(tool).replace(/,/g, " ")];

            months.forEach((month) => {
                [1, 2, 3, 4].forEach((week) => {
                    const toolSchedules = currentData.filter((item: any) => item.S_No === tool.S_No);
                    const schedule = toolSchedules.find((item: any) => {
                        const date = new Date(item.start_date);
                        if (date.getFullYear() !== selectedYear) return false;
                        if (date.getMonth() !== month.value) return false;
                        let w = getMonthlyWeekNumber(item.start_date);
                        if (w > 4) w = 4;
                        return w === week;
                    });

                    if (schedule) {
                        const status = String(schedule.status).toUpperCase();
                        if (status === "DONE" || status === "DONE (ON TIME)") toolRow.push("Done (On Time)");
                        else if (status === "DONE (LATE)" || status === "LATE") toolRow.push("Done (Late)");
                        else if (status === "OVERDUE" || status === "NOT DONE") toolRow.push("Overdue/Not Done");
                        else toolRow.push("Scheduled");
                    } else {
                        toolRow.push("-");
                    }
                });
            });

            return toolRow;
        });

        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `PM_Schedule_Matrix_${activeTab.replace(" ", "_")}_Year_${selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Schedule Matrix CSV exported successfully!");
    };

    // Confirm cancel PM handler
    const confirmCancelPm = async () => {
        if (!cancelingItem) return;
        setCancelingLoading(true);
        try {
            await axios.post(`${apiBase}/production/toolroom/delete-pm-occurrence`, {
                schedule_occ_id: cancelingItem.schedule_occ_id,
                punched_by: loginData?.name || "System"
            });
            toast.success("PM schedule cancelled successfully.");
            setCancelDialogOpen(false);
            setCancelingItem(null);
            fetchPmData();
        } catch (error) {
            console.error("Error cancelling PM:", error);
            toast.error("Failed to cancel PM schedule.");
        } finally {
            setCancelingLoading(false);
        }
    };

    const handleSaveCustomPm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customToolCode || !customStartDate || !customEndDate) {
            toast.error("Please fill in all inputs.");
            return;
        }

        try {
            const mappedType = activeTab === "IMM Moulds" ? "IMM-MOULD" : activeTab === "Press Tools" ? "PRESS-TOOL" : "LINE-TOOL";
            await axios.post(`${apiBase}/production/toolroom/add-custom-pm`, {
                S_No: customToolCode,
                Type: mappedType,
                start_date: customStartDate,
                end_date: customEndDate,
                punched_by: loginData?.name || "System"
            });
            toast.success("Custom PM schedule added successfully!");
            setCustomPmOpen(false);
            setCustomToolCode("");
            setCustomStartDate("");
            setCustomEndDate("");
            fetchPmData();
        } catch (error: any) {
            console.error("Error adding custom PM:", error);
            toast.error(error?.response?.data?.message || "Failed to schedule custom PM.");
        }
    };

    const handleSaveEditPm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editStartDate || !editEndDate) {
            toast.error("Please fill in all inputs.");
            return;
        }

        try {
            await axios.post(`${apiBase}/production/toolroom/update-pm-occurrence`, {
                schedule_occ_id: editingItem.schedule_occ_id,
                start_date: editStartDate,
                end_date: editEndDate,
                punched_by: loginData?.name || "System"
            });
            toast.success("PM schedule updated successfully!");
            setEditPmOpen(false);
            setEditingItem(null);
            fetchPmData();
        } catch (error: any) {
            console.error("Error updating PM dates:", error);
            toast.error(error?.response?.data?.message || "Failed to update schedule dates.");
        }
    };

    // Helper formatting methods matching legacy Dashboard.jsx
    const getMonthAbbr = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", { month: "short" });
    };

    const getMonthlyWeekNum = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const days = Math.floor((date.getTime() - startOfMonth.getTime()) / (24 * 60 * 60 * 1000));
        return Math.ceil((days + 1) / 7);
    };

    const formatScheduleDate = (dateStr: string) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const abbr = getMonthAbbr(dateStr);
        const week = getMonthlyWeekNum(dateStr);
        return (
            <div className="text-center">
                <div>{`${day}-${month}-${year}`}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                    {abbr} Week {week}
                </div>
            </div>
        );
    };

    // Columns config for CommonTable in Detailed View
    const detailedColumns: ColumnConfig<any>[] = [
        {
            header: "S.No",
            accessorKey: "index",
            className: "text-center w-12",
            headerClassName: "text-center",
            cell: (_item: any, index: number) => <span className="font-bold text-muted-foreground">{index + 1}</span>
        },
        {
            header: "Tool/Mould Details",
            accessorKey: "toolDetails",
            isSortable: true,
            cell: (item: any) => getToolDisplayName(item)
        },
        {
            header: "Scheduled Date",
            accessorKey: "start_date",
            isSortable: true,
            className: "text-center text-muted-foreground w-32",
            headerClassName: "text-center",
            cell: (item: any) => item.start_date ? formatScheduleDate(item.start_date) : "-"
        },
        {
            header: "Complete By",
            accessorKey: "complete_by",
            isSortable: true,
            className: "text-center text-muted-foreground w-32",
            headerClassName: "text-center",
            cell: (item: any) => {
                if (!item.start_date) return "-";
                const d = new Date(item.start_date);
                d.setDate(d.getDate() + 7);
                return formatScheduleDate(d.toISOString());
            }
        },
        {
            header: "Next Due On",
            accessorKey: "next_due_on",
            isSortable: true,
            className: "text-center text-muted-foreground w-32",
            headerClassName: "text-center",
            cell: (item: any) => {
                if (!item.end_date) return "-";
                const d = new Date(item.end_date);
                d.setDate(d.getDate() + 1);
                return formatScheduleDate(d.toISOString());
            }
        },
        {
            header: "Frequency",
            accessorKey: "frequency",
            isSortable: true,
            className: "text-center text-muted-foreground w-28",
            headerClassName: "text-center",
            cell: (item: any) => {
                if (!item.start_date || !item.end_date) return "Unknown";
                const start = new Date(item.start_date);
                const end = new Date(item.end_date);
                const diffInDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                if (diffInDays <= 7) return "Weekly";
                if (diffInDays <= 15) return "Twice a Month";
                if (diffInDays <= 30) return "Monthly";
                if (diffInDays <= 90) return "Quarterly";
                return "Custom";
            }
        },
        {
            header: "Done Date",
            accessorKey: "submitted_at",
            isSortable: true,
            className: "text-center text-muted-foreground w-32",
            headerClassName: "text-center",
            cell: (item: any) => {
                const doneVal = item.submitted_at || item.done_date;
                return doneVal ? formatScheduleDate(doneVal) : "-";
            }
        },
        {
            header: "Status",
            accessorKey: "status",
            isSortable: true,
            className: "text-center w-28",
            headerClassName: "text-center",
            cell: (item: any) => {
                const status = String(item.status).toUpperCase();
                const isDone = status === "DONE" || status === "DONE (LATE)";
                return (
                    <Badge variant="outline" className={`text-[10px] font-bold ${isDone
                            ? "bg-emerald-500/10 text-green-600 border-green-500/20"
                            : status === "OVERDUE"
                                ? "bg-rose-500/10 text-rose-600 border-rose-500/20 animate-pulse"
                                : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        }`}>
                        {item.status || "Scheduled"}
                    </Badge>
                );
            }
        },
        {
            header: "Remarks",
            accessorKey: "remarks",
            className: "max-w-[150px] truncate text-muted-foreground",
            cell: (item: any) => <span title={item.remarks}>{item.remarks || "No Remarks"}</span>
        },
        {
            header: "Actions",
            accessorKey: "actions",
            className: "text-center w-48",
            headerClassName: "text-center",
            cell: (item: any) => {
                const statusUpper = String(item.status).toUpperCase();
                const isPending = statusUpper === "SCHEDULED" || statusUpper === "OVERDUE" || statusUpper === "NOT DONE";

                // Date-based due check
                const currentDate = new Date();
                currentDate.setHours(0, 0, 0, 0);
                const startDate = item.start_date ? new Date(item.start_date) : null;
                if (startDate) startDate.setHours(0, 0, 0, 0);
                const endDate = item.end_date ? new Date(item.end_date) : null;
                if (endDate) endDate.setHours(0, 0, 0, 0);

                const isDue = (
                    (statusUpper === "SCHEDULED" && startDate && currentDate >= startDate) ||
                    (statusUpper === "NOT DONE" && endDate && currentDate <= endDate)
                );

                return (
                    <div className="flex items-center justify-center gap-1.5">
                        {/* View checksheet */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] font-bold gap-1 px-2 border-border/80"
                            onClick={() => {
                                setSelectedChecksheet(item);
                                setChecksheetOpen(true);
                            }}
                        >
                            Checksheet
                        </Button>

                        {/* Form add checksheet link */}
                        {isPending && isDue && hasAccessEdit && (
                            <Button
                                variant="default"
                                size="sm"
                                className="h-7 text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white px-2.5"
                                onClick={() => router.push(`/manufacturing/toolroom/add-pm-checklist?tool_code=${item.S_No}`)}
                            >
                                Perform PM
                            </Button>
                        )}

                        {/* Edit occurrence */}
                        {isPending && hasAccessEdit && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 border-border/80 text-amber-500 hover:text-amber-600"
                                onClick={() => {
                                    setEditingItem(item);
                                    setEditStartDate(item.start_date);
                                    setEditEndDate(item.end_date);
                                    setEditPmOpen(true);
                                }}
                            >
                                <Edit className="w-3.5 h-3.5" />
                            </Button>
                        )}

                        {/* Cancel item */}
                        {isPending && hasAccessEdit && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 border-border/80 text-rose-500 hover:text-rose-600"
                                onClick={() => {
                                    setCancelingItem(item);
                                    setCancelDialogOpen(true);
                                }}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <div className="space-y-6 max-w-8xl mx-auto p-4 sm:p-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push("/manufacturing/toolroom")}
                            className="h-8 gap-1 border-border/80"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Back
                        </Button>
                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                            Preventative Maintenance
                        </Badge>
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight mt-2 text-foreground">
                        PM Schedule
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Monitor tool preventive maintenance plans, view summaries, and audit checklist logs.
                    </p>
                </div>

                {hasAccessEdit && (
                    <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-9 gap-1"
                        onClick={() => setCustomPmOpen(true)}
                    >
                        <Plus className="w-4 h-4" /> Schedule Custom PM
                    </Button>
                )}
            </div>

            {/* Category tabs */}
            <div className="flex border-b border-border bg-muted/40 p-1 rounded-xl gap-1 shrink-0 max-w-md">
                {["Press Tools", "IMM Moulds", "Line Tools"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center ${activeTab === tab
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-background/30"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Sub-view card */}
            <Card className="border border-border/60 bg-card">
                <CardHeader className="pb-3 border-b border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle className="text-sm font-bold uppercase tracking-wider">PM Maintenance Logs</CardTitle>
                        <CardDescription className="text-xs">
                            Active registry for: <strong className="text-foreground">{activeTab}</strong>
                        </CardDescription>
                    </div>

                    {/* Sub tabs selectors */}
                    <div className="flex border border-border bg-muted/30 p-0.5 rounded-lg text-[11px] font-bold">
                        {["Detailed View", "Summary", "Yearly View"].map((sub) => (
                            <button
                                key={sub}
                                onClick={() => setActiveSubTab(sub)}
                                className={`px-3 py-1 rounded-md transition-all ${activeSubTab === sub
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-background/20"
                                    }`}
                            >
                                {sub}
                            </button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="pt-6">

                    {/* Sub view: Detailed View */}
                    {activeSubTab === "Detailed View" && (
                        <div className="space-y-4">
                            {/* Filter bar */}
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Search Tool</label>
                                    <input
                                        type="text"
                                        placeholder="Search code/status..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-1.5 bg-background text-foreground focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Month</label>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-1.5 bg-background text-foreground focus:outline-none"
                                    >
                                        <option value="">All Months</option>
                                        {months.map((m) => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Week</label>
                                    <select
                                        value={selectedWeek}
                                        onChange={(e) => setSelectedWeek(e.target.value)}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-1.5 bg-background text-foreground focus:outline-none"
                                    >
                                        <option value="">All Weeks</option>
                                        <option value="1">Week 1</option>
                                        <option value="2">Week 2</option>
                                        <option value="3">Week 3</option>
                                        <option value="4">Week 4</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Year</label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-1.5 bg-background text-foreground focus:outline-none"
                                    >
                                        {years.map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchPmData}
                                    className="h-8 text-xs font-bold flex gap-1 items-center border-border/80"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" /> Reload
                                </Button>
                            </div>

                            {/* Table */}
                            {loading ? (
                                <div className="text-center py-10 text-xs text-muted-foreground">Loading schedules...</div>
                            ) : (
                                <CommonTable
                                    data={filteredSchedules}
                                    columns={detailedColumns}
                                    enableFiltering={false}
                                    showColumnVisibility={true}
                                    initialPageSize={10}
                                />
                            )}
                        </div>
                    )}

                    {/* Sub view: Summary */}
                    {activeSubTab === "Summary" && (
                        <div className="space-y-6">
                            {/* Filter bar */}
                            <div className="flex flex-wrap gap-4 max-w-xl items-end">
                                <div className="flex-1 min-w-[120px] space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Month</label>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-1.5 bg-background text-foreground focus:outline-none"
                                    >
                                        <option value="">All Months</option>
                                        {months.map((m) => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1 min-w-[120px] space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Week</label>
                                    <select
                                        value={selectedWeek}
                                        onChange={(e) => setSelectedWeek(e.target.value)}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-1.5 bg-background text-foreground focus:outline-none"
                                    >
                                        <option value="">All Weeks</option>
                                        <option value="1">Week 1</option>
                                        <option value="2">Week 2</option>
                                        <option value="3">Week 3</option>
                                        <option value="4">Week 4</option>
                                    </select>
                                </div>
                                <div className="flex-1 min-w-[120px] space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Year</label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-1.5 bg-background text-foreground focus:outline-none"
                                    >
                                        {years.map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Summary Grid stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-4xl">
                                <Card className="border border-border/60 bg-muted/10">
                                    <CardContent className="p-4 text-center space-y-1">
                                        <Calendar className="w-5 h-5 text-blue-500 mx-auto" />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Scheduled Total</span>
                                        <div className="text-xl font-black text-foreground">{stats.total}</div>
                                    </CardContent>
                                </Card>

                                <Card className="border border-border/60 bg-emerald-500/5">
                                    <CardContent className="p-4 text-center space-y-1">
                                        <CheckSquare className="w-5 h-5 text-green-500 mx-auto" />
                                        <span className="text-[10px] font-bold text-green-600 uppercase">Completed (Done)</span>
                                        <div className="text-xl font-black text-green-600 dark:text-green-400">{stats.done}</div>
                                    </CardContent>
                                </Card>

                                <Card className="border border-border/60 bg-rose-500/5">
                                    <CardContent className="p-4 text-center space-y-1">
                                        <AlertCircle className="w-5 h-5 text-red-500 mx-auto" />
                                        <span className="text-[10px] font-bold text-red-600 uppercase">Overdue</span>
                                        <div className="text-xl font-black text-red-600 dark:text-red-400">{stats.overdue}</div>
                                    </CardContent>
                                </Card>

                                <Card className="border border-border/60 bg-amber-500/5">
                                    <CardContent className="p-4 text-center space-y-1">
                                        <Clock className="w-5 h-5 text-amber-500 mx-auto" />
                                        <span className="text-[10px] font-bold text-amber-600 uppercase">Cancelled / Not Done</span>
                                        <div className="text-xl font-black text-amber-600 dark:text-amber-400">{stats.notDone}</div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* Sub view: Yearly View */}
                    {activeSubTab === "Yearly View" && (
                        <div className="space-y-4">
                            {/* Year selector & export buttons */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1 w-32">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Year</label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-1.5 bg-background text-foreground focus:outline-none"
                                    >
                                        {years.map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleMatrixExport}
                                    className="h-9 gap-1 text-xs font-bold border-border/80"
                                >
                                    <Download className="w-3.5 h-3.5" /> Export Yearly Matrix
                                </Button>
                            </div>

                            {/* Legend details row */}
                            <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/40 border border-border/60 rounded-lg text-[10px] font-bold">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-4 h-4 bg-emerald-500 flex items-center justify-center text-[8px] text-white rounded">X</div>
                                    <span className="text-muted-foreground">Done (On Time)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-4 h-4 bg-amber-400 flex items-center justify-center text-[8px] text-black rounded">X</div>
                                    <span className="text-muted-foreground">Done (Late)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-4 h-4 bg-rose-500 flex items-center justify-center text-[8px] text-white rounded">ND</div>
                                    <span className="text-muted-foreground">Overdue / Not Done</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-4 h-4 bg-blue-500 flex items-center justify-center text-[8px] text-white rounded">S</div>
                                    <span className="text-muted-foreground">Scheduled</span>
                                </div>
                            </div>

                            {/* Matrix Scrollable table */}
                            <div className="overflow-x-auto border border-border/60 rounded-xl max-h-[450px] overflow-y-auto">
                                <table className="w-full text-[10px] border-collapse text-center">
                                    <thead className="sticky top-0 z-10 bg-muted shadow-sm">
                                        <tr className="border-b border-border text-muted-foreground font-bold">
                                            <th className="p-3 border-r border-border text-left w-12 bg-muted sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">S.No</th>
                                            <th className="p-3 border-r border-border text-left min-w-[180px] bg-muted sticky left-12 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Tool / Mould ID</th>
                                            {months.map((m) => (
                                                <th key={m.value} colSpan={4} className="p-2 border-r border-border border-b bg-slate-100 text-[9px] uppercase tracking-wide">
                                                    {m.label.slice(0, 3)}
                                                </th>
                                            ))}
                                        </tr>
                                        <tr className="border-b border-border text-muted-foreground font-semibold">
                                            <th className="p-2 border-r border-border bg-muted sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]"></th>
                                            <th className="p-2 border-r border-border bg-muted sticky left-12 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]"></th>
                                            {months.map((m) => (
                                                [1, 2, 3, 4].map((w) => (
                                                    <th key={`${m.value}-W${w}`} className="p-1 border-r border-border min-w-[32px] bg-muted/65 text-[8px]">
                                                        W{w}
                                                    </th>
                                                ))
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {(() => {
                                            const currentData = getActiveCategoryData();
                                            // Get unique tools in current list
                                            const uniqueTools: any[] = [];
                                            const seen = new Set();
                                            currentData.forEach((item: any) => {
                                                if (!seen.has(item.S_No)) {
                                                    seen.add(item.S_No);
                                                    uniqueTools.push(item);
                                                }
                                            });

                                            return uniqueTools.map((tool, idx) => (
                                                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                                    <td className="p-2 border-r border-border font-bold text-muted-foreground text-left sticky left-0 bg-card z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{idx + 1}</td>
                                                    <td className="p-2 border-r border-border font-semibold text-foreground text-left sticky left-12 bg-card z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                                        {getToolDisplayName(tool)}
                                                    </td>
                                                    {months.map((month) => {
                                                        return [1, 2, 3, 4].map((week) => {
                                                            const toolSchedules = currentData.filter((item: any) => item.S_No === tool.S_No);
                                                            const schedule = toolSchedules.find((item: any) => {
                                                                const date = new Date(item.start_date);
                                                                if (date.getFullYear() !== selectedYear) return false;
                                                                if (date.getMonth() !== month.value) return false;
                                                                let w = getMonthlyWeekNumber(item.start_date);
                                                                if (w > 4) w = 4;
                                                                return w === week;
                                                            });

                                                            const cellInfo = getScheduleStatusColor(schedule);

                                                            return (
                                                                <td
                                                                    key={`${month.value}-W${week}`}
                                                                    className={`p-2 border-r border-border font-bold text-center transition-colors ${cellInfo.bgColor} ${cellInfo.textColor}`}
                                                                >
                                                                    {cellInfo.content}
                                                                </td>
                                                            );
                                                        });
                                                    })}
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Checksheet Detail Dialog Modal */}
            {checksheetOpen && selectedChecksheet && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="max-w-2xl w-full border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="pb-4 border-b border-border/40 relative">
                            <span className="absolute top-2 left-6 text-[8px] font-bold text-muted-foreground uppercase">
                                {activeTab === "IMM Moulds" && "Doc No: IFB/MFG/F/74 Rev 00 dtd 01.10.2018"}
                                {activeTab === "Line Tools" && "Doc. No: IFB/MFG/F/121 Rev 00 dtd 01.10.2018"}
                                {activeTab === "Press Tools" && "Doc No: IFB/MFG/F/74 Rev 00 dtd 01.10.2018"}
                            </span>
                            <CardTitle className="text-base font-bold pt-2">
                                Checksheet: {getToolDisplayName(selectedChecksheet)}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Submitted On: <strong>{(selectedChecksheet.submitted_at || selectedChecksheet.done_date) ? new Date(selectedChecksheet.submitted_at || selectedChecksheet.done_date).toLocaleDateString("en-GB") : "N/A"}</strong>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4 max-h-[60vh] overflow-y-auto">
                            {selectedChecksheet.checkpoints && selectedChecksheet.checkpoints.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="overflow-x-auto border border-border/50 rounded-lg">
                                        <table className="w-full text-xs text-left border-collapse">
                                            <thead>
                                                <tr className="bg-muted text-muted-foreground font-bold border-b border-border">
                                                    <th className="p-2 w-10 text-center">No</th>
                                                    <th className="p-2">Checkpoint</th>
                                                    <th className="p-2 text-center w-28">Observation</th>
                                                    <th className="p-2 w-40">Action Taken</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {selectedChecksheet.checkpoints.map((cp: any, idx: number) => (
                                                    <tr key={idx}>
                                                        <td className="p-2 text-center text-muted-foreground">{idx + 1}</td>
                                                        <td className="p-2 font-medium text-foreground">{cp.predefined_checkpoint || cp.checkpoint || "Checkpoint item"}</td>
                                                        <td className="p-2 text-center font-semibold text-slate-800 dark:text-slate-200">{cp.observation || "Checked"}</td>
                                                        <td className="p-2 text-muted-foreground">{cp.action_taken || "-"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        <span className="font-bold text-foreground">Remarks:</span>
                                        <p className="text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/50">
                                            {selectedChecksheet.remarks || "No comments documented."}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-xs text-muted-foreground uppercase font-black tracking-wide bg-muted/20 border border-dashed rounded-lg border-border/60">
                                    Please Refer Physical Copy
                                </div>
                            )}
                        </CardContent>
                        <div className="p-4 border-t border-border/40 flex justify-end">
                            <Button
                                size="sm"
                                onClick={() => {
                                    setChecksheetOpen(false);
                                    setSelectedChecksheet(null);
                                }}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                            >
                                Close
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Custom PM Scheduler Modal */}
            {customPmOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="pb-4 border-b border-border/40">
                            <CardTitle className="text-sm font-bold uppercase tracking-wide">Schedule Custom PM</CardTitle>
                            <CardDescription className="text-xs">Schedule a preventive maintenance event for a specific tool.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSaveCustomPm}>
                            <CardContent className="pt-4 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">Select Tool *</label>
                                    <select
                                        required
                                        value={customToolCode}
                                        onChange={(e) => setCustomToolCode(e.target.value)}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none"
                                    >
                                        <option value="">-- Choose Tool --</option>
                                        {(toolsList[activeTab === "IMM Moulds" ? "IMM-MOULD" : activeTab === "Press Tools" ? "PRESS-TOOL" : "LINE-TOOL"] || []).map((t: any) => {
                                            const label = activeTab === "IMM Moulds"
                                                ? t.Mould_Name
                                                : activeTab === "Press Tools"
                                                    ? t.Press_Tool_Code
                                                    : `${t.Tool} - ${t.Machine}`;
                                            return (
                                                <option key={t.S_No} value={t.S_No}>{label}</option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">Start Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">End Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none"
                                    />
                                </div>
                            </CardContent>
                            <div className="p-4 border-t border-border/40 flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCustomPmOpen(false)}
                                    className="font-bold text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                                >
                                    Schedule PM
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Edit PM Schedule Date Modal */}
            {editPmOpen && editingItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="pb-4 border-b border-border/40">
                            <CardTitle className="text-sm font-bold uppercase tracking-wide">Edit PM Dates</CardTitle>
                            <CardDescription className="text-xs">Modify the scheduled timeline parameters for: {getToolDisplayName(editingItem)}</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSaveEditPm}>
                            <CardContent className="pt-4 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">Start Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={editStartDate ? editStartDate.split("T")[0] : ""}
                                        onChange={(e) => setEditStartDate(e.target.value)}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">End Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={editEndDate ? editEndDate.split("T")[0] : ""}
                                        onChange={(e) => setEditEndDate(e.target.value)}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none"
                                    />
                                </div>
                            </CardContent>
                            <div className="p-4 border-t border-border/40 flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditPmOpen(false)}
                                    className="font-bold text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* PM Cancellation Confirmation Modal */}
            <ConfirmDialog
                open={cancelDialogOpen}
                onOpenChange={setCancelDialogOpen}
                title="Cancel PM Schedule"
                description={`Are you sure you want to cancel the PM schedule for ${cancelingItem ? getToolDisplayName(cancelingItem) : ""}?`}
                onConfirm={confirmCancelPm}
                loading={cancelingLoading}
                confirmText="Cancel PM"
                cancelText="Keep PM"
            />
        </div>
    );
}
