"use client";

import React, { useState, useEffect } from "react";
import CommonDialog from "@/components/shared/CommonDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DatePicker } from "@/components/manufacturing/DatePicker";
import { AlertCircle, RefreshCw } from "lucide-react";

interface BreakDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: any, isEdit: boolean) => Promise<void>;
  isEdit?: boolean;
  initialData?: any;
  defaultDate?: string;
  defaultLine?: string;
}

export default function BreakDialog({
  open,
  onClose,
  onSave,
  isEdit = false,
  initialData = null,
  defaultDate = "",
  defaultLine = "IDU-Line",
}: BreakDialogProps) {
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [line, setLine] = useState("IDU-Line");
  const [breakType, setBreakType] = useState("tea");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const breakTypeOptions = [
    { value: "tea", label: "Tea Break" },
    { value: "lunch", label: "Lunch Break" },
    { value: "dinner", label: "Dinner Break" },
    { value: "other", label: "Other Break" },
  ];

  // Set default values when opening dialog
  useEffect(() => {
    if (open) {
      setErrorMsg("");
      setSaving(false);

      if (isEdit && initialData) {
        setSelectedDate(initialData.date || new Date().toISOString().split("T")[0]);
        setLine(initialData.line || "IDU-Line");
        setBreakType(initialData.type || "tea");
        setStartTime(initialData.startTime || "");
        setEndTime(initialData.endTime || "");
      } else {
        setSelectedDate(defaultDate || new Date().toISOString().split("T")[0]);
        setLine(defaultLine || "IDU-Line");
        setBreakType("tea");
        setStartTime("");
        setEndTime("");
      }
    }
  }, [open, isEdit, initialData, defaultDate, defaultLine]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedDate) {
      setErrorMsg("Please select a valid date.");
      return;
    }
    if (!line) {
      setErrorMsg("Please select a manufacturing line.");
      return;
    }
    if (!breakType) {
      setErrorMsg("Please select a break type.");
      return;
    }
    if (!startTime) {
      setErrorMsg("Please select a valid start time.");
      return;
    }
    if (!endTime) {
      setErrorMsg("Please select a valid end time.");
      return;
    }

    // Time ordering check
    if (startTime >= endTime) {
      setErrorMsg("Start time must be before End time.");
      return;
    }

    // Standardize time formats to HH:mm:ss for backend compatibility
    const formatTime = (timeStr: string) => {
      const parts = timeStr.split(":");
      if (parts.length === 2) {
        return `${timeStr}:00`;
      }
      return timeStr;
    };

    setSaving(true);
    try {
      const payload = {
        id: initialData?.id,
        date: selectedDate,
        line,
        type: breakType,
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
      };

      await onSave(payload, isEdit);
      onClose();
    } catch (err: any) {
      console.error("Save break failed:", err);
      setErrorMsg(err.message || "Failed to save break configuration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CommonDialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title={isEdit ? "Edit Break Details" : "Add Break Details"}
      description="Configure line break durations and operational types."
      className="sm:max-w-[450px]"
    >
      {errorMsg && (
        <Alert variant="destructive" className="py-2 px-3 text-xs mb-3">
          <div className="flex gap-2 items-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <AlertDescription className="text-xs font-semibold">{errorMsg}</AlertDescription>
          </div>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* DATE SELECTOR */}
        <div className="space-y-1">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-0.5">Date *</Label>
          <DatePicker
            value={selectedDate}
            onChange={(dateStr) => setSelectedDate(dateStr)}
            className="w-full bg-background border-border"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* LINE SELECTOR */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-0.5">Line *</Label>
            <Select value={line} onValueChange={setLine}>
              <SelectTrigger className="w-full bg-background border-border h-9 text-xs">
                <SelectValue placeholder="Select Line" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IDU-Line">IDU LINE</SelectItem>
                <SelectItem value="ODU-Line">ODU LINE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* BREAK TYPE */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-0.5">Break Type *</Label>
            <Select value={breakType} onValueChange={setBreakType}>
              <SelectTrigger className="w-full bg-background border-border h-9 text-xs">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                {breakTypeOptions.map(({ label, value }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* START TIME */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-0.5">Start Time *</Label>
            <Input
              type="time"
              step="1"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-background border-border h-9 text-xs"
              required
            />
          </div>

          {/* END TIME */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-0.5">End Time *</Label>
            <Input
              type="time"
              step="1"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="bg-background border-border h-9 text-xs"
              required
            />
          </div>
        </div>

        <div className="flex w-full justify-end gap-2 pt-4 border-t border-border/20">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-9"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 min-w-[80px]"
          >
            {saving ? (
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
              </span>
            ) : isEdit ? (
              "Update"
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </form>
    </CommonDialog>
  );
}
