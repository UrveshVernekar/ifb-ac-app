"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, User, HeartPulse, ShieldAlert, FileText, Check, Plus, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CommonDialog from "@/components/shared/CommonDialog";
import { toast } from "sonner";
import { format } from "date-fns";

interface OhcPatientDetail {
  id: number;
  patient: string;
  paitentbyid: string; // matches patientbyid
  age: number;
  departin: string;
  experience: number;
  gender: string;
  sperson: string;
  obsertype: string;
  slevel: string;
  date: string;
  otime: string;
  complaint: string;
  injury: string;
  attended: string;
  fag: string;
  cases: string;
  tempFile?: string;
  perFile?: string;
  supporting_files?: string;
}

export default function OhcDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState<OhcPatientDetail | null>(null);
  const [hasIncidentReport, setHasIncidentReport] = useState(false);

  // Patient History Dialog
  const [historyOpen, setHistoryOpen] = useState(false);
  const [areaOfWork, setAreaOfWork] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [savingHistory, setSavingHistory] = useState(false);

  const API_HOST_3003 = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";
  const imgURL1 = "http://10.0.7.26:8090/";
  const imgURL2 = "http://10.0.2.243:8086/";

  const fetchPatientDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const currentYear = new Date().getFullYear();
    const apiUrl = `${API_HOST_3003}/safety/ohc/year=${currentYear}&ptype=AC&rtype=FY&sdate=sdate&edate=edate`;

    try {
      // 1. Fetch OHC record list and find this patient
      const res = await axios.get(apiUrl);
      const list = res.data?.ohclist || [];
      const found = list.find((item: any) => item.id === parseInt(id));
      setPatientData(found || null);

      // 2. Fetch OHC incident report availability
      const incidentRes = await axios.get(`${API_HOST_3003}/safety/ohc/incident_report_list?id=${id}`);
      const incidentList = Array.isArray(incidentRes.data) ? incidentRes.data : [incidentRes.data];
      const hasRep = incidentList.some((item: any) => item && item.sohcdata_id === parseInt(id));
      setHasIncidentReport(hasRep);
    } catch (err) {
      console.error("Error loading patient details:", err);
      toast.error("Failed to load patient record details");
    } finally {
      setLoading(false);
    }
  }, [id, API_HOST_3003]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && id) {
      fetchPatientDetails();
    }
  }, [id, fetchPatientDetails, mounted]);

  const handleSaveHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!areaOfWork.trim() || !recommendation.trim()) {
      toast.error("Please fill both history fields");
      return;
    }

    setSavingHistory(true);
    try {
      const response = await axios.post(`${API_HOST_3003}/safety/ohc/patient_history`, {
        id: id,
        areaOfWork,
        recommendation,
      });

      if (response.data === "Data Submitted!") {
        toast.success("Patient medical history updated successfully!");
        setHistoryOpen(false);
        setAreaOfWork("");
        setRecommendation("");
        fetchPatientDetails();
      } else {
        toast.error("Failed to update history: " + response.data);
      }
    } catch (error) {
      console.error("Error submitting history:", error);
      toast.error("An error occurred during updating patient history");
    } finally {
      setSavingHistory(false);
    }
  };

  const getSeverityBadgeColor = (level: string) => {
    const lev = level?.toLowerCase();
    if (lev?.includes("high") || lev?.includes("severe")) return "bg-red-500/10 text-red-600 border border-red-500/20";
    if (lev?.includes("medium") || lev?.includes("moderate")) return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
    return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
  };

  // Convert files list string into array
  const filesList = useMemo(() => {
    if (!patientData?.supporting_files) return [];
    return patientData.supporting_files.split(",").map((f) => f.trim()).filter(Boolean);
  }, [patientData]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-xs text-muted-foreground">Loading patient details...</p>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="space-y-4 text-center p-8">
        <h3 className="text-lg font-bold">OHC Patient record not found</h3>
        <Link href="/safety/ohc-list">
          <Button variant="outline" size="sm">Go Back</Button>
        </Link>
      </div>
    );
  }

  const showIncidentAction = ["First Aid Case", "Referred cases"].includes(patientData.obsertype);

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/safety/ohc-list">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
              Patient Record Details
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review confidential medical log, case classifications, and incident logs.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* PATIENT HISTORY UPDATE DIALOG */}
          <Button
            onClick={() => setHistoryOpen(true)}
            variant="outline"
            className="text-xs h-9 border-blue-500/20 text-blue-600 hover:bg-blue-500/5 font-semibold"
          >
            Update Patient History
          </Button>

          {/* INCIDENT REPORT REDIRECT */}
          {showIncidentAction && (
            <Button
              onClick={() => router.push(`/safety/ohc-incident?id=${id}`)}
              className="text-xs h-9 bg-teal-600 hover:bg-teal-700 text-white font-bold"
            >
              {hasIncidentReport ? "View 5-Why Investigation" : "Create 5-Why Investigation"}
            </Button>
          )}
        </div>
      </div>

      {/* METRIC HEADER BANNER */}
      <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent border border-teal-500/20 rounded-xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-teal-500/15 text-teal-600 rounded-xl">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground uppercase tracking-wide">{patientData.patient}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Employee ID: {patientData.paitentbyid || "N/A"} • Case ID: {patientData.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">Category</p>
            <p className="text-xs font-bold text-foreground mt-0.5">{patientData.obsertype}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getSeverityBadgeColor(patientData.slevel)}`}>
            Severity: {patientData.slevel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PATIENT INFO CARD */}
        <Card className="border-border/60 shadow-md">
          <CardHeader className="bg-muted/30 border-b border-border/40 pb-3 flex items-center gap-1.5 flex-row">
            <User className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
              Patient Demographic Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr className="border-b border-border/40 hover:bg-muted/10">
                  <td className="p-3 font-semibold text-muted-foreground w-1/3 bg-muted/5">Patient Name</td>
                  <td className="p-3 font-medium uppercase">{patientData.patient}</td>
                </tr>
                <tr className="border-b border-border/40 hover:bg-muted/10">
                  <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Employee ID</td>
                  <td className="p-3 font-medium">{patientData.paitentbyid || "N/A"}</td>
                </tr>
                <tr className="border-b border-border/40 hover:bg-muted/10">
                  <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Age</td>
                  <td className="p-3 font-medium">{patientData.age} Years</td>
                </tr>
                <tr className="border-b border-border/40 hover:bg-muted/10">
                  <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Gender</td>
                  <td className="p-3 font-medium">{patientData.gender}</td>
                </tr>
                <tr className="border-b border-border/40 hover:bg-muted/10">
                  <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Department Incharge</td>
                  <td className="p-3 font-medium uppercase">{patientData.departin}</td>
                </tr>
                <tr className="border-b border-border/40 hover:bg-muted/10">
                  <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Experience in Job</td>
                  <td className="p-3 font-medium">{patientData.experience} Years</td>
                </tr>
                <tr className="hover:bg-muted/10">
                  <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Reporting Supervisor</td>
                  <td className="p-3 font-medium">{patientData.sperson}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* CLINICAL LOGS CARD */}
        <Card className="border-border/60 shadow-md">
          <CardHeader className="bg-muted/30 border-b border-border/40 pb-3 flex items-center gap-1.5 flex-row">
            <HeartPulse className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
              Clinical Medical Record
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr className="border-b border-border/40 hover:bg-muted/10">
                  <td className="p-3 font-semibold text-muted-foreground w-1/3 bg-muted/5">Date of Issue</td>
                  <td className="p-3 font-medium">{patientData.date ? format(new Date(patientData.date), "dd-MMM-yyyy") : "--"}</td>
                </tr>
                <tr className="border-b border-border/40 hover:bg-muted/10">
                  <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Time Logged</td>
                  <td className="p-3 font-medium">{patientData.otime}</td>
                </tr>
                <tr className="border-b border-border/40 hover:bg-muted/10">
                  <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Patient Complaints</td>
                  <td className="p-3 leading-relaxed">{patientData.complaint}</td>
                </tr>
                <tr className="border-b border-border/40 hover:bg-muted/10">
                  <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Injury Classification</td>
                  <td className="p-3 font-medium">{patientData.injury}</td>
                </tr>
                <tr className="border-b border-border/40 hover:bg-muted/10">
                  <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Attended By</td>
                  <td className="p-3 font-medium">{patientData.attended}</td>
                </tr>
                <tr className="border-b border-border/40 hover:bg-muted/10">
                  <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Treatment / First Aid Given</td>
                  <td className="p-3 leading-relaxed text-teal-600 font-semibold">{patientData.fag}</td>
                </tr>
                <tr className="hover:bg-muted/10">
                  <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Case Classification</td>
                  <td className="p-3 font-medium">{patientData.cases}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* EVIDENCE & FILES ATTACHMENTS CARD */}
      {(patientData.tempFile || patientData.perFile || filesList.length > 0) && (
        <Card className="border-border/60 shadow-md">
          <CardHeader className="bg-muted/30 border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
              Evidence & Supporting Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Temp File */}
              {patientData.tempFile && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase">Temporary Evidence File</h4>
                  <div className="border border-border rounded-lg p-2 bg-muted/20 w-48 h-48 overflow-hidden shadow-sm">
                    <img
                      src={imgURL1 + patientData.tempFile}
                      alt="Temporary Evidence"
                      className="w-full h-full object-contain cursor-zoom-in hover:scale-105 transition-all"
                      onClick={() => window.open(imgURL1 + patientData!.tempFile, "_blank")}
                      onError={(e: any) => {
                        e.target.onerror = null;
                        e.target.src = imgURL2 + patientData!.tempFile;
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Per File */}
              {patientData.perFile && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase">Permanent Evidence File</h4>
                  <div className="border border-border rounded-lg p-2 bg-muted/20 w-48 h-48 overflow-hidden shadow-sm">
                    <img
                      src={imgURL1 + patientData.perFile}
                      alt="Permanent Evidence"
                      className="w-full h-full object-contain cursor-zoom-in hover:scale-105 transition-all"
                      onClick={() => window.open(imgURL1 + patientData!.perFile, "_blank")}
                      onError={(e: any) => {
                        e.target.onerror = null;
                        e.target.src = imgURL2 + patientData!.perFile;
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Supporting Files Lists */}
            {filesList.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase">Additional Supporting Documents</h4>
                <div className="flex flex-wrap gap-3">
                  {filesList.map((file, idx) => (
                    <Button
                      key={idx}
                      type="button"
                      variant="outline"
                      onClick={() => window.open(imgURL1 + file, "_blank")}
                      className="text-xs h-9 border-border/60 hover:bg-muted/10 gap-1 text-foreground"
                    >
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      {file.split("/").pop()}
                      <ExternalLink className="w-3 h-3 text-muted-foreground ml-1" />
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PATIENT HISTORY UPDATE DIALOG */}
      <CommonDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        title="Update Patient Medical History"
        description="Insert area of work and physical work recommendation for patient registry details"
      >
        <form onSubmit={handleSaveHistory} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="area" className="text-xs font-semibold">Area of Work *</Label>
            <Input
              id="area"
              placeholder="e.g. Press Shop, Assembly line A"
              value={areaOfWork}
              onChange={(e) => setAreaOfWork(e.target.value)}
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recommend" className="text-xs font-semibold">Physician Recommendation *</Label>
            <Input
              id="recommend"
              placeholder="e.g. Light work, no lifting > 5kg"
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setHistoryOpen(false)}
              className="text-xs h-9"
              disabled={savingHistory}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 min-w-[80px]"
              disabled={savingHistory}
            >
              {savingHistory ? "Saving..." : "Save History"}
            </Button>
          </div>
        </form>
      </CommonDialog>
    </div>
  );
}
