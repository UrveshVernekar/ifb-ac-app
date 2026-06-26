"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, QrCode, Sparkles, Edit2, Trash2, ShieldAlert, Plus, Check, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";
import CommonDialog from "@/components/shared/CommonDialog";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import QRScanner from "@/components/shared/QRScanner";
import { toast } from "sonner";

interface EmployeeRow {
  id: string;
  emp_code: string;
  emp_name: string;
  deprt: string;
  agency?: string;
  shift?: string;
  station_no?: string;
  area?: string;
  status: string;
  active: number;
}

const initialFormState = {
  id: "",
  emp_code: "",
  emp_name: "",
  deprt: "",
  agency: "-",
  shift: "-",
  station_no: "-",
  area: "Others",
  status: "Pool"
};

export default function RegisterEmployeePage() {
  const [mounted, setMounted] = useState(false);
  const [access, setAccess] = useState<any>(null);

  // Tabs: "register" | "pool"
  const [activeTab, setActiveTab] = useState<"register" | "pool">("register");

  // Registration Form state
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [autoGenerate, setAutoGenerate] = useState(false);

  // Pool Count state
  const [poolLine, setPoolLine] = useState("IDU");
  const [poolCount, setPoolCount] = useState("");
  const [poolDate, setPoolDate] = useState("");
  const [poolSaving, setPoolSaving] = useState(false);

  // Deletion confirm state
  const [deleteTarget, setDeleteTarget] = useState<EmployeeRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";
  const API_URL = `${apiBase}/ac/hr/line-manpower/attendance`;

  useEffect(() => {
    setMounted(true);
    setPoolDate(new Date().toISOString().split("T")[0]);
    const stored = sessionStorage.getItem("logindata");
    if (stored) {
      setAccess(JSON.parse(stored));
    }
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
      // Sort descending by id
      data.sort((a: EmployeeRow, b: EmployeeRow) => Number(b.id) - Number(a.id));
      setRows(data);
    } catch (error) {
      console.error("Fetch failed:", error);
      toast.error("Failed to load employee list.");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (mounted && access) {
      if (access.hr_access === 1 || access.production_access === 1) {
        fetchData();
      }
    }
  }, [mounted, access, fetchData]);

  // Fetch pool count when inputs change
  const fetchExistingPoolCount = useCallback(async () => {
    if (!poolLine || !poolDate) return;
    try {
      const baseApiUrl = API_URL.replace("/attendance", "");
      const res = await axios.get(`${baseApiUrl}/pool-counter`, {
        params: { date: poolDate, line: poolLine }
      });
      if (res.data) {
        setPoolCount(res.data.counter);
      } else {
        setPoolCount("");
      }
    } catch (error) {
      console.error("Failed to fetch pool count:", error);
    }
  }, [API_URL, poolLine, poolDate]);

  useEffect(() => {
    if (mounted && activeTab === "pool") {
      fetchExistingPoolCount();
    }
  }, [mounted, activeTab, fetchExistingPoolCount, poolLine, poolDate]);

  const handleSavePoolCount = async () => {
    if (poolCount === "" || isNaN(Number(poolCount)) || Number(poolCount) < 0) {
      toast.warning("Please enter a valid pool count");
      return;
    }
    setPoolSaving(true);
    try {
      const baseApiUrl = API_URL.replace("/attendance", "");
      const username = access?.username || "system";
      await axios.post(`${baseApiUrl}/pool-counter`, {
        line: poolLine,
        counter: Number(poolCount),
        date: poolDate,
        username: username
      });
      toast.success("Pool count updated successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Operation failed to set pool headcount target.");
    } finally {
      setPoolSaving(false);
    }
  };

  // Derive autocomplete options
  const deptOptions = useMemo(() => {
    const list = rows.map(r => r.deprt).filter(Boolean);
    return [...new Set(list)].sort();
  }, [rows]);

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleScan = (decodedText: string) => {
    handleChange("emp_code", decodedText);
    setIsScanning(false);
    toast.success("Employee barcode scanned successfully!");
  };

  const resetForm = () => {
    setForm(initialFormState);
    setAutoGenerate(false);
  };

  const handleToggleAutoGenerate = (checked: boolean) => {
    setAutoGenerate(checked);
    if (checked) {
      const code = Date.now().toString().slice(-8);
      handleChange("emp_code", code);
    } else {
      handleChange("emp_code", "");
    }
  };

  const handleEdit = (row: EmployeeRow) => {
    setForm({
      id: row.id,
      emp_code: row.emp_code,
      emp_name: row.emp_name,
      deprt: row.deprt || "",
      agency: row.agency || "-",
      shift: row.shift || "-",
      station_no: row.station_no || "-",
      area: row.area || "Others",
      status: row.status || "Pool"
    });
    setAutoGenerate(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!form.emp_code.trim() || !form.emp_name.trim()) {
      toast.warning("Employee Code and Name are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        active: form.status === "Pool" ? 2 : (form.status === "active" ? 1 : 0)
      };
      // remove status field to match backend schema
      const cleanedPayload: any = { ...payload };
      delete cleanedPayload.status;

      if (form.id) {
        await axios.put(`${API_URL}/${form.id}`, cleanedPayload, { timeout: 10000 });
        toast.success("Employee roster updated successfully.");
      } else {
        await axios.post(API_URL, cleanedPayload, { timeout: 10000 });
        toast.success("Employee registered successfully.");
      }
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Operation failed to register employee.");
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
      toast.success("Employee record deleted successfully.");
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete employee.");
    }
  };

  const filteredRows = useMemo(() => {
    if (!searchText) return rows;
    const term = searchText.toLowerCase();
    return rows.filter(row =>
      String(row.emp_code || "").toLowerCase().includes(term) ||
      String(row.emp_name || "").toLowerCase().includes(term) ||
      String(row.deprt || "").toLowerCase().includes(term) ||
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
      header: "Department",
      accessorKey: "deprt",
      isSortable: true,
      isFilterable: true
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
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

  // Render unauthorized fallback
  if (access && access.hr_access !== 1 && access.production_access !== 1) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4 animate-bounce">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold uppercase tracking-tight text-foreground">Unauthorized Access</h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs text-center">
          You do not have administrative permissions (HR or Production access) to manage shopfloor registrations.
        </p>
        <Link href="/hr" className="mt-6">
          <Button variant="outline" size="sm">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* HEADER SECTION */}
      <div className="flex items-center gap-3">
        <Link href="/hr/line-attendance">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
            Roster & Registration
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Register shopfloor contractual workers or allocate daily pool headcounts.
          </p>
        </div>
      </div>

      {/* FORM AND TABS CARD */}
      <Card className="border-border/60 shadow-md">
        <div className="border-b border-border/40 px-6 flex gap-4 bg-muted/10">
          <button
            onClick={() => setActiveTab("register")}
            className={`py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 outline-none ${
              activeTab === "register" 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Register Employee
          </button>
          <button
            onClick={() => setActiveTab("pool")}
            className={`py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 outline-none ${
              activeTab === "pool" 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Set Pool Count
          </button>
        </div>

        <CardContent className="pt-6">
          {activeTab === "register" ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/20 pb-4">
                <div>
                  <h3 className="text-sm font-bold tracking-wide text-foreground uppercase">
                    {form.id ? "Modify Employee Record" : "Enroll New Shopfloor Staff"}
                  </h3>
                  <span className="text-[10px] text-muted-foreground">Define identifiers, names, and department tags.</span>
                </div>
                
                {/* Auto Gen toggle */}
                <div className="flex items-center gap-2 border border-border p-1.5 px-3 rounded-lg bg-muted/20">
                  <Label htmlFor="auto-gen" className="text-[10px] font-bold text-muted-foreground uppercase cursor-pointer">Auto Code</Label>
                  <Switch 
                    id="auto-gen" 
                    checked={autoGenerate} 
                    onCheckedChange={handleToggleAutoGenerate}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Employee Code</Label>
                  <div className="relative">
                    <Input
                      disabled={autoGenerate}
                      value={form.emp_code}
                      onChange={(e) => handleChange("emp_code", e.target.value)}
                      placeholder={autoGenerate ? "Auto-generated" : "Enter or scan ID"}
                      className="h-9 text-xs pr-10"
                    />
                    {!autoGenerate && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsScanning(true)}
                        className="absolute right-1.5 top-1 h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Employee Name</Label>
                  <Input
                    value={form.emp_name}
                    onChange={(e) => handleChange("emp_name", e.target.value)}
                    placeholder="Enter full name"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Department</Label>
                  <input
                    type="text"
                    list="depts-list"
                    value={form.deprt}
                    onChange={(e) => handleChange("deprt", e.target.value)}
                    placeholder="Select or type department"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-blue-500"
                  />
                  <datalist id="depts-list">
                    {deptOptions.map(d => <option key={d} value={d} />)}
                  </datalist>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/20">
                <Button size="sm" variant="outline" onClick={resetForm} disabled={saving} className="h-9 text-xs">
                  Clear
                </Button>
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
                      <Plus className="w-3.5 h-3.5" /> {form.id ? "Update Employee" : "Register Employee"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold tracking-wide text-foreground uppercase">
                  Daily Pool Headcount Targets
                </h3>
                <span className="text-[10px] text-muted-foreground">Adjust target counts for pool workers by date and active assembly line.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Line Name</Label>
                  <select
                    value={poolLine}
                    onChange={(e) => setPoolLine(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-background text-foreground text-xs px-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="IDU">IDU</option>
                    <option value="ODU">ODU</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Pool Count</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Enter pool target size"
                    value={poolCount}
                    onChange={(e) => setPoolCount(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Select Date</Label>
                  <Input
                    type="date"
                    value={poolDate}
                    onChange={(e) => setPoolDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/20">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => { setPoolCount(""); setPoolDate(new Date().toISOString().split("T")[0]); }} 
                  disabled={poolSaving} 
                  className="h-9 text-xs"
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={handleSavePoolCount}
                  disabled={poolSaving}
                  className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5"
                >
                  {poolSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Submit Pool Count
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIRECTORY LIST CARD */}
      {activeTab === "register" && (
        <Card className="border-border/60 shadow-md">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4 gap-4">
            <div>
              <CardTitle className="text-sm font-bold tracking-wide text-foreground uppercase">
                Employee Directory
              </CardTitle>
              <CardDescription className="text-xs">
                Browse, search, or edit the master listing of registered contractual staff.
              </CardDescription>
            </div>
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search code, name, status..."
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
              exportFileName="Employee_Roster_List.csv"
              noDataMessage="No registered employees found in database."
              initialPageSize={10}
            />
          </CardContent>
        </Card>
      )}

      {/* QR CAMERA MODAL */}
      {isScanning && (
        <CommonDialog
          open={isScanning}
          onOpenChange={setIsScanning}
          title="Scan Employee Barcode"
          description="Align the employee's QR or Barcode inside the scanner window. Ensure camera access is allowed."
          className="sm:max-w-[450px]"
        >
          <div className="py-2 border border-border/65 rounded-lg overflow-hidden bg-black/5">
            <QRScanner onScan={handleScan} />
          </div>
        </CommonDialog>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Employee Registration"
        description={`Are you sure you want to remove the registered record for "${deleteTarget?.emp_name}" (${deleteTarget?.emp_code})? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Remove"
        variant="destructive"
      />
    </div>
  );
}
