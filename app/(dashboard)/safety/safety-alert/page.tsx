"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, Upload, FileImage, Trash2, ShieldAlert, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SafetyAlertPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_HOST = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";

  useEffect(() => {
    setMounted(true);
    setSelectedDate(new Date().toISOString().split("T")[0]);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "image/png") {
        toast.warning("Please upload a valid PNG image file only.");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    // Include alert date if backend supports it
    formData.append("date", selectedDate);

    try {
      const response = await axios.post(`${API_HOST}/safety/safety-alert/alert-upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success) {
        toast.success(response.data?.data?.message || "Safety Alert broadcasted successfully!");
        handleRemoveFile();
      } else {
        toast.error(response.data?.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to connect to safety alert server.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Link href="/safety">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-indigo-500" />
            Safety Alert Broadcast
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Broadcast emergency alerts, near-miss lessons, and incident briefings.
          </p>
        </div>
      </div>

      <Card className="border-border/60 shadow-md">
        <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-transparent border-b border-border/40 pb-4">
          <CardTitle className="text-sm font-bold tracking-wide text-foreground uppercase">
            Upload Broadcaster Image
          </CardTitle>
          <CardDescription className="text-xs">
            Only PNG formats are accepted. Choose the date and select your alert leaflet image.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Date Selector */}
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="alertDate" className="text-xs font-semibold">Alert Date</Label>
            <Input
              id="alertDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png"
            className="hidden"
          />

          {/* Drag & Drop Container */}
          {!previewUrl ? (
            <div
              onClick={triggerFileInput}
              className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 hover:border-indigo-500 rounded-xl p-10 cursor-pointer bg-muted/5 hover:bg-indigo-500/5 transition-all text-muted-foreground hover:text-indigo-600"
            >
              <Upload className="w-12 h-12 mb-3" />
              <span className="text-sm font-bold">Upload Safety Alert Leaflet</span>
              <span className="text-xs mt-1 opacity-70">Click to browse or drag and drop (PNG format only)</span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-6">
              {/* Image Preview */}
              <div className="relative border border-border/80 rounded-xl overflow-hidden shadow-md max-w-full bg-muted/10 p-2">
                <Button
                  onClick={() => handleRemoveFile()}
                  variant="destructive"
                  size="icon"
                  className="absolute top-4 right-4 h-8 w-8 rounded-full shadow-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <img
                  src={previewUrl}
                  alt="Safety Alert Preview"
                  className="max-h-[350px] object-contain rounded-lg"
                />
              </div>

              {/* File Info */}
              <div className="flex items-center gap-2 border border-border/60 p-2 px-4 rounded-lg bg-card text-xs font-semibold text-muted-foreground shadow-sm">
                <FileImage className="w-4 h-4 text-indigo-500" />
                <span className="text-foreground max-w-[200px] truncate">{selectedFile?.name}</span>
                <span className="opacity-40">|</span>
                <span>{selectedFile ? (selectedFile.size / 1024).toFixed(1) : 0} KB</span>
              </div>

              {/* Submit Trigger */}
              <Button
                onClick={handleSubmit}
                disabled={isUploading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-10 w-full max-w-xs shadow-md gap-2"
              >
                {isUploading ? (
                  "Broadcasting..."
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Broadcast Alert
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
