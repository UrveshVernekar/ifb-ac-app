"use client";

import React, { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { 
            fps: 10, 
            qrbox: 250
          },
          (decodedText) => {
            if (!isRunningRef.current) return;

            isRunningRef.current = false;
            scanner.stop().catch(() => {});
            onScan(decodedText);
          },
          () => {}
        )
        .then(() => {
          isRunningRef.current = true;
        })
        .catch((err) => {
          console.error("Scanner Start Error:", err);
          isRunningRef.current = false;
          alert("Camera Access Error: Please ensure you have granted camera permissions and are using a secure connection (HTTPS or localhost).");
        });
    }, 300); // Wait for modal animation

    return () => {
      clearTimeout(timer);
      if (scannerRef.current && isRunningRef.current) {
        scannerRef.current.stop().catch(() => {});
        isRunningRef.current = false;
      }
    };
  }, [onScan]);

  return (
    <div
      id="qr-reader"
      className="w-full h-[300px] border border-border rounded-lg overflow-hidden bg-muted/10 flex items-center justify-center"
    />
  );
}
