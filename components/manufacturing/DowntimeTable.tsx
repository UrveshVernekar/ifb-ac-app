"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export interface DowntimeItem {
    id: number;
    date: string;
    time: string;
    duration: string;
    line: string;
    type: string;
    reason: string;
    remarks: string;
    person_incharge: string;
}

interface Props {
    data: DowntimeItem[];
}

export default function DowntimeTable({ data }: Props) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const filtered = data.filter(
        (i) =>
            i.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.remarks.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.type.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filtered.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

    const totalDowntime = filtered.reduce((total, item) => {
        const match = item.duration.match(/\d+/);
        return match ? total + parseInt(match[0], 10) : total;
    }, 0);

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const day = String(date.getDate()).padStart(2, "0");
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    };

    return (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mt-6">
            <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <CardTitle className="text-gray-900 font-bold text-2xl dark:text-white">
                            DOWNTIME LOGS
                        </CardTitle>
                    </div>

                    <Input
                        placeholder="Search reason, remarks, or type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-80 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    />
                </div>
            </CardHeader>

            <div className="p-6 pt-0">
                <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="dark:border-gray-700">
                                <TableHead className="text-gray-900 dark:text-gray-100">S.No</TableHead>
                                <TableHead className="text-gray-900 dark:text-gray-100">Date</TableHead>
                                <TableHead className="text-gray-900 dark:text-gray-100">Time</TableHead>
                                <TableHead className="text-gray-900 dark:text-gray-100">Duration</TableHead>
                                <TableHead className="text-gray-900 dark:text-gray-100">Line</TableHead>
                                <TableHead className="text-gray-900 dark:text-gray-100">Type</TableHead>
                                <TableHead className="text-gray-900 dark:text-gray-100">Reason</TableHead>
                                <TableHead className="text-gray-900 dark:text-gray-100">Remarks</TableHead>
                                <TableHead className="text-gray-900 dark:text-gray-100">Person In-charge</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length > 0 ? (
                                <>
                                    {paginatedData.map((item, index) => (
                                        <TableRow
                                            key={item.id}
                                            className="dark:border-gray-700 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <TableCell className="font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                {startIndex + index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                {formatDate(item.date)}
                                            </TableCell>
                                            <TableCell className="text-gray-900 dark:text-white whitespace-nowrap">
                                                {item.time}
                                            </TableCell>
                                            <TableCell className="font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                                                {item.duration}
                                            </TableCell>
                                            <TableCell className="text-gray-900 dark:text-white whitespace-nowrap">
                                                {item.line}
                                            </TableCell>
                                            <TableCell className="text-gray-900 dark:text-white whitespace-nowrap">
                                                <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-800 border-none">
                                                    {item.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-900 dark:text-white whitespace-nowrap">
                                                {item.reason}
                                            </TableCell>
                                            <TableCell className="text-gray-900 dark:text-white max-w-md truncate" title={item.remarks}>
                                                {item.remarks}
                                            </TableCell>
                                            <TableCell className="text-gray-900 dark:text-white max-w-md truncate">
                                                {item.person_incharge}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-gray-100 dark:bg-gray-800/80 font-bold hover:bg-gray-100 dark:hover:bg-gray-800/80">
                                        <TableCell colSpan={3} className="text-right text-gray-900 dark:text-white">
                                            Total Downtime
                                        </TableCell>
                                        <TableCell className="text-red-600 dark:text-red-400">
                                            {totalDowntime} mins
                                        </TableCell>
                                        <TableCell colSpan={4}></TableCell>
                                    </TableRow>
                                </>
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-gray-500 dark:text-gray-400">
                                        No downtime logs found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination UI */}
                {filtered.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Showing {filtered.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, filtered.length)} of {filtered.length} entries
                        </span>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Rows per page:</span>
                                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                                    <SelectTrigger className="w-16 h-8 text-xs bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                                        <SelectValue placeholder={String(pageSize)} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[5, 10, 20, 50, 100].map((size) => (
                                            <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-xs font-semibold px-2 text-gray-900 dark:text-white">Page {currentPage} of {totalPages || 1}</span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
