"use client";

import React from "react";
import CommonDialog from "./CommonDialog";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  variant?: "default" | "destructive" | "outline";
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title = "Confirm Action",
  description,
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "destructive",
  loading = false,
}: ConfirmDialogProps) {
  const footer = (
    <div className="flex w-full justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onOpenChange(false)}
        className="text-xs h-9"
        disabled={loading}
      >
        {cancelText}
      </Button>
      <Button
        type="button"
        variant={variant}
        size="sm"
        onClick={onConfirm}
        className="text-xs h-9 min-w-[80px]"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing...
          </span>
        ) : (
          confirmText
        )}
      </Button>
    </div>
  );

  return (
    <CommonDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={footer}
      className="sm:max-w-[400px]"
    >
      {children}
    </CommonDialog>
  );
}
