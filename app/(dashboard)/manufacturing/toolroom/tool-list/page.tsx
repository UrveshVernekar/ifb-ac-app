"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Edit, Trash2, Eye, Calendar, Settings, Info, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

export default function ToolListPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toolListRaw, setToolListRaw] = useState<any>({
        "IMM-MOULD": [],
        "LINE-TOOL": [],
        "PRESS-TOOL": []
    });
    const [hasAccessEdit, setHasAccessEdit] = useState(false);
    const [loginData, setLoginData] = useState<any>(null);

    // Active Category states
    const [activeTab, setActiveTab] = useState("Press Tools"); // Press Tools, IMM Moulds, Line Tools
    const [searchTerm, setSearchTerm] = useState("");

    // Modal dialogs trigger states
    // 1. Recondition Plan view
    const [reconPlanOpen, setReconPlanOpen] = useState(false);
    const [selectedReconData, setSelectedReconData] = useState<any[]>([]);
    const [selectedReconToolName, setSelectedReconToolName] = useState("");

    // 2. Update Shots Dialog
    const [updateShotsOpen, setUpdateShotsOpen] = useState(false);
    const [selectedShotsTool, setSelectedShotsTool] = useState<any>(null);
    const [shotsIncrement, setShotsIncrement] = useState("");
    const [newShotsTotal, setNewShotsTotal] = useState(0);
    const [selectedMonth, setSelectedMonth] = useState("");
    const [shotsConfirmOpen, setShotsConfirmOpen] = useState(false);
    const [shotsSaving, setShotsSaving] = useState(false);

    // 3. Tool Add/Edit modal
    const [toolFormOpen, setToolFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<"add" | "edit">("add");
    const [editingTool, setEditingTool] = useState<any>(null);

    // Tool Delete confirm dialog states
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [toolToDelete, setToolToDelete] = useState<any>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Add/Edit Form states
    const [formType, setFormType] = useState("IMM-MOULD");
    const [formCode, setFormCode] = useState("");
    const [formName, setFormName] = useState("");
    const [formMachine, setFormMachine] = useState("");
    const [formQuantity, setFormQuantity] = useState("");
    const [formOperation, setFormOperation] = useState("");
    const [formLifeExpectancy, setFormLifeExpectancy] = useState("500000");
    const [formPmScheduleType, setFormPmScheduleType] = useState("FREQUENCY"); // FREQUENCY, SHOTS
    const [formPmFrequency, setFormPmFrequency] = useState("Weekly"); // Weekly, Twice a Month, Monthly, Quarterly
    const [formPmShotThreshold, setFormPmShotThreshold] = useState("");
    const [formPmStartDate, setFormPmStartDate] = useState(() => new Date().toISOString().split("T")[0]);

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";

    const monthsList = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const fetchTools = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${apiBase}/production/toolroom/get-toolslist`);
            setToolListRaw(response.data || { "IMM-MOULD": [], "LINE-TOOL": [], "PRESS-TOOL": [] });
        } catch (error) {
            console.error("Error loading tools database:", error);
            toast.error("Failed to load tools database.");
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

            const accessStr = sessionStorage.getItem("accesslist");
            if (accessStr) {
                const list = JSON.parse(accessStr);
                const idMatch = list.some((user: any) => String(user.Employee_code) === String(data.id));
                setHasAccessEdit(idMatch);
            }
        }
        fetchTools();
    }, [apiBase]);

    // Handle initial preselection for update shots month (previous month)
    useEffect(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        setSelectedMonth(monthsList[d.getMonth()]);
    }, []);

    // Helper: recalculate new shot totals
    useEffect(() => {
        if (selectedShotsTool) {
            const curr = Number(selectedShotsTool.Shots_taken) || 0;
            const inc = Number(shotsIncrement) || 0;
            setNewShotsTotal(curr + inc);
        }
    }, [shotsIncrement, selectedShotsTool]);

    if (!mounted) return null;

    // Filter tools list for Category tab & search criteria
    const getFilteredTools = () => {
        let rawList: any[] = [];
        if (activeTab === "IMM Moulds") rawList = toolListRaw["IMM-MOULD"] || [];
        else if (activeTab === "Line Tools") rawList = toolListRaw["LINE-TOOL"] || [];
        else if (activeTab === "Press Tools") rawList = toolListRaw["PRESS-TOOL"] || [];

        // Sort by S_No
        const sorted = [...rawList].sort((a, b) => Number(a.S_No) - Number(b.S_No));

        if (!searchTerm) return sorted;

        const term = searchTerm.toLowerCase();
        return sorted.filter((t) => {
            const code = String(t.Press_Tool_Code || t.Mould_Name || t.Tool || "").toLowerCase();
            const name = String(t.Press_Tool_Name || t.Mould_Name || t.Tool || "").toLowerCase();
            const machine = String(t.Machine || "").toLowerCase();
            const operation = String(t.Opeartion || "").toLowerCase();

            return code.includes(term) || name.includes(term) || machine.includes(term) || operation.includes(term);
        });
    };

    const filteredTools = getFilteredTools();

    // Reset Form fields
    const resetFormFields = () => {
        setFormType(activeTab === "IMM Moulds" ? "IMM-MOULD" : activeTab === "Press Tools" ? "PRESS-TOOL" : "LINE-TOOL");
        setFormCode("");
        setFormName("");
        setFormMachine("");
        setFormQuantity("");
        setFormOperation("");
        setFormLifeExpectancy("500000");
        setFormPmScheduleType("FREQUENCY");
        setFormPmFrequency("Weekly");
        setFormPmShotThreshold("");
        setFormPmStartDate(new Date().toISOString().split("T")[0]);
        setEditingTool(null);
    };

    // Trigger tool creation form
    const triggerAddTool = () => {
        resetFormFields();
        setFormMode("add");
        setToolFormOpen(true);
    };

    // Trigger tool modification form
    const triggerEditTool = (tool: any) => {
        setFormMode("edit");
        setEditingTool(tool);
        setFormType(tool.Type || "");

        // Resolve code & name properties
        setFormCode(tool.Press_Tool_Code || tool.Mould_Name || tool.Tool || "");
        setFormName(tool.Press_Tool_Name || tool.Mould_Name || tool.Tool || "");
        setFormMachine(tool.Machine || "");
        setFormQuantity(tool.Qty || "");
        setFormOperation(tool.Opeartion || "");
        setFormLifeExpectancy(String(tool.life || 500000));
        setFormPmScheduleType(tool.pm_schedule_type || "FREQUENCY");
        setFormPmFrequency(tool.pm_frequency || "Weekly");
        setFormPmShotThreshold(String(tool.pm_shot_threshold || ""));
        setFormPmStartDate(tool.pm_start_date ? tool.pm_start_date.split("T")[0] : new Date().toISOString().split("T")[0]);

        setToolFormOpen(true);
    };

    // Submissions
    const triggerSaveShots = (e: React.FormEvent) => {
        e.preventDefault();
        const inc = Number(shotsIncrement) || 0;
        if (inc <= 0) {
            toast.error("Invalid increment count value.");
            return;
        }
        setShotsConfirmOpen(true);
    };

    const confirmSaveShots = async () => {
        setShotsSaving(true);
        try {
            await axios.post(`${apiBase}/production/toolroom/updateshots`, {
                S_No: selectedShotsTool.S_No,
                Shots_taken: newShotsTotal,
                Shot_increment: Number(shotsIncrement),
                Month: selectedMonth
            });
            toast.success("Shots updated successfully!");
            setShotsConfirmOpen(false);
            setUpdateShotsOpen(false);
            setSelectedShotsTool(null);
            setShotsIncrement("");
            fetchTools();
        } catch (error) {
            console.error("Error updating shots count:", error);
            toast.error("Failed to update shots registry.");
        } finally {
            setShotsSaving(false);
        }
    };

    const handleSaveTool = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formCode || !formName || !formLifeExpectancy || !formPmScheduleType) {
            toast.error("Please fill in all required parameters.");
            return;
        }

        const payload = {
            type: formType,
            code: formCode,
            name: formName,
            machine: formMachine || null,
            quantity: formQuantity ? Number(formQuantity) : null,
            operation: formOperation || null,
            life_expectancy: Number(formLifeExpectancy),
            pm_schedule_type: formPmScheduleType,
            pm_frequency: formPmScheduleType === "FREQUENCY" ? formPmFrequency : null,
            pm_shot_threshold: formPmScheduleType === "SHOTS" ? Number(formPmShotThreshold) : null,
            pm_start_date: formPmScheduleType === "FREQUENCY" ? formPmStartDate : null,
            id: editingTool ? editingTool.S_No : undefined,
            punched_by: loginData?.name || "System"
        };

        try {
            const endpoint = formMode === "add" ? "add-tool" : "update-tool";
            await axios.post(`${apiBase}/production/toolroom/${endpoint}`, payload);
            toast.success(`Tool ${formMode === "add" ? "added" : "updated"} successfully!`);
            setToolFormOpen(false);
            fetchTools();
        } catch (error: any) {
            console.error("Error saving tool:", error);
            toast.error(error?.response?.data?.message || "Failed to submit tool asset.");
        }
    };

    const confirmDeleteTool = async () => {
        if (!toolToDelete) return;
        setDeleteLoading(true);
        try {
            await axios.post(`${apiBase}/production/toolroom/delete-tool`, {
                id: toolToDelete.S_No,
                punched_by: loginData?.name || "System"
            });
            toast.success("Tool deleted successfully!");
            setDeleteConfirmOpen(false);
            setToolToDelete(null);
            fetchTools();
        } catch (error) {
            console.error("Error deleting tool:", error);
            toast.error("Failed to delete tool asset.");
        } finally {
            setDeleteLoading(false);
        }
    };

    // Columns config for CommonTable based on active category
    const getColumnsConfig = (): ColumnConfig<any>[] => {
        const list: ColumnConfig<any>[] = [];

        // Category specific columns
        if (activeTab === "IMM Moulds") {
            list.push(
                {
                    header: "Mould Name",
                    accessorKey: "Mould_Name",
                    isSortable: true,
                    className: "font-semibold text-foreground text-left"
                }
            );
        } else if (activeTab === "Line Tools") {
            list.push(
                {
                    header: "Tool Name",
                    accessorKey: "Tool",
                    isSortable: true,
                    className: "font-semibold text-foreground text-left"
                },
                {
                    header: "Machine",
                    accessorKey: "Machine",
                    isSortable: true,
                    className: "text-muted-foreground"
                },
                {
                    header: "Qty",
                    accessorKey: "Qty",
                    className: "text-center font-medium w-16",
                    headerClassName: "text-center",
                    cell: (item: any) => item.Qty || 1
                }
            );
        } else {
            list.push(
                {
                    header: "Tool Name",
                    accessorKey: "Press_Tool_Name",
                    isSortable: true,
                    className: "font-semibold text-foreground text-left"
                },
                {
                    header: "Operation",
                    accessorKey: "Opeartion",
                    isSortable: true,
                    className: "text-muted-foreground"
                },
                {
                    header: "Code",
                    accessorKey: "Press_Tool_Code",
                    isSortable: true,
                    className: "font-mono font-medium"
                }
            );
        }

        // Shared shots taken column with custom monthly shots hover tooltip
        list.push({
            header: activeTab === "IMM Moulds" ? "Life Stroke Count" : activeTab === "Line Tools" ? "Shots Count" : "Stroke Count",
            accessorKey: "Shots_taken",
            isSortable: true,
            className: "text-center w-36",
            headerClassName: "text-center",
            cell: (item: any) => (
                <div className="relative group cursor-pointer border-b border-dashed border-muted-foreground/65 inline-block mx-auto">
                    <span className="font-bold text-foreground">{item.Shots_taken || 0}</span>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-popover text-popover-foreground border border-border p-3 rounded-xl shadow-xl text-left min-w-[150px] z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-1 border-b border-border pb-1">Shot History</span>
                        <div className="space-y-0.5 text-[9px]">
                            {["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].map((m) => {
                                const shots = item[`${m}_shots`] || 0;
                                return (
                                    <div key={m} className="flex justify-between gap-4 font-semibold">
                                        <span className="uppercase text-muted-foreground">{m}</span>
                                        <span className="text-foreground">{shots}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )
        });

        // Life utilization
        list.push({
            header: "Life Utilization",
            accessorKey: "utilization",
            isSortable: true,
            className: "text-center w-28",
            headerClassName: "text-center",
            cell: (item: any) => {
                const utilization = ((Number(item.Shots_taken || 0) / Number(item.life || 1)) * 100).toFixed(2);
                const isHighUtil = Number(utilization) > 85;
                return (
                    <Badge variant="outline" className={`text-[10px] font-bold ${isHighUtil ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 'bg-green-500/10 text-green-600 border-green-500/20'
                        }`}>
                        {utilization}%
                    </Badge>
                );
            }
        });

        // Add shots button (access restricted)
        if (hasAccessEdit) {
            list.push({
                header: "Counter",
                accessorKey: "counter",
                className: "text-center w-20",
                headerClassName: "text-center",
                cell: (item: any) => (
                    <Button
                        variant="default"
                        size="sm"
                        className="h-6 text-[9px] font-bold bg-blue-600 hover:bg-blue-500 text-white"
                        onClick={() => {
                            setSelectedShotsTool(item);
                            setShotsIncrement("");
                            setUpdateShotsOpen(true);
                        }}
                    >
                        ADD
                    </Button>
                )
            });
        }

        // View recondition plan
        list.push({
            header: "Recondition",
            accessorKey: "recondition",
            className: "text-center w-28",
            headerClassName: "text-center",
            cell: (item: any) => item.reconData && item.reconData.length > 0 ? (
                <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] font-bold gap-1 px-2 border-border/80 text-purple-600 dark:text-purple-400"
                    onClick={() => {
                        setSelectedReconToolName(item.Mould_Name || item.Press_Tool_Code || item.Tool);
                        setSelectedReconData(item.reconData);
                        setReconPlanOpen(true);
                    }}
                >
                    <Eye className="w-3 h-3" /> View
                </Button>
            ) : (
                <span className="text-[10px] text-muted-foreground font-semibold">NO PLAN</span>
            )
        });

        // Lifecycle Redirect button
        list.push({
            header: "Lifecycle",
            accessorKey: "lifecycle",
            className: "text-center w-24",
            headerClassName: "text-center",
            cell: (item: any) => (
                <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] font-bold border-border/80 text-blue-600 dark:text-blue-400"
                    onClick={() => {
                        const mapTab = activeTab === "IMM Moulds" ? "IMM-MOULD" : activeTab === "Press Tools" ? "PRESS-TOOL" : "LINE-TOOL";
                        router.push(`/manufacturing/toolroom/tool-history?activeTab=${mapTab}&S_No=${item.S_No}`);
                    }}
                >
                    History
                </Button>
            )
        });

        // Edit/Delete actions (access restricted)
        if (hasAccessEdit) {
            list.push({
                header: "Actions",
                accessorKey: "actions",
                className: "text-center w-36",
                headerClassName: "text-center",
                cell: (item: any) => (
                    <div className="flex justify-center gap-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 border-border/80 text-amber-500 hover:text-amber-600"
                            onClick={() => triggerEditTool(item)}
                        >
                            <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 border-border/80 text-rose-500 hover:text-rose-600"
                            onClick={() => {
                                setToolToDelete(item);
                                setDeleteConfirmOpen(true);
                            }}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                )
            });
        }

        return list;
    };

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
                        <Badge className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20">
                            Asset Database
                        </Badge>
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight mt-2 text-foreground">
                        Tool List Registry
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Verify tool inventory, track shot counters lifecycle percentages, and schedule recondition plans.
                    </p>
                </div>

                {hasAccessEdit && (
                    <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-9 gap-1"
                        onClick={triggerAddTool}
                    >
                        <Plus className="w-4 h-4" /> Add Tool Asset
                    </Button>
                )}
            </div>

            {/* Category tabs & Search filters bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex border-b border-border bg-muted/40 p-1 rounded-xl gap-1 shrink-0 w-full sm:max-w-md">
                    {["Press Tools", "IMM Moulds", "Line Tools"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                setSearchTerm("");
                            }}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center ${activeTab === tab
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-background/30"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Search input */}
                <div className="relative w-full sm:max-w-xs">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full text-xs rounded-lg border border-input pl-9 pr-3 py-2 bg-background text-foreground focus:outline-none"
                    />
                </div>
            </div>

            {/* Table registry */}
            <Card className="border border-border/60 bg-card shadow-sm">
                <CardContent className="p-4 sm:p-6">
                    {loading ? (
                        <div className="text-center py-12 text-xs text-muted-foreground">Loading tool list...</div>
                    ) : (
                        <CommonTable
                            data={filteredTools}
                            columns={getColumnsConfig()}
                            enableFiltering={false}
                            showColumnVisibility={true}
                            initialPageSize={10}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Recondition Plan check modal */}
            {reconPlanOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="max-w-3xl w-full border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="pb-4 border-b border-border/40">
                            <CardTitle className="text-base font-bold">
                                Recondition Strategy: {selectedReconToolName}
                            </CardTitle>
                            <CardDescription className="text-xs">Browse scheduling decisions and target requirements.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4 max-h-[60vh] overflow-y-auto">
                            <div className="overflow-x-auto border border-border/50 rounded-lg">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted text-muted-foreground font-bold border-b border-border">
                                            <th className="p-2.5 text-center w-12">ID</th>
                                            <th className="p-2.5">Tool Management Strategy</th>
                                            <th className="p-2.5">Reconditioning Plan</th>
                                            <th className="p-2.5">New Tool Requirement / Critical Decision</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {selectedReconData.map((recon: any) => (
                                            <tr key={recon.R_id} className="hover:bg-muted/10">
                                                <td className="p-2.5 text-center font-bold text-muted-foreground">{recon.R_id}</td>
                                                <td className="p-2.5 leading-relaxed">{recon.TM_Strat}</td>
                                                <td className="p-2.5 leading-relaxed">{recon.Re_con}</td>
                                                <td className="p-2.5 leading-relaxed font-semibold text-rose-600 dark:text-rose-400">{recon.New_tool_req}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                        <div className="p-4 border-t border-border/40 flex justify-end">
                            <Button
                                size="sm"
                                onClick={() => {
                                    setReconPlanOpen(false);
                                    setSelectedReconData([]);
                                }}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                            >
                                Close
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Update Shots modal dialog */}
            {updateShotsOpen && selectedShotsTool && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="pb-4 border-b border-border/40">
                            <CardTitle className="text-sm font-bold uppercase tracking-wide">Update Shot Counter</CardTitle>
                            <CardDescription className="text-xs">Record monthly shot counts increment values.</CardDescription>
                        </CardHeader>
                        <form onSubmit={triggerSaveShots}>
                            <CardContent className="pt-4 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">Target Asset</label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={selectedShotsTool.Mould_Name || selectedShotsTool.Press_Tool_Code || selectedShotsTool.Tool || ""}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-muted text-muted-foreground cursor-not-allowed outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">Current Life Shots</label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={selectedShotsTool.Shots_taken || "0"}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-muted text-muted-foreground cursor-not-allowed outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">Select Month *</label>
                                    <select
                                        required
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none"
                                    >
                                        {monthsList.map((m) => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">Shots To Be Added *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        placeholder="Enter incremental stroke count..."
                                        value={shotsIncrement}
                                        onChange={(e) => setShotsIncrement(e.target.value)}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">New Calculated Shots</label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={newShotsTotal}
                                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-muted text-slate-800 dark:text-slate-100 font-bold outline-none"
                                    />
                                </div>
                            </CardContent>
                            <div className="p-4 border-t border-border/40 flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setUpdateShotsOpen(false)}
                                    className="font-bold text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                                >
                                    Save Counter
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Create/Edit Tool Modal */}
            {toolFormOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="max-w-lg w-full border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="pb-4 border-b border-border/40">
                            <CardTitle className="text-sm font-bold uppercase tracking-wide">
                                {formMode === "add" ? "Add New Tool Asset" : "Edit Tool Asset"}
                            </CardTitle>
                            <CardDescription className="text-xs">Setup specifications and PM parameters for the asset.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSaveTool}>
                            <CardContent className="pt-4 space-y-4 max-h-[60vh] overflow-y-auto">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Tool type */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground">Tool Type *</label>
                                        <select
                                            disabled={formMode === "edit"}
                                            value={formType}
                                            onChange={(e) => setFormType(e.target.value)}
                                            className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none disabled:bg-muted disabled:cursor-not-allowed"
                                        >
                                            <option value="IMM-MOULD">IMM Mould</option>
                                            <option value="PRESS-TOOL">Press Tool</option>
                                            <option value="LINE-TOOL">Line Tool</option>
                                        </select>
                                    </div>

                                    {/* Code parameter */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground">
                                            {formType === "IMM-MOULD" ? "Mould Code *" : formType === "PRESS-TOOL" ? "Press Tool Code *" : "Tool Code *"}
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formCode}
                                            onChange={(e) => setFormCode(e.target.value)}
                                            placeholder="Enter unique code id..."
                                            className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none"
                                        />
                                    </div>

                                    {/* Name parameter */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground">
                                            {formType === "IMM-MOULD" ? "Mould Name *" : formType === "PRESS-TOOL" ? "Press Tool Name *" : "Tool Name *"}
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formName}
                                            onChange={(e) => setFormName(e.target.value)}
                                            placeholder="Enter descriptive label..."
                                            className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none"
                                        />
                                    </div>

                                    {/* Line Tool specific details */}
                                    {formType === "LINE-TOOL" && (
                                        <>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-foreground">Machine</label>
                                                <input
                                                    type="text"
                                                    value={formMachine}
                                                    onChange={(e) => setFormMachine(e.target.value)}
                                                    placeholder="Assigned machine..."
                                                    className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-foreground">Quantity</label>
                                                <input
                                                    type="number"
                                                    value={formQuantity}
                                                    onChange={(e) => setFormQuantity(e.target.value)}
                                                    placeholder="Asset count..."
                                                    className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Press Tool specific details */}
                                    {formType === "PRESS-TOOL" && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-foreground">Operation</label>
                                            <input
                                                type="text"
                                                value={formOperation}
                                                onChange={(e) => setFormOperation(e.target.value)}
                                                placeholder="Target operation..."
                                                className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none"
                                            />
                                        </div>
                                    )}

                                    {/* Life expectancy */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground">Expected Life Stroke Counts *</label>
                                        <input
                                            type="number"
                                            required
                                            value={formLifeExpectancy}
                                            onChange={(e) => setFormLifeExpectancy(e.target.value)}
                                            className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-border/55 pt-3.5 space-y-4">
                                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">PM Scheduling Parameters</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* PM Schedule select */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-foreground">Scheduling Strategy *</label>
                                            <select
                                                value={formPmScheduleType}
                                                onChange={(e) => setFormPmScheduleType(e.target.value)}
                                                className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none"
                                            >
                                                <option value="FREQUENCY">Frequency Based</option>
                                                <option value="SHOTS">Shot Count Based</option>
                                            </select>
                                        </div>

                                        {/* Frequency details options */}
                                        {formPmScheduleType === "FREQUENCY" && (
                                            <>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-foreground">Frequency *</label>
                                                    <select
                                                        value={formPmFrequency}
                                                        onChange={(e) => setFormPmFrequency(e.target.value)}
                                                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none"
                                                    >
                                                        <option value="Weekly">Weekly</option>
                                                        <option value="Twice a Month">Twice a Month</option>
                                                        <option value="Monthly">Monthly</option>
                                                        <option value="Quarterly">Quarterly</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-foreground">PM Start Date *</label>
                                                    <input
                                                        type="date"
                                                        required
                                                        value={formPmStartDate}
                                                        onChange={(e) => setFormPmStartDate(e.target.value)}
                                                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {/* Stroke Threshold options */}
                                        {formPmScheduleType === "SHOTS" && (
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-foreground">Shot Stroke Threshold *</label>
                                                <input
                                                    type="number"
                                                    required
                                                    value={formPmShotThreshold}
                                                    onChange={(e) => setFormPmShotThreshold(e.target.value)}
                                                    placeholder="Stroke counts threshold..."
                                                    className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                            <div className="p-4 border-t border-border/40 flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setToolFormOpen(false)}
                                    className="font-bold text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                                >
                                    Save Asset
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Shots Increment Update Confirmation */}
            <ConfirmDialog
                open={shotsConfirmOpen}
                onOpenChange={setShotsConfirmOpen}
                title="Update Shot Count"
                description="Are you sure you want to update shot count metrics? This change cannot be reverted."
                onConfirm={confirmSaveShots}
                loading={shotsSaving}
                confirmText="Save Counter"
                cancelText="Cancel"
            />

            {/* Tool Asset Deletion Confirmation */}
            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="Delete Tool Asset"
                description={`Are you sure you want to delete this tool asset? (${toolToDelete ? (toolToDelete.Mould_Name || toolToDelete.Press_Tool_Code || toolToDelete.Tool) : ""})`}
                onConfirm={confirmDeleteTool}
                loading={deleteLoading}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
}
