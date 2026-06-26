"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Calendar, ShieldCheck, HeartPulse, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";
import { toast } from "sonner";
import { format } from "date-fns";

interface OhcRecord {
  id: number;
  patient: string;
  complaint: string;
  departin: string;
  gender: string;
  slevel: string;
  obsertype: string;
  date: string;
}

interface CatOption {
  value: string;
  label: string;
}

export default function OhcListPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ohcList, setOhcList] = useState<OhcRecord[]>([]);
  const [ohcCatList, setOhcCatList] = useState<CatOption[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [sessionEmail, setSessionEmail] = useState("");

  const API_HOST_3003 = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";

  const WELL_BEING_EMAILS = useMemo(() => ["ohc_goa@ifbglobal.com", "ohc_ac@ifbglobal.com"], []);

  const isWellBeingUser = useMemo(() => {
    return WELL_BEING_EMAILS.includes(sessionEmail);
  }, [sessionEmail, WELL_BEING_EMAILS]);

  const fetchOhcList = useCallback(async () => {
    setLoading(true);
    const currentYear = new Date().getFullYear();
    const apiUrl = `${API_HOST_3003}/safety/ohc/year=${currentYear}&ptype=AC&rtype=FY&sdate=sdate&edate=edate`;
    try {
      const res = await axios.get(apiUrl);
      setOhcList(res.data?.ohclist || []);
      setOhcCatList(res.data?.ohccatlist || []);
    } catch (err) {
      console.error("API Error fetching OHC list:", err);
      toast.error("Failed to load OHC registry data");
      setOhcList([]);
    } finally {
      setLoading(false);
    }
  }, [API_HOST_3003]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setSessionEmail(sessionStorage.getItem("employee_email") || "");
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchOhcList();
    }
  }, [fetchOhcList, mounted]);

  const canAccessRow = useCallback(
    (row: OhcRecord) => {
      if (row.obsertype === "Well-being") {
        return isWellBeingUser;
      }
      return true;
    },
    [isWellBeingUser]
  );

  // Filtered List
  const filteredList = useMemo(() => {
    return ohcList.filter((item) => {
      // Hide Well-being rows for unauthorized users
      if (item.obsertype === "Well-being" && !isWellBeingUser) {
        return false;
      }

      if (selectedType !== "ALL" && item.obsertype !== selectedType) {
        return false;
      }

      if (!searchText) return true;

      const lower = searchText.toLowerCase();
      return (
        item.patient?.toLowerCase().includes(lower) ||
        item.complaint?.toLowerCase().includes(lower) ||
        item.departin?.toLowerCase().includes(lower) ||
        item.gender?.toLowerCase().includes(lower) ||
        item.slevel?.toLowerCase().includes(lower)
      );
    });
  }, [ohcList, selectedType, searchText, isWellBeingUser]);

  // Columns Configuration
  const columns = useMemo<ColumnConfig<OhcRecord>[]>(
    () => [
      {
        header: "Sr. No",
        accessorKey: "srNo",
        isFilterable: false,
        isSortable: false,
        className: "w-12 text-center text-xs",
        cell: (_, index) => index + 1,
      },
      {
        header: "Patient",
        accessorKey: "patient",
        isFilterable: true,
        isSortable: true,
        className: "font-semibold text-xs text-left",
      },
      {
        header: "Complaint",
        accessorKey: "complaint",
        isFilterable: true,
        className: "text-left text-xs max-w-[200px] truncate",
      },
      {
        header: "Department",
        accessorKey: "departin",
        isFilterable: true,
        isSortable: true,
        className: "text-center text-xs uppercase",
      },
      {
        header: "Gender",
        accessorKey: "gender",
        isFilterable: true,
        className: "text-center text-xs",
      },
      {
        header: "Severity",
        accessorKey: "slevel",
        isFilterable: true,
        isSortable: true,
        className: "text-center text-xs",
        cell: (row) => (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              row.slevel?.toLowerCase().includes("high") || row.slevel?.toLowerCase().includes("severe")
                ? "bg-red-500/10 text-red-600 border-red-500/20"
                : row.slevel?.toLowerCase().includes("medium") || row.slevel?.toLowerCase().includes("moderate")
                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            }`}
          >
            {row.slevel}
          </span>
        ),
      },
      {
        header: "Type",
        accessorKey: "obsertype",
        isFilterable: true,
        isSortable: true,
        className: "text-center text-xs",
      },
      {
        header: "Date",
        accessorKey: "date",
        isSortable: true,
        className: "text-center text-xs",
        cell: (row) => (row.date ? format(new Date(row.date), "dd-MMM-yyyy") : "--"),
      },
      {
        header: "Actions",
        accessorKey: "actions",
        isFilterable: false,
        isSortable: false,
        className: "w-20 text-center text-xs",
        cell: (row) => {
          const allowed = canAccessRow(row);
          return (
            <Button
              onClick={() => router.push(`/safety/ohc-list/view?id=${row.id}`)}
              disabled={!allowed}
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 font-semibold"
            >
              {allowed ? "View" : "Restricted"}
            </Button>
          );
        },
      },
    ],
    [router, canAccessRow]
  );

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-8xl mx-auto p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/safety">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
              OHC Registry Logs
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review and query logs of outpatient patient medical treatments, severity and incidents.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/safety/ohc-form">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 cursor-pointer">
              Register Patient (OPD)
            </Button>
          </Link>
        </div>
      </div>

      {/* FILTER PANEL */}
      <Card className="border-border/60 shadow-sm bg-card">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Category selection */}
            <div className="flex items-center gap-2 border border-border px-3 py-1 rounded-lg bg-card w-full sm:w-[220px]">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-7 text-xs border-0 bg-transparent focus:ring-0 w-full p-0 shadow-none">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">All Categories</SelectItem>
                  {ohcCatList
                    .filter((opt) => opt.value !== "Well-being" || isWellBeingUser)
                    .map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients, complaints..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* LEDGER TABLE */}
      <Card className="border-border/60 shadow-md">
        <CardHeader className="pb-2 border-b border-border/40">
          <CardTitle className="text-sm font-bold uppercase text-foreground">
            OHC Patient Ledger
          </CardTitle>
          <CardDescription className="text-xs">
            Ledger records for the current fiscal year. Confidentially secured.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <CommonTable
            data={filteredList}
            columns={columns}
            enableFiltering={true}
            enableExport={true}
            exportFileName={`ohc_patient_ledger_${new Date().getFullYear()}.csv`}
            noDataMessage="No registered patients found in OHC logs"
            initialPageSize={10}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
