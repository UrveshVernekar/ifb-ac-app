"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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

    const filtered = data.filter(
        (i) =>
            i.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.remarks.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.type.toLowerCase().includes(searchTerm.toLowerCase()),
    );

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
                                    {filtered.map((item, index) => (
                                        <TableRow
                                            key={item.id}
                                            className="dark:border-gray-700 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <TableCell className="font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                {index + 1}
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
            </div>
        </Card>
    );
}
