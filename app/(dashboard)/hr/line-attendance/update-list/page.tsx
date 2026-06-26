"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, Edit2, Trash2, Plus, RefreshCw, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";

interface EmployeeRow {
  id: string;
  emp_code: string;
  emp_name: string;
  deprt: string;
  agency: string;
  shift: string;
  station_no: string;
  area: string;
  status: string;
  active: number;
}

const initialFormState = {
  id: "",
  emp_code: "",
  emp_name: "",
  deprt: "",
  agency: "",
  shift: "",
  station_no: "",
  area: "",
  status: "active"
};

export default function ManpowerUpdateListPage() {
  const [mounted, setMounted] = useState(false);
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [form, setForm] = useState(initialFormState);

  // Deletion confirm state
  const [deleteTarget, setDeleteTarget] = useState<EmployeeRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";
  const API_URL = `${apiBase}/ac/hr/line-manpower/attendance`;

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL, { timeout: 10000 });
      const rawData = res?.data?.manpowerpunchData || res?.data?.data || res?.data || [];
      const data = rawData.map((row: any) => ({
        ...row,
        status: Number(row.active) === 1 ? "active" : (Number(row.active) === 2 ? "Pool" : "inactive")
      }));
      // Sort by descending ID
      data.sort((a: EmployeeRow, b: EmployeeRow) => Number(b.id) - Number(a.id));
      setRows(data);
    } catch (error) {
      console.error("Fetch failed:", error);
      toast.error("Failed to load records from database.");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (mounted) {
      fetchData();
    }
  }, [mounted, fetchData]);

  // Options lists for autocomplete datalists
  const selectOptions = useMemo(() => {
    const fields = ["area", "deprt", "agency", "shift"];
    const options: Record<string, string[]> = {
      status: ["active", "inactive", "Pool"]
    };
    fields.forEach(field => {
      const dbVals = rows.map(r => String(r[field as keyof EmployeeRow] || "")).filter(Boolean);
      options[field] = [...new Set(dbVals)].sort();
    });
    return options;
  }, [rows]);

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(initialFormState);
  };

  const handleEdit = (row: EmployeeRow) => {
    setForm({ ...row });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!form.emp_code.trim() || !form.emp_name.trim()) {
      toast.warning("Employee Code and Name are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        active: form.status === "active" ? 1 : (form.status === "Pool" ? 2 : 0)
      };
      const cleanedPayload: any = { ...payload };
      delete cleanedPayload.status;

      if (form.id) {
        await axios.put(`${API_URL}/${form.id}`, cleanedPayload, { timeout: 10000 });
        toast.success("Roster record updated successfully.");
      } else {
        await axios.post(API_URL, cleanedPayload, { timeout: 10000 });
        toast.success("Roster record added successfully.");
      }
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Operation failed to save worker update.");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (row: EmployeeRow) => {
    setDeleteTarget(row);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${API_URL}/${deleteTarget.id}`, { timeout: 10000 });
      toast.success("Roster record deleted successfully.");
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete record.");
    }
  };

  const filteredRows = useMemo(() => {
    if (!searchText) return rows;
    const term = searchText.toLowerCase();
    return rows.filter(row =>
      String(row.emp_code || "").toLowerCase().includes(term) ||
      String(row.emp_name || "").toLowerCase().includes(term) ||
      String(row.area || "").toLowerCase().includes(term) ||
      String(row.deprt || "").toLowerCase().includes(term) ||
      String(row.station_no || "").toLowerCase().includes(term) ||
      String(row.agency || "").toLowerCase().includes(term) ||
      String(row.shift || "").toLowerCase().includes(term) ||
      String(row.status || "").toLowerCase().includes(term)
    );
  }, [rows, searchText]);

  const columns: ColumnConfig<EmployeeRow>[] = [
    {
      header: "Employee Code",
      accessorKey: "emp_code",
      isSortable: true,
      isFilterable: true
    },
    {
      header: "Employee Name",
      accessorKey: "emp_name",
      isSortable: true,
      isFilterable: true
    },
    {
      header: "Area",
      accessorKey: "area",
      isSortable: true,
      isFilterable: true
    },
    {
      header: "Department",
      accessorKey: "deprt",
      isSortable: true,
      isFilterable: true
    },
    {
      header: "Station No",
      accessorKey: "station_no",
      isSortable: true,
      isFilterable: true
    },
    {
      header: "Agency",
      accessorKey: "agency",
      isSortable: true,
      isFilterable: true
    },
    {
      header: "Shift",
      accessorKey: "shift",
      isSortable: true,
      isFilterable: true
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
          row.status === "active" 
            ? "bg-emerald-500/10 text-emerald-600" 
            : row.status === "Pool"
              ? "bg-amber-500/10 text-amber-600"
              : "bg-rose-500/10 text-rose-600"
        }`}>
          {row.status}
        </span>
      ),
      isSortable: true,
      isFilterable: true
    },
    {
      header: "Operations",
      accessorKey: "actions",
      cell: (row) => (
        <div className="flex justify-center gap-1.5">
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7 border-border hover:bg-slate-100 hover:text-blue-600"
            onClick={() => handleEdit(row)}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7 border-rose-100 hover:bg-rose-50 hover:text-rose-600 text-rose-500"
            onClick={() => openDeleteConfirm(row)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ];

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* HEADER BAR */}
      <div className="flex items-center gap-3">
        <Link href="/hr/line-attendance">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
            Manpower Roster Editor
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quickly edit details, line stations, agency shifts, and area allocations.
          </p>
        </div>
      </div>

      {/* QUICK FORM CARD */}
      <Card className="border-border/60 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent border-b border-border/40 pb-4">
          <CardTitle className="text-sm font-bold tracking-wide text-foreground uppercase flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-blue-500" />
            {form.id ? "Modify Roster Record" : "Enroll New Employee"}
          </CardTitle>
          <CardDescription className="text-xs">
            Type or select values for shopfloor fields. All fields are searchable.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Employee Code</Label>
              <Input
                value={form.emp_code}
                onChange={(e) => handleChange("emp_code", e.target.value)}
                placeholder="Roster identifier"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Employee Name</Label>
              <Input
                value={form.emp_name}
                onChange={(e) => handleChange("emp_name", e.target.value)}
                placeholder="Roster full name"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Station No</Label>
              <Input
                value={form.station_no}
                onChange={(e) => handleChange("station_no", e.target.value)}
                placeholder="Roster assembly station"
                className="h-9 text-xs"
              />
            </div>

            {["area", "deprt", "agency", "shift", "status"].map((key) => {
              const label = key === "deprt" ? "Department" : key.charAt(0).toUpperCase() + key.slice(1);
              return (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs font-semibold">{label}</Label>
                  <input
                    type="text"
                    list={`datalist-${key}`}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={`Select or type ${label.toLowerCase()}`}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-blue-500"
                  />
                  <datalist id={`datalist-${key}`}>
                    {(selectOptions[key] || []).map(val => (
                      <option key={val} value={val} />
                    ))}
                  </datalist>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border/45">
            {form.id && (
              <Button size="sm" variant="outline" onClick={resetForm} disabled={saving} className="h-9 text-xs">
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> {form.id ? "Update Record" : "Save Record"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DIRECTORY TABLE */}
      <Card className="border-border/60 shadow-md">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4 gap-4">
          <div>
            <CardTitle className="text-sm font-bold tracking-wide text-foreground uppercase">
              Manpower Directory
            </CardTitle>
            <CardDescription className="text-xs">
              Search and filter the live database of assembly line allocations.
            </CardDescription>
          </div>
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search directory..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-8 text-xs rounded-lg"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <CommonTable
            data={filteredRows}
            columns={columns}
            loading={loading}
            enableFiltering={false}
            enableExport={true}
            exportFileName="Manpower_Roster_Editor_Export.csv"
            noDataMessage="No manpower records loaded."
            initialPageSize={10}
          />
        </CardContent>
      </Card>

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Roster Record"
        description={`Are you sure you want to delete the roster record for "${deleteTarget?.emp_name}" (${deleteTarget?.emp_code})? This will permanently remove them from historical live punch logs.`}
        onConfirm={handleDelete}
        confirmText="Remove"
        variant="destructive"
      />
    </div>
  );
}
