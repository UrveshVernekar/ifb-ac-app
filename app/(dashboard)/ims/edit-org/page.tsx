"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  GitCommit,
  UserCheck,
  UserX,
  ArrowLeft,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Interface Definitions
interface OrgNode {
  id: number;
  employee: string;
  email: string;
  employee_id: string;
  department_name: string;
  title: string;
  role: string;
  parent_id: number | null;
  isDotted?: boolean;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  company: string;
}

// SearchSelect helper component
const SearchSelect = ({
  options,
  value,
  onChange,
  placeholder,
  className = ""
}: {
  options: { label: string; value: string; [key: string]: any }[];
  value: string;
  onChange: (option: any) => void;
  placeholder: string;
  className?: string;
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectedOption = options.find((o) => String(o.value) === String(value));
  const displayValue = selectedOption ? selectedOption.label : query;

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <input
        type="text"
        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        placeholder={placeholder}
        value={isOpen ? query : displayValue}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setQuery("");
          setIsOpen(true);
        }}
      />
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-popover text-popover-foreground border border-border rounded-lg shadow-lg z-50 py-1">
          {filtered.length > 0 ? (
            filtered.map((opt) => (
              <div
                key={opt.value}
                className="px-3 py-2 text-[11px] hover:bg-accent hover:text-accent-foreground cursor-pointer truncate"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                  setQuery("");
                }}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-muted-foreground text-center">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function EditOrgPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"add" | "add_dotted" | "update" | "delete">("add");

  // Raw states
  const [orgChart, setOrgChart] = useState<any[]>([]);
  const [flatOrgNodes, setFlatOrgNodes] = useState<OrgNode[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loginData, setLoginData] = useState<any>(null);

  // Parent Options for select dropdowns
  const [parentOptions, setParentOptions] = useState<{ label: string; value: string; name: string; department: string }[]>([]);
  const [userOptions, setUserOptions] = useState<{ label: string; value: string; email: string }[]>([]);

  // Approver lookup lists
  const [hrApprovers, setHrApprovers] = useState({
    approvalHr1: "", approvalHr1_name: "", approvalHr1_email: "",
    approvalHr2: "", approvalHr2_name: "", approvalHr2_email: ""
  });

  // Department list for approvals HOD mapping
  const departmentOptions = [
    { label: "ESG/Green Initiative", value: "ESG/Green Intiative" },
    { label: "Industrial Design", value: "Industrial Design" },
    { label: "Supply Chain", value: "Supply chain" },
    { label: "Plant Operations", value: "Plant Operations" },
    { label: "R&D", value: "R&D" },
    { label: "Strategic Sourcing", value: "Strategic Sourcing" },
    { label: "Vendor Management", value: "Vendor Management" },
    { label: "Manufacturing", value: "Manufacturing" },
    { label: "IT", value: "IT" },
    { label: "Administration", value: "Administration" },
    { label: "Stores/Logistics", value: "Stores/Logistics" },
    { label: "Accounts", value: "Accounts" },
    { label: "Quality", value: "Quality" },
    { label: "EHS", value: "EHS" },
    { label: "HR", value: "HR" },
    { label: "Testing & Validation", value: "Testing & Validation" }
  ];

  // Forms states
  const [addForm, setAddForm] = useState({
    employee: "", email: "", employee_id: "", department_name: "", role: "",
    parent_id: "", reports_to: "", title: "", hod_dept: "",
    approval_hod: "", approval_hod_id: "", approval_hod_email: ""
  });

  const [dottedForm, setDottedForm] = useState({
    dottedParent: "", dotted_parent_name: "", dottedChild: "", employee: "",
    hod_dept: "", approval_hod: "", approval_hod_id: "", approval_hod_email: ""
  });

  const [updateForm, setUpdateForm] = useState({
    employee: "", email: "", CURRENT_EMPLOYEE: "", new_employee: "", employee_id: "",
    department_name: "", reports_to: "", title: "", role: "", hod_dept: "",
    approval_hod: "", approval_hod_id: "", approval_hod_email: ""
  });

  const [deleteForm, setDeleteForm] = useState({
    employee: "", email: "", CURRENT_EMPLOYEE: "", employee_id: "",
    department_name: "", reports_to: "", title: "", role: "", hod_dept: "",
    approval_hod: "", approval_hod_id: "", approval_hod_email: ""
  });

  useEffect(() => {
    setMounted(true);
    const dataStr = sessionStorage.getItem("logindata");
    if (dataStr) {
      try {
        setLoginData(JSON.parse(dataStr));
      } catch (e) {
        console.error("Error reading login details:", e);
      }
    }
  }, []);

  // Fetch initial edit organization data
  useEffect(() => {
    if (!mounted) return;

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";
    setIsLoading(true);

    Promise.all([
      axios.get(`${apiBase}/quality/ims/orgchart`),
      axios.get(`${apiBase}/hr/employees/users`)
    ])
      .then(([orgchartRes, usersRes]) => {
        setOrgChart(orgchartRes.data || []);
        setUsers(usersRes.data || []);
      })
      .catch((error) => {
        console.error("Error fetching Edit organization data:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [mounted]);

  // Flatten org chart recursive parsing
  useEffect(() => {
    if (orgChart.length > 0) {
      const flattened: OrgNode[] = [];
      const flatten = (nodes: any[]) => {
        nodes.forEach((node) => {
          flattened.push({
            id: node.id,
            employee: node.employee || "N/A",
            email: node.email || "",
            employee_id: String(node.employee_id || ""),
            department_name: node.department_name || node.department || "",
            title: node.title || "",
            role: node.role || "",
            parent_id: node.parent_id || null,
            isDotted: node.isDotted || false
          });
          if (node.children) flatten(node.children);
          if (node.dottedChildren) flatten(node.dottedChildren);
        });
      };
      flatten(orgChart);
      setFlatOrgNodes(flattened);

      // Create Parent Options mapping
      const pOptions = flattened.map((node) => ({
        label: `${node.department_name} - ${node.employee}`,
        value: String(node.id),
        name: node.employee,
        department: node.department_name
      }));
      setParentOptions(pOptions);

      // Find HR1 (ID 145) and HR2 (ID 146) details from flattened list
      const hr1Node = flattened.find((emp) => emp.id === 145);
      const hr2Node = flattened.find((emp) => emp.id === 146);
      setHrApprovers({
        approvalHr1: hr1Node?.employee_id || "",
        approvalHr1_name: hr1Node?.employee || "",
        approvalHr1_email: hr1Node?.email || "",
        approvalHr2: hr2Node?.employee_id || "",
        approvalHr2_name: hr2Node?.employee || "",
        approvalHr2_email: hr2Node?.email || ""
      });
    }
  }, [orgChart]);

  // Convert raw user list to select options
  useEffect(() => {
    if (users.length > 0) {
      const uOptions = users
        .filter((person) => person.company && person.company.includes("IFB"))
        .map((user) => ({
          label: user.name,
          value: String(user.id),
          email: user.email || ""
        }));
      setUserOptions(uOptions);
    }
  }, [users]);

  // Helper lookup for Department HOD
  const getDepartmentHOD = (deptName: string): { name: string; id: string; email: string } => {
    const HOD = flatOrgNodes.find(
      (node) => node.department_name === deptName && node.role === "HOD"
    );
    return {
      name: HOD?.employee || "",
      id: HOD?.employee_id || "",
      email: HOD?.email || ""
    };
  };

  // Submit Approval wrapper
  const submitApproval = async (approvalData: any) => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";
    try {
      await axios.post(`${apiBase}/quality/ims/approval-request`, approvalData);
      alert("Your request for edits has been successfully submitted. Proposed changes will be enacted upon receiving the necessary approvals.");
      router.back();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to submit approval request. Please try again.");
    }
  };

  // Unique list of departments and roles for dropdowns
  const existingDepartments = Array.from(new Set(flatOrgNodes.map((n) => n.department_name))).map((d) => ({ label: d, value: d }));
  const existingRoles = Array.from(new Set(flatOrgNodes.map((n) => n.role))).map((r) => ({ label: r, value: r }));

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex items-center gap-3 border-b border-border/60 pb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Edit Organization Structure
          </h1>
          <p className="text-xs text-muted-foreground">
            Submit modifications to the organization tree for review and authorization.
          </p>
        </div>
      </div>

      {isLoading ? (
        <Card className="border border-border/60 bg-card p-6 animate-pulse">
          <div className="h-6 bg-muted rounded w-1/4 mb-4" />
          <div className="space-y-3">
            <div className="h-10 bg-muted rounded w-full" />
            <div className="h-10 bg-muted rounded w-full" />
            <div className="h-10 bg-muted rounded w-full" />
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* TAB HEADERS */}
          <div className="flex border-b border-border bg-muted/30 p-1.5 rounded-xl gap-1 shrink-0">
            <button
              onClick={() => setActiveTab("add")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "add"
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:bg-background/40"
              }`}
            >
              <UserPlus className="w-4 h-4 text-blue-500" />
              Add New
            </button>
            <button
              onClick={() => setActiveTab("add_dotted")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "add_dotted"
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:bg-background/40"
              }`}
            >
              <GitCommit className="w-4 h-4 text-emerald-500 rotate-45" />
              Dotted Relation
            </button>
            <button
              onClick={() => setActiveTab("update")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "update"
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:bg-background/40"
              }`}
            >
              <UserCheck className="w-4 h-4 text-amber-500" />
              Update Existing
            </button>
            <button
              onClick={() => setActiveTab("delete")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "delete"
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:bg-background/40"
              }`}
            >
              <UserX className="w-4 h-4 text-rose-500" />
              Delete Member
            </button>
          </div>

          {/* TAB PANES */}
          <Card className="border border-border/60 bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold tracking-wide uppercase">
                {activeTab === "add" && "Add New Employee Node"}
                {activeTab === "add_dotted" && "Establish Dotted Reporting Connection"}
                {activeTab === "update" && "Update Existing Employee Details"}
                {activeTab === "delete" && "Remove Employee Node"}
              </CardTitle>
              <CardDescription className="text-xs">
                {activeTab === "add" && "Initiate an approval flow to insert a new department member."}
                {activeTab === "add_dotted" && "Link a child employee to a secondary reporting manager."}
                {activeTab === "update" && "Modify information, department role, or transfer active nodes."}
                {activeTab === "delete" && "Remove an active employee from the official structure."}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              
              {/* TAB 1: ADD NEW */}
              {activeTab === "add" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!addForm.employee || !addForm.department_name || !addForm.role || !addForm.parent_id || !addForm.hod_dept) {
                      alert("Please fill in all required fields.");
                      return;
                    }

                    submitApproval({
                      ...addForm,
                      action: "Add New",
                      initiated_by: loginData?.id || "",
                      initiated_by_name: loginData?.name || "",
                      ...hrApprovers
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Employee Name *</label>
                      <SearchSelect
                        options={userOptions}
                        value={addForm.employee_id}
                        placeholder="Search employee from roster..."
                        onChange={(opt) => {
                          // Check if person already exists in current org
                          const isDuplicate = flatOrgNodes.some(
                            (node) => node.employee.toLowerCase() === opt.label.toLowerCase()
                          );
                          if (isDuplicate) {
                            if (!window.confirm("This employee already exists in organization structure. Continue?")) {
                              return;
                            }
                          }
                          setAddForm({
                            ...addForm,
                            employee: opt.label,
                            employee_id: opt.value,
                            email: opt.email
                          });
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Department *</label>
                      <SearchSelect
                        options={existingDepartments}
                        value={addForm.department_name}
                        placeholder="Select department..."
                        onChange={(opt) => setAddForm({ ...addForm, department_name: opt.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Role *</label>
                      <SearchSelect
                        options={existingRoles}
                        value={addForm.role}
                        placeholder="Select corporate role..."
                        onChange={(opt) => setAddForm({ ...addForm, role: opt.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Reports To (Parent Node) *</label>
                      <SearchSelect
                        options={parentOptions}
                        value={addForm.parent_id}
                        placeholder="Select immediate manager..."
                        onChange={(opt) => setAddForm({ ...addForm, parent_id: opt.value, reports_to: opt.name })}
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-foreground">Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Lead Quality Engineer"
                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-background text-foreground outline-none focus:ring-1 focus:ring-blue-500"
                        value={addForm.title}
                        onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Department for Approval *</label>
                      <SearchSelect
                        options={departmentOptions}
                        value={addForm.hod_dept}
                        placeholder="Select HOD department..."
                        onChange={(opt) => {
                          const hodDetails = getDepartmentHOD(opt.value);
                          setAddForm({
                            ...addForm,
                            hod_dept: opt.value,
                            approval_hod: hodDetails.name,
                            approval_hod_id: hodDetails.id,
                            approval_hod_email: hodDetails.email
                          });
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">HOD Approver (Auto-Filled)</label>
                      <input
                        type="text"
                        readOnly
                        placeholder="No HOD assigned yet"
                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-muted text-muted-foreground outline-none"
                        value={addForm.approval_hod || ""}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/40 flex justify-end">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs">
                      Submit Request
                    </Button>
                  </div>
                </form>
              )}

              {/* TAB 2: ADD DOTTED RELATION */}
              {activeTab === "add_dotted" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!dottedForm.dottedChild || !dottedForm.dottedParent || !dottedForm.hod_dept) {
                      alert("Please fill in all required fields.");
                      return;
                    }

                    submitApproval({
                      dotted_parent_id: dottedForm.dottedParent,
                      dotted_parent_name: dottedForm.dotted_parent_name,
                      child_id: dottedForm.dottedChild,
                      employee: dottedForm.employee,
                      hod_dept: dottedForm.hod_dept,
                      approval_hod: dottedForm.approval_hod_id,
                      approval_hod_name: dottedForm.approval_hod,
                      approval_hod_email: dottedForm.approval_hod_email,
                      action: "Add Dotted Relation",
                      initiated_by: loginData?.id || "",
                      initiated_by_name: loginData?.name || "",
                      ...hrApprovers
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Child Employee (Dotted Reportee) *</label>
                      <SearchSelect
                        options={parentOptions}
                        value={dottedForm.dottedChild}
                        placeholder="Select child employee..."
                        onChange={(opt) => setDottedForm({ ...dottedForm, dottedChild: opt.value, employee: opt.name })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Dotted Manager (Indirect Line) *</label>
                      <SearchSelect
                        options={parentOptions}
                        value={dottedForm.dottedParent}
                        placeholder="Select dotted reporting manager..."
                        onChange={(opt) => setDottedForm({ ...dottedForm, dottedParent: opt.value, dotted_parent_name: opt.name })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Department for Approval *</label>
                      <SearchSelect
                        options={departmentOptions}
                        value={dottedForm.hod_dept}
                        placeholder="Select HOD department..."
                        onChange={(opt) => {
                          const hodDetails = getDepartmentHOD(opt.value);
                          setDottedForm({
                            ...dottedForm,
                            hod_dept: opt.value,
                            approval_hod: hodDetails.name,
                            approval_hod_id: hodDetails.id,
                            approval_hod_email: hodDetails.email
                          });
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">HOD Approver (Auto-Filled)</label>
                      <input
                        type="text"
                        readOnly
                        placeholder="No HOD assigned yet"
                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-muted text-muted-foreground outline-none"
                        value={dottedForm.approval_hod || ""}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/40 flex justify-end">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs">
                      Submit Request
                    </Button>
                  </div>
                </form>
              )}

              {/* TAB 3: UPDATE EXISTING */}
              {activeTab === "update" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!updateForm.employee || !updateForm.new_employee || !updateForm.hod_dept) {
                      alert("Please fill in all required fields.");
                      return;
                    }

                    submitApproval({
                      id: updateForm.employee,
                      employee: updateForm.CURRENT_EMPLOYEE,
                      email: updateForm.email,
                      new_employee_name: updateForm.new_employee,
                      employee_id: updateForm.employee_id,
                      department_name: updateForm.department_name,
                      reports_to: updateForm.reports_to,
                      hod_dept: updateForm.hod_dept,
                      approval_hod: updateForm.approval_hod_id,
                      approval_hod_name: updateForm.approval_hod,
                      approval_hod_email: updateForm.approval_hod_email,
                      action: "Update Existing",
                      initiated_by: loginData?.id || "",
                      initiated_by_name: loginData?.name || "",
                      ...hrApprovers
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Current Active Employee *</label>
                      <SearchSelect
                        options={parentOptions}
                        value={updateForm.employee}
                        placeholder="Search active node..."
                        onChange={(opt) => {
                          const details = flatOrgNodes.find((n) => String(n.id) === String(opt.value));
                          const parentName = flatOrgNodes.find((n) => n.id === details?.parent_id)?.employee || "";

                          setUpdateForm({
                            ...updateForm,
                            employee: opt.value,
                            CURRENT_EMPLOYEE: opt.name,
                            department_name: details?.department_name || "",
                            reports_to: parentName,
                            title: details?.title || "",
                            role: details?.role || ""
                          });
                        }}
                      />
                    </div>

                    {updateForm.employee && (
                      <div className="p-3 bg-muted/40 border border-border/60 rounded-lg flex flex-col justify-center space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Current Profile Details</span>
                        <div className="text-xs flex flex-wrap gap-2 text-foreground font-semibold">
                          <span>Dept: {updateForm.department_name}</span>
                          <span>Role: {updateForm.role}</span>
                          <span>Title: {updateForm.title}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Replacement Employee *</label>
                      <SearchSelect
                        options={userOptions}
                        value={updateForm.employee_id}
                        placeholder="Select new resource..."
                        onChange={(opt) => {
                          const isDuplicate = flatOrgNodes.some(
                            (node) => node.employee.toLowerCase() === opt.label.toLowerCase()
                          );
                          if (isDuplicate) {
                            if (!window.confirm("This replacement person is already active in organization structure. Continue?")) {
                              return;
                            }
                          }
                          setUpdateForm({
                            ...updateForm,
                            new_employee: opt.label,
                            employee_id: opt.value,
                            email: opt.email
                          });
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Department for Approval *</label>
                      <SearchSelect
                        options={departmentOptions}
                        value={updateForm.hod_dept}
                        placeholder="Select HOD department..."
                        onChange={(opt) => {
                          const hodDetails = getDepartmentHOD(opt.value);
                          setUpdateForm({
                            ...updateForm,
                            hod_dept: opt.value,
                            approval_hod: hodDetails.name,
                            approval_hod_id: hodDetails.id,
                            approval_hod_email: hodDetails.email
                          });
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">HOD Approver (Auto-Filled)</label>
                      <input
                        type="text"
                        readOnly
                        placeholder="No HOD assigned yet"
                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-muted text-muted-foreground outline-none"
                        value={updateForm.approval_hod || ""}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/40 flex justify-end">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs">
                      Submit Request
                    </Button>
                  </div>
                </form>
              )}

              {/* TAB 4: DELETE MEMBER */}
              {activeTab === "delete" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!deleteForm.employee || !deleteForm.hod_dept) {
                      alert("Please fill in all required fields.");
                      return;
                    }

                    submitApproval({
                      id: deleteForm.employee,
                      employee: deleteForm.CURRENT_EMPLOYEE,
                      email: deleteForm.email,
                      employee_id: deleteForm.employee_id,
                      department_name: deleteForm.department_name,
                      reports_to: deleteForm.reports_to,
                      hod_dept: deleteForm.hod_dept,
                      approval_hod: deleteForm.approval_hod_id,
                      approval_hod_name: deleteForm.approval_hod,
                      approval_hod_email: deleteForm.approval_hod_email,
                      action: "Delete",
                      initiated_by: loginData?.id || "",
                      initiated_by_name: loginData?.name || "",
                      ...hrApprovers
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Employee Node to Remove *</label>
                      <SearchSelect
                        options={parentOptions}
                        value={deleteForm.employee}
                        placeholder="Search active node..."
                        onChange={(opt) => {
                          const details = flatOrgNodes.find((n) => String(n.id) === String(opt.value));
                          const parentName = flatOrgNodes.find((n) => n.id === details?.parent_id)?.employee || "";

                          setDeleteForm({
                            ...deleteForm,
                            employee: opt.value,
                            CURRENT_EMPLOYEE: opt.name,
                            employee_id: details?.employee_id || "",
                            email: details?.email || "",
                            department_name: details?.department_name || "",
                            reports_to: parentName,
                            title: details?.title || "",
                            role: details?.role || ""
                          });
                        }}
                      />
                    </div>

                    {deleteForm.employee && (
                      <div className="p-3 bg-rose-50/10 border border-rose-500/20 rounded-lg flex flex-col justify-center space-y-1">
                        <span className="text-[10px] font-bold text-rose-500 uppercase">Target Removal Profile</span>
                        <div className="text-xs flex flex-wrap gap-2 text-foreground font-semibold">
                          <span>Dept: {deleteForm.department_name}</span>
                          <span>Role: {deleteForm.role}</span>
                          <span>Title: {deleteForm.title}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Department for Approval *</label>
                      <SearchSelect
                        options={departmentOptions}
                        value={deleteForm.hod_dept}
                        placeholder="Select HOD department..."
                        onChange={(opt) => {
                          const hodDetails = getDepartmentHOD(opt.value);
                          setDeleteForm({
                            ...deleteForm,
                            hod_dept: opt.value,
                            approval_hod: hodDetails.name,
                            approval_hod_id: hodDetails.id,
                            approval_hod_email: hodDetails.email
                          });
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">HOD Approver (Auto-Filled)</label>
                      <input
                        type="text"
                        readOnly
                        placeholder="No HOD assigned yet"
                        className="w-full text-xs rounded-lg border border-input px-3 py-2 bg-muted text-muted-foreground outline-none"
                        value={deleteForm.approval_hod || ""}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/40 flex justify-end">
                    <Button type="submit" className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs">
                      Submit Deletion Request
                    </Button>
                  </div>
                </form>
              )}

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
