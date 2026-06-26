"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface OptionItem {
  value: string;
  label: string;
}

export default function HrTrainingAddPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // Lists from API
  const [deptOptions, setDeptOptions] = useState<OptionItem[]>([]);
  const [courseOptions, setCourseOptions] = useState<OptionItem[]>([]);

  // Form Fields
  const [trainingType, setTrainingType] = useState("");
  const [department, setDepartment] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [trainingName, setTrainingName] = useState("");
  const [trainingCategory, setTrainingCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState("");
  const [strength, setStrength] = useState("");

  // OJT specific fields
  const [focuseArea, setFocuseArea] = useState("");
  const [traineeName, setTraineeName] = useState(""); // Comma-separated or text input
  const [remark, setRemark] = useState("");

  const API_HOST_3003 = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";

  const trainingCategoryOptions = [
    { value: "health&safety", label: "Health & Safety" },
    { value: "safety", label: "Safety" },
    { value: "employee", label: "Employee" },
    { value: "contractual", label: "Contractual" },
    { value: "trainee_apprentice", label: "Trainee Apprentice" },
    { value: "quality_inspection", label: "Quality Inspection" },
  ];

  const remarkOptions = [
    { value: "attend_session", label: "Attend the session for Information" },
    { value: "supervisiom", label: "Can work under Supervision" },
    { value: "direction", label: "Can perform as per direction" },
    { value: "independently", label: "Can perform independently (can add value)" },
  ];

  const focusAreaOptions = [
    { value: "softSkills", label: "Soft Skills" },
    { value: "format/registerTraining", label: "Format/Register Training" },
    { value: "softwareTraining", label: "Software Training" },
    { value: "machineOperationTraining", label: "Machine Operation Training" },
    { value: "qms", label: "QMS" },
    { value: "awarness", label: "Awarness (Knowledge Sharing)" },
  ];

  const fetchLists = useCallback(async () => {
    setLoadingDropdowns(true);
    try {
      const [deptRes, courseRes] = await Promise.all([
        axios.get(`${API_HOST_3003}/safety/ohc/department_list`),
        axios.get(`${API_HOST_3003}/safety/ohc/hr_training_course`),
      ]);

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

      const rawDepts = (deptRes.data || []).map((d: any) => ({ value: d.value, label: d.label }));
      setDeptOptions(deduplicate(rawDepts));

      const courses = courseRes.data?.hrTrainingList || [];
      const rawCourses = courses.map((c: any) => ({ value: c.value, label: c.label }));
      setCourseOptions(deduplicate(rawCourses));
    } catch (err) {
      console.error("Error loading training setup dropdown lists:", err);
      toast.error("Failed to load setup parameters");
    } finally {
      setLoadingDropdowns(false);
    }
  }, [API_HOST_3003]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchLists();
    }
  }, [fetchLists, mounted]);

  const isFormIncomplete = () => {
    if (
      !trainingType ||
      !trainerName.trim() ||
      !department ||
      !trainingCategory ||
      !startDate ||
      !duration ||
      !strength
    ) {
      return true;
    }

    if (trainingType === "ojt") {
      return !focuseArea || !traineeName.trim() || !remark;
    } else {
      return !trainingName;
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isFormIncomplete()) {
      toast.error("Please fill all required fields");
      return;
    }

    const matchedDept = deptOptions.find((d) => d.value === department);
    const matchedCategory = trainingCategoryOptions.find((c) => c.value === trainingCategory);
    const matchedCourse = courseOptions.find((c) => c.value === trainingName);

    const postData = {
      key: "POST",
      formdata: {
        trainingType: trainingType === "ojt" ? "On Job Training" : "Training",
        remark: trainingType === "ojt" ? remarkOptions.find((r) => r.value === remark)?.label || "" : "",
        focuseArea: trainingType === "ojt" ? focusAreaOptions.find((f) => f.value === focuseArea)?.label || "" : "",
        trainerName,
        department: matchedDept ? matchedDept.label : department,
        trainingName: trainingType !== "ojt" && matchedCourse ? matchedCourse.label : "",
        trainingCategory: matchedCategory ? matchedCategory.label : trainingCategory,
        startDate,
        endDate: endDate || null,
        duration: parseFloat(duration),
        strength: parseInt(strength),
        plant: sessionStorage.getItem("plant") || "AC",
        traineeName: trainingType === "ojt" ? traineeName : "",
      },
    };

    setLoading(true);
    try {
      const response = await axios.post(`${API_HOST_3003}/safety/ohc/hr_training`, postData, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.status === 200) {
        toast.success(response.data.message || "Training schedule submitted successfully!");
        router.push("/safety/hr-training");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit training schedule details");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Link href="/safety/hr-training">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            Training Entry Form
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log employee training schedules, focus fields, attendee strength, or OJT metrics.
          </p>
        </div>
      </div>

      <Card className="border-border/60 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-500/10 to-transparent border-b border-border/40 pb-4">
          <CardTitle className="text-sm font-bold tracking-wide text-foreground uppercase">
            Log Training Details
          </CardTitle>
          <CardDescription className="text-xs">
            Complete training specifications. Highlighted (*) fields are required.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Training Type */}
              <div className="space-y-2">
                <Label htmlFor="trainingType" className="text-xs font-semibold">Training Type *</Label>
                <select
                  id="trainingType"
                  value={trainingType}
                  onChange={(e) => setTrainingType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="ojt">On Job Training (OJT)</option>
                  <option value="training">Training</option>
                </select>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department" className="text-xs font-semibold">Department *</Label>
                <select
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none"
                  required
                >
                  <option value="">Select Department</option>
                  {deptOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trainer Name */}
              <div className="space-y-2">
                <Label htmlFor="trainerName" className="text-xs font-semibold">Trainer Name *</Label>
                <Input
                  id="trainerName"
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                  placeholder="Trainer Name"
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* Course Title (Only for non-OJT) */}
              {trainingType !== "ojt" && (
                <div className="space-y-2">
                  <Label htmlFor="trainingName" className="text-xs font-semibold">Training Title / Course *</Label>
                  <select
                    id="trainingName"
                    value={trainingName}
                    onChange={(e) => setTrainingName(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none"
                    required
                  >
                    <option value="">Select Title / Topic</option>
                    {courseOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Training Category */}
              <div className="space-y-2">
                <Label htmlFor="trainingCategory" className="text-xs font-semibold">Training Category *</Label>
                <select
                  id="trainingCategory"
                  value={trainingCategory}
                  onChange={(e) => setTrainingCategory(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none"
                  required
                >
                  <option value="">Select Category</option>
                  {trainingCategoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-xs font-semibold">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-xs font-semibold">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Duration and Strength */}
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-xs font-semibold">Duration (Hours) *</Label>
                <Input
                  id="duration"
                  type="number"
                  step="0.5"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="strength" className="text-xs font-semibold">Strength (Attendee Count) *</Label>
                <Input
                  id="strength"
                  type="number"
                  value={strength}
                  onChange={(e) => setStrength(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>

            {/* OJT CONDITIONAL SECTION */}
            {trainingType === "ojt" && (
              <div className="space-y-6 p-4 rounded-lg bg-muted/30 border border-border/50">
                <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
                  On-Job Training (OJT) Particulars
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Focus Area */}
                  <div className="space-y-2">
                    <Label htmlFor="focuseArea" className="text-xs font-semibold">Focus Area *</Label>
                    <select
                      id="focuseArea"
                      value={focuseArea}
                      onChange={(e) => setFocuseArea(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none"
                      required
                    >
                      <option value="">Select Focus Area</option>
                      {focusAreaOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Trainee Remark */}
                  <div className="space-y-2">
                    <Label htmlFor="remark" className="text-xs font-semibold">Trainee Capability Evaluation Remark *</Label>
                    <select
                      id="remark"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus:outline-none"
                      required
                    >
                      <option value="">Select Evaluation</option>
                      {remarkOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Trainee Names */}
                <div className="space-y-2">
                  <Label htmlFor="traineeName" className="text-xs font-semibold">Trainee Names *</Label>
                  <Input
                    id="traineeName"
                    value={traineeName}
                    onChange={(e) => setTraineeName(e.target.value)}
                    placeholder="Enter trainee name(s), separated by commas if multiple..."
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
              <Link href="/safety/hr-training">
                <Button type="button" variant="outline" size="sm" className="h-9 text-xs">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isFormIncomplete() || loading || loadingDropdowns}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 min-w-[120px] shadow-md gap-2"
              >
                {loading ? (
                  "Submitting..."
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Save Training Record
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
