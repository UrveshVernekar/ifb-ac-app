// app/(dashboard)/manufacturing/process-validation/download/[id]/page.tsx
"use client";

import React, { useState, useEffect, use } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Download, Image as ImageIcon } from "lucide-react";

const API_HOST = "http://10.0.7.26:3003";

const reasonOptions = [
    { key: "newSupplier", label: "New Supplier (Localised / Alternate)" },
    { key: "designChange", label: "Design Change" },
    { key: "fieldIssue", label: "Field Issue" },
    { key: "newPart", label: "New Part" },
    { key: "lineTrial", label: "Line Trial" },
    { key: "newModel", label: "New Model" },
    { key: "fourMSupplier", label: "4M : Supplier" },
    { key: "fourMInhouse", label: "4M : Inhouse" },
    { key: "newTool", label: "New Tool" },
    { key: "duplicateTool", label: "Duplicate Tool" },
    { key: "fitmentTrial", label: "Fitment Trial" },
    { key: "other", label: "Other" },
];

const docOptions = [
    { key: "sirReport", label: "SIR Approval Report" },
    { key: "reliabilityReport", label: "Reliability Test Report" },
    { key: "dqaReport", label: "DQA Test Report" },
    { key: "approvedECN", label: "Approved ECN" },
    { key: "pds", label: "Product Data Sheet (PDS)" },
    { key: "trialReport", label: "Trial Report" },
    { key: "approved4M", label: "Approved 4M" },
    { key: "other", label: "Other" },
];

interface CheckRowProps {
    label: string;
    checked: boolean;
}

const CheckRow = ({ label, checked }: CheckRowProps) => (
    <div className="flex items-center gap-2 py-0.5 text-xs text-slate-800">
        <span className={`inline-block w-4 h-4 border border-slate-600 text-center leading-3 text-[10px] font-bold shrink-0 bg-white ${checked ? "bg-slate-900 text-amber-500 border-slate-900" : ""
            }`}>
            {checked ? "✓" : ""}
        </span>
        <span className="truncate">{label}</span>
    </div>
);

