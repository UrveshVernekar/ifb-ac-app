"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Upload, X, ShieldAlert, Plus, Trash2, Check, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface InjuryRow {
  slNo: number;
  details: string;
  treatment: string;
}

interface PersonInvolvedRow {
  slNo: number;
  name: string;
  slNo4: number;
  name4: string;
}

interface RootCauseRow {
  what: string;
  why1: string;
  why2: string;
  why3: string;
  why4: string;
  why5: string;
}

interface CorrectiveActionRow {
  slNo: number;
  action: string;
  who: string;
  when: string;
}

interface HiraRow {
  question: string;
  answer: string;
  who: string;
  when: string;
}

export default function OhcIncidentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingReport, setExistingReport] = useState<any>(null);

  // Form Fields State
  const [accidentType, setAccidentType] = useState("");
  const [nearMissType, setNearMissType] = useState("");
  const [fireType, setFireType] = useState("");
  const [dangerousOccurrence, setDangerousOccurrence] = useState("");

  const [location, setLocation] = useState("");
  const [unit, setUnit] = useState("");
  const [exactSpot, setExactSpot] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [shift, setShift] = useState("");
  const [happenedInOT, setHappenedInOT] = useState("");

  const [empNo, setEmpNo] = useState("");
  const [patientName, setPatientName] = useState("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [contractorName, setContractorName] = useState("");

  const [briefNarration, setBriefNarration] = useState("");
  const [initialObservations, setInitialObservations] = useState("");
  const [propertyDamage, setPropertyDamage] = useState("");

  // Dynamic Tables
  const [injuryDetails, setInjuryDetails] = useState<InjuryRow[]>([
    { slNo: 1, details: "", treatment: "" }
  ]);
  const [personsInvolved, setPersonsInvolved] = useState<PersonInvolvedRow[]>([
    { slNo: 1, name: "", slNo4: 4, name4: "" },
    { slNo: 2, name: "", slNo4: 5, name4: "" },
    { slNo: 3, name: "", slNo4: 6, name4: "" },
  ]);

  // Investigation (Part B Option Fields)
  const [manOption, setManOption] = useState("");
  const [machineOption, setMachineOption] = useState("");
  const [materialOption, setMaterialOption] = useState("");
  const [methodOption, setMethodOption] = useState("");

  const [othersMan, setOthersMan] = useState<string[]>(["", ""]);
  const [othersMachine, setOthersMachine] = useState<string[]>(["", ""]);
  const [othersMaterial, setOthersMaterial] = useState<string[]>(["", ""]);
  const [othersMethod, setOthersMethod] = useState<string[]>(["", ""]);

  // Root Causes Why-Why
  const [rootCauses, setRootCauses] = useState<RootCauseRow[]>([
    { what: "", why1: "", why2: "", why3: "", why4: "", why5: "" }
  ]);

  // Corrective Actions
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveActionRow[]>([
    { slNo: 1, action: "", who: "", when: "" }
  ]);

  // HIRA Table
  const [hira, setHira] = useState<HiraRow[]>([
    {
      question: "Whether the activity of this incident is covered in the HIRA",
      answer: "",
      who: "",
      when: "",
    },
    {
      question: "Whether the associated hazards of the activity is captured in HIRA",
      answer: "",
      who: "",
      when: "",
    },
    {
      question: "If identified, are the necessary controls in place",
      answer: "",
      who: "",
      when: "",
    },
    {
      question: "Whether the suggested control measures are revised through HIRA",
      answer: "",
      who: "",
      when: "",
    },
  ]);

  // File Upload State
  const [files, setFiles] = useState<File[]>([]);
  const [sketchFile, setSketchFile] = useState<File | null>(null);

  const API_HOST_3003 = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";
  const imgURL = "http://10.0.7.26:8090/";

  const fetchIncidentReport = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_HOST_3003}/safety/ohc/incident_report_list?id=${id}`);
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : [res.data];
        const record = list.find((item: any) => item.sohcdata_id === parseInt(id));
        if (record) {
          setExistingReport(record);

          // Populate form fields
          setAccidentType(record.accidentType || "");
          setNearMissType(record.nearMissType || "");
          setFireType(record.fireType || "");
          setDangerousOccurrence(record.dangerousOccurrence || "");
          setLocation(record.location || "");
          setUnit(record.unit || "");
          setExactSpot(record.exactSpot || "");
          setIncidentDate(record.incidentDate || "");
          setIncidentTime(record.incidentTime || "");
          setShift(record.shift || "");
          setHappenedInOT(record.happenedInOT || "");
          setEmpNo(record.empNo || "");
          setPatientName(record.name || "");
          setCategory(record.category || "");
          setGender(record.gender || "");
          setAge(record.age || "");
          setContractorName(record.contractorName || "");
          setBriefNarration(record.briefNarration || "");
          setInitialObservations(record.initialObservations || "");
          setPropertyDamage(record.propertyDamage || "");

          if (record.injuryDetails && record.injuryDetails.length > 0) setInjuryDetails(record.injuryDetails);
          if (record.personsInvolved && record.personsInvolved.length > 0) setPersonsInvolved(record.personsInvolved);

          setManOption(record.manOptions?.[0] || "");
          setMachineOption(record.machineOptions?.[0] || "");
          setMaterialOption(record.materialOptions?.[0] || "");
          setMethodOption(record.methodOptions?.[0] || "");

          if (record.othersMan) setOthersMan(record.othersMan);
          if (record.othersMachine) setOthersMachine(record.othersMachine);
          if (record.othersMaterial) setOthersMaterial(record.othersMaterial);
          if (record.othersMethod) setOthersMethod(record.othersMethod);

          if (record.rootCauses && record.rootCauses.length > 0) setRootCauses(record.rootCauses);
          if (record.correctiveActions && record.correctiveActions.length > 0) setCorrectiveActions(record.correctiveActions);
          if (record.hira && record.hira.length > 0) setHira(record.hira);
        }
      }
    } catch (err) {
      console.error("Error loading incident report:", err);
      toast.error("Failed to load investigation data");
    } finally {
      setLoading(false);
    }
  }, [id, API_HOST_3003]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && id) {
      fetchIncidentReport();
    }
  }, [id, fetchIncidentReport, mounted]);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setter(e.target.value);
  };

  const handleTableChange = (table: string, index: number, field: string, value: any) => {
    if (table === "injuryDetails") {
      setInjuryDetails((prev) => {
        const copy = [...prev];
        (copy[index] as any)[field] = value;
        return copy;
      });
    } else if (table === "personsInvolved") {
      setPersonsInvolved((prev) => {
        const copy = [...prev];
        (copy[index] as any)[field] = value;
        return copy;
      });
    } else if (table === "rootCauses") {
      setRootCauses((prev) => {
        const copy = [...prev];
        (copy[index] as any)[field] = value;
        return copy;
      });
    } else if (table === "correctiveActions") {
      setCorrectiveActions((prev) => {
        const copy = [...prev];
        (copy[index] as any)[field] = value;
        return copy;
      });
    } else if (table === "hira") {
      setHira((prev) => {
        const copy = [...prev];
        (copy[index] as any)[field] = value;
        return copy;
      });
    }
  };

  const addTableRow = (table: string) => {
    if (table === "injuryDetails") {
      setInjuryDetails((prev) => [...prev, { slNo: prev.length + 1, details: "", treatment: "" }]);
    } else if (table === "personsInvolved") {
      setPersonsInvolved((prev) => [...prev, { slNo: prev.length + 1, name: "", slNo4: prev.length + 4, name4: "" }]);
    } else if (table === "rootCauses") {
      setRootCauses((prev) => [...prev, { what: "", why1: "", why2: "", why3: "", why4: "", why5: "" }]);
    } else if (table === "correctiveActions") {
      setCorrectiveActions((prev) => [...prev, { slNo: prev.length + 1, action: "", who: "", when: "" }]);
    }
  };

  const removeTableRow = (table: string, index: number) => {
    if (table === "injuryDetails") {
      setInjuryDetails((prev) => prev.filter((_, i) => i !== index).map((row, i) => ({ ...row, slNo: i + 1 })));
    } else if (table === "personsInvolved") {
      setPersonsInvolved((prev) => prev.filter((_, i) => i !== index).map((row, i) => ({ ...row, slNo: i + 1, slNo4: i + 4 })));
    } else if (table === "rootCauses") {
      setRootCauses((prev) => prev.filter((_, i) => i !== index));
    } else if (table === "correctiveActions") {
      setCorrectiveActions((prev) => prev.filter((_, i) => i !== index).map((row, i) => ({ ...row, slNo: i + 1 })));
    }
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSubmitting(true);

    const processedData = {
      parentId: parseInt(id),
      accidentType,
      nearMissType,
      fireType,
      dangerousOccurrence,
      location,
      unit,
      exactSpot,
      date: incidentDate,
      time: incidentTime,
      shift,
      happenedInOT,
      empNo,
      name: patientName,
      category,
      gender,
      age,
      contractorName,
      briefNarration,
      initialObservations,
      propertyDamage,
      injuryDetails,
      personsInvolved,
      manOption,
      machineOption,
      materialOption,
      methodOption,
      othersMan,
      othersMachine,
      othersMaterial,
      othersMethod,
      rootCauses,
      correctiveActions,
      hira,
      manOptions: [manOption],
      machineOptions: [machineOption],
      materialOptions: [materialOption],
      methodOptions: [methodOption],
    };

    const data = new FormData();
    data.append("ptype", sessionStorage.getItem("plant") || "AC");
    data.append("formdata", JSON.stringify(processedData));

    // Support bulk files
    if (files.length > 0) {
      files.forEach((file) => {
        data.append("supportingFiles", file);
      });
    }

    // Support single sketch
    if (sketchFile) {
      data.append("supportingFiles", sketchFile);
    }

    try {
      const response = await axios.post(`${API_HOST_3003}/safety/ohc/incident_report`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.status) {
        toast.success("Incident investigation report saved successfully!");
        router.back();
      } else {
        toast.error("Failed to save report: " + response.data.message);
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Error occurred while submitting investigation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenFile = (filePath: string) => {
    if (!filePath) return;
    const cleanPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
    window.open(`${imgURL}${cleanPath}`, "_blank");
  };

  const existingFiles = useMemo(() => {
    if (!existingReport?.supporting_files) return [];
    return Array.isArray(existingReport.supporting_files)
      ? existingReport.supporting_files
      : [existingReport.supporting_files];
  }, [existingReport]);

  if (!mounted) return null;

  if (loading && id && existingReport === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-xs text-muted-foreground">Checking existing investigation data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Button onClick={() => router.back()} variant="outline" size="icon" className="h-9 w-9">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            5-Why Incident Investigation Report
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log detailed incident investigation for Factory Accident, Fire, or Near Miss.
          </p>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* PART A */}
        <Card className="border-border/60 shadow-md">
          <CardHeader className="bg-red-500/10 border-b border-red-500/20 pb-4">
            <CardTitle className="text-sm font-extrabold uppercase text-red-800">
              PART-A: Incident Details & Narration
            </CardTitle>
            <CardDescription className="text-xs">
              Complete within the same shift of the incident occurrence.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* INCIDENT TYPE GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border border-border/60 p-4 rounded-lg bg-muted/5">
              {/* Accident Type */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">Accident Type</Label>
                <div className="space-y-1">
                  {["first_aid", "non_reportable", "reportable"].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="accidentType"
                        value={opt}
                        checked={accidentType === opt}
                        onChange={(e) => setAccidentType(e.target.value)}
                        className="w-3.5 h-3.5"
                        disabled={!!existingReport}
                      />
                      <span className="capitalize">{opt.replace("_", " ")}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Near Miss */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">Near Miss</Label>
                <div className="space-y-1">
                  {[
                    { label: "No Injury Incident", value: "no_injury" },
                    { label: "Spark or Fumes", value: "spark_fumes" },
                    { label: "Chemical Splash", value: "chemical_splash" },
                    { label: "Blunt Injury", value: "blunt_injury" },
                    { label: "Fire Incident (Low)", value: "fire_incident_low" },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="nearMissType"
                        value={opt.value}
                        checked={nearMissType === opt.value}
                        onChange={(e) => setNearMissType(e.target.value)}
                        className="w-3.5 h-3.5"
                        disabled={!!existingReport}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Fire */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">Fire</Label>
                <div className="space-y-1">
                  <label className="flex items-start gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="fireType"
                      value="damage_gt_50k"
                      checked={fireType === "damage_gt_50k"}
                      onChange={(e) => setFireType(e.target.value)}
                      className="w-3.5 h-3.5 mt-0.5"
                      disabled={!!existingReport}
                    />
                    <span>Fire involving property damage &gt; Rs. 50,000/-</span>
                  </label>
                </div>
              </div>

              {/* Dangerous Occurrence */}
              <div className="space-y-2 col-span-1">
                <Label className="text-xs font-bold text-foreground">Dangerous Occurrence</Label>
                <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                  {[
                    "Collapse of civil structures",
                    "Explosion of Pressure vessel",
                    "Incident with potential for loss of life",
                    "Collapses or failure of lifting Equipment's",
                    "Bursting of steam vessel",
                    "Incident with potential for permanent disablem",
                  ].map((label) => (
                    <label key={label} className="flex items-start gap-2 text-[11px] font-medium cursor-pointer py-0.5">
                      <input
                        type="radio"
                        name="dangerousOccurrence"
                        value={label}
                        checked={dangerousOccurrence === label}
                        onChange={(e) => setDangerousOccurrence(e.target.value)}
                        className="w-3.5 h-3.5 mt-0.5"
                        disabled={!!existingReport}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* LOCATION DETAILS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs font-semibold">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={handleInputChange(setLocation)}
                  className="h-9 text-xs"
                  disabled={!!existingReport}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit" className="text-xs font-semibold">Unit</Label>
                <Input
                  id="unit"
                  value={unit}
                  onChange={handleInputChange(setUnit)}
                  className="h-9 text-xs"
                  disabled={!!existingReport}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exactSpot" className="text-xs font-semibold">Exact Spot (Mc No/Bay/Cell)</Label>
                <Input
                  id="exactSpot"
                  value={exactSpot}
                  onChange={handleInputChange(setExactSpot)}
                  className="h-9 text-xs"
                  disabled={!!existingReport}
                />
              </div>
            </div>

            {/* TIME DETAILS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="incidentDate" className="text-xs font-semibold">Incident Date</Label>
                <Input
                  id="incidentDate"
                  type="date"
                  value={incidentDate}
                  onChange={handleInputChange(setIncidentDate)}
                  className="h-9 text-xs"
                  disabled={!!existingReport}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="incidentTime" className="text-xs font-semibold">Incident Time</Label>
                <Input
                  id="incidentTime"
                  type="time"
                  value={incidentTime}
                  onChange={handleInputChange(setIncidentTime)}
                  className="h-9 text-xs"
                  disabled={!!existingReport}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shift" className="text-xs font-semibold">Shift</Label>
                <Input
                  id="shift"
                  value={shift}
                  onChange={handleInputChange(setShift)}
                  className="h-9 text-xs"
                  disabled={!!existingReport}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold block mb-1">Happened in OT?</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="happenedInOT"
                      value="Yes"
                      checked={happenedInOT === "Yes"}
                      onChange={(e) => setHappenedInOT(e.target.value)}
                      className="w-3.5 h-3.5"
                      disabled={!!existingReport}
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="happenedInOT"
                      value="No"
                      checked={happenedInOT === "No"}
                      onChange={(e) => setHappenedInOT(e.target.value)}
                      className="w-3.5 h-3.5"
                      disabled={!!existingReport}
                    />
                    No
                  </label>
                </div>
              </div>
            </div>

            {/* INJURED PERSON DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 pt-2">
              <div className="space-y-1.5 md:col-span-1">
                <Label htmlFor="empNo" className="text-xs font-semibold">Emp No</Label>
                <Input
                  id="empNo"
                  value={empNo}
                  onChange={handleInputChange(setEmpNo)}
                  className="h-9 text-xs"
                  disabled={!!existingReport}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="patientName" className="text-xs font-semibold">Injured Person Name</Label>
                <Input
                  id="patientName"
                  value={patientName}
                  onChange={handleInputChange(setPatientName)}
                  className="h-9 text-xs"
                  disabled={!!existingReport}
                />
              </div>
              <div className="space-y-1.5 md:col-span-1">
                <Label htmlFor="age" className="text-xs font-semibold">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={handleInputChange(setAge)}
                  className="h-9 text-xs"
                  disabled={!!existingReport}
                />
              </div>
              <div className="space-y-1.5 md:col-span-1">
                <Label className="text-xs font-semibold block mb-1">Gender</Label>
                <div className="flex gap-3 mt-1.5">
                  <label className="flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Male"
                      checked={gender === "Male"}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-3.5 h-3.5"
                      disabled={!!existingReport}
                    />
                    Male
                  </label>
                  <label className="flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Female"
                      checked={gender === "Female"}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-3.5 h-3.5"
                      disabled={!!existingReport}
                    />
                    Female
                  </label>
                </div>
              </div>
              <div className="space-y-1.5 md:col-span-1">
                <Label htmlFor="category" className="text-xs font-semibold">Job Exp (Yrs)</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={handleInputChange(setCategory)}
                  className="h-9 text-xs"
                  disabled={!!existingReport}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contractorName" className="text-xs font-semibold">Contractor Name (If contract labor)</Label>
              <Input
                id="contractorName"
                value={contractorName}
                onChange={handleInputChange(setContractorName)}
                className="h-9 text-xs"
                disabled={!!existingReport}
              />
            </div>

            {/* BRIEF NARRATION & DETAILS */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="briefNarration" className="text-xs font-semibold">Brief Narration of Incident</Label>
                <Textarea
                  id="briefNarration"
                  value={briefNarration}
                  onChange={handleInputChange(setBriefNarration)}
                  className="min-h-[80px] text-xs"
                  disabled={!!existingReport}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="initialObservations" className="text-xs font-semibold">Initial Observations & Findings</Label>
                <Textarea
                  id="initialObservations"
                  value={initialObservations}
                  onChange={handleInputChange(setInitialObservations)}
                  className="min-h-[80px] text-xs"
                  disabled={!!existingReport}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="propertyDamage" className="text-xs font-semibold">Property Damage Details (If any)</Label>
                <Textarea
                  id="propertyDamage"
                  value={propertyDamage}
                  onChange={handleInputChange(setPropertyDamage)}
                  className="min-h-[50px] text-xs"
                  disabled={!!existingReport}
                />
              </div>
            </div>

            {/* INJURY DETAILS TABLE */}
            <div className="space-y-3">
              <Label className="text-xs font-bold block">Injury & Treatment Log</Label>
              <table className="w-full text-xs border border-border border-collapse text-center">
                <thead>
                  <tr className="bg-muted font-bold text-muted-foreground border-b border-border">
                    <th className="p-2 border-r border-border w-12">No.</th>
                    <th className="p-2 border-r border-border">Injury Details</th>
                    <th className="p-2 border-r border-border">First Aid / Treatment Given</th>
                    {!existingReport && <th className="p-2 w-12">Delete</th>}
                  </tr>
                </thead>
                <tbody>
                  {injuryDetails.map((row, idx) => (
                    <tr key={idx} className="border-b border-border">
                      <td className="p-2 border-r border-border font-medium">{row.slNo}</td>
                      <td className="p-1 border-r border-border">
                        <Input
                          value={row.details}
                          onChange={(e) => handleTableChange("injuryDetails", idx, "details", e.target.value)}
                          className="h-8 border-0 shadow-none text-xs text-center"
                          disabled={!!existingReport}
                        />
                      </td>
                      <td className="p-1 border-r border-border">
                        <Input
                          value={row.treatment}
                          onChange={(e) => handleTableChange("injuryDetails", idx, "treatment", e.target.value)}
                          className="h-8 border-0 shadow-none text-xs text-center"
                          disabled={!!existingReport}
                        />
                      </td>
                      {!existingReport && (
                        <td className="p-1">
                          <Button
                            type="button"
                            onClick={() => removeTableRow("injuryDetails", idx)}
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-500"
                            disabled={injuryDetails.length <= 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!existingReport && (
                <Button
                  type="button"
                  onClick={() => addTableRow("injuryDetails")}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Injury Row
                </Button>
              )}
            </div>

            {/* PERSONS INVOLVED */}
            <div className="space-y-3">
              <Label className="text-xs font-bold block">Persons Involved during Investigation</Label>
              <table className="w-full text-xs border border-border border-collapse text-center">
                <thead>
                  <tr className="bg-muted font-bold text-muted-foreground border-b border-border">
                    <th className="p-2 border-r border-border w-12">No.</th>
                    <th className="p-2 border-r border-border">Investigating Member</th>
                    <th className="p-2 border-r border-border w-12">No.</th>
                    <th className="p-2 border-r border-border">Investigating Member</th>
                    {!existingReport && <th className="p-2 w-12">Delete</th>}
                  </tr>
                </thead>
                <tbody>
                  {personsInvolved.map((row, idx) => (
                    <tr key={idx} className="border-b border-border">
                      <td className="p-2 border-r border-border font-medium">{row.slNo}</td>
                      <td className="p-1 border-r border-border">
                        <Input
                          value={row.name}
                          onChange={(e) => handleTableChange("personsInvolved", idx, "name", e.target.value)}
                          className="h-8 border-0 shadow-none text-xs text-center"
                          disabled={!!existingReport}
                        />
                      </td>
                      <td className="p-2 border-r border-border font-medium">{row.slNo4}</td>
                      <td className="p-1 border-r border-border">
                        <Input
                          value={row.name4}
                          onChange={(e) => handleTableChange("personsInvolved", idx, "name4", e.target.value)}
                          className="h-8 border-0 shadow-none text-xs text-center"
                          disabled={!!existingReport}
                        />
                      </td>
                      {!existingReport && (
                        <td className="p-1">
                          <Button
                            type="button"
                            onClick={() => removeTableRow("personsInvolved", idx)}
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-500"
                            disabled={personsInvolved.length <= 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!existingReport && (
                <Button
                  type="button"
                  onClick={() => addTableRow("personsInvolved")}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Investigating Members Row
                </Button>
              )}
            </div>

            {/* FILE ATTACHMENTS VIEW/UPLOAD */}
            <div className="space-y-3 pt-2">
              <Label className="text-xs font-bold block">Supporting Documents & Sketch</Label>
              {existingReport ? (
                <div className="flex flex-wrap gap-4">
                  {existingFiles.map((file: string, idx: number) => {
                    const fileName = file.split("/").pop() || "Document";
                    return (
                      <Button
                        key={idx}
                        type="button"
                        onClick={() => handleOpenFile(file)}
                        variant="outline"
                        className="text-xs h-9 gap-1.5 text-blue-600 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10"
                      >
                        <FileText className="w-4 h-4" /> {fileName}
                      </Button>
                    );
                  })}
                  {existingFiles.length === 0 && (
                    <p className="text-xs italic text-muted-foreground">No supporting documents uploaded for this report.</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Photo Sketch */}
                  <div className="space-y-1.5">
                    <Label htmlFor="sketch" className="text-xs">Photo / Sketch (Optional)</Label>
                    <Input
                      id="sketch"
                      type="file"
                      onChange={(e) => setSketchFile(e.target.files?.[0] || null)}
                      className="text-xs"
                    />
                  </div>

                  {/* Bulk files */}
                  <div className="space-y-1.5">
                    <Label htmlFor="bulkFiles" className="text-xs">Supporting Evidence Documents</Label>
                    <Input
                      id="bulkFiles"
                      type="file"
                      multiple
                      onChange={handleBulkFileChange}
                      className="text-xs"
                    />
                    {files.length > 0 && (
                      <div className="text-[10px] text-muted-foreground">
                        {files.length} files selected: {files.map(f => f.name).join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PART B */}
        <Card className="border-border/60 shadow-md">
          <CardHeader className="bg-indigo-500/10 border-b border-indigo-500/20 pb-4">
            <CardTitle className="text-sm font-extrabold uppercase text-indigo-800">
              PART-B: Root Causes, Action Plans & HIRA Checklist
            </CardTitle>
            <CardDescription className="text-xs">
              Requires full causal investigation analysis and preventive actions checklist.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            {/* INVESTIGATION 4-M GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border border-border/50 rounded-lg p-4 bg-muted/5">
              {/* MAN FACTORS */}
              <div className="space-y-2 border-r border-border/40 pr-2">
                <h4 className="text-xs font-bold text-center bg-muted/40 p-1.5 rounded uppercase">MAN</h4>
                <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                  {[
                    "Not aware of requirement",
                    "Bypassing Safety Eqpt.",
                    "Violation of defined rule",
                    "Use of wrong tools",
                    "Failed to check",
                    "Failed to use controls",
                    "Unsafe body position",
                    "Horseplay",
                    "Unauthorized operation",
                    "Supervisory error",
                    "Action of Co-employee",
                    "Over confidence",
                    "Diverted attention",
                    "Fatigue",
                    "Overtime working",
                  ].map((opt) => (
                    <label key={opt} className="flex items-start gap-1.5 text-[11px] font-medium cursor-pointer leading-tight">
                      <input
                        type="radio"
                        name="manOption"
                        value={opt}
                        checked={manOption === opt}
                        onChange={(e) => setManOption(e.target.value)}
                        className="w-3 h-3 mt-0.5"
                        disabled={!!existingReport}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-1 pt-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Others</Label>
                  <Input
                    value={othersMan[0]}
                    onChange={(e) => setOthersMan([e.target.value, othersMan[1]])}
                    className="h-7 text-[11px] mb-1"
                    placeholder="Other factor 1"
                    disabled={!!existingReport}
                  />
                  <Input
                    value={othersMan[1]}
                    onChange={(e) => setOthersMan([othersMan[0], e.target.value])}
                    className="h-7 text-[11px]"
                    placeholder="Other factor 2"
                    disabled={!!existingReport}
                  />
                </div>
              </div>

              {/* MACHINE FACTORS */}
              <div className="space-y-2 border-r border-border/40 pr-2">
                <h4 className="text-xs font-bold text-center bg-muted/40 p-1.5 rounded uppercase">MACHINE</h4>
                <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                  {[
                    "Inadequate Guarding",
                    "Failure of Interlock",
                    "Failure of Photo sensor",
                    "Failure of m/c controls",
                    "Malfunction of controls",
                    "Non-standard equipment",
                    "No lockout provision",
                    "No Interlock",
                    "No Sensor",
                    "Damaged Machine/Eqpt./Tools",
                    "No guard/side guard",
                    "Unearthed machine",
                    "Static charge",
                  ].map((opt) => (
                    <label key={opt} className="flex items-start gap-1.5 text-[11px] font-medium cursor-pointer leading-tight">
                      <input
                        type="radio"
                        name="machineOption"
                        value={opt}
                        checked={machineOption === opt}
                        onChange={(e) => setMachineOption(e.target.value)}
                        className="w-3 h-3 mt-0.5"
                        disabled={!!existingReport}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-1 pt-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Others</Label>
                  <Input
                    value={othersMachine[0]}
                    onChange={(e) => setOthersMachine([e.target.value, othersMachine[1]])}
                    className="h-7 text-[11px] mb-1"
                    placeholder="Other factor 1"
                    disabled={!!existingReport}
                  />
                  <Input
                    value={othersMachine[1]}
                    onChange={(e) => setOthersMachine([othersMachine[0], e.target.value])}
                    className="h-7 text-[11px]"
                    placeholder="Other factor 2"
                    disabled={!!existingReport}
                  />
                </div>
              </div>

              {/* MATERIAL FACTORS */}
              <div className="space-y-2 border-r border-border/40 pr-2">
                <h4 className="text-xs font-bold text-center bg-muted/40 p-1.5 rounded uppercase font-semibold">MATERIAL</h4>
                <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                  {[
                    "Slippery floor",
                    "Hot object",
                    "Hazardous chemical",
                    "Low illumination",
                    "Re-work",
                    "Work load",
                    "Heavy noise/dust/fume",
                    "Congested layout",
                    "Poor access/inadequate access",
                    "Heavy Accumulation of vapour/gas/dust",
                    "Non-standard material",
                  ].map((opt) => (
                    <label key={opt} className="flex items-start gap-1.5 text-[11px] font-medium cursor-pointer leading-tight">
                      <input
                        type="radio"
                        name="materialOption"
                        value={opt}
                        checked={materialOption === opt}
                        onChange={(e) => setMaterialOption(e.target.value)}
                        className="w-3 h-3 mt-0.5"
                        disabled={!!existingReport}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-1 pt-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Others</Label>
                  <Input
                    value={othersMaterial[0]}
                    onChange={(e) => setOthersMaterial([e.target.value, othersMaterial[1]])}
                    className="h-7 text-[11px] mb-1"
                    placeholder="Other factor 1"
                    disabled={!!existingReport}
                  />
                  <Input
                    value={othersMaterial[1]}
                    onChange={(e) => setOthersMaterial([othersMaterial[0], e.target.value])}
                    className="h-7 text-[11px]"
                    placeholder="Other factor 2"
                    disabled={!!existingReport}
                  />
                </div>
              </div>

              {/* METHOD FACTORS */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-center bg-muted/40 p-1.5 rounded uppercase">METHOD</h4>
                <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                  {[
                    "Improper loading height",
                    "Manual Handling",
                    "No safe procedure",
                    "Wrong selection of material",
                    "Non standard methods",
                    "Lack of training",
                    "No specific training",
                    "Congested layout",
                    "Absence / Inadequate planning",
                    "Absence/Inadequate Risk assessment",
                    "Inadequate Maintenance",
                    "Inadequate Contractor Management",
                    "Inadequate monitoring",
                  ].map((opt) => (
                    <label key={opt} className="flex items-start gap-1.5 text-[11px] font-medium cursor-pointer leading-tight">
                      <input
                        type="radio"
                        name="methodOption"
                        value={opt}
                        checked={methodOption === opt}
                        onChange={(e) => setMethodOption(e.target.value)}
                        className="w-3 h-3 mt-0.5"
                        disabled={!!existingReport}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-1 pt-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Others</Label>
                  <Input
                    value={othersMethod[0]}
                    onChange={(e) => setOthersMethod([e.target.value, othersMethod[1]])}
                    className="h-7 text-[11px] mb-1"
                    placeholder="Other factor 1"
                    disabled={!!existingReport}
                  />
                  <Input
                    value={othersMethod[1]}
                    onChange={(e) => setOthersMethod([othersMethod[0], e.target.value])}
                    className="h-7 text-[11px]"
                    placeholder="Other factor 2"
                    disabled={!!existingReport}
                  />
                </div>
              </div>
            </div>

            {/* ROOT CAUSE (WHY-WHY ANALYSIS) */}
            <div className="space-y-3">
              <Label className="text-xs font-bold block">Why-Why Root Cause Determination Table</Label>
              <table className="w-full text-xs border border-border border-collapse text-center">
                <thead>
                  <tr className="bg-muted font-bold text-muted-foreground border-b border-border">
                    <th className="p-2 border-r border-border">What Happened</th>
                    <th className="p-2 border-r border-border">Why 1</th>
                    <th className="p-2 border-r border-border">Why 2</th>
                    <th className="p-2 border-r border-border">Why 3</th>
                    <th className="p-2 border-r border-border">Why 4</th>
                    <th className="p-2 border-r border-border">Why 5</th>
                    {!existingReport && <th className="p-2 w-12">Delete</th>}
                  </tr>
                </thead>
                <tbody>
                  {rootCauses.map((row, idx) => (
                    <tr key={idx} className="border-b border-border">
                      <td className="p-1 border-r border-border">
                        <Textarea
                          value={row.what}
                          onChange={(e) => handleTableChange("rootCauses", idx, "what", e.target.value)}
                          className="h-10 border-0 shadow-none text-xs resize-none"
                          disabled={!!existingReport}
                        />
                      </td>
                      <td className="p-1 border-r border-border">
                        <Textarea
                          value={row.why1}
                          onChange={(e) => handleTableChange("rootCauses", idx, "why1", e.target.value)}
                          className="h-10 border-0 shadow-none text-xs resize-none"
                          disabled={!!existingReport}
                        />
                      </td>
                      <td className="p-1 border-r border-border">
                        <Textarea
                          value={row.why2}
                          onChange={(e) => handleTableChange("rootCauses", idx, "why2", e.target.value)}
                          className="h-10 border-0 shadow-none text-xs resize-none"
                          disabled={!!existingReport}
                        />
                      </td>
                      <td className="p-1 border-r border-border">
                        <Textarea
                          value={row.why3}
                          onChange={(e) => handleTableChange("rootCauses", idx, "why3", e.target.value)}
                          className="h-10 border-0 shadow-none text-xs resize-none"
                          disabled={!!existingReport}
                        />
                      </td>
                      <td className="p-1 border-r border-border">
                        <Textarea
                          value={row.why4}
                          onChange={(e) => handleTableChange("rootCauses", idx, "why4", e.target.value)}
                          className="h-10 border-0 shadow-none text-xs resize-none"
                          disabled={!!existingReport}
                        />
                      </td>
                      <td className="p-1 border-r border-border">
                        <Textarea
                          value={row.why5}
                          onChange={(e) => handleTableChange("rootCauses", idx, "why5", e.target.value)}
                          className="h-10 border-0 shadow-none text-xs resize-none"
                          disabled={!!existingReport}
                        />
                      </td>
                      {!existingReport && (
                        <td className="p-1">
                          <Button
                            type="button"
                            onClick={() => removeTableRow("rootCauses", idx)}
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-500"
                            disabled={rootCauses.length <= 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!existingReport && (
                <Button
                  type="button"
                  onClick={() => addTableRow("rootCauses")}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Analysis Row
                </Button>
              )}
            </div>

            {/* CORRECTIVE ACTIONS */}
            <div className="space-y-3">
              <Label className="text-xs font-bold block">Corrective & Preventive Action Plans</Label>
              <table className="w-full text-xs border border-border border-collapse text-center">
                <thead>
                  <tr className="bg-muted font-bold text-muted-foreground border-b border-border">
                    <th className="p-2 border-r border-border w-12">No.</th>
                    <th className="p-2 border-r border-border">Correction / Corrective Action</th>
                    <th className="p-2 border-r border-border w-48">Responsibility (Who)</th>
                    <th className="p-2 border-r border-border w-48">Deadline (When)</th>
                    {!existingReport && <th className="p-2 w-12">Delete</th>}
                  </tr>
                </thead>
                <tbody>
                  {correctiveActions.map((row, idx) => (
                    <tr key={idx} className="border-b border-border">
                      <td className="p-2 border-r border-border font-medium">{row.slNo}</td>
                      <td className="p-1 border-r border-border">
                        <Input
                          value={row.action}
                          onChange={(e) => handleTableChange("correctiveActions", idx, "action", e.target.value)}
                          className="h-8 border-0 shadow-none text-xs text-center"
                          disabled={!!existingReport}
                        />
                      </td>
                      <td className="p-1 border-r border-border">
                        <Input
                          value={row.who}
                          onChange={(e) => handleTableChange("correctiveActions", idx, "who", e.target.value)}
                          className="h-8 border-0 shadow-none text-xs text-center"
                          disabled={!!existingReport}
                        />
                      </td>
                      <td className="p-1 border-r border-border">
                        <Input
                          type="date"
                          value={row.when}
                          onChange={(e) => handleTableChange("correctiveActions", idx, "when", e.target.value)}
                          className="h-8 border-0 shadow-none text-xs text-center"
                          disabled={!!existingReport}
                        />
                      </td>
                      {!existingReport && (
                        <td className="p-1">
                          <Button
                            type="button"
                            onClick={() => removeTableRow("correctiveActions", idx)}
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-500"
                            disabled={correctiveActions.length <= 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!existingReport && (
                <Button
                  type="button"
                  onClick={() => addTableRow("correctiveActions")}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Corrective Action Row
                </Button>
              )}
            </div>

            {/* HIRA TABLE */}
            <div className="space-y-3">
              <Label className="text-xs font-bold block">Hazard Identification & Risk Assessment (HIRA) Checklist</Label>
              <table className="w-full text-xs border border-border border-collapse text-left">
                <thead>
                  <tr className="bg-muted font-bold text-muted-foreground border-b border-border text-center">
                    <th className="p-2 border-r border-border w-12">No.</th>
                    <th className="p-2 border-r border-border text-left">HIRA Analysis Question</th>
                    <th className="p-2 border-r border-border w-32">Answer</th>
                    <th className="p-2 border-r border-border w-40">Responsibility (Who)</th>
                    <th className="p-2 w-32">Deadline (When)</th>
                  </tr>
                </thead>
                <tbody>
                  {hira.map((row, idx) => (
                    <tr key={idx} className="border-b border-border">
                      <td className="p-2 border-r border-border text-center font-medium">{idx + 1}</td>
                      <td className="p-2 border-r border-border">{row.question}</td>
                      <td className="p-1 border-r border-border text-center">
                        <div className="flex justify-center gap-4">
                          <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                            <input
                              type="radio"
                              name={`hira_${idx}`}
                              value="Yes"
                              checked={row.answer === "Yes"}
                              onChange={(e) => handleTableChange("hira", idx, "answer", e.target.value)}
                              className="w-3.5 h-3.5"
                              disabled={!!existingReport}
                            />
                            Yes
                          </label>
                          <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                            <input
                              type="radio"
                              name={`hira_${idx}`}
                              value="No"
                              checked={row.answer === "No"}
                              onChange={(e) => handleTableChange("hira", idx, "answer", e.target.value)}
                              className="w-3.5 h-3.5"
                              disabled={!!existingReport}
                            />
                            No
                          </label>
                        </div>
                      </td>
                      <td className="p-1 border-r border-border">
                        <Input
                          value={row.who}
                          onChange={(e) => handleTableChange("hira", idx, "who", e.target.value)}
                          className="h-8 border-0 shadow-none text-xs text-center"
                          disabled={!!existingReport}
                        />
                      </td>
                      <td className="p-1">
                        <Input
                          value={row.when}
                          onChange={(e) => handleTableChange("hira", idx, "when", e.target.value)}
                          className="h-8 border-0 shadow-none text-xs text-center"
                          placeholder="Wk No / Date"
                          disabled={!!existingReport}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ACTION BUTTON */}
            {!existingReport && (
              <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 min-w-[150px] shadow-md gap-2"
                >
                  {submitting ? (
                    "Saving Report..."
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Submit Incident Report
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
