"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, Upload, FileImage, Trash2, ShieldAlert, Check, Calendar, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import CommonDialog from "@/components/shared/CommonDialog";

export default function SafetyAlertPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // States for viewing recent alerts
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [activeLightboxAlert, setActiveLightboxAlert] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_HOST = process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.0.7.26:3003/api";

  const fetchRecentAlerts = async () => {
    setIsLoadingRecent(true);
    try {
      const response = await axios.get(`${API_HOST}/safety/safety-alert/recent`);
      if (response.data && response.data.success) {
        setRecentAlerts(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching recent alerts:", error);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    setSelectedDate(new Date().toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchRecentAlerts();
    }
  }, [mounted]);

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
        fetchRecentAlerts();
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
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
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

      {/* RECENT ALERTS SECTION */}
      <Card className="border-border/60 shadow-md">
        <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-transparent border-b border-border/40 pb-4">
          <CardTitle className="text-sm font-bold tracking-wide text-foreground uppercase flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            Recent Safety Alerts
          </CardTitle>
          <CardDescription className="text-xs">
            View the last 5 uploaded safety alerts. Click on any alert to view it full screen.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoadingRecent ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : recentAlerts.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-muted-foreground/20 rounded-xl text-muted-foreground text-xs">
              No safety alerts uploaded yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {recentAlerts.map((alert) => {
                const formattedDate = new Date(alert.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                return (
                  <div
                    key={alert.fileName}
                    className="group cursor-pointer border border-border/50 hover:border-indigo-500 rounded-xl overflow-hidden bg-card hover:shadow-md transition-all p-2 flex flex-col gap-2"
                    onClick={() => setActiveLightboxAlert(alert)}
                  >
                    <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-muted/20 relative">
                      <img
                        src={alert.url}
                        alt={`Safety Alert ${formattedDate}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placeholder.co/180x120?text=Alert+Image";
                        }}
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-foreground truncate">
                        {formattedDate}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {alert.fileName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      {activeLightboxAlert && (
        <CommonDialog
          open={!!activeLightboxAlert}
          onOpenChange={(open) => {
            if (!open) setActiveLightboxAlert(null);
          }}
          title={`Safety Alert - ${new Date(activeLightboxAlert.date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}`}
          description={activeLightboxAlert.fileName}
          className="sm:max-w-[700px]"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <a
                href={activeLightboxAlert.url}
                download={activeLightboxAlert.fileName}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-xs gap-1.5 text-white">
                  <Download className="w-3.5 h-3.5" /> Download
                </Button>
              </a>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setActiveLightboxAlert(null)}
              >
                Close
              </Button>
            </div>
          }
        >
          <div className="relative w-full overflow-hidden rounded-lg bg-black/40 flex justify-center py-2 border border-border/40">
            <img
              src={activeLightboxAlert.url}
              alt="Full Screen Safety Alert"
              className="max-w-full max-h-[50vh] object-contain rounded"
            />
          </div>
        </CommonDialog>
      )}
    </div>
  );
}
