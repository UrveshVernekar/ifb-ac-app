"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, Shield, HeartPulse, UserCheck, Calendar, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";
import CommonDialog from "@/components/shared/CommonDialog";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";

interface PersonnelItem {
  id?: number;
  name: string;
  employeecode: string; // matches employee_code in form
  department: string;
  role: "FIRST AID" | "ERT";
  role_id?: number;
  phone: string;
  punchtime?: string;
  status?: "PRESENT" | "ABSENT";
  updated_at?: string;
}

export default function SafetyPersonnelPage() {
  const [mounted, setMounted] = useState(false);
  const [personnelList, setPersonnelList] = useState<PersonnelItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Modal / Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formEmpCode, setFormEmpCode] = useState("");
  const [formRole, setFormRole] = useState("1"); // 1 = FIRST AID, 2 = ERT
  const [formDept, setFormDept] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete states
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const API_HOST = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";

  const fetchPersonnelData = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_HOST}/safety/safety-personnel/data?plant=AC&date=${selectedDate}`
      );
      const rawData = response.data?.data || [];
      const formatted = rawData.map((item: any) => ({
        ...item,
        status: item.punchtime ? "PRESENT" : "ABSENT"
      }));
      setPersonnelList(formatted);
    } catch (error) {
      console.error("Error fetching personnel data:", error);
      toast.error("Failed to load personnel details");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, API_HOST]);

  useEffect(() => {
    setMounted(true);
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
  }, []);

  useEffect(() => {
    if (mounted && selectedDate) {
      fetchPersonnelData();
    }
  }, [selectedDate, fetchPersonnelData, mounted]);

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormName("");
    setFormEmpCode("");
    setFormRole("1");
    setFormDept("");
    setFormPhone("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: PersonnelItem) => {
    setIsEditMode(true);
    setEditingId(item.id || null);
    setFormName(item.name || "");
    setFormEmpCode(item.employeecode || "");
    setFormRole(String(item.role_id || (item.role === "ERT" ? 2 : 1)));
    setFormDept(item.department || "");
    setFormPhone(item.phone || "");
    setDialogOpen(true);
  };

  const handleSavePersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmpCode || !formDept) {
      toast.error("Please fill out all required fields");
      return;
    }

    const payload = {
      name: formName,
      employee_code: formEmpCode,
      role_id: parseInt(formRole),
      department: formDept,
      phone: formPhone,
      plant: "AC"
    };

    setIsSubmitting(true);
    try {
      if (isEditMode && editingId) {
        await axios.put(`${API_HOST}/safety/safety-personnel/${editingId}`, payload);
        toast.success("Personnel record updated successfully");
      } else {
        await axios.post(`${API_HOST}/safety/safety-personnel`, payload);
        toast.success("New personnel added successfully");
      }
      setDialogOpen(false);
      fetchPersonnelData();
    } catch (error) {
      console.error("Error saving personnel:", error);
      toast.error("Error saving personnel details");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (id: number) => {
    setItemToDelete(id);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API_HOST}/safety/safety-personnel/${itemToDelete}`);
      toast.success("Personnel deleted successfully");
      setDeleteOpen(false);
      fetchPersonnelData();
    } catch (error) {
      console.error("Error deleting personnel:", error);
      toast.error("Failed to delete personnel");
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  // Grouped lists
  const firstAidData = useMemo(() => {
    return personnelList.filter((item) => item.role === "FIRST AID");
  }, [personnelList]);

  const ERTData = useMemo(() => {
    return personnelList.filter((item) => item.role === "ERT");
  }, [personnelList]);

  // Statistics
  const totalCount = personnelList.length;
  const presentCount = personnelList.filter((item) => item.status === "PRESENT").length;
  const absentCount = totalCount - presentCount;

  const firstAidPresent = firstAidData.filter((item) => item.status === "PRESENT").length;
  const ERTPresent = ERTData.filter((item) => item.status === "PRESENT").length;

  const columns = useCallback(
    (roleName: "FIRST AID" | "ERT"): ColumnConfig<PersonnelItem>[] => [
      {
        header: "Sr. No",
        accessorKey: "index",
        isFilterable: false,
        isSortable: false,
        className: "w-12 text-center",
        cell: (_, index) => index + 1,
      },
      {
        header: "Emp Code",
        accessorKey: "employeecode",
        isFilterable: true,
        isSortable: true,
        className: "text-center",
      },
      {
        header: "Name",
        accessorKey: "name",
        isFilterable: true,
        isSortable: true,
        className: "text-left font-semibold",
      },
      {
        header: "Status",
        accessorKey: "status",
        isFilterable: true,
        isSortable: true,
        className: "text-center",
        cell: (row) => (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              row.status === "PRESENT"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-600 border-rose-500/20"
            }`}
          >
            {row.status}
          </span>
        ),
      },
      {
        header: "Punch Time",
        accessorKey: "punchtime",
        className: "text-center",
        cell: (row) => row.punchtime || "--",
      },
      {
        header: "Department",
        accessorKey: "department",
        isFilterable: true,
        isSortable: true,
        className: "text-center capitalize",
      },
      {
        header: "Phone",
        accessorKey: "phone",
        className: "text-center",
        cell: (row) => row.phone || "--",
      },
      {
        header: "Actions",
        accessorKey: "id",
        isFilterable: false,
        isSortable: false,
        className: "w-20 text-center",
        cell: (row) => (
          <div className="flex items-center justify-center gap-1.5">
            <Button
              onClick={() => handleOpenEdit(row)}
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button
              onClick={() => handleOpenDelete(row.id!)}
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-8xl mx-auto p-4 sm:p-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/safety">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
              Safety Personnel Portal
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage ERT and First Aid responder listings and check real-time attendance.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border/60 px-3 py-1 rounded-lg">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-7 text-xs border-0 bg-transparent focus-visible:ring-0 w-[120px]"
            />
          </div>

          <Button
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Personnel
          </Button>
        </div>
      </div>

      {/* METRIC GRIDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 border-0 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="w-24 h-24" />
          </div>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold opacity-85 uppercase tracking-wider">Total Responders</h3>
            <p className="text-4xl font-extrabold mt-2">{totalCount}</p>
            <div className="mt-4 text-xs opacity-75 font-medium">
              First Aid: {firstAidData.length} &nbsp;|&nbsp; ERT: {ERTData.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <UserCheck className="w-24 h-24" />
          </div>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold opacity-85 uppercase tracking-wider">Present Today</h3>
            <p className="text-4xl font-extrabold mt-2">{presentCount}</p>
            <div className="mt-4 text-xs opacity-75 font-medium">
              First Aid: {firstAidPresent} &nbsp;|&nbsp; ERT: {ERTPresent}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500 to-rose-600 border-0 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <HeartPulse className="w-24 h-24" />
          </div>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold opacity-85 uppercase tracking-wider">Absent Today</h3>
            <p className="text-4xl font-extrabold mt-2">{absentCount}</p>
            <div className="mt-4 text-xs opacity-75 font-medium">
              First Aid: {firstAidData.length - firstAidPresent} &nbsp;|&nbsp; ERT: {ERTData.length - ERTPresent}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FIRST AID LEDGER */}
      <Card className="border-border/60 shadow-sm bg-card">
        <CardHeader className="pb-2 border-b border-border/40">
          <CardTitle className="text-md font-bold uppercase text-foreground">
            First Aid Responders Team
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <CommonTable
            data={firstAidData}
            columns={columns("FIRST AID")}
            enableFiltering={true}
            enableExport={true}
            exportFileName={`first_aid_responders_${selectedDate}.csv`}
            noDataMessage="No first aid team members found"
            initialPageSize={5}
          />
        </CardContent>
      </Card>

      {/* ERT LEDGER */}
      <Card className="border-border/60 shadow-sm bg-card">
        <CardHeader className="pb-2 border-b border-border/40">
          <CardTitle className="text-md font-bold uppercase text-foreground">
            Emergency Response Team (ERT)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <CommonTable
            data={ERTData}
            columns={columns("ERT")}
            enableFiltering={true}
            enableExport={true}
            exportFileName={`ert_responders_${selectedDate}.csv`}
            noDataMessage="No ERT members found"
            initialPageSize={5}
          />
        </CardContent>
      </Card>

      {/* ADD/EDIT DIALOG */}
      <CommonDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={isEditMode ? "Edit Safety Personnel" : "Add Safety Personnel"}
        description="Submit safety personnel registry particulars"
      >
        <form onSubmit={handleSavePersonnel} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name" className="text-xs">Full Name *</Label>
            <Input
              id="name"
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="employee_code" className="text-xs">Employee Code *</Label>
              <Input
                id="employee_code"
                type="text"
                value={formEmpCode}
                onChange={(e) => setFormEmpCode(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role" className="text-xs">Assign Role *</Label>
              <Select value={formRole} onValueChange={setFormRole}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1" className="text-xs">FIRST AID</SelectItem>
                  <SelectItem value="2" className="text-xs">ERT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="department" className="text-xs">Department *</Label>
              <Input
                id="department"
                type="text"
                value={formDept}
                onChange={(e) => setFormDept(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-xs">Phone</Label>
              <Input
                id="phone"
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              className="text-xs h-9"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 min-w-[80px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </CommonDialog>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Personnel"
        description="Are you sure you want to delete this safety personnel record? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </div>
  );
}
