"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Shield, ClipboardCheck, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface JsaRow {
  sr_num: number;
  sub_activity_name: string;
  type_of_hazard: string;
  risk_involved: string;
  risk_control_measures: string;
}

const COMMON_HAZARDS = [
  "PROPER LADDER",
  "ROOF IS NOT SLIPPERY",
  "NO NAKED HT/LT POWER LINE NEAR BY",
  "AREA INCHARGE/EMPLOYEES INFORMED",
  "LIFTING EQUIPMENT",
  "ELECTRICAL ISOLATION REQUIRED",
  "ELECTRICAL WIRING WORK",
  "WELDING WORK",
  "HOT FLAME WORK",
  "NO PACKING MATERIAL NEAR BY",
];

const COMMON_PRECAUTIONS = [
  "PROPER PPE USED",
  "SAFETY BELT - FULL BODY HARNESS",
  "RIGHT TYPE OF FIRE EXTINGUISHER",
  "CAUTION BORDS",
  "STAND BY PERSON AVAILABLE",
  "IDENTIFY THE NEAREST FIRE HYDRANT POINT",
  "NO HAZARDOUS ITEMS CHEMICALS/OIL",
  "PROPER EARTHING OR NO LOOSE CONNECTON",
  "FLASH BACK ARRESTOR",
  "ELECTRICAL ISOLATION DONE - LOTO",
  "PHYSICAL FITNESS CHECK",
];

const NATURE_OF_WORK_ITEMS = [
  { id: 1, label: "HOT WORK", remarkKey: "hotwork_remark" },
  { id: 2, label: "HEIGHT WORK", remarkKey: "heightwork_remark" },
  { id: 3, label: "EXCAVATION WORK/CIVIL WORK:", remarkKey: "excavationwork_remark" },
  { id: 4, label: "ELECTRICAL WORK:", remarkKey: "electricalwork_remark" },
  { id: 5, label: "CONFINED SPACE WORK", remarkKey: "confinedspace_remark" },
  { id: 6, label: "USE OF LIFTING MACHINES", remarkKey: "liftingmachine_remark" },
  { id: 7, label: "OTHERS:", remarkKey: null },
];

const SAFETY_OPTIONS_AC = [
  { label: "Ketan Kale", value: "ketan_keshav@ifbglobal.com" },
  { label: "Safety AC Plant", value: "safety_acplant@ifbglobal.com" },
];

