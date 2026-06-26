"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Upload, X, ShieldAlert, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";

interface SafetyDetail {
  id: number;
  obsertype: string;
  obser: string;
  date: string;
  status: string;
}

export default function SafetyActionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sdata, setsData] = useState<SafetyDetail | null>(null);

  // Form Fields
  const [targetDate, setTargetDate] = useState("");
  const [action, setAction] = useState("");
  const [remark, setRemark] = useState("");
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageFilename, setImageFilename] = useState("");

  const API_HOST_3003 = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_HOST_3003}/safety/ohc/getByIdUaucdata?id=${id}`);
      const item = res.data?.[0] || null;
      setsData(item);
    } catch (err) {
      console.error("Error fetching safety details for action:", err);
      toast.error("Failed to load safety observation details");
    } finally {
      setLoading(false);
    }
  }, [id, API_HOST_3003]);

  useEffect(() => {
    setMounted(true);
    const todayStr = new Date().toISOString().split("T")[0];
    setTargetDate(todayStr);
  }, []);

  useEffect(() => {
    if (mounted && id) {
      fetchDetails();
    }
  }, [id, fetchDetails, mounted]);

  const generateUUID = () => {
    if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.warning("Please upload an image file");
        return;
      }
      const extension = file.name.split(".").pop();
      const filename = `${generateUUID()}.${extension}`;
      setImageFile(file);
      setImageFilename(filename);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImageFilename("");
    setImagePreview("");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !sdata) return;

    if (!action.trim()) {
      toast.error("Please specify the action taken");
      return;
    }

    setSubmitting(true);

    let employeeName = "AC User";
    let employeeEmail = "ac_user@ifbglobal.com";
    let employeeCode = "AC-TEMP";
    let userIdVal = employeeCode;

    try {
      const loginDataStr = sessionStorage.getItem("logindata");
      if (loginDataStr) {
        const loginData = JSON.parse(loginDataStr);
        if (loginData) {
          userIdVal = loginData.id || userIdVal;
          employeeName = loginData.name || employeeName;
          employeeEmail = loginData.email || employeeEmail;
        }
      } else {
        employeeName = sessionStorage.getItem("employee_name") || employeeName;
        employeeEmail = sessionStorage.getItem("employee_email") || employeeEmail;
        employeeCode = sessionStorage.getItem("employee_code") || employeeCode;
        userIdVal = employeeCode;
      }
    } catch (e) {
      // fallback
    }

    const formdata = {
      stdate: new Date(targetDate).toISOString(),
      saction: action,
      sremark: remark,
      tstatus: taskCompleted,
    };

    const userdetails = {
      userid: userIdVal,
      username: employeeName,
      email: employeeEmail,
      status: 1,
    };

    const data = new FormData();
    data.append("formdata", JSON.stringify(formdata));
    data.append("status", JSON.stringify(0));
    data.append("userdetails", JSON.stringify(userdetails));
    data.append("sdatakey", JSON.stringify(parseInt(id)));
    data.append("ptype", JSON.stringify("AC"));

    if (imageFile) {
      data.append("file", imageFile, imageFilename);
    }

    const config = {
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    };

    try {
      const response = await axios.post(`${API_HOST_3003}/safety/ohc/formdata`, data, config);
      toast.success(response.data || "Action submitted successfully!");
      router.push("/safety/safety-list");
    } catch (err) {
      console.error("Action submission error:", err);
      toast.error("Failed to submit action details");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-xs text-muted-foreground">Loading action form details...</p>
      </div>
    );
  }

  if (!sdata) {
    return (
      <div className="space-y-4 text-center p-8">
        <h3 className="text-lg font-bold">Safety record details not loaded</h3>
        <Link href="/safety/safety-list">
          <Button variant="outline" size="sm">Go Back</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Link href={`/safety/safety-list/view?id=${id}`}>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
            Safety Action Form
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Record resolution steps and upload photo verification for Observation #{id}.
          </p>
        </div>
      </div>

      <Card className="border-border/60 shadow-md">
        <CardHeader className="bg-gradient-to-r from-amber-500/10 to-transparent border-b border-border/40 pb-4">
          <CardTitle className="text-sm font-bold tracking-wide text-foreground uppercase">
            Observation Reference
          </CardTitle>
          <CardDescription className="text-xs space-y-1">
            <div><strong>Type:</strong> {sdata.obsertype}</div>
            <div><strong>Observation:</strong> {sdata.obser}</div>
            <div><strong>Initial Date:</strong> {sdata.date ? format(new Date(sdata.date), "dd-MMM-yyyy") : "--"}</div>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date of Issue */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Date of Issue</Label>
                <Input
                  type="text"
                  value={sdata.date ? format(new Date(sdata.date), "dd-MMM-yyyy") : "--"}
                  disabled
                  className="h-9 text-xs bg-muted/30 cursor-not-allowed"
                />
              </div>

              {/* Target Date Selector */}
              <div className="space-y-2">
                <Label htmlFor="targetDate" className="text-xs font-semibold">Select Target Date *</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>

            {/* Action Text */}
            <div className="space-y-2">
              <Label htmlFor="action" className="text-xs font-semibold">Action Taken *</Label>
              <Input
                id="action"
                placeholder="Detail what immediate steps or fixes have been implemented..."
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            {/* Remark Text */}
            <div className="space-y-2">
              <Label htmlFor="remark" className="text-xs font-semibold">Remark</Label>
              <Input
                id="remark"
                placeholder="Any additional comments or notes..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* After Picture */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold">Verification Picture</Label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-36 h-36 border border-border rounded-lg overflow-hidden group shadow-sm bg-muted/30">
                    <img src={imagePreview} alt="After Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black text-white rounded-full p-1 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-36 h-36 border border-dashed border-muted-foreground/30 hover:border-blue-500 rounded-lg cursor-pointer bg-muted/10 hover:bg-blue-500/5 transition-all text-muted-foreground hover:text-blue-600">
                    <Upload className="w-6 h-6 mb-1.5" />
                    <span className="text-xs font-semibold text-center px-1">Upload Photo</span>
                    <span className="text-[9px] mt-0.5 text-muted-foreground">After action details</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Toggle Completion */}
            <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border/40">
              <div className="space-y-0.5">
                <Label htmlFor="task-completed" className="text-xs font-bold text-foreground">
                  Task Completed?
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Switch this on to flag that this safety task is fully closed and resolved.
                </p>
              </div>
              <Switch
                id="task-completed"
                checked={taskCompleted}
                onCheckedChange={setTaskCompleted}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
              <Link href={`/safety/safety-list/view?id=${id}`}>
                <Button type="button" variant="outline" size="sm" className="h-9 text-xs">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 min-w-[120px] shadow-md gap-2"
              >
                {submitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Submit Action
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
