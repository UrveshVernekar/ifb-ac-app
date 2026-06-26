"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Clock, ShieldAlert, Award, Wrench, Download, Printer } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface JsaItem {
  sr_num: number;
  sub_activity_name: string;
  type_of_hazard: string;
  risk_involved: string;
  risk_control_measures: string;
}

interface PermitDetails {
  id: number;
  validfrom: string;
  expiry_date: string;
  dateofissue: string;
  perminame: string;
  description: string;
  LocationOfWork: string;
  totalManPower: number;
  plant: string;
  supervisorName: string;
  contractorName: string;
  ppeUsed?: string;
  department: string;
  activityName?: string;
  ref?: string;
  location?: string;
  jsa?: string | JsaItem[];
  
  // Approver states: 0 = Pending, 1 = Approved, 2 = Rejected
  main_status: number;
  main_mail?: string;
  main_remark?: string;
  main_date?: string;
  
  area_status: number;
  area_mail?: string;
  area_remark?: string;
  area_date?: string;
  
  safety_status: number;
  safety_mail?: string;
  safety_remark?: string;
  safety_date?: string;
  
  permit_status: number; // closure status
  permit_remark?: string;
  permit_date?: string;

  // LOTO
  machineID?: string;
  machine_Date?: string;
  machine_startTime?: string;
  machine_EndTime?: string;
  lotoUser1?: string;
  lotoUser2?: string;
  lotoUser?: string;
}

