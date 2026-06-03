// app/(dashboard)/planning/components/PlanTable.tsx
import { useMemo } from "react";
import CommonTable, { ColumnConfig } from "@/components/shared/CommonTable";

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
    const columns = useMemo<ColumnConfig<PlanRow>[]>(() => {
        return headers.map((header, idx) => {
            const headerStr = String(header ?? "").trim();
            const lower = headerStr.toLowerCase();
            let accessorKey = headerStr || `col_${idx}`;
            let className = "";

            if (lower.includes("seq") || idx === 0) {
                accessorKey = "sequence";
                className = "font-semibold";
            } else if (lower.includes("model") || idx === 1) {
                accessorKey = "modelName";
                className = "font-medium text-foreground/90";
            } else {
                className = "font-bold text-blue-600 dark:text-blue-400";
            }

            return {
                header,
                accessorKey,
                className,
                isFilterable: false,
                isSortable: false,
                cell: (row) => {
                    if (accessorKey === "sequence") return row.sequence;
                    if (accessorKey === "modelName") return row.modelName;

                    const val = row[accessorKey as keyof PlanRow] ?? row[headerStr as keyof PlanRow] ?? row["plan"];
                    return val ?? "";
                }
            };
        });
    }, [headers]);

    return (
        <CommonTable
            data={rows}
            columns={columns}
            enableFiltering={false}
            enableExport={false}
            showColumnVisibility={false}
            noDataMessage="No planning items scheduled"
            initialPageSize={10}
        />
    );
}
