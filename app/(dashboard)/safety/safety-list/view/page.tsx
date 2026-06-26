"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Edit, Check, X, FileText, CheckCircle2, Clock, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CommonDialog from "@/components/shared/CommonDialog";
import { toast } from "sonner";
import { format } from "date-fns";

interface SafetyDetail {
  id: number;
  obsertype: string;
  obser: string;
  departin: string;
  hazard: string;
  risklevel: string;
  action: string;
  reperson: string;
  rperson: string;
  rpersonid?: string;
  onBehalf: string;
  raisedby: string;
  date: string;
  tdate: string;
  status: string;
  bpicture?: string;
  apicture?: string;
  remark?: string;
}

interface UserOption {
  value: string;
  label: string;
}

interface DepartmentOption {
  value: string;
  label: string;
  type: string;
}

export default function SafetyDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [sdata, setsData] = useState<SafetyDetail | null>(null);

  // Form Verification & Actions
  const [remark, setRemark] = useState("");
  const [sessionEmail, setSessionEmail] = useState("");
  const [employeeCompany, setEmployeeCompany] = useState("");

  // Edit details dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [deptOptions, setDeptOptions] = useState<DepartmentOption[]>([]);
  const [editedRPerson, setEditedRPerson] = useState("");
  const [editedDepartIn, setEditedDepartIn] = useState("");

  // OHC Incident report availability check
  const [hasIncidentReport, setHasIncidentReport] = useState(false);

  const API_HOST_3003 = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";

  const imgURL1 = "http://10.0.7.26:8090/";
  const imgURL2 = "http://10.0.2.243:8086/";

  const reviewerEmails = useMemo(() => [
    "ramchandra_yadav@ifbglobal.com",
    "salim_khan@ifbglobal.com",
    "riv_acplant@ifbglobal.com",
    "binnet_sam@ifbglobal.com",
    "safety_acplant@ifbglobal.com",
    "sairaj_usgaonkar@ifbglobal.com",
    "j_karthikeyan@ifbglobal.com",
    "yogesh_more@ifbglobal.com",
    "santosh_nimbalkar@ifbglobal.com",
    "ketan_keshav@ifbglobal.com",
  ], []);

  const adminEmails = useMemo(() => [
    "safety_acplant@ifbglobal.com",
    "ketan_keshav@ifbglobal.com",
  ], []);

  const isReviewer = useMemo(() => {
    return reviewerEmails.includes(sessionEmail);
  }, [sessionEmail, reviewerEmails]);

  const isAdminUser = useMemo(() => {
    return adminEmails.includes(sessionEmail);
  }, [sessionEmail, adminEmails]);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 1. Fetch safety observation details
      const detailsRes = await axios.get(`${API_HOST_3003}/safety/ohc/getByIdUaucdata?id=${id}`);
      const fetchedItem = detailsRes.data?.[0] || null;
      setsData(fetchedItem);

      if (fetchedItem) {
        setEditedRPerson(fetchedItem.rperson || "");
        setEditedDepartIn(fetchedItem.departin || "");

        // 2. Fetch OHC incident report list to see if investigation exists
        const incidentRes = await axios.get(`${API_HOST_3003}/safety/ohc/incident_report_list?id=${id}`);
        const list = Array.isArray(incidentRes.data) ? incidentRes.data : [incidentRes.data];
        const hasRep = list.some((item: any) => item && item.sohcdata_id === parseInt(id));
        setHasIncidentReport(hasRep);
      }
    } catch (err) {
      console.error("Error fetching safety details:", err);
      toast.error("Failed to load details");
    } finally {
      setLoading(false);
    }
  }, [id, API_HOST_3003]);

  const fetchDropdownLists = useCallback(async () => {
    try {
      const [usersRes, deptsRes] = await Promise.all([
        axios.get(`${API_HOST_3003}/safety/ohc/ac-user`),
        axios.get(`${API_HOST_3003}/safety/ohc/department_list`),
      ]);

      const deduplicate = <T extends { value: string }>(arr: T[]) => {
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

      setUserOptions(deduplicate(usersRes.data || []));
      const rawDepts = (deptsRes.data || []).filter((item: DepartmentOption) => item.type === "AC");
      setDeptOptions(deduplicate(rawDepts));
    } catch (err) {
      console.error("Error loading dropdown data for edit modal:", err);
    }
  }, [API_HOST_3003]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setSessionEmail(sessionStorage.getItem("employee_email") || "");
      setEmployeeCompany(sessionStorage.getItem("employee_company") || "IFB AC");
    }
  }, []);

  useEffect(() => {
    if (mounted && id) {
      fetchDetails();
      fetchDropdownLists();
    }
  }, [id, fetchDetails, fetchDropdownLists, mounted]);

  const handleVerify = async (actionStatus: number) => {
    if (!remark.trim()) {
      toast.error("Please enter an approval/rejection remark");
      return;
    }
    if (!sdata) return;

    setIsActionSubmitting(true);
    const data = new FormData();
    data.append("formdata", JSON.stringify(sdata));
    data.append("status", JSON.stringify(3));
    data.append("astatus", JSON.stringify(actionStatus));
    data.append("aremark", JSON.stringify(remark));

    const config = {
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    };

    try {
      await axios.post(`${API_HOST_3003}/safety/ohc/formdata`, data, config);
      toast.success(actionStatus === 1 ? "Observation approved successfully" : "Observation rejected");
      router.push("/safety/safety-list");
    } catch (err) {
      console.error("Action verify error:", err);
      toast.error("Failed to process verification action");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleOpenEdit = () => {
    if (sdata) {
      setEditedRPerson(sdata.rperson || "");
      setEditedDepartIn(sdata.departin || "");
    }
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sdata) return;
    if (!editedRPerson || !editedDepartIn) {
      toast.error("Please fill all required fields");
      return;
    }

    const matchedUser = userOptions.find((u) => u.label === editedRPerson || u.value === editedRPerson);
    const repersonLabel = matchedUser ? matchedUser.label : editedRPerson;
    const repersonValue = matchedUser ? matchedUser.value : sdata.rpersonid || "";

    const payload = {
      id: sdata.id,
      rpersonid: repersonValue,
      rperson: repersonLabel,
      departin: editedDepartIn,
    };

    try {
      await axios.put(`${API_HOST_3003}/safety/ohc/update-raisedby`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Details updated successfully");
      setEditOpen(false);
      fetchDetails();
    } catch (err) {
      console.error("Error editing details:", err);
      toast.error("Failed to update safety details");
    }
  };

  // Image helpers
  const beforePics = useMemo(() => {
    if (!sdata?.bpicture) return [];
    return sdata.bpicture.split(",").map((p) => p.trim()).filter(Boolean);
  }, [sdata]);

  const afterPics = useMemo(() => {
    if (!sdata?.apicture) return [];
    return sdata.apicture.split(",").map((p) => p.trim()).filter(Boolean);
  }, [sdata]);

  const getStatusBadge = (statusStr: string) => {
    const stat = statusStr?.toLowerCase();
    if (stat === "completed") return <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded text-xs font-bold">Completed</span>;
    if (stat === "approval pending") return <span className="bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2 py-0.5 rounded text-xs font-bold">Approval Pending</span>;
    if (stat === "rejected") return <span className="bg-rose-500/10 text-rose-600 border border-rose-500/20 px-2 py-0.5 rounded text-xs font-bold">Rejected</span>;
    return <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded text-xs font-bold">Under Progress</span>;
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-xs text-muted-foreground">Loading safety details...</p>
      </div>
    );
  }

  if (!sdata) {
    return (
      <div className="space-y-4 text-center p-8">
        <Ban className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold">Safety record not found</h3>
        <Link href="/safety/safety-list">
          <Button variant="outline" size="sm">Go Back</Button>
        </Link>
      </div>
    );
  }

  const isProgress = sdata.status === "Under Progress" || sdata.status === "Pending";
  const showActionsTab = ["First Aid Case", "Near Miss", "Minor Incident", "Major Incident", "Fire Incident", "Dangerous occurrence", "Property Damage"].includes(sdata.obsertype?.replace(/\s+/g, " ")?.trim());

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/safety/safety-list">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
              Safety Record Details
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review history, check status, verify resolution details or update.
            </p>
          </div>
        </div>

        {/* ADMIN EDIT DETAILS BUTTON */}
        {isAdminUser && employeeCompany === "IFB AC" && sdata.status !== "Completed" && (
          <Button
            onClick={handleOpenEdit}
            variant="outline"
            className="text-xs h-9 border-blue-500/20 text-blue-600 hover:bg-blue-500/5 gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Details
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DETAILS PANEL */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/60 shadow-md">
            <CardHeader className="bg-muted/30 border-b border-border/40 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Task Specifications
                </CardTitle>
                <CardDescription className="text-[10px]">Record ID: {sdata.id}</CardDescription>
              </div>
              <div>{getStatusBadge(sdata.status)}</div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-xs text-left border-collapse">
                <tbody>
                  <tr className="border-b border-border/40 hover:bg-muted/10">
                    <td className="p-3 font-semibold text-muted-foreground w-1/3 bg-muted/5">Observation Type</td>
                    <td className="p-3 font-medium">{sdata.obsertype}</td>
                  </tr>
                  <tr className="border-b border-border/40 hover:bg-muted/10">
                    <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Responsible Person</td>
                    <td className="p-3 font-medium">{sdata.reperson} ({sdata.rpersonid || "N/A"})</td>
                  </tr>
                  <tr className="border-b border-border/40 hover:bg-muted/10">
                    <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Approver / HOD</td>
                    <td className="p-3 font-medium">{sdata.rperson}</td>
                  </tr>
                  <tr className="border-b border-border/40 hover:bg-muted/10">
                    <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Department Incharge</td>
                    <td className="p-3 font-medium uppercase">{sdata.departin}</td>
                  </tr>
                  <tr className="border-b border-border/40 hover:bg-muted/10">
                    <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Hazard Classification</td>
                    <td className="p-3 font-medium">{sdata.hazard}</td>
                  </tr>
                  <tr className="border-b border-border/40 hover:bg-muted/10">
                    <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Risk Severity</td>
                    <td className="p-3 font-medium">
                      <span className="capitalize font-bold">{sdata.risklevel}</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border/40 hover:bg-muted/10">
                    <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Date of Issue</td>
                    <td className="p-3 font-medium">{sdata.date ? format(new Date(sdata.date), "dd-MMM-yyyy") : "--"}</td>
                  </tr>
                  <tr className="border-b border-border/40 hover:bg-muted/10">
                    <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Target Closure Date</td>
                    <td className="p-3 font-medium">
                      {sdata.tdate ? format(new Date(sdata.tdate), "dd-MMM-yyyy") : "Not Specified"}
                    </td>
                  </tr>
                  <tr className="border-b border-border/40 hover:bg-muted/10">
                    <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Raised By</td>
                    <td className="p-3 font-medium">{sdata.raisedby}</td>
                  </tr>
                  <tr className="border-b border-border/40 hover:bg-muted/10">
                    <td className="p-3 font-semibold text-muted-foreground bg-muted/5">On Behalf Of</td>
                    <td className="p-3 font-medium">{sdata.onBehalf}</td>
                  </tr>
                  <tr className="border-b border-border/40 hover:bg-muted/10">
                    <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Observation Details</td>
                    <td className="p-3 leading-relaxed">{sdata.obser}</td>
                  </tr>
                  <tr className="border-b border-border/40 hover:bg-muted/10">
                    <td className="p-3 font-semibold text-muted-foreground bg-muted/5">Action Taken</td>
                    <td className="p-3 font-medium text-emerald-600">{sdata.action || "None yet logged"}</td>
                  </tr>
                  <tr className="hover:bg-muted/10">
                    <td className="p-3 font-semibold text-muted-foreground bg-muted/5">HOD Review Remark</td>
                    <td className="p-3 italic text-muted-foreground">{sdata.remark || "Pending review"}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* PICTURES CARD */}
          <Card className="border-border/60 shadow-md">
            <CardHeader className="bg-muted/30 border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
                Before & After Picture Evidence
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Before Pictures */}
              <div>
                <h4 className="text-xs font-bold text-rose-500 uppercase mb-3">Before Pictures</h4>
                {beforePics.length > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    {beforePics.map((pic, idx) => (
                      <div key={idx} className="relative w-36 h-36 border border-border rounded-lg overflow-hidden shadow-sm bg-muted/30">
                        <img
                          src={imgURL1 + pic}
                          alt="Before"
                          className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-all"
                          onClick={() => window.open(imgURL1 + pic, "_blank")}
                          onError={(e: any) => {
                            e.target.onerror = null;
                            e.target.src = imgURL2 + pic;
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-muted-foreground">No before pictures uploaded.</p>
                )}
              </div>

              {/* After Pictures */}
              <div>
                <h4 className="text-xs font-bold text-emerald-500 uppercase mb-3">After Pictures</h4>
                {afterPics.length > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    {afterPics.map((pic, idx) => (
                      <div key={idx} className="relative w-36 h-36 border border-border rounded-lg overflow-hidden shadow-sm bg-muted/30">
                        <img
                          src={imgURL1 + pic}
                          alt="After"
                          className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-all"
                          onClick={() => window.open(imgURL1 + pic, "_blank")}
                          onError={(e: any) => {
                            e.target.onerror = null;
                            e.target.src = imgURL2 + pic;
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-muted-foreground">No after pictures uploaded.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* VERIFICATION & CONTROLS SIDE PANEL */}
        <div className="space-y-6">
          {/* USER RESOLUTION TASK ACTIONS */}
          {isProgress && (
            <Card className="border-border/60 shadow-md">
              <CardHeader className="bg-amber-500/10 border-b border-amber-500/20 pb-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Resolution Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Log the specific actions and submit after-implementation image evidence.
                </p>

                {showActionsTab && (
                  <Button
                    onClick={() => router.push(`/safety/ohc-incident?id=${id}`)}
                    className="w-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-9"
                  >
                    <FileText className="w-4 h-4" />
                    {hasIncidentReport ? "View 5-Why Investigation" : "Create 5-Why Investigation"}
                  </Button>
                )}

                <Button
                  onClick={() => router.push(`/safety/safety-list/action?id=${id}`)}
                  className="w-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1.5 h-9"
                >
                  <CheckCircle2 className="w-4 h-4" /> Take Action Form
                </Button>
              </CardContent>
            </Card>
          )}

          {/* HOD VERIFICATION / APPROVAL CONTROLS */}
          {isReviewer && sdata.status !== "Completed" && sdata.status !== "Rejected" && (
            <Card className="border-border/60 shadow-md border-t-2 border-t-indigo-500">
              <CardHeader className="bg-indigo-500/10 border-b border-indigo-500/20 pb-3">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-800">
                  HOD Review Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reviewRemark" className="text-xs font-bold">Reviewer Remark *</Label>
                  <Input
                    id="reviewRemark"
                    placeholder="Enter approval or rejection notes..."
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleVerify(0)}
                    disabled={isActionSubmitting}
                    className="text-xs font-bold h-9 gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleVerify(1)}
                    disabled={isActionSubmitting}
                    className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white h-9 gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* EDIT REGISTRY DETAILS DIALOG */}
      <CommonDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Modify Observation Assignments"
        description="Override assignment values for the safety observation"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editRPerson" className="text-xs">Responsible Person *</Label>
            <select
              id="editRPerson"
              value={editedRPerson}
              onChange={(e) => setEditedRPerson(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none"
              required
            >
              <option value="">Select Responsible Person</option>
              {userOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editDepart" className="text-xs">Department *</Label>
            <select
              id="editDepart"
              value={editedDepartIn}
              onChange={(e) => setEditedDepartIn(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none"
              required
            >
              <option value="">Select Department</option>
              {deptOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(false)}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 min-w-[80px]"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </CommonDialog>
    </div>
  );
}
