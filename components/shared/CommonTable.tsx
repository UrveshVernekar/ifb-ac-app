import React, { useState, useMemo, useRef, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Download,
    SlidersHorizontal,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnConfig<T> {
    header: string;
    accessorKey: keyof T | string;
    isFilterable?: boolean;
    isSortable?: boolean;
    className?: string;
    headerClassName?: string;
    cell?: (row: T, index: number) => React.ReactNode;
    hiddenByDefault?: boolean;
}

interface CommonTableProps<T> {
    data: T[];
    columns: ColumnConfig<T>[];
    showColumnVisibility?: boolean;
    enableFiltering?: boolean;
    enableExport?: boolean;
    exportFileName?: string;
    noDataMessage?: string;
    initialPageSize?: number;
    rowClassName?: (row: T) => string;
    showTotal?: boolean;
}

export default function CommonTable<T>({
    data = [],
    columns = [],
    showColumnVisibility = true,
    enableFiltering = false,
    enableExport = false,
    exportFileName = "table_export.csv",
    noDataMessage = "No records found",
    initialPageSize = 10,
    rowClassName,
    showTotal = false,
}: CommonTableProps<T>) {
    // COLUMN VISIBILITY STATE
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(() => {
        const keys = columns
            .filter((col) => !col.hiddenByDefault)
            .map((col) => String(col.accessorKey));
        return new Set(keys);
    });

    const columnsKeyString = useMemo(() => {
        return columns.map((col) => `${String(col.accessorKey)}:${col.hiddenByDefault}`).join(",");
    }, [columns]);

    useEffect(() => {
        const keys = columns
            .filter((col) => !col.hiddenByDefault)
            .map((col) => String(col.accessorKey));
        setVisibleKeys(new Set(keys));
    }, [columnsKeyString]);

    const [showColMenu, setShowColMenu] = useState(false);
    const colMenuRef = useRef<HTMLDivElement>(null);

    // CLOSE COLUMN MENU WHEN CLICKING OUTSIDE
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (colMenuRef.current && !colMenuRef.current.contains(event.target as Node)) {
                setShowColMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleColumn = (key: string) => {
        setVisibleKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                if (next.size > 1) {
                    next.delete(key);
                }
            } else {
                next.add(key);
            }
            return next;
        });
    };

    // FILTER STATE
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

    const handleFilterChange = (key: string, value: string) => {
        setColumnFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
        setCurrentPage(1);
    };

    // SORTING STATE
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: "asc" | "desc";
    } | null>(null);

    const handleSort = (key: string) => {
        setSortConfig((prev) => {
            if (prev?.key === key) {
                if (prev.direction === "asc") {
                    return { key, direction: "desc" };
                }
                return null;
            }
            return { key, direction: "asc" };
        });
    };

    // PAGINATION STATE
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);

    // APPLY FILTERING
    const filteredData = useMemo(() => {
        return data.filter((row) => {
            return Object.entries(columnFilters).every(([key, filterVal]) => {
                if (!filterVal) return true;
                const cellVal = row[key as keyof T];
                return String(cellVal ?? "")
                    .toLowerCase()
                    .includes(filterVal.toLowerCase());
            });
        });
    }, [data, columnFilters]);

    // APPLY SORTING
    const sortedData = useMemo(() => {
        const result = [...filteredData];
        if (!sortConfig) return result;

        return result.sort((a, b) => {
            const valA = a[sortConfig.key as keyof T];
            const valB = b[sortConfig.key as keyof T];

            if (valA === valB) return 0;
            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;

            const numA = Number(valA);
            const numB = Number(valB);
            if (!isNaN(numA) && !isNaN(numB)) {
                return sortConfig.direction === "asc" ? numA - numB : numB - numA;
            }

            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();
            return sortConfig.direction === "asc"
                ? strA.localeCompare(strB)
                : strB.localeCompare(strA);
        });
    }, [filteredData, sortConfig]);

    // APPLY PAGINATION
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize]);

    const totalPages = Math.ceil(sortedData.length / pageSize);

    // VISIBLE COLUMNS CONFIG`
    const visibleColumns = useMemo(() => {
        return columns.filter((col) => visibleKeys.has(String(col.accessorKey)));
    }, [columns, visibleKeys]);

    // CALCULATE COLUMN TOTALS
    const totalRow = useMemo(() => {
        if (!showTotal) return null;

        const totals: Record<string, any> = {};
        visibleColumns.forEach((col, index) => {
            const key = String(col.accessorKey);
            if (index === 0) {
                totals[key] = "TOTAL";
                return;
            }

            // Check if all values in this column are numeric
            const values = sortedData.map((row) => row[col.accessorKey as keyof T]);
            const allNumeric = values.every(
                (v) => v === undefined || v === null || v === "" || !isNaN(Number(v))
            );

            if (allNumeric && values.length > 0) {
                const sum = values.reduce((acc, v) => {
                    const num = Number(v);
                    return acc + (isNaN(num) ? 0 : num);
                }, 0);
                totals[key] = sum;
            } else {
                totals[key] = "";
            }
        });

        return totals;
    }, [sortedData, visibleColumns, showTotal]);

    // Export to Excel-compatible CSV
    const handleExport = () => {
        // BUILD CSV CONTENT
        const headersLine = visibleColumns
            .map((col) => `"${col.header.replace(/"/g, '""')}"`)
            .join(",");

        const rowsLines = sortedData.map((row) => {
            return visibleColumns
                .map((col) => {
                    let cellVal = row[col.accessorKey as keyof T];

                    if (col.cell) {
                        try {
                            const rendered = col.cell(row, 0);
                            if (
                                typeof rendered === "string" ||
                                typeof rendered === "number"
                            ) {
                                cellVal = rendered as any;
                            }
                        } catch (e) {
                            // IGNORE AND USE RAW VAL
                        }
                    }
                    const strVal = cellVal !== null && cellVal !== undefined ? String(cellVal) : "";
                    return `"${strVal.replace(/"/g, '""')}"`;
                })
                .join(",");
        });

        if (showTotal && totalRow) {
            const totalLine = visibleColumns
                .map((col) => {
                    const key = String(col.accessorKey);
                    const val = totalRow[key] !== undefined && totalRow[key] !== null ? String(totalRow[key]) : "";
                    return `"${val.replace(/"/g, '""')}"`;
                })
                .join(",");
            rowsLines.push(totalLine);
        }

        const csvContent = [headersLine, ...rowsLines].join("\n");
        // UTF-8 BOM
        const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", exportFileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4">
            {/* TABLE CONTROLS - TOP BAR */}
            {(enableExport || (columns.length > 0 && showColumnVisibility)) && (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-xs text-muted-foreground font-medium">
                        Showing {sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
                        {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
                    </div>
                    <div className="flex items-center gap-2">
                        {/* COLUMN VISIBILITY DROPDOWN */}
                        {showColumnVisibility && (
                            <div className="relative" ref={colMenuRef}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowColMenu((p) => !p)}
                                    className="h-8 text-xs gap-1.5 border-border/80"
                                >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    Columns
                                </Button>
                                {showColMenu && (
                                    <div className="absolute right-0 mt-1.5 w-48 bg-card border border-border rounded-lg shadow-lg z-50 py-1.5 max-h-64 overflow-y-auto">
                                        <div className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Toggle Columns
                                        </div>
                                        {columns.map((col) => {
                                            const colKey = String(col.accessorKey);
                                            const isVisible = visibleKeys.has(colKey);
                                            return (
                                                <button
                                                    key={colKey}
                                                    onClick={() => toggleColumn(colKey)}
                                                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted/80 flex items-center justify-between transition-colors text-foreground"
                                                >
                                                    <span className="truncate">{col.header}</span>
                                                    {isVisible && <Check className="w-3.5 h-3.5 text-blue-500 shrink-0 ml-2" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* EXPORT BUTTON */}
                        {enableExport && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExport}
                                className="h-8 text-xs gap-1.5 border-border/80 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Export
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* MAIN TABLE CONTAINER */}
            <div className="overflow-x-auto border border-border/40 rounded-xl bg-card shadow-sm w-full">
                <Table>
                    <TableHeader>
                        {/* HEADERS ROW */}
                        <TableRow className="bg-slate-900 dark:bg-slate-950 hover:bg-slate-900 dark:hover:bg-slate-950 border-b border-border/40">
                            {visibleColumns.map((col) => (
                                <TableHead
                                    key={String(col.accessorKey)}
                                    className={cn(
                                        "text-amber-500 font-extrabold uppercase tracking-wider text-xs h-10 align-middle",
                                        col.headerClassName
                                    )}
                                >
                                    <div className="flex items-center gap-1.5 justify-center">
                                        <span>{col.header}</span>
                                        {col.isSortable !== false && (
                                            <button
                                                onClick={() => handleSort(String(col.accessorKey))}
                                                className="text-amber-500/50 hover:text-amber-500 transition-colors"
                                            >
                                                <ArrowUpDown className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>

                        {/* FILTER INPUTS ROW */}
                        {enableFiltering && (
                            <TableRow className="bg-muted/10 border-b border-border/30 hover:bg-muted/10">
                                {visibleColumns.map((col) => (
                                    <TableHead
                                        key={`filter-${String(col.accessorKey)}`}
                                        className="py-1.5 px-2 align-middle text-center"
                                    >
                                        {col.isFilterable !== false ? (
                                            <Input
                                                // placeholder={`Filter ${col.header}...`}
                                                placeholder={`Filter...`}
                                                value={columnFilters[String(col.accessorKey)] || ""}
                                                onChange={(e) =>
                                                    handleFilterChange(String(col.accessorKey), e.target.value)
                                                }
                                                className="h-7 w-full max-w-[150px] mx-auto text-[11px] rounded-md border border-input/60 px-2 bg-background focus-visible:ring-1 focus-visible:ring-blue-500 text-center"
                                            />
                                        ) : null}
                                    </TableHead>
                                ))}
                            </TableRow>
                        )}
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row, rIdx) => (
                                <TableRow
                                    key={rIdx}
                                    className={cn(
                                        "hover:bg-muted/40 transition-colors border-b border-border/30",
                                        rowClassName?.(row)
                                    )}
                                >
                                    {visibleColumns.map((col) => {
                                        const val = col.cell
                                            ? col.cell(row, rIdx)
                                            : (row[col.accessorKey as keyof T] as React.ReactNode);
                                        return (
                                            <TableCell
                                                key={String(col.accessorKey)}
                                                className={cn(
                                                    "text-center text-xs py-3 font-medium",
                                                    col.className
                                                )}
                                            >
                                                {val}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={visibleColumns.length}
                                    className="text-center py-10 text-xs text-muted-foreground font-medium"
                                >
                                    {noDataMessage}
                                </TableCell>
                            </TableRow>
                        )}
                        {showTotal && totalRow && sortedData.length > 0 && (
                            <TableRow className="bg-slate-100 dark:bg-slate-900 border-t-2 border-border/80 font-bold hover:bg-slate-100 dark:hover:bg-slate-900">
                                {visibleColumns.map((col, index) => {
                                    const key = String(col.accessorKey);
                                    return (
                                        <TableCell
                                            key={`total-${key}`}
                                            className={cn(
                                                "text-center text-xs py-3 font-bold text-foreground",
                                                col.className
                                            )}
                                        >
                                            {totalRow[key]}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* PAGINATION CONTROLS FOOTER */}
            {totalPages > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-border/20 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Rows per page:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="h-8 w-16 text-xs bg-background border border-border rounded-md px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-foreground"
                        >
                            {[5, 10, 20, 50, 100].map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-1.5 justify-center sm:justify-end">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs font-semibold px-2">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
