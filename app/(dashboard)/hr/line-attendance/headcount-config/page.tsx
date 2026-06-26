"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, Trash2, Edit2, Plus, RefreshCw, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";

interface HeadcountRow {
  id: string;
  plant: string;
  line: string;
  type: string;
  headcount: number;
  date: string;
}

const initialFormState = {
  id: "",
  plant: "",
  line: "",
  type: "Contractual",
  headcount: "",
  date: ""
};

export default function HeadcountConfigPage() {
  const [mounted, setMounted] = useState(false);
  const [rows, setRows] = useState<HeadcountRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [form, setForm] = useState(initialFormState);
  const [error, setError] = useState<string | null>(null);

  // Deletion confirm state
  const [deleteTarget, setDeleteTarget] = useState<HeadcountRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";
  const API_URL = `${apiBase}/ac/hr/line-manpower/headcount`;

  useEffect(() => {
    setMounted(true);
    setForm(prev => ({
      ...prev,
      date: new Date().toISOString().split("T")[0]
    }));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(API_URL, { timeout: 10000 });
      setRows(res.data || []);
    } catch (err) {
      console.error("Fetch headcounts failed:", err);
      setError("Failed to connect to the headcount service. Please verify the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (mounted) {
      fetchData();
    }
  }, [mounted, fetchData]);

  // Options derived from rows for datalists
  const plantOptions = useMemo(() => {
    const defaultPlants = ["AC", "WASHER"];
    const dbPlants = rows.map(r => r.plant).filter(Boolean);
    return [...new Set([...defaultPlants, ...dbPlants])].sort();
  }, [rows]);

  const lineOptions = useMemo(() => {
    const defaultLines = ["IDU", "ODU", "Paintshop", "QC", "TL", "FL"];
    const dbLines = rows.map(r => r.line).filter(Boolean);
    return [...new Set([...defaultLines, ...dbLines])].sort();
  }, [rows]);

  const typeOptions = useMemo(() => {
    const defaultTypes = ["Contractual", "On-roll"];
    const dbTypes = rows.map(r => r.type).filter(Boolean);
    return [...new Set([...defaultTypes, ...dbTypes])].sort();
  }, [rows]);

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm({
      id: "",
      plant: "AC",
      line: "",
      type: "Contractual",
      headcount: "",
      date: new Date().toISOString().split("T")[0]
    });
  };

  const handleEdit = (row: HeadcountRow) => {
    setForm({
      id: row.id,
      plant: row.plant || "",
      line: row.line || "",
      type: row.type || "",
      headcount: String(row.headcount || ""),
      date: row.date ? row.date.slice(0, 10) : new Date().toISOString().split("T")[0]
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!form.line.trim()) {
      toast.warning("Line designation is required");
      return;
    }
    if (!form.plant.trim()) {
      toast.warning("Plant designation is required");
      return;
    }
    if (form.headcount === "" || isNaN(Number(form.headcount)) || Number(form.headcount) < 0) {
      toast.warning("A valid non-negative headcount target number is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        plant: form.plant.trim().toUpperCase(),
        line: form.line.trim().toUpperCase(),
        type: form.type ? form.type.trim() : "Contractual",
        headcount: Number(form.headcount),
        date: form.date
      };

      if (form.id) {
        await axios.put(`${API_URL}/${form.id}`, payload, { timeout: 10000 });
        toast.success("Headcount config updated successfully.");
      } else {
        // Prevent duplicate lines in config
        const duplicate = rows.find(
          r => r.line.toUpperCase() === payload.line && r.plant.toUpperCase() === payload.plant
        );
        if (duplicate) {
          toast.error(`Headcount configuration for plant "${payload.plant}" and line "${payload.line}" already exists.`);
          setSaving(false);
          return;
        }
        await axios.post(API_URL, payload, { timeout: 10000 });
        toast.success("Headcount config added successfully.");
      }

      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Operation failed to save headcount configuration.");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (row: HeadcountRow) => {
    setDeleteTarget(row);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${API_URL}/${deleteTarget.id}`, { timeout: 10000 });
      toast.success("Headcount configuration deleted successfully.");
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      console.error("Delete headcount failed:", error);
      toast.error("Operation failed to delete headcount.");
    }
  };

  // Filter based on search box
  const filteredRows = useMemo(() => {
    if (!searchText) return rows;
    const term = searchText.toLowerCase();
    return rows.filter(row =>
      String(row.plant || "").toLowerCase().includes(term) ||
      String(row.line || "").toLowerCase().includes(term) ||
      String(row.type || "").toLowerCase().includes(term) ||
      String(row.headcount || "").toLowerCase().includes(term) ||
      String(row.date || "").toLowerCase().includes(term)
    );
  }, [rows, searchText]);

  const columns: ColumnConfig<HeadcountRow>[] = [
    {
      header: "Effective Date",
      accessorKey: "date",
      cell: (row) => row.date ? new Date(row.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "-",
      isSortable: true
    },
    {
      header: "Plant",
      accessorKey: "plant",
      isSortable: true,
      isFilterable: true
    },
    {
      header: "Line Name",
      accessorKey: "line",
      isSortable: true,
      isFilterable: true
    },
    {
      header: "Type",
      accessorKey: "type",
      isSortable: true,
      isFilterable: true
    },
    {
      header: "Headcount Target",
      accessorKey: "headcount",
      isSortable: true
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
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
            Sanctioned Headcount Config
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure line targets for on-roll and contractual manpower.
          </p>
        </div>
      </div>

      {/* FORM CARD */}
      <Card className="border-border/60 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent border-b border-border/40 pb-4">
          <CardTitle className="text-sm font-bold tracking-wide text-foreground uppercase">
            {form.id ? "Edit Target Headcount" : "Create New Target Configuration"}
          </CardTitle>
          <CardDescription className="text-xs">
            Specify the plant, active assembly line, contract type, and target size.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 align-end">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Plant</Label>
              <input
                type="text"
                list="plants-list"
                value={form.plant}
                onChange={(e) => handleChange("plant", e.target.value)}
                placeholder="Type or select plant"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-blue-500"
              />
              <datalist id="plants-list">
                {plantOptions.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Line Name</Label>
              <input
                type="text"
                list="lines-list"
                value={form.line}
                onChange={(e) => handleChange("line", e.target.value)}
                placeholder="Type or select line"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-blue-500"
              />
              <datalist id="lines-list">
                {lineOptions.map(l => <option key={l} value={l} />)}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Type</Label>
              <input
                type="text"
                list="types-list"
                value={form.type}
                onChange={(e) => handleChange("type", e.target.value)}
                placeholder="Type or select type"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-blue-500"
              />
              <datalist id="types-list">
                {typeOptions.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Headcount Target</Label>
              <Input
                type="number"
                placeholder="Count size"
                value={form.headcount}
                onChange={(e) => handleChange("headcount", e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Effective Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => handleChange("date", e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border/40">
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
                  <Plus className="w-3.5 h-3.5" /> {form.id ? "Update Config" : "Save Config"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* TABLE LIST CARD */}
      <Card className="border-border/60 shadow-md">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4 gap-4">
          <div>
            <CardTitle className="text-sm font-bold tracking-wide text-foreground uppercase">
              Sanctioned Headcounts
            </CardTitle>
            <CardDescription className="text-xs">
              Live configurations governing live targets for presence reporting.
            </CardDescription>
          </div>
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search plant, line..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-8 text-xs rounded-lg"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {error ? (
            <div className="text-center py-8 border border-dashed border-rose-300 rounded-xl bg-rose-50/30 flex flex-col items-center gap-3">
              <span className="text-xs text-rose-600 font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4" /> {error}
              </span>
              <Button size="sm" variant="outline" onClick={fetchData} className="text-xs">
                Retry Connection
              </Button>
            </div>
          ) : (
            <CommonTable
              data={filteredRows}
              columns={columns}
              loading={loading}
              enableFiltering={false}
              enableExport={true}
              exportFileName="sanctioned_headcounts.csv"
              noDataMessage="No headcount configurations defined."
              initialPageSize={10}
            />
          )}
        </CardContent>
      </Card>

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Headcount Config"
        description={`Are you sure you want to delete the headcount configuration for line "${deleteTarget?.line}" (${deleteTarget?.plant})?`}
        onConfirm={handleDelete}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