export default function InitiateWorkPermitPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  // DB drop-downs
  const [departmentOptions, setDepartmentOptions] = useState<{ value: string; label: string }[]>([]);
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);
  const [lotoMachines, setLotoMachines] = useState<{ value: string; label: string; raw: any }[]>([]);
  const [lotoUsers, setLotoUsers] = useState<{ value: string; label: string }[]>([]);

  // Main Form fields
  const [validFrom, setValidFrom] = useState(new Date().toISOString().split("T")[0]);
  const [validToTime, setValidToTime] = useState("");
  const [department, setDepartment] = useState("");
  const [permitee, setPermitee] = useState("");
  const [description, setDescription] = useState("");
  const [locationOfWork, setLocationOfWork] = useState("");
  const [totalManPower, setTotalManPower] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [supervisorName, setSupervisorName] = useState("");

  // Nature of Work checkboxes and remarks
  const [natureChecked, setNatureChecked] = useState<Record<string, boolean>>({});
  const [hotworkRemark, setHotworkRemark] = useState("");
  const [heightworkRemark, setHeightworkRemark] = useState("");
  const [excavationworkRemark, setExcavationworkRemark] = useState("");
  const [electricalworkRemark, setElectricalworkRemark] = useState("");
  const [confinedspaceRemark, setConfinedspaceRemark] = useState("");
  const [liftingmachineRemark, setLiftingmachineRemark] = useState("");

  // Hazard Identification selection: Yes, No, N/A
  const [hazardSelection, setHazardSelection] = useState<Record<string, "Yes" | "No" | "N/A">>({});

  // Precautions selection: Yes, No, N/A
  const [precautionSelection, setPrecautionSelection] = useState<Record<string, "Yes" | "No" | "N/A">>({});
  const [ppeUsed, setPpeUsed] = useState("");

  // JSA info and rows
  const [activityName, setActivityName] = useState("");
  const [jsaRef, setJsaRef] = useState("");
  const [jsaLocation, setJsaLocation] = useState("");
  const [jsaRows, setJsaRows] = useState<JsaRow[]>([
    { sr_num: 1, sub_activity_name: "", type_of_hazard: "", risk_involved: "", risk_control_measures: "" }
  ]);

  // LOTO details
  const [selectedMachineId, setSelectedMachineId] = useState("");
  const [lotoDate, setLotoDate] = useState("");
  const [lotoStartTime, setLotoStartTime] = useState("");
  const [lotoEndTime, setLotoEndTime] = useState("");
  const [lotoUser1, setLotoUser1] = useState<string[]>([]);
  const [lotoUser2, setLotoUser2] = useState<string[]>([]);
  const [lotoGeneralUser, setLotoGeneralUser] = useState<string[]>([]);

  // Approving Authorities
  const [maintenanceIncharges, setMaintenanceIncharges] = useState<string[]>([]);
  const [areaIncharges, setAreaIncharges] = useState<string[]>([]);
  const [safetyApprover, setSafetyApprover] = useState("");

  const API_HOST = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";
  const safetyDataBase = API_HOST.replace(":3003", ":3002");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch initial option lists
  const fetchOptions = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Departments list
      const deptRes = await axios.get(`${safetyDataBase}/safetydata/department_list`);
      const mappedDepts = (deptRes.data || [])
        .filter((item: any) => item.type === "AC")
        .map((item: any) => ({
          value: item.value,
          label: item.label,
        }));
      setDepartmentOptions(mappedDepts);

      // 2. Users list (for approvers)
      const userRes = await axios.get(`${API_HOST}/users`);
      const mappedUsers = (userRes.data || []).map((u: any) => ({
        label: u.name,
        value: u.email,
      }));
      setUserOptions(mappedUsers);

      // 3. LOTO details (machines & users)
      const permitDetailsRes = await axios.post(`${safetyDataBase}/safetydata/workpermit`, { key: "GET" });
      if (permitDetailsRes.data) {
        // Machines
        const machines = (permitDetailsRes.data.lotoDetails || [])
          .filter((m: any) => m.plant === "AC" && m.machine && m.machine !== "N/A")
          .map((m: any) => ({
            value: String(m.id),
            label: `${m.line} - ${m.machine}`,
            raw: m,
          }));
        setLotoMachines(machines);

        // LOTO Users
        const lotousers = (permitDetailsRes.data.lotoUsers || []).map((u: any) => ({
          value: String(u.id),
          label: u.employee_name,
        }));
        setLotoUsers(lotousers);
      }
    } catch (error) {
      console.error("Error fetching dropdown options:", error);
      toast.error("Failed to load department or LOTO registry lists");
    } finally {
      setLoading(false);
    }
  }, [API_HOST, safetyDataBase]);

  useEffect(() => {
    if (mounted) {
      fetchOptions();
    }
  }, [fetchOptions, mounted]);

  const handleAddJsaRow = () => {
    setJsaRows((prev) => [
      ...prev,
      {
        sr_num: prev.length + 1,
        sub_activity_name: "",
        type_of_hazard: "",
        risk_involved: "",
        risk_control_measures: ""
      }
    ]);
  };

  const handleRemoveJsaRow = (index: number) => {
    if (jsaRows.length === 1) return;
    const updated = jsaRows.filter((_, idx) => idx !== index).map((row, idx) => ({
      ...row,
      sr_num: idx + 1
    }));
    setJsaRows(updated);
  };

  const handleJsaChange = (index: number, field: keyof JsaRow, value: string) => {
    setJsaRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  const selectedMachine = useMemo(() => {
    return lotoMachines.find((m) => m.value === selectedMachineId)?.raw;
  }, [selectedMachineId, lotoMachines]);

  // Submit Handler
  const handleSubmit = async () => {
    // Basic Form validation
    if (!validFrom || !department || !description || !locationOfWork || !permitee || !totalManPower || !validToTime) {
      toast.error("Please fill out all basic work permit details");
      return;
    }
    if (!contractorName || !supervisorName) {
      toast.error("Supervisor name and Contractor name are required for the AC plant");
      return;
    }
    if (maintenanceIncharges.length === 0 || areaIncharges.length === 0 || !safetyApprover) {
      toast.error("Please select all required approving authorities");
      return;
    }

    // Hazard validations
    for (const h of COMMON_HAZARDS) {
      if (!hazardSelection[h]) {
        toast.error(`Please select Yes, No or N/A for hazard: ${h}`);
        return;
      }
    }

    // Precaution validations
    for (const p of COMMON_PRECAUTIONS) {
      if (!precautionSelection[p]) {
        toast.error(`Please select Yes, No or N/A for precaution: ${p}`);
        return;
      }
      if (p === "PROPER PPE USED" && precautionSelection[p] === "Yes" && !ppeUsed) {
        toast.error("Please specify proper PPE used");
        return;
      }
    }

    // JSA validation
    if (!activityName || !jsaRef || !jsaLocation) {
      toast.error("Please complete the JSA activity header section");
      return;
    }
    for (const row of jsaRows) {
      if (!row.sub_activity_name || !row.type_of_hazard || !row.risk_involved || !row.risk_control_measures) {
        toast.error(`Please complete all fields for JSA row #${row.sr_num}`);
        return;
      }
    }

    // LOTO validation
    if (selectedMachineId) {
      if (!lotoDate || !lotoStartTime || !lotoEndTime) {
        toast.error("Please fill in LOTO isolation dates and times");
        return;
      }
      // Check if user requirements based on machine LOTO points
      if (selectedMachine?.loto_1 && selectedMachine.loto_1 !== "N/A" && lotoUser1.length === 0) {
        toast.error("LOTO Point 1 Approver is required");
        return;
      }
      if (selectedMachine?.loto_2 && selectedMachine.loto_2 !== "N/A" && lotoUser2.length === 0) {
        toast.error("LOTO Point 2 Approver is required");
        return;
      }
      const needsGenUser = (!selectedMachine?.loto_1 || selectedMachine.loto_1 === "N/A") && 
                           (!selectedMachine?.loto_2 || selectedMachine.loto_2 === "N/A");
      if (needsGenUser && lotoGeneralUser.length === 0) {
        toast.error("General LOTO Isolation Person is required");
        return;
      }
    }

    // Format nature of work items
    const checkboxItems: Record<string, boolean> = {};
    NATURE_OF_WORK_ITEMS.forEach((item) => {
      checkboxItems[item.label] = !!natureChecked[item.label];
    });

    const formatMultiEmails = (selectedValues: string[]) => {
      return selectedValues.map(email => {
        const u = userOptions.find(o => o.value === email);
        return { label: u?.label || email, value: email };
      });
    };

    const safetyOpt = SAFETY_OPTIONS_AC.find(o => o.value === safetyApprover);

    const submissionData = {
      validFrom,
      dateOfIssue: validFrom,
      checkboxItems,
      hotwork_remark: natureChecked["HOT WORK"] ? hotworkRemark : null,
      heightwork_remark: natureChecked["HEIGHT WORK"] ? heightworkRemark : null,
      excavationwork_remark: natureChecked["EXCAVATION WORK/CIVIL WORK:"] ? excavationworkRemark : null,
      electricalwork_remark: natureChecked["ELECTRICAL WORK:"] ? electricalworkRemark : null,
      confinedspace_remark: natureChecked["CONFINED SPACE WORK"] ? confinedspaceRemark : null,
      liftingmachine_remark: natureChecked["USE OF LIFTING MACHINES"] ? liftingmachineRemark : null,
      
      iniName: sessionStorage.getItem("employee_name") || "AC User",
      iniEmail: sessionStorage.getItem("employee_email") || "ac_user@ifbglobal.com",
      permitee,
      description,
      LocationOfWork: locationOfWork,
      totalManPower: parseInt(totalManPower),
      hazard_iden: hazardSelection,
      precau: precautionSelection,
      ppeUsed: precautionSelection["PROPER PPE USED"] === "Yes" ? ppeUsed : "",
      
      maintenanceIncharge: formatMultiEmails(maintenanceIncharges),
      areaIncharge: formatMultiEmails(areaIncharges),
      safety: [{ label: safetyOpt?.label || "Safety", value: safetyApprover }],
      remark: "",
      department,
      activityName,
      ref: jsaRef,
      location: jsaLocation,
      jsa: jsaRows,
      plant: "AC",
      supervisorName,
      contractorName,
      
      machineID: selectedMachineId || "",
      machine_Date: lotoDate || "",
      machine_startTime: lotoStartTime || "",
      machine_EndTime: lotoEndTime || "",
      lotoUser1: lotoUser1.map(id => ({ value: id, label: lotoUsers.find(u => u.value === id)?.label })),
      lotoUser2: lotoUser2.map(id => ({ value: id, label: lotoUsers.find(u => u.value === id)?.label })),
      lotoUser: lotoGeneralUser.map(id => ({ value: id, label: lotoUsers.find(u => u.value === id)?.label })),
    };

    setLoading(true);
    try {
      const validToValue = `${validFrom} ${validToTime}:00`;
      const response = await axios.post(`${safetyDataBase}/safetydata/workpermit`, {
        key: "POST",
        data: submissionData,
        validTo: validToValue,
      });

      if (response.status === 200) {
        toast.success("Safety Work Permit initiated successfully!");
        router.push("/safety/work-permit");
      } else {
        toast.error("Failed to initiate work permit");
      }
    } catch (error) {
      console.error("Work permit submit error:", error);
      toast.error("Submission failed. Network/Server error");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      {/* HEADER SECTION */}
      <div className="flex items-center gap-3">
        <Link href="/safety/work-permit">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
            Initiate Safety Work Permit
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complete the form sections to create and request approval for a work permit.
          </p>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm bg-card overflow-hidden">
        <CardHeader className="bg-slate-900 dark:bg-slate-950 text-white p-5">
          <CardTitle className="text-lg font-bold text-center text-amber-500 uppercase tracking-wide">
            Safety Work Permit Application Form (AC Plant)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">

          {/* SECTION 1: BASIC DETAILS */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 border-b pb-2">
              1. Basic Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Select Date *</Label>
                <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Valid To (Time Today) *</Label>
                <Input type="time" value={validToTime} onChange={(e) => setValidToTime(e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Department *</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Total Manpower *</Label>
                <Input type="number" min="1" value={totalManPower} onChange={(e) => setTotalManPower(e.target.value)} className="h-9 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Permittee / Contractor Agency Name *</Label>
                <Input type="text" value={permitee} onChange={(e) => setPermitee(e.target.value)} placeholder="e.g. Acme Services" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Contractor Representative *</Label>
                <Input type="text" value={contractorName} onChange={(e) => setContractorName(e.target.value)} placeholder="Contractor Person" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">IFB Supervisor Name *</Label>
                <Input type="text" value={supervisorName} onChange={(e) => setSupervisorName(e.target.value)} placeholder="Supervisor Person" className="h-9 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Location of Work *</Label>
                <Input type="text" value={locationOfWork} onChange={(e) => setLocationOfWork(e.target.value)} placeholder="e.g. Compressor Area" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Description of Work *</Label>
                <Input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of activity" className="h-9 text-xs" />
              </div>
            </div>
          </div>

          {/* SECTION 2: NATURE OF WORK CHECKLIST */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 border-b pb-2">
              2. Nature of Work Checklist & Remarks
            </h3>
            <div className="space-y-3">
              {NATURE_OF_WORK_ITEMS.map((item) => (
                <div key={item.id} className="space-y-2 border-b border-muted/50 pb-2 last:border-0">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`nature-${item.id}`}
                      checked={!!natureChecked[item.label]}
                      onChange={(e) => {
                        setNatureChecked((prev) => ({ ...prev, [item.label]: e.target.checked }));
                      }}
                      className="h-4 w-4 rounded border-input text-blue-600 focus:ring-blue-500 cursor-pointer bg-background"
                    />
                    <Label htmlFor={`nature-${item.id}`} className="text-xs font-bold cursor-pointer text-foreground/95">
                      {item.label}
                    </Label>
                  </div>
                  {natureChecked[item.label] && item.remarkKey && (
                    <div className="pl-6 space-y-1 max-w-2xl">
                      <Label className="text-[10px] text-muted-foreground font-semibold">Provide specific details/remarks for {item.label}:</Label>
                      <Input
                        type="text"
                        placeholder="Provide details..."
                        value={
                          item.remarkKey === "hotwork_remark" ? hotworkRemark :
                          item.remarkKey === "heightwork_remark" ? heightworkRemark :
                          item.remarkKey === "excavationwork_remark" ? excavationworkRemark :
                          item.remarkKey === "electricalwork_remark" ? electricalworkRemark :
                          item.remarkKey === "confinedspace_remark" ? confinedspaceRemark :
                          item.remarkKey === "liftingmachine_remark" ? liftingmachineRemark : ""
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (item.remarkKey === "hotwork_remark") setHotworkRemark(val);
                          else if (item.remarkKey === "heightwork_remark") setHeightworkRemark(val);
                          else if (item.remarkKey === "excavationwork_remark") setExcavationworkRemark(val);
                          else if (item.remarkKey === "electricalwork_remark") setElectricalworkRemark(val);
                          else if (item.remarkKey === "confinedspace_remark") setConfinedspaceRemark(val);
                          else if (item.remarkKey === "liftingmachine_remark") setLiftingmachineRemark(val);
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: HAZARDS IDENTIFICATION */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 border-b pb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 animate-bounce" /> 3. Hazards Identification
            </h3>
            <div className="overflow-x-auto border border-border/40 rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-900 text-amber-500 text-left">
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">Safety Hazard Factor</th>
                    <th className="p-3 w-48 text-center">Selection *</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {COMMON_HAZARDS.map((hazard, index) => (
                    <tr key={hazard} className="hover:bg-muted/30">
                      <td className="p-3 text-center text-muted-foreground font-semibold">{index + 1}</td>
                      <td className="p-3 font-semibold text-foreground/80">{hazard}</td>
                      <td className="p-3">
                        <div className="flex justify-center gap-4">
                          {["Yes", "No", "N/A"].map((opt) => (
                            <label key={opt} className="flex items-center gap-1.5 cursor-pointer font-medium">
                              <input
                                type="radio"
                                name={`hazard-${hazard}`}
                                checked={hazardSelection[hazard] === opt}
                                onChange={() => setHazardSelection((prev) => ({ ...prev, [hazard]: opt as any }))}
                                className="cursor-pointer"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 4: PRECAUTIONS CHECKLIST */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 border-b pb-2">
              4. Precautions Checklist
            </h3>
            <div className="overflow-x-auto border border-border/40 rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-900 text-amber-500 text-left">
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">Safety Precaution Checklist</th>
                    <th className="p-3 w-48 text-center">Selection *</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {COMMON_PRECAUTIONS.map((prec, index) => (
                    <tr key={prec} className="hover:bg-muted/30">
                      <td className="p-3 text-center text-muted-foreground font-semibold">{index + 1}</td>
                      <td className="p-3">
                        <div className="space-y-2">
                          <p className="font-semibold text-foreground/80">{prec}</p>
                          {prec === "PROPER PPE USED" && precautionSelection[prec] === "Yes" && (
                            <div className="max-w-md pt-1">
                              <Input
                                type="text"
                                placeholder="Specify PPE used (helmet, safety shoes, belt, glasses etc.)"
                                value={ppeUsed}
                                onChange={(e) => setPpeUsed(e.target.value)}
                                className="h-8 text-xs bg-background"
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-4">
                          {["Yes", "No", "N/A"].map((opt) => (
                            <label key={opt} className="flex items-center gap-1.5 cursor-pointer font-medium">
                              <input
                                type="radio"
                                name={`prec-${prec}`}
                                checked={precautionSelection[prec] === opt}
                                onChange={() => setPrecautionSelection((prev) => ({ ...prev, [prec]: opt as any }))}
                                className="cursor-pointer"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 5: JOB SAFETY ANALYSIS (JSA) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 border-b pb-2 flex items-center justify-between">
              <span>5. Job Safety Analysis (JSA) Section</span>
              <Button type="button" onClick={handleAddJsaRow} size="xs" className="bg-blue-600 text-white font-bold h-7 gap-1">
                <Plus className="w-3.5 h-3.5" /> Add JSA Step
              </Button>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Activity Name *</Label>
                <Input type="text" value={activityName} onChange={(e) => setActivityName(e.target.value)} placeholder="Overall Job Activity" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Reference Document / JSA No *</Label>
                <Input type="text" value={jsaRef} onChange={(e) => setJsaRef(e.target.value)} placeholder="Ref No" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">JSA Location *</Label>
                <Input type="text" value={jsaLocation} onChange={(e) => setJsaLocation(e.target.value)} placeholder="Specific job location" className="h-9 text-xs" />
              </div>
            </div>

            <div className="overflow-x-auto border border-border/40 rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-900 text-amber-500 text-left">
                    <th className="p-3 w-12 text-center">Step</th>
                    <th className="p-3">Sub-Activity Process *</th>
                    <th className="p-3">Safety Hazard *</th>
                    <th className="p-3">Risk Involved *</th>
                    <th className="p-3">Risk Control Measures *</th>
                    <th className="p-3 w-12 text-center">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {jsaRows.map((row, index) => (
                    <tr key={index} className="hover:bg-muted/30">
                      <td className="p-3 text-center text-muted-foreground font-semibold">{row.sr_num}</td>
                      <td className="p-2">
                        <Textarea rows={2} value={row.sub_activity_name} onChange={(e) => handleJsaChange(index, "sub_activity_name", e.target.value)} className="text-xs resize-none h-14" />
                      </td>
                      <td className="p-2">
                        <Textarea rows={2} value={row.type_of_hazard} onChange={(e) => handleJsaChange(index, "type_of_hazard", e.target.value)} className="text-xs resize-none h-14" />
                      </td>
                      <td className="p-2">
                        <Textarea rows={2} value={row.risk_involved} onChange={(e) => handleJsaChange(index, "risk_involved", e.target.value)} className="text-xs resize-none h-14" />
                      </td>
                      <td className="p-2">
                        <Textarea rows={2} value={row.risk_control_measures} onChange={(e) => handleJsaChange(index, "risk_control_measures", e.target.value)} className="text-xs resize-none h-14" />
                      </td>
                      <td className="p-2 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={jsaRows.length === 1}
                          onClick={() => handleRemoveJsaRow(index)}
                          className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 6: LOCKOUT/TAGOUT (LOTO) DETAILS */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 border-b pb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" /> 6. Lockout / Tagout (LOTO) Specifications (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">LOTO Machine isolation</Label>
                <Select value={selectedMachineId} onValueChange={setSelectedMachineId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="No machine isolation" />
                  </SelectTrigger>
                  <SelectContent>
                    {lotoMachines.map((m) => (
                      <SelectItem key={m.value} value={m.value} className="text-xs">
                        {m.label.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMachineId && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">LOTO Date *</Label>
                    <Input type="date" value={lotoDate} onChange={(e) => setLotoDate(e.target.value)} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Start Time *</Label>
                    <Input type="time" value={lotoStartTime} onChange={(e) => setLotoStartTime(e.target.value)} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">End Time *</Label>
                    <Input type="time" value={lotoEndTime} onChange={(e) => setLotoEndTime(e.target.value)} className="h-9 text-xs" />
                  </div>
                </>
              )}
            </div>

            {selectedMachineId && (
              <div className="p-4 bg-muted/20 border border-border/40 rounded-xl space-y-4 max-w-4xl">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground/80">LOTO Points Isolation Approvers</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Point 1 */}
                  {selectedMachine?.loto_1 && selectedMachine.loto_1 !== "N/A" && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-rose-500">LOTO Pt 1 ({selectedMachine.loto_1}) Approver *</Label>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto border border-border/40 p-2 rounded bg-background">
                        {lotoUsers.map((u) => (
                          <label key={u.value} className="flex items-center gap-2 cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={lotoUser1.includes(u.value)}
                              onChange={(e) => {
                                if (e.target.checked) setLotoUser1((p) => [...p, u.value]);
                                else setLotoUser1((p) => p.filter(id => id !== u.value));
                              }}
                            />
                            <span>{u.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Point 2 */}
                  {selectedMachine?.loto_2 && selectedMachine.loto_2 !== "N/A" && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-rose-500">LOTO Pt 2 ({selectedMachine.loto_2}) Approver *</Label>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto border border-border/40 p-2 rounded bg-background">
                        {lotoUsers.map((u) => (
                          <label key={u.value} className="flex items-center gap-2 cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={lotoUser2.includes(u.value)}
                              onChange={(e) => {
                                if (e.target.checked) setLotoUser2((p) => [...p, u.value]);
                                else setLotoUser2((p) => p.filter(id => id !== u.value));
                              }}
                            />
                            <span>{u.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* General LOTO Isolation (if no specific point 1/2) */}
                  {(!selectedMachine?.loto_1 || selectedMachine.loto_1 === "N/A") && 
                   (!selectedMachine?.loto_2 || selectedMachine.loto_2 === "N/A") && (
                    <div className="space-y-2 col-span-3">
                      <Label className="text-xs font-bold text-rose-500">LOTO General Isolation Persons *</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto border border-border/40 p-2 rounded bg-background">
                        {lotoUsers.map((u) => (
                          <label key={u.value} className="flex items-center gap-2 cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={lotoGeneralUser.includes(u.value)}
                              onChange={(e) => {
                                if (e.target.checked) setLotoGeneralUser((p) => [...p, u.value]);
                                else setLotoGeneralUser((p) => p.filter(id => id !== u.value));
                              }}
                            />
                            <span>{u.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 7: APPROVING AUTHORITIES */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 border-b pb-2">
              7. Approving Authorities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
              {/* Maintenance Incharge */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">Maintenance Incharges (Select Multi) *</Label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto border border-border/40 p-3 rounded-lg bg-card shadow-inner">
                  {userOptions.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={maintenanceIncharges.includes(opt.value)}
                        onChange={(e) => {
                          if (e.target.checked) setMaintenanceIncharges((p) => [...p, opt.value]);
                          else setMaintenanceIncharges((p) => p.filter(v => v !== opt.value));
                        }}
                      />
                      <span className="truncate">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Area Incharge */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">Area Incharges (Select Multi) *</Label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto border border-border/40 p-3 rounded-lg bg-card shadow-inner">
                  {userOptions.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={areaIncharges.includes(opt.value)}
                        onChange={(e) => {
                          if (e.target.checked) setAreaIncharges((p) => [...p, opt.value]);
                          else setAreaIncharges((p) => p.filter(v => v !== opt.value));
                        }}
                      />
                      <span className="truncate">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Safety Incharge */}
              <div className="space-y-2 flex flex-col">
                <Label className="text-xs font-bold text-foreground">Safety Incharge (Select One) *</Label>
                <Select value={safetyApprover} onValueChange={setSafetyApprover}>
                  <SelectTrigger className="h-9 text-xs bg-background mt-1">
                    <SelectValue placeholder="Safety Authority" />
                  </SelectTrigger>
                  <SelectContent>
                    {SAFETY_OPTIONS_AC.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/safety/work-permit")}
              className="text-xs h-10 w-24"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-8"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Initiate Permit"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