export default function ProcessValidationDownloadPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<any | null>(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_HOST}/api/process-validation/get-pv-requests`);
            const allData = Array.isArray(res.data) ? res.data : res.data.data || [];
            const detail = allData.find((item: any) => item.id.toString() === id);
            if (detail) {
                setData(detail);
            } else {
                setError("Validation signoff request not found.");
            }
        } catch (err) {
            console.error("Error loading download details:", err);
            setError("Failed to retrieve request details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) {
            fetchDetail();
        }
    }, [id, mounted]);

    const formatDate = (dateString: string) => {
        if (!dateString) return "—";
        try {
            const date = new Date(dateString.replace(" ", "T"));
            return date.toLocaleString("en-GB", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit", hour12: false,
            }).replace(",", "");
        } catch (e) {
            return dateString;
        }
    };

    const formatDateOnly = (dateString: string) => {
        if (!dateString) return "—";
        try {
            const d = new Date(dateString.split('T')[0]);
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${d.getDate().toString().padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
        } catch (e) {
            return dateString;
        }
    };

    const handleDownloadPDF = async () => {
        const element = document.querySelector(".pdf-card") as HTMLElement;
        if (!element) return;

        setDownloading(true);
        try {
            const html2canvas = (await import("html2canvas")).default;
            const { jsPDF } = await import("jspdf");

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let positionY = 0;

            pdf.addImage(imgData, "PNG", 0, positionY, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                pdf.addPage();
                positionY -= pageHeight;
                pdf.addImage(imgData, "PNG", 0, positionY, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const codeStr = data?.request_code || `PV_${id}`;
            pdf.save(`PV_${codeStr}.pdf`);
        } catch (err) {
            console.error("PDF generation failed:", err);
            alert("Failed to export sign-off PDF.");
        } finally {
            setDownloading(false);
        }
    };

    const handleDownloadImage = async () => {
        const element = document.querySelector(".pdf-card") as HTMLElement;
        if (!element) return;

        setDownloading(true);
        try {
            const html2canvas = (await import("html2canvas")).default;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true
            });

            const imgData = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            const codeStr = data?.request_code || `PV_${id}`;
            link.download = `PV_${codeStr}.png`;
            link.href = imgData;
            link.click();
        } catch (err) {
            console.error("Image generation failed:", err);
            alert("Failed to export sign-off image.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto p-2">
                <Skeleton className="h-10 w-44" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto p-2">
                <Link href="/manufacturing/process-validation">
                    <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                </Link>
                <Alert variant="destructive">
                    <AlertDescription>{error || "Record not found."}</AlertDescription>
                </Alert>
            </div>
        );
    }

    const activeReasons = data.reasons || [];
    const activeDocs = data.docs || [];

    const reasonLeft = reasonOptions.slice(0, 6);
    const reasonRight = reasonOptions.slice(6);
    const docLeft = docOptions.slice(0, 4);
    const docRight = docOptions.slice(4);

    const footerDepartments = ["Mnfg Head1", "Mnfg Head2", "Quality Head", "Plant Head"];

    const filteredApprovals = data.approvals?.filter(
        (item: any) => item.name !== "NA" && !footerDepartments.includes(item.department)
    ) || [];

    const manufacturingHeads = data.approvals?.filter((a: any) =>
        a.department === "Mnfg Head1" || a.department === "Mnfg Head2"
    ) || [];

    const qualityHead = data.approvals?.find((a: any) => a.department === "Quality Head");
    const plantHead = data.approvals?.find((a: any) => a.department === "Plant Head");

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-2">
            {/* Header controls bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href={`/manufacturing/process-validation/view/${id}`}>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-foreground uppercase tracking-tight">
                            Export Sign-off Form
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Generate high-resolution printable PDFs or image archives
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={handleDownloadImage}
                        disabled={downloading}
                        variant="outline"
                        className="text-xs h-9 gap-1.5"
                    >
                        <ImageIcon className="w-3.5 h-3.5" /> PNG Image
                    </Button>
                    <Button
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 gap-1.5"
                    >
                        <Download className="w-3.5 h-3.5" /> Export PDF
                    </Button>
                </div>
            </div>

            {/* Document wrapper */}
            <div className="overflow-x-auto p-4 bg-muted/30 border border-dashed rounded-2xl flex justify-center">
                <div className="pdf-card w-[1000px] shrink-0 bg-white border-2 border-slate-900 text-slate-900 p-8 font-sans shadow-md">
                    {/* Header */}
                    <div className="flex justify-between items-center border-b-2 border-slate-950 pb-4 mb-4">
                        <div className="font-serif text-3xl font-black text-slate-950 border-[3px] border-slate-950 px-3 py-1 tracking-wider leading-none">
                            IFB
                        </div>
                        <div className="text-xl font-bold text-center tracking-wide flex-1 text-slate-900">
                            Process Validation (PV) Request
                        </div>
                        <div className="text-right text-[11px] font-bold text-slate-700 space-y-0.5">
                            <div>CODE: {data.request_code || "FY25_26_0003"}</div>
                            <div>BRAND: {data.pv_type}</div>
                        </div>
                    </div>

                    {/* Metadata grids */}
                    <table className="w-full border-collapse border border-slate-800 text-[11px] mb-4">
                        <tbody>
                            <tr className="border-b border-slate-800">
                                <td className="w-[15%] bg-slate-100 font-bold border-r border-slate-800 p-2">Part Number</td>
                                <td className="w-[20%] border-r border-slate-800 p-2">{data.part_number}</td>
                                <td className="w-[15%] bg-slate-100 font-bold border-r border-slate-800 p-2">Requestor Name</td>
                                <td className="w-[20%] border-r border-slate-800 p-2">{data.requestor_name}</td>
                                <td className="w-[15%] bg-slate-100 font-bold border-r border-slate-800 p-2">Product</td>
                                <td className="w-[15%] p-2">{data.product}</td>
                            </tr>
                            <tr className="border-b border-slate-800">
                                <td className="bg-slate-100 font-bold border-r border-slate-800 p-2">Part Name</td>
                                <td className="border-r border-slate-800 p-2 truncate max-w-[150px]">{data.part_name}</td>
                                <td className="bg-slate-100 font-bold border-r border-slate-800 p-2">Requestor Dept</td>
                                <td className="border-r border-slate-800 p-2">{data.department}</td>
                                <td className="bg-slate-100 font-bold border-r border-slate-800 p-2">Trial Qty.</td>
                                <td className="p-2">{data.trial_quantity} Units</td>
                            </tr>
                            <tr>
                                <td className="bg-slate-100 font-bold border-r border-slate-800 p-2">Supplier / Inhouse</td>
                                <td className="border-r border-slate-800 p-2">{data.supplier_type}</td>
                                <td className="bg-slate-100 font-bold border-r border-slate-800 p-2">Request Date</td>
                                <td className="border-r border-slate-800 p-2">{formatDateOnly(data.request_date)}</td>
                                <td className="bg-slate-100 border-r border-slate-800 p-2" colSpan={2}></td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Section Titles */}
                    <table className="w-full border-collapse border border-slate-800 text-xs mb-0">
                        <thead>
                            <tr className="bg-slate-900 text-amber-500 font-bold">
                                <th className="w-1/2 text-center p-1.5 border-r border-slate-800 uppercase tracking-wider">
                                    Reason of Request <span className="text-[9px] font-normal lowercase">(✓ on applicable)</span>
                                </th>
                                <th className="w-1/2 text-center p-1.5 uppercase tracking-wider">
                                    Attached Backup Documents <span className="text-[9px] font-normal lowercase">(✓ on applicable)</span>
                                </th>
                            </tr>
                        </thead>
                    </table>

                    {/* Checkboxes items details table */}
                    <table className="w-full border-collapse border border-slate-800 text-[11px] mb-4">
                        <tbody>
                            {Array.from({ length: Math.max(reasonLeft.length, docLeft.length) }).map((_, i) => {
                                const rl = reasonLeft[i], rr = reasonRight[i];
                                const dl = docLeft[i], dr = docRight[i];
                                return (
                                    <tr key={i} className="border-b border-slate-800">
                                        <td className="w-[25%] border-r border-slate-800 p-2">
                                            {rl && <CheckRow label={rl.label} checked={activeReasons.includes(rl.key)} />}
                                        </td>
                                        <td className="w-[25%] border-r border-slate-800 p-2">
                                            {rr && <CheckRow label={rr.label} checked={activeReasons.includes(rr.key)} />}
                                        </td>
                                        <td className="w-[25%] border-r border-slate-800 p-2">
                                            {dl && <CheckRow label={dl.label} checked={activeDocs.includes(dl.key)} />}
                                        </td>
                                        <td className="w-[25%] p-2">
                                            {dr && <CheckRow label={dr.label} checked={activeDocs.includes(dr.key)} />}
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr className="border-t border-slate-800">
                                <td className="bg-slate-100 font-bold border-r border-slate-800 p-2">Reason Remark</td>
                                <td className="border-r border-slate-800 p-2" colSpan={1}>
                                    <span className="text-slate-800 font-semibold">{data.reason_remark || "—"}</span>
                                </td>
                                <td className="bg-slate-100 font-bold border-r border-slate-800 p-2">Doc Remark</td>
                                <td className="p-2">
                                    <span className="text-slate-800 font-semibold">{data.doc_remark || "—"}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Section Titles */}
                    <table className="w-full border-collapse border border-slate-800 text-xs mb-0">
                        <thead>
                            <tr className="bg-slate-900 text-amber-500 font-bold">
                                <th className="w-1/4 text-center p-1.5 border-r border-slate-800 uppercase tracking-wider">Before</th>
                                <th className="w-1/4 text-center p-1.5 border-r border-slate-800 uppercase tracking-wider">After</th>
                                <th className="w-1/2 text-center p-1.5 uppercase tracking-wider">Approval Details</th>
                            </tr>
                        </thead>
                    </table>

                    {/* Before/After/Signatures table */}
                    <table className="w-full border-collapse border border-slate-800 text-[11px] mb-4">
                        <thead>
                            <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-800">
                                <th className="w-1/4 border-r border-slate-800 p-1"></th>
                                <th className="w-1/4 border-r border-slate-800 p-1"></th>
                                <th className="w-[12%] border-r border-slate-800 p-1.5 text-center">Department</th>
                                <th className="w-[23%] border-r border-slate-800 p-1.5 text-left">Remarks</th>
                                <th className="w-[15%] p-1.5 text-center">Status / Sign</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredApprovals.map((item: any, i: number) => (
                                <tr key={i} className="border-b border-slate-800">
                                    {i === 0 && (
                                        <>
                                            <td className="w-1/4 border-r border-slate-800 p-3 align-top whitespace-pre-wrap max-h-96 text-slate-700 bg-slate-50/20" rowSpan={filteredApprovals.length}>
                                                {data.before_text || "N/A"}
                                            </td>
                                            <td className="w-1/4 border-r border-slate-800 p-3 align-top whitespace-pre-wrap max-h-96 text-slate-700 bg-slate-50/20" rowSpan={filteredApprovals.length}>
                                                {data.after_text || "N/A"}
                                            </td>
                                        </>
                                    )}
                                    <td className="w-[12%] border-r border-slate-800 p-2 text-center align-middle font-bold uppercase">
                                        {item.department}
                                        <span className="block text-[9px] font-normal text-slate-500 mt-0.5">{item.name || "—"}</span>
                                    </td>
                                    <td className="w-[23%] border-r border-slate-800 p-2 text-left align-top space-y-1">
                                        {item.history?.map((h: any, idx: number) => (
                                            <div key={idx} className="mb-1 p-1 bg-slate-100 border-l border-slate-800 text-[10px]">
                                                <div className="flex justify-between items-center text-[9px] text-slate-500 mb-0.5 font-semibold">
                                                    <span>{h.status === "1" ? "APPROVED" : "ON HOLD"}</span>
                                                    <span>{formatDate(h.created_at)}</span>
                                                </div>
                                                <p className="leading-tight text-slate-700">{h.remark}</p>
                                            </div>
                                        ))}
                                        {!item.history?.length && item.remark && (
                                            <p className="leading-tight text-slate-700">{item.remark}</p>
                                        )}
                                        {!item.remark && !item.history?.length && (
                                            <span className="text-slate-400 italic text-[10px]">No remarks</span>
                                        )}
                                    </td>
                                    <td className="w-[15%] p-2 text-center align-middle">
                                        {item.status === "1" ? (
                                            <div className="space-y-0.5">
                                                <span className="inline-block bg-blue-600 text-white font-bold px-2 py-0.5 rounded-[3px] text-[10px]">APPROVED</span>
                                                <div className="text-[9px] text-slate-500">{formatDate(item.last_updated)}</div>
                                            </div>
                                        ) : item.status === "0" || item.status === "2" ? (
                                            <div className="space-y-0.5">
                                                <span className="inline-block bg-rose-600 text-white font-bold px-2 py-0.5 rounded-[3px] text-[10px]">ON HOLD</span>
                                                <div className="text-[9px] text-slate-500">{formatDate(item.last_updated)}</div>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic text-[10px]">Pending</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Footer Heads boxes */}
                    <div className="border-t-2 border-slate-900 grid grid-cols-3 text-[11px] bg-white">
                        {/* Manufacturing Heads block */}
                        <div className="border-r border-slate-800 p-3 space-y-3">
                            {manufacturingHeads.map((head: any, i: number) => {
                                const statusLabel = head?.status === "1" ? "APPROVED" : head?.status === "0" || head?.status === "2" ? "ON HOLD" : "PENDING";
                                return (
                                    <div key={i} className="space-y-1">
                                        <div className="font-bold text-slate-950 uppercase border-b pb-0.5">
                                            Manufacturing Head: {head?.name || "—"}
                                        </div>
                                        <div className="grid grid-cols-5 gap-1">
                                            <span className="font-bold text-[9px] text-slate-500 col-span-1">REMARK:</span>
                                            <span className="col-span-4 font-medium text-slate-800">{head?.remark || "—"}</span>
                                        </div>
                                        <div className="grid grid-cols-5 gap-1">
                                            <span className="font-bold text-[9px] text-slate-500 col-span-1">STATUS:</span>
                                            <div className="col-span-4 flex items-center gap-1.5">
                                                <span className={`px-1 rounded-[2px] font-bold text-[9px] text-white ${head?.status === "1" ? "bg-blue-600" : head?.status === "0" || head?.status === "2" ? "bg-rose-600" : "bg-slate-400"
                                                    }`}>
                                                    {statusLabel}
                                                </span>
                                                <span className="text-[9px] text-slate-500">{formatDate(head?.last_updated)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {manufacturingHeads.length === 0 && (
                                <div className="font-bold text-slate-500 uppercase">Manufacturing Head: Not Assigned</div>
                            )}
                        </div>

                        {/* Quality Head block */}
                        <div className="border-r border-slate-800 p-3 space-y-1">
                            <div className="font-bold text-slate-950 uppercase border-b pb-0.5">
                                Quality Head: {qualityHead?.name || "—"}
                            </div>
                            <div className="grid grid-cols-5 gap-1">
                                <span className="font-bold text-[9px] text-slate-500 col-span-1">REMARK:</span>
                                <span className="col-span-4 font-medium text-slate-800">{qualityHead?.remark || "—"}</span>
                            </div>
                            <div className="grid grid-cols-5 gap-1">
                                <span className="font-bold text-[9px] text-slate-500 col-span-1">STATUS:</span>
                                <div className="col-span-4 flex items-center gap-1.5">
                                    <span className={`px-1 rounded-[2px] font-bold text-[9px] text-white ${qualityHead?.status === "1" ? "bg-blue-600" : qualityHead?.status === "0" || qualityHead?.status === "2" ? "bg-rose-600" : "bg-slate-400"
                                        }`}>
                                        {qualityHead?.status === "1" ? "APPROVED" : qualityHead?.status === "0" || qualityHead?.status === "2" ? "ON HOLD" : "PENDING"}
                                    </span>
                                    <span className="text-[9px] text-slate-500">{formatDate(qualityHead?.last_updated)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Plant Head block */}
                        <div className="p-3 space-y-1">
                            <div className="font-bold text-slate-950 uppercase border-b pb-0.5">
                                Plant Head: {plantHead?.name || "—"}
                            </div>
                            <div className="grid grid-cols-5 gap-1">
                                <span className="font-bold text-[9px] text-slate-500 col-span-1">REMARK:</span>
                                <span className="col-span-4 font-medium text-slate-800">{plantHead?.remark || "—"}</span>
                            </div>
                            <div className="grid grid-cols-5 gap-1">
                                <span className="font-bold text-[9px] text-slate-500 col-span-1">STATUS:</span>
                                <div className="col-span-4 flex items-center gap-1.5">
                                    <span className={`px-1 rounded-[2px] font-bold text-[9px] text-white ${plantHead?.status === "1" ? "bg-blue-600" : plantHead?.status === "0" || plantHead?.status === "2" ? "bg-rose-600" : "bg-slate-400"
                                        }`}>
                                        {plantHead?.status === "1" ? "APPROVED" : plantHead?.status === "0" || plantHead?.status === "2" ? "ON HOLD" : "PENDING"}
                                    </span>
                                    <span className="text-[9px] text-slate-500">{formatDate(plantHead?.last_updated)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
