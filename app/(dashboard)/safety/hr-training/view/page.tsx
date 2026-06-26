"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, User, GraduationCap, Calendar, Clock, BookOpen, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";

interface TrainingDetail {
  id: number;
  trainingType: string;
  trainer_name: string;
  trainee_name: string | null;
  department: string;
  training_name: string;
  focuseArea: string | null;
  remark: string | null;
  training_category: string;
  start_date: string;
  end_date: string | null;
  duration: number;
}

export default function HrTrainingViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TrainingDetail | null>(null);

  const API_HOST_3003 = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";

  const fetchTrainingDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_HOST_3003}/safety/ohc/hr_training_data_by_id?id=${id}`);
      const fetched = res.data?.[0] || null;
      setData(fetched);
    } catch (err) {
      console.error("Error fetching training details:", err);
      toast.error("Failed to load training record details");
    } finally {
      setLoading(false);
    }
  }, [id, API_HOST_3003]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && id) {
      fetchTrainingDetail();
    }
  }, [id, fetchTrainingDetail, mounted]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-xs text-muted-foreground">Loading training details...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4 text-center p-8">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold">Training record not found</h3>
        <Link href="/safety/hr-training">
          <Button variant="outline" size="sm">Go Back</Button>
        </Link>
      </div>
    );
  }

  const isOJT = data.trainingType === "On Job Training" || !data.training_name;

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
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
            Training Record details
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log information for HR Safety certifications and evaluations.
          </p>
        </div>
      </div>

      {/* METRIC HEADER BANNER */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 rounded-xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/15 text-blue-600 rounded-xl">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground uppercase tracking-wide">
              {isOJT ? "On Job Training (OJT)" : data.training_name}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Department: {data.department} • Category: {data.training_category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold border bg-blue-500/10 text-blue-600 border-blue-500/20">
            {data.trainingType || "Training"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* BASIC INFORMATION */}
        <Card className="border-border/60 shadow-md">
          <CardHeader className="bg-muted/30 border-b border-border/40 pb-3 flex items-center gap-1.5 flex-row">
            <User className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
              Personnel Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div>
              <Label className="text-[10px] text-muted-foreground font-semibold uppercase">Trainer Name</Label>
              <p className="font-bold text-foreground text-sm mt-0.5">{data.trainer_name || "--"}</p>
            </div>
            {data.trainee_name && (
              <div>
                <Label className="text-[10px] text-muted-foreground font-semibold uppercase">Trainee Names</Label>
                <p className="font-bold text-foreground mt-0.5 leading-relaxed">{data.trainee_name}</p>
              </div>
            )}
            <div>
              <Label className="text-[10px] text-muted-foreground font-semibold uppercase">Department</Label>
              <p className="font-bold text-foreground mt-0.5 uppercase">{data.department || "--"}</p>
            </div>
          </CardContent>
        </Card>

        {/* TOPIC DETAILS */}
        <Card className="border-border/60 shadow-md">
          <CardHeader className="bg-muted/30 border-b border-border/40 pb-3 flex items-center gap-1.5 flex-row">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
              Training Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            {!isOJT && (
              <div>
                <Label className="text-[10px] text-muted-foreground font-semibold uppercase">Training Title</Label>
                <p className="font-bold text-foreground text-sm mt-0.5">{data.training_name || "--"}</p>
              </div>
            )}
            {data.focuseArea && (
              <div>
                <Label className="text-[10px] text-muted-foreground font-semibold uppercase">Focus Area (OJT)</Label>
                <p className="font-bold text-foreground mt-0.5">{data.focuseArea}</p>
              </div>
            )}
            {data.remark && (
              <div>
                <Label className="text-[10px] text-muted-foreground font-semibold uppercase">Evaluation / Remark</Label>
                <p className="font-bold text-teal-600 mt-0.5 italic">{data.remark}</p>
              </div>
            )}
            <div>
              <Label className="text-[10px] text-muted-foreground font-semibold uppercase">Category</Label>
              <p className="font-bold text-foreground mt-0.5 capitalize">{data.training_category || "--"}</p>
            </div>
          </CardContent>
        </Card>

        {/* SCHEDULE */}
        <Card className="border-border/60 shadow-md">
          <CardHeader className="bg-muted/30 border-b border-border/40 pb-3 flex items-center gap-1.5 flex-row">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
              Schedule & Duration
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div>
              <Label className="text-[10px] text-muted-foreground font-semibold uppercase">Start Date</Label>
              <p className="font-bold text-foreground mt-0.5">
                {data.start_date ? format(new Date(data.start_date), "dd-MMM-yyyy") : "--"}
              </p>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground font-semibold uppercase">End Date</Label>
              <p className="font-bold text-foreground mt-0.5">
                {data.end_date ? format(new Date(data.end_date), "dd-MMM-yyyy") : "Not Logged"}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <div>
                <Label className="text-[10px] text-muted-foreground font-semibold uppercase block">Duration</Label>
                <span className="font-extrabold text-blue-600 text-sm">{data.duration} hrs</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
