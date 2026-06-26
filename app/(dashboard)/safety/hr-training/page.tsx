"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";
import { toast } from "sonner";
import { format } from "date-fns";

interface TrainingRecord {
  id: number;
  department: string;
  training_name: string;
  focuseArea?: string;
  training_category: string;
  start_date: string;
  end_date: string;
  duration: number;
  strength: number;
  plant: string;
}

export default function HrTrainingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trainingData, setTrainingData] = useState<TrainingRecord[]>([]);

  const API_HOST_3003 = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";

  const fetchTrainingData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_HOST_3003}/safety/ohc/hr_training`, {
        key: "GET",
      });

      const plantVal = sessionStorage.getItem("plant") || "AC";

      const formatted = (response.data || [])
        .filter((item: any) => item.plant === plantVal)
        .map((item: any) => ({
          ...item,
          training_name: item.training_name?.trim() ? item.training_name : item.focuseArea,
        }));

      setTrainingData(formatted);
    } catch (error) {
      console.error("Error fetching training data:", error);
      toast.error("Failed to load training schedules");
    } finally {
      setLoading(false);
    }
  }, [API_HOST_3003]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchTrainingData();
    }
  }, [fetchTrainingData, mounted]);

  const columns = useMemo<ColumnConfig<TrainingRecord>[]>(
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
        header: "Department",
        accessorKey: "department",
        isFilterable: true,
        isSortable: true,
        className: "font-semibold text-xs text-left capitalize",
      },
      {
        header: "Training Topic / Name",
        accessorKey: "training_name",
        isFilterable: true,
        isSortable: true,
        className: "text-left text-xs",
      },
      {
        header: "Training Category",
        accessorKey: "training_category",
        isFilterable: true,
        isSortable: true,
        className: "text-center text-xs capitalize",
      },
      {
        header: "Start Date",
        accessorKey: "start_date",
        isSortable: true,
        className: "text-center text-xs",
        cell: (row) => (row.start_date ? format(new Date(row.start_date), "dd-MMM-yyyy") : "--"),
      },
      {
        header: "End Date",
        accessorKey: "end_date",
        isSortable: true,
        className: "text-center text-xs",
        cell: (row) => (row.end_date ? format(new Date(row.end_date), "dd-MMM-yyyy") : "--"),
      },
      {
        header: "Duration (Hrs)",
        accessorKey: "duration",
        className: "text-center text-xs font-bold text-blue-600",
        cell: (row) => `${row.duration} hrs`,
      },
      {
        header: "Attendee Count",
        accessorKey: "strength",
        className: "text-center text-xs font-bold text-muted-foreground",
      },
      {
        header: "Actions",
        accessorKey: "actions",
        isFilterable: false,
        isSortable: false,
        className: "w-20 text-center text-xs",
        cell: (row) => (
          <Button
            onClick={() => router.push(`/safety/hr-training/view?id=${row.id}`)}
            variant="ghost"
            size="sm"
            className="text-xs h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 font-semibold"
          >
            Details
          </Button>
        ),
      },
    ],
    [router]
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
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
              <GraduationCap className="w-7 h-7 text-blue-600" />
              HR Safety Training Registry
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track workforce safety certifications, On-Job Trainings (OJT), and training impact logs.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/safety/hr-training/add">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 cursor-pointer gap-1.5">
              <Plus className="w-4 h-4" /> Log Training Schedule
            </Button>
          </Link>
        </div>
      </div>

      {/* LEDGER TABLE CARD */}
      <Card className="border-border/60 shadow-md">
        <CardHeader className="pb-2 border-b border-border/40">
          <CardTitle className="text-sm font-bold uppercase text-foreground">
            Training Records Ledger
          </CardTitle>
          <CardDescription className="text-xs">
            Registry details of health & safety educational initiatives in the AC Plant.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <CommonTable
            data={trainingData}
            columns={columns}
            enableFiltering={true}
            enableExport={true}
            exportFileName={`safety_hr_training_records_${new Date().getFullYear()}.csv`}
            noDataMessage="No training records found for the AC Plant"
            initialPageSize={10}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