export default function ViewWorkPermitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const permitId = searchParams.get("id");

  const [mounted, setMounted] = useState(false);
  const [permitData, setPermitData] = useState<PermitDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [approving, setApproving] = useState(false);
  const [remarkInput, setRemarkInput] = useState("");

  const API_HOST = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";
  const safetyDataBase = API_HOST.replace(":3003", ":3002");

  const fetchPermitDetails = useCallback(async () => {
    if (!permitId) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `${safetyDataBase}/safetydata/workpermit/getdata?id=${permitId}&plant=AC`
      );
      if (response.data) {
        setPermitData(response.data);
      }
    } catch (error) {
      console.error("Error fetching permit details:", error);
      toast.error("Failed to load work permit details");
    } finally {
      setLoading(false);
    }
  }, [permitId, safetyDataBase]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setUserEmail(sessionStorage.getItem("employee_email") || "");
    }
  }, []);

  useEffect(() => {
    if (mounted && permitId) {
      fetchPermitDetails();
    }
  }, [permitId, fetchPermitDetails, mounted]);

  // Determine current active approval role step for logged-in user
  const myApprovalStep = useMemo(() => {
    if (!permitData || !userEmail) return null;
    const email = userEmail.toLowerCase().trim();

    // 1. Maintenance Incharge
    if (permitData.main_status === 0 && permitData.main_mail?.toLowerCase().trim() === email) {
      return { key: "main_status", label: "Maintenance Incharge" };
    }
    // 2. Area Incharge
    if (permitData.area_status === 0 && permitData.area_mail?.toLowerCase().trim() === email) {
      return { key: "area_status", label: "Area Incharge" };
    }
    // 3. Safety Incharge
    if (permitData.safety_status === 0 && permitData.safety_mail?.toLowerCase().trim() === email) {
      return { key: "safety_status", label: "Safety Incharge" };
    }
    // 4. Closure (by Area Incharge once safety is approved)
    if (permitData.permit_status === 0 && permitData.safety_status === 1 && permitData.area_mail?.toLowerCase().trim() === email) {
      return { key: "permit_status", label: "Clearance Closure Authority" };
    }

    return null;
  }, [permitData, userEmail]);

  // Determine next pending step for general display
  const waitingForStep = useMemo(() => {
    if (!permitData) return null;
    if (permitData.main_status === 0) return { label: "Maintenance Incharge Approval", mail: permitData.main_mail };
    if (permitData.area_status === 0) return { label: "Area Incharge Approval", mail: permitData.area_mail };
    if (permitData.safety_status === 0) return { label: "Safety Incharge Approval", mail: permitData.safety_mail };
    if (permitData.permit_status === 0) return { label: "Area Closure Authorization", mail: permitData.area_mail };
    return { label: "Closed & Completed", mail: "" };
  }, [permitData]);

  // Approve/Reject request
  const handleApprovalAction = async (status: number) => {
    if (!permitData || !myApprovalStep) return;
    
    if (status === 2 && !remarkInput.trim()) {
      toast.error("Please provide a rejection remark");
      return;
    }

    const payload = {
      docid: permitData.id,
      apkey: myApprovalStep.key,
      status: status,
      remark: remarkInput || "Approved",
      date: new Date().toISOString().split("T")[0],
      mailid: userEmail
    };

    setApproving(true);
    try {
      const response = await axios.post(`${safetyDataBase}/safetydata/workpermit`, {
        key: "APPROVAL",
        ...payload
      });
      
      toast.success(response.data || "Authorization status updated successfully!");
      setRemarkInput("");
      fetchPermitDetails();
    } catch (error) {
      console.error("Authorization submit error:", error);
      toast.error("Error submitting authorization action");
    } finally {
      setApproving(false);
    }
  };

  // Safe parse of JSA entries
  const jsaList = useMemo<JsaItem[]>(() => {
    if (!permitData || !permitData.jsa) return [];
    if (typeof permitData.jsa === "string") {
      try {
        return JSON.parse(permitData.jsa) || [];
      } catch {
        return [];
      }
    }
    return permitData.jsa || [];
  }, [permitData]);

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold">APPROVED</Badge>;
      case 2:
        return <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px] font-bold">REJECTED</Badge>;
      default:
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] font-bold">PENDING</Badge>;
    }
  };

  const fmtMailName = (email?: string) => {
    return email?.split("@")[0]?.replace(/_/g, " ")?.toUpperCase() || "--";
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground font-semibold">Loading Permit Details...</p>
        </div>
      </div>
    );
  }

  if (!permitData) {
    return (
      <div className="max-w-xl mx-auto text-center space-y-4 pt-16">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold">Work Permit Not Found</h3>
        <p className="text-sm text-muted-foreground">The requested safety permit record is either missing or inaccessible.</p>
        <Link href="/safety/work-permit">
          <Button variant="outline" size="sm">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 print:p-0 print:max-w-full">
      {/* HEADER SECTION (HIDDEN IN PRINT) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/safety/work-permit">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
              Permit Authorization Details
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review safety parameters and authorize permit approvals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-9 font-semibold text-xs border-border/80 gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Permit
          </Button>
        </div>
      </div>

      {/* PRINT-ONLY COVER HEADER */}
      <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-extrabold tracking-wide uppercase">IFB Industries Ltd. Goa</h1>
        <h2 className="text-md font-bold text-muted-foreground uppercase">AC Plant division</h2>
        <h3 className="text-xl font-bold mt-2 text-black underline">SAFETY WORK CLEARANCE PERMIT CERTIFICATE</h3>
        <p className="text-xs text-muted-foreground mt-1">Permit ID Reference: {permitData.id}</p>
      </div>

      {/* MAIN VIEW CARD */}
      <Card className="border-border/65 shadow-sm bg-card overflow-hidden print:border-0 print:shadow-none print:bg-white">
        <CardHeader className="bg-slate-900 text-white p-5 print:bg-transparent print:text-black print:p-0 print:pb-3 print:border-b">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-amber-500 uppercase tracking-wide print:text-black">
                Master Work Permit Details
              </CardTitle>
              <CardDescription className="text-xs text-slate-300 print:text-muted-foreground">
                Document Code ID: {permitData.id}
              </CardDescription>
            </div>
            
            {/* Status indicator */}
            <div className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-lg border border-white/10 print:bg-transparent print:border-black print:text-black text-xs font-semibold">
              <Clock className="w-4 h-4 text-amber-500 print:text-black" />
              <span>
                {waitingForStep?.label === "Closed & Completed" ? "PERMIT CLOSED" : `WAITING FOR: ${waitingForStep?.label.toUpperCase()}`}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-8 print:p-0 print:pt-4">

          {/* SECTION 1: WORK DETAILS */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 border-b pb-1.5 print:text-black print:border-black">
              1. General Particulars
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-xs">
              <div>
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Date of Issue</p>
                <p className="font-semibold text-foreground/90 mt-1">{permitData.dateofissue || "--"}</p>
              </div>
              <div>
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Valid From</p>
                <p className="font-semibold text-foreground/90 mt-1">{permitData.validfrom || "--"}</p>
              </div>
              <div>
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Expiry Date</p>
                <p className="font-semibold text-foreground/90 mt-1">{permitData.expiry_date || "--"}</p>
              </div>
              <div>
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Department</p>
                <p className="font-semibold text-foreground/90 mt-1 capitalize">{permitData.department || "--"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-xs">
              <div>
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Permittee Contractor Agency</p>
                <p className="font-semibold text-foreground/90 mt-1">{permitData.perminame || "--"}</p>
              </div>
              <div>
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Contractor Representative</p>
                <p className="font-semibold text-foreground/90 mt-1">{permitData.contractorName || "--"}</p>
              </div>
              <div>
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">IFB Supervisor</p>
                <p className="font-semibold text-foreground/90 mt-1">{permitData.supervisorName || "--"}</p>
              </div>
              <div>
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Total Manpower</p>
                <p className="font-semibold text-foreground/90 mt-1">{permitData.totalManPower || "0"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
              <div>
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Location of Work</p>
                <p className="font-semibold text-foreground/90 mt-1">{permitData.LocationOfWork || "--"}</p>
              </div>
              <div>
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Description of Work</p>
                <p className="font-semibold text-foreground/90 mt-1">{permitData.description || "--"}</p>
              </div>
            </div>
          </div>

          {/* SECTION 2: JSA SCHEME DETAILS */}
          {permitData.activityName && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 border-b pb-1.5 print:text-black print:border-black">
                2. Job Safety Analysis (JSA)
              </h3>
              <div className="grid grid-cols-3 gap-4 text-xs bg-muted/20 border p-3 rounded-lg print:border-black">
                <div>
                  <span className="font-bold text-muted-foreground text-[10px] block">Activity Name</span>
                  <span className="font-semibold mt-0.5 block">{permitData.activityName}</span>
                </div>
                <div>
                  <span className="font-bold text-muted-foreground text-[10px] block">Reference JSA Ref</span>
                  <span className="font-semibold mt-0.5 block">{permitData.ref}</span>
                </div>
                <div>
                  <span className="font-bold text-muted-foreground text-[10px] block">JSA Location</span>
                  <span className="font-semibold mt-0.5 block">{permitData.location}</span>
                </div>
              </div>

              <div className="overflow-x-auto border border-border/40 rounded-lg print:border-black">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-900 text-amber-500 font-bold uppercase text-[10px] print:bg-slate-100 print:text-black">
                      <th className="p-2.5 w-12 text-center border-r print:border-black">Step</th>
                      <th className="p-2.5 border-r print:border-black">Process Steps</th>
                      <th className="p-2.5 border-r print:border-black">Potential Hazards</th>
                      <th className="p-2.5 border-r print:border-black">Risk Involved</th>
                      <th className="p-2.5">Recommended Control Measures</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 print:divide-black">
                    {jsaList.map((row) => (
                      <tr key={row.sr_num} className="hover:bg-muted/10 print:hover:bg-transparent">
                        <td className="p-2.5 text-center font-bold border-r print:border-black">{row.sr_num}</td>
                        <td className="p-2.5 border-r print:border-black leading-relaxed">{row.sub_activity_name}</td>
                        <td className="p-2.5 border-r print:border-black leading-relaxed">{row.type_of_hazard}</td>
                        <td className="p-2.5 border-r print:border-black leading-relaxed">{row.risk_involved}</td>
                        <td className="p-2.5 leading-relaxed">{row.risk_control_measures}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 3: LOTO DETAILS */}
          {permitData.machineID && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 border-b pb-1.5 print:text-black print:border-black">
                3. Lockout / Tagout (LOTO) isolation details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="font-bold text-muted-foreground text-[10px] block">LOTO Machine Point</span>
                  <span className="font-semibold block mt-0.5 text-rose-500 font-bold">{permitData.machineID}</span>
                </div>
                <div>
                  <span className="font-bold text-muted-foreground text-[10px] block">Isolation Date</span>
                  <span className="font-semibold block mt-0.5">{permitData.machine_Date || "--"}</span>
                </div>
                <div>
                  <span className="font-bold text-muted-foreground text-[10px] block">Start Time</span>
                  <span className="font-semibold block mt-0.5">{permitData.machine_startTime || "--"}</span>
                </div>
                <div>
                  <span className="font-bold text-muted-foreground text-[10px] block">End Time</span>
                  <span className="font-semibold block mt-0.5">{permitData.machine_EndTime || "--"}</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: APPROVALS LEDGER & STATUS */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 border-b pb-1.5 print:text-black print:border-black">
              4. Authorization Work Signatures
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Maintenance */}
              <div className="border border-border/40 rounded-xl p-4 bg-muted/5 flex flex-col justify-between h-40 shadow-inner print:border-black">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Maint Incharge</span>
                    <Wrench className="w-3.5 h-3.5 text-muted-foreground/60" />
                  </div>
                  <p className="text-xs font-extrabold truncate" title={permitData.main_mail}>
                    {fmtMailName(permitData.main_mail)}
                  </p>
                </div>

                <div className="space-y-2 mt-4">
                  {getStatusBadge(permitData.main_status)}
                  {permitData.main_status !== 0 && (
                    <div className="text-[10px] text-muted-foreground leading-tight space-y-0.5">
                      <p className="font-medium truncate"><span className="font-bold">Rem:</span> {permitData.main_remark}</p>
                      <p className="text-[9px]">{permitData.main_date}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Area */}
              <div className="border border-border/40 rounded-xl p-4 bg-muted/5 flex flex-col justify-between h-40 shadow-inner print:border-black">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Area Incharge</span>
                    <Award className="w-3.5 h-3.5 text-muted-foreground/60" />
                  </div>
                  <p className="text-xs font-extrabold truncate" title={permitData.area_mail}>
                    {fmtMailName(permitData.area_mail)}
                  </p>
                </div>

                <div className="space-y-2 mt-4">
                  {getStatusBadge(permitData.area_status)}
                  {permitData.area_status !== 0 && (
                    <div className="text-[10px] text-muted-foreground leading-tight space-y-0.5">
                      <p className="font-medium truncate"><span className="font-bold">Rem:</span> {permitData.area_remark}</p>
                      <p className="text-[9px]">{permitData.area_date}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Safety */}
              <div className="border border-border/40 rounded-xl p-4 bg-muted/5 flex flex-col justify-between h-40 shadow-inner print:border-black">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Safety Officer</span>
                    <CheckCircle className="w-3.5 h-3.5 text-muted-foreground/60" />
                  </div>
                  <p className="text-xs font-extrabold truncate" title={permitData.safety_mail}>
                    {fmtMailName(permitData.safety_mail)}
                  </p>
                </div>

                <div className="space-y-2 mt-4">
                  {getStatusBadge(permitData.safety_status)}
                  {permitData.safety_status !== 0 && (
                    <div className="text-[10px] text-muted-foreground leading-tight space-y-0.5">
                      <p className="font-medium truncate"><span className="font-bold">Rem:</span> {permitData.safety_remark}</p>
                      <p className="text-[9px]">{permitData.safety_date}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Closure */}
              <div className="border border-border/40 rounded-xl p-4 bg-muted/5 flex flex-col justify-between h-40 shadow-inner print:border-black">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Clearance Closure</span>
                    <XCircle className="w-3.5 h-3.5 text-muted-foreground/60" />
                  </div>
                  <p className="text-xs font-extrabold truncate" title={permitData.area_mail}>
                    {fmtMailName(permitData.area_mail)}
                  </p>
                </div>

                <div className="space-y-2 mt-4">
                  {getStatusBadge(permitData.permit_status)}
                  {permitData.permit_status !== 0 && (
                    <div className="text-[10px] text-muted-foreground leading-tight space-y-0.5">
                      <p className="font-medium truncate"><span className="font-bold">Rem:</span> {permitData.permit_remark}</p>
                      <p className="text-[9px]">{permitData.permit_date}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: APPROVALS FORM INTERFACE (HIDDEN IN PRINT) */}
          {myApprovalStep && (
            <div className="border-2 border-dashed border-amber-500 bg-amber-500/5 p-6 rounded-2xl space-y-4 print:hidden">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
                <h4 className="text-sm font-bold uppercase tracking-wider">
                  Pending Authorization clearance required: {myApprovalStep.label.toUpperCase()}
                </h4>
              </div>
              <p className="text-xs text-muted-foreground">
                You are currently assigned as the active authority approver for this safety work permit clearance step.
              </p>

              <div className="space-y-2 max-w-xl">
                <Label htmlFor="auth-remark" className="text-xs font-semibold">Remarks (Required if rejecting) *</Label>
                <Input
                  id="auth-remark"
                  type="text"
                  placeholder="Provide authorization remarks..."
                  value={remarkInput}
                  onChange={(e) => setRemarkInput(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleApprovalAction(1)}
                  disabled={approving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-6 cursor-pointer"
                >
                  Authorize Approve
                </Button>
                <Button
                  onClick={() => handleApprovalAction(2)}
                  disabled={approving}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-9 px-6 cursor-pointer"
                >
                  Reject Permit
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
