// app/(dashboard)/planning/components/PlanTable.tsx
import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface PlanRow {
    sequence: number | string;
    modelName: string;
    plan: number | string;
    [key: string]: string | number;
}

interface PlanTableProps {
    headers: string[];
    rows: PlanRow[];
}

export default function PlanTable({ headers = [], rows = [] }: PlanTableProps) {
    return (
        <div className="overflow-x-auto border border-border/40 rounded-xl bg-card shadow-sm w-full">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-900 dark:bg-slate-950 hover:bg-slate-900 dark:hover:bg-slate-950 border-b border-border/40">
                        {headers.map((header, idx) => (
                            <TableHead 
                                key={idx} 
                                className="text-amber-500 font-extrabold text-center uppercase tracking-wider text-xs h-10"
                            >
                                {header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.length > 0 ? (
                        rows.map((row, rIdx) => (
                            <TableRow key={row?.sequence ?? rIdx} className="hover:bg-muted/40 transition-colors border-b border-border/30">
                                <TableCell className="text-center font-semibold text-xs py-3">{row?.sequence}</TableCell>
                                <TableCell className="text-center font-medium text-xs py-3 text-foreground/90">{row?.modelName}</TableCell>
                                <TableCell className="text-center font-bold text-xs py-3 text-blue-600 dark:text-blue-400">{row?.plan}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={headers.length || 3} className="text-center py-8 text-xs text-muted-foreground">
                                No planning items scheduled
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
