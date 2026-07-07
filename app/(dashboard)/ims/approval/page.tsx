"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Search
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Interface definitions
interface ApprovalRequest {
  request_id: number;
  action: "Add New" | "Add Dotted Relation" | "Update Existing" | "Delete";
  department_name?: string;
  employee?: string;
  new_employee_name?: string;
  child_id?: string;
  dotted_parent_name?: string;
  title?: string;
  role?: string;
  reports_to?: string;
  initiated_by_name: string;
  initiated_by: string;
  hod_dept?: string;
  status_hod: number; // 0=Pending, 1=Approved, 2=Rejected
  status_hr: number;  // 0=Pending, 1=Approved, 2=Rejected
  request_timestamp: string;
  approval_hod: string;
  approval_hr1: string;
  approval_hr2: string;
}

export default function ApprovalRequestsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [loginData, setLoginData] = useState<any>(null);
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);

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

  // Fetch approvals
  const fetchApprovals = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";
    setIsLoading(true);

    axios
      .get(`${apiBase}/quality/ims/get-approval`)
      .then((response) => {
        setRequests(response.data || []);
      })
      .catch((error) => {
        console.error("Error fetching approval requests:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (mounted) {
      fetchApprovals();
    }
  }, [mounted]);

  // Handle action click
  const handleApprovalAction = async (item: ApprovalRequest, approverType: "hod" | "hr", isApprove: boolean) => {
    const status = isApprove ? 1 : 2;
    const actionText = isApprove ? "Approve" : "Reject";
    if (!window.confirm(`Are you sure you want to ${actionText} this request?`)) return;

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";
    try {
      await axios.post(`${apiBase}/quality/ims/approval-status`, {
        request_id: item.request_id,
        approver: approverType,
        status: status
      });
      alert(`Successfully registered ${actionText.toLowerCase()}al.`);
      fetchApprovals(); // Reload list
    } catch (error) {
      console.error("Error updating approval status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  // Timestamp formatter
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  // Filter requests by Tab
  const pendingRequests = requests.filter((r) =>
    (r.status_hod === 0 || r.status_hr === 0) &&
    !(r.status_hod === 2 || r.status_hr === 2)
  );

  const approvedRequests = requests.filter((r) =>
    r.status_hod === 1 && r.status_hr === 1
  );

  const rejectedRequests = requests.filter((r) =>
    r.status_hod === 2 || r.status_hr === 2
  );

  const getActiveList = () => {
    if (activeTab === "approved") return approvedRequests;
    if (activeTab === "rejected") return rejectedRequests;
    return pendingRequests;
  };

  // Filter by Search Query
  const filteredList = getActiveList().filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Group headers mapping for each action type
  const actionHeaders: Record<string, string[]> = {
    "Add New": ["Request ID", "Department", "Employee", "Title", "Reports To", "Initiated By", "HOD Approval", "HR Approval", "Requested On"],
    "Add Dotted Relation": ["Request ID", "Employee", "Dotted Relation", "Initiated By", "HOD Approval", "HR Approval", "Requested On"],
    "Update Existing": ["Request ID", "Department", "Current Employee", "New Employee", "Reports To", "Initiated By", "HOD Approval", "HR Approval", "Requested On"],
    "Delete": ["Request ID", "Department", "Current Employee", "Reports To", "Initiated By", "HOD Approval", "HR Approval", "Requested On"]
  };

  const headerMapping: Record<string, keyof ApprovalRequest> = {
    "Request ID": "request_id",
    "Department": "department_name",
    "Employee": "employee",
    "New Employee": "new_employee_name",
    "Current Employee": "employee",
    "Title": "title",
    "Initiated By": "initiated_by_name",
    "HOD Approval": "status_hod",
    "HR Approval": "status_hr",
    "Requested On": "request_timestamp",
    "Dotted Relation": "dotted_parent_name",
    "Reports To": "reports_to"
  };

  if (!mounted) return null;

  const groupedActions = ["Add New", "Add Dotted Relation", "Update Existing", "Delete"] as const;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Approval Requests
            </h1>
            <p className="text-xs text-muted-foreground">
              Authorise structural updates and reporting relationship modifications.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs rounded-full border border-input pl-9 pr-4 py-2 bg-background text-foreground outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* TAB SWITCHES */}
      <div className="flex border-b border-border gap-2 shrink-0">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "pending"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending ({pendingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "approved"
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Approved ({approvedRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("rejected")}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "rejected"
              ? "border-rose-500 text-rose-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <XCircle className="w-4 h-4" />
          Rejected ({rejectedRequests.length})
        </button>
      </div>

      {isLoading ? (
        <Card className="border border-border/60 bg-card p-6 animate-pulse space-y-3">
          <div className="h-6 bg-muted rounded w-1/4" />
          <div className="h-10 bg-muted rounded w-full" />
          <div className="h-10 bg-muted rounded w-full" />
        </Card>
      ) : filteredList.length > 0 ? (
        <div className="space-y-10">
          {groupedActions.map((actionType) => {
            const items = filteredList.filter((item) => item.action === actionType);
            if (items.length === 0) return null;

            const headers = actionHeaders[actionType];

            return (
              <div key={actionType} className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {actionType} Requests
                </h3>

                <div className="border border-border/60 rounded-xl overflow-hidden shadow-sm bg-card">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-center border-collapse text-xs">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border/40 text-muted-foreground font-bold">
                          {headers.map((h, idx) => (
                            <th key={idx} className="p-3 text-[10px] uppercase tracking-wider">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-medium">
                        {items.map((item, index) => (
                          <tr key={index} className="hover:bg-muted/20 transition-all">
                            {headers.map((h, colIdx) => {
                              const key = headerMapping[h];

                              if (h === "Requested On") {
                                return (
                                  <td key={colIdx} className="p-3 text-muted-foreground truncate max-w-[140px]">
                                    {formatTimestamp(item.request_timestamp)}
                                  </td>
                                );
                              }

                              if (h === "HOD Approval") {
                                const isCurrentUserHOD = String(loginData?.id) === String(item.approval_hod);
                                const status = item.status_hod;

                                return (
                                  <td key={colIdx} className="p-3">
                                    {status === 0 ? (
                                      isCurrentUserHOD && activeTab === "pending" ? (
                                        <div className="flex items-center justify-center gap-1.5">
                                          <Button
                                            size="sm"
                                            className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                                            onClick={() => handleApprovalAction(item, "hod", true)}
                                          >
                                            Approve
                                          </Button>
                                          <Button
                                            size="sm"
                                            className="h-7 text-[10px] bg-rose-600 hover:bg-rose-500 text-white font-bold"
                                            onClick={() => handleApprovalAction(item, "hod", false)}
                                          >
                                            Reject
                                          </Button>
                                        </div>
                                      ) : (
                                        <Badge className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 font-semibold text-[9px] hover:bg-amber-100">
                                          Pending
                                        </Badge>
                                      )
                                    ) : status === 1 ? (
                                      <Badge className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 font-semibold text-[9px] hover:bg-emerald-100">
                                        Approved
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 font-semibold text-[9px] hover:bg-rose-100">
                                        Rejected
                                      </Badge>
                                    )}
                                  </td>
                                );
                              }

                              if (h === "HR Approval") {
                                const isCurrentUserHR =
                                  String(loginData?.id) === String(item.approval_hr1) ||
                                  String(loginData?.id) === String(item.approval_hr2);
                                const status = item.status_hr;

                                return (
                                  <td key={colIdx} className="p-3">
                                    {status === 0 ? (
                                      item.status_hod === 0 ? (
                                        <span className="text-[10px] text-muted-foreground font-semibold">
                                          Pending HOD
                                        </span>
                                      ) : item.status_hod === 2 ? (
                                        <Badge className="bg-muted text-muted-foreground border border-border font-semibold text-[9px]">
                                          Rejected by HOD
                                        </Badge>
                                      ) : isCurrentUserHR && activeTab === "pending" ? (
                                        <div className="flex items-center justify-center gap-1.5">
                                          <Button
                                            size="sm"
                                            className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                                            onClick={() => handleApprovalAction(item, "hr", true)}
                                          >
                                            Approve
                                          </Button>
                                          <Button
                                            size="sm"
                                            className="h-7 text-[10px] bg-rose-600 hover:bg-rose-500 text-white font-bold"
                                            onClick={() => handleApprovalAction(item, "hr", false)}
                                          >
                                            Reject
                                          </Button>
                                        </div>
                                      ) : (
                                        <Badge className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 font-semibold text-[9px] hover:bg-amber-100">
                                          Pending
                                        </Badge>
                                      )
                                    ) : status === 1 ? (
                                      <Badge className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 font-semibold text-[9px] hover:bg-emerald-100">
                                        Approved
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 font-semibold text-[9px] hover:bg-rose-100">
                                        Rejected
                                      </Badge>
                                    )}
                                  </td>
                                );
                              }

                              return (
                                <td key={colIdx} className="p-3 text-foreground truncate max-w-[150px]">
                                  {key ? String(item[key]) || "-" : "-"}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-border/60 rounded-xl py-12 text-center text-xs text-muted-foreground font-semibold bg-card shadow-sm">
          No approval requests found in this section.
        </div>
      )}
    </div>
  );
}
