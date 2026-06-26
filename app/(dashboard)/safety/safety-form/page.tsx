"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X, ShieldAlert, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface OptionItem {
  value: string;
  label: string;
}

interface DropdownData {
  ocatlist: OptionItem[];
  departlist: OptionItem[];
  hazardlist: OptionItem[];
  risklist: OptionItem[];
  userlist: OptionItem[];
}

interface ImageUploadItem {
  file: File;
  uniqueName: string;
  previewUrl: string;
}

export default function SafetyFormPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Dropdown options from API
  const [optionList, setOptionList] = useState<DropdownData>({
    ocatlist: [],
    departlist: [],
    hazardlist: [],
    risklist: [],
    userlist: [],
  });

  // Form Fields
  const [observationType, setObservationType] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [observation, setObservation] = useState("");
  const [departmentIncharge, setDepartmentIncharge] = useState("");
  const [hazard, setHazard] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [reportingTo, setReportingTo] = useState("");
  const [onBehalf, setOnBehalf] = useState("");
  const [verified, setVerified] = useState(false);
  const [images, setImages] = useState<ImageUploadItem[]>([]);

  const API_HOST = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";

  // Fetch dropdown lists
  const fetchDropdownData = useCallback(async () => {
    setOptionsLoading(true);
    // Mimicking the original URL pattern
    const url = `${API_HOST}/safety/ohc/year=:year&ptype=AC&rtype=FY&sdate=:sdate&edate=:edate`;
    try {
      const res = await axios.get(url);
      if (res.data) {
        const deduplicate = (arr: OptionItem[]) => {
          if (!arr) return [];
          const seen = new Set<string>();
          return arr.filter((item) => {
            if (!item || item.value === undefined || item.value === null) return false;
            const val = String(item.value).trim();
            if (seen.has(val)) {
              return false;
            }
            seen.add(val);
            return true;
          });
        };

        setOptionList({
          ocatlist: deduplicate(res.data.ocatlist),
          departlist: deduplicate(res.data.departlist),
          hazardlist: deduplicate(res.data.hazardlist),
          risklist: deduplicate(res.data.risklist),
          userlist: deduplicate(res.data.userlist),
        });
      }
    } catch (err) {
      console.error("API Error fetching dropdown lists:", err);
      toast.error("Failed to fetch dropdown options");
    } finally {
      setOptionsLoading(false);
    }
  }, [API_HOST]);

  useEffect(() => {
    setMounted(true);
    // Pre-fill targetDate with today
    const todayStr = new Date().toISOString().split("T")[0];
    setTargetDate(todayStr);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchDropdownData();
    }
  }, [mounted, fetchDropdownData]);

  const generateUUID = () => {
    if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newImages: ImageUploadItem[] = [];

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.warning(`${file.name} is not an image file`);
        return;
      }
      const extension = file.name.split(".").pop();
      const filename = `${generateUUID()}.${extension}`;
      newImages.push({
        file,
        uniqueName: filename,
        previewUrl: URL.createObjectURL(file),
      });
    });

    setImages((prev) => [...prev, ...newImages]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].previewUrl); // Free memory
      copy.splice(index, 1);
      return copy;
    });
  };

  const isFormValid = () => {
    return (
      observationType &&
      targetDate &&
      observation.trim() &&
      departmentIncharge &&
      hazard &&
      riskLevel &&
      responsiblePerson &&
      reportingTo &&
      onBehalf &&
      verified
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      toast.error("Please fill all required fields and verify the data.");
      return;
    }

    const employeeName = sessionStorage.getItem("employee_name") || "AC User";
    const employeeEmail = sessionStorage.getItem("employee_email") || "ac_user@ifbglobal.com";
    const employeeCode = sessionStorage.getItem("employee_code") || "AC-TEMP";
    const plantVal = sessionStorage.getItem("plant") || "AC";

    const fromdata = {
      acceptTerms: true,
      rperson: [
        {
          value: reportingTo,
          label: optionList.userlist.find((user) => user.value === reportingTo)?.label || "",
        },
      ],
      hazard: [
        {
          value: hazard,
          label: optionList.hazardlist.find((h) => h.value === hazard)?.label || "",
        },
      ],
      dtype: [
        {
          value: departmentIncharge,
          label: optionList.departlist.find((d) => d.value === departmentIncharge)?.label || "",
        },
      ],
      rlevel: riskLevel,
      odata: observation,
      ssdate: new Date().toISOString(),
      octype: observationType,
      reperson: [
        {
          value: responsiblePerson,
          label: optionList.userlist.find((user) => user.value === responsiblePerson)?.label || "",
        },
      ],
      onBehalf: [
        {
          value: onBehalf,
          label: optionList.userlist.find((user) => user.value === onBehalf)?.label || "",
        },
      ],
      targetDate: new Date(targetDate).toISOString(),
    };

    const userdetails = {
      username: employeeName,
      email: employeeEmail,
      status: 1,
      userid: employeeCode,
    };

    const data = new FormData();
    data.append("formdata", JSON.stringify(fromdata));
    data.append("status", JSON.stringify(1));
    data.append("userdetails", JSON.stringify(userdetails));
    data.append("ptype", JSON.stringify(plantVal));

    if (images.length > 0) {
      images.forEach((img) => {
        data.append("file", img.file, img.uniqueName);
      });
    }

    const config = {
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    };

    setLoading(true);
    try {
      await axios.post(`${API_HOST}/safety/ohc/formdata`, data, config);
      toast.success("Safety observation submitted successfully!");
      router.push("/safety/safety-list");
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Failed to submit safety data");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Link href="/safety">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
            Safety Observation Form
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Report near-misses, unsafe acts, hazards, or conditions to ensure a safer workplace.
          </p>
        </div>
      </div>

      <Card className="border-border/60 shadow-md">
        <CardHeader className="bg-gradient-to-r from-amber-500/10 via-red-500/5 to-transparent border-b border-border/40 pb-4">
          <CardTitle className="text-sm font-bold tracking-wide text-foreground uppercase">
            New Safety Observation Details
          </CardTitle>
          <CardDescription className="text-xs">
            Complete the fields below. Highlighted fields (*) are required.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Observation Type */}
              <div className="space-y-2">
                <Label htmlFor="observationType" className="text-xs font-semibold">
                  Observation Type *
                </Label>
                <select
                  id="observationType"
                  value={observationType}
                  onChange={(e) => setObservationType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Select Type</option>
                  {optionList.ocatlist.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Date */}
              <div className="space-y-2">
                <Label htmlFor="targetDate" className="text-xs font-semibold">
                  Target Date *
                </Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* Department Incharge */}
              <div className="space-y-2">
                <Label htmlFor="departmentIncharge" className="text-xs font-semibold">
                  Department Incharge *
                </Label>
                <select
                  id="departmentIncharge"
                  value={departmentIncharge}
                  onChange={(e) => setDepartmentIncharge(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select Department</option>
                  {optionList.departlist.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hazard */}
              <div className="space-y-2">
                <Label htmlFor="hazard" className="text-xs font-semibold">
                  Hazard Category *
                </Label>
                <select
                  id="hazard"
                  value={hazard}
                  onChange={(e) => setHazard(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select Hazard</option>
                  {optionList.hazardlist.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Risk Level */}
              <div className="space-y-2">
                <Label htmlFor="riskLevel" className="text-xs font-semibold">
                  Risk Level *
                </Label>
                <select
                  id="riskLevel"
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select Risk Level</option>
                  {optionList.risklist.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Responsible Person */}
              <div className="space-y-2">
                <Label htmlFor="responsiblePerson" className="text-xs font-semibold">
                  Responsible Person *
                </Label>
                <select
                  id="responsiblePerson"
                  value={responsiblePerson}
                  onChange={(e) => setResponsiblePerson(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none"
                  required
                >
                  <option value="">Select Responsible Person</option>
                  {optionList.userlist.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reporting To */}
              <div className="space-y-2">
                <Label htmlFor="reportingTo" className="text-xs font-semibold">
                  Reporting To *
                </Label>
                <select
                  id="reportingTo"
                  value={reportingTo}
                  onChange={(e) => setReportingTo(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none"
                  required
                >
                  <option value="">Select Approver / HOD</option>
                  {optionList.userlist.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* On Behalf Of */}
              <div className="space-y-2">
                <Label htmlFor="onBehalf" className="text-xs font-semibold">
                  On Behalf Of *
                </Label>
                <select
                  id="onBehalf"
                  value={onBehalf}
                  onChange={(e) => setOnBehalf(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none"
                  required
                >
                  <option value="">Select Employee</option>
                  {optionList.userlist.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Observation Description */}
            <div className="space-y-2">
              <Label htmlFor="observation" className="text-xs font-semibold">
                Observation Details *
              </Label>
              <Textarea
                id="observation"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Describe what you observed, including any immediate concerns or actions taken..."
                className="min-h-[100px] text-xs resize-none"
                required
              />
            </div>

            {/* Upload Images */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold">Upload Supporting Images</Label>
              <div className="flex flex-wrap gap-4 items-center">
                {images.map((img, index) => (
                  <div key={index} className="relative w-24 h-24 border border-border rounded-lg overflow-hidden group shadow-sm bg-muted/30">
                    <img src={img.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black text-white rounded-full p-1 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <label className="flex flex-col items-center justify-center w-24 h-24 border border-dashed border-muted-foreground/30 hover:border-blue-500 rounded-lg cursor-pointer bg-muted/10 hover:bg-blue-500/5 transition-all text-muted-foreground hover:text-blue-600">
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-semibold text-center px-1">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
              <p className="text-[10px] text-muted-foreground">
                You can upload multiple files. Only image formats are supported.
              </p>
            </div>

            {/* Verification Checkbox */}
            <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-lg border border-border/40">
              <input
                type="checkbox"
                id="verify"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                className="h-4 w-4 rounded border-input text-blue-600 focus:ring-blue-500 cursor-pointer bg-background"
              />
              <Label htmlFor="verify" className="text-xs font-medium cursor-pointer text-muted-foreground select-none">
                I verify that all details entered above are accurate and valid. *
              </Label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
              <Link href="/safety">
                <Button type="button" variant="outline" size="sm" className="h-9 text-xs">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={!isFormValid() || loading || optionsLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 min-w-[120px] shadow-md gap-2"
              >
                {loading ? (
                  "Submitting..."
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Submit Observation
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
