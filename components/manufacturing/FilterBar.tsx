// components/manufacturing/FilterBar.tsx
'use client';

import { Calendar, Layers, Cpu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FilterBarProps {
    fromDate: string;
    toDate: string;
    area: string;
    machine: string;
    onFromDateChange: (val: string) => void;
    onToDateChange: (val: string) => void;
    onAreaChange: (val: string) => void;
    onMachineChange: (val: string) => void;
    onSearch: () => void;
    loading?: boolean;
}

export default function FilterBar({
    fromDate,
    toDate,
    area,
    machine,
    onFromDateChange,
    onToDateChange,
    onAreaChange,
    onMachineChange,
    onSearch,
    loading
}: FilterBarProps) {
    return (
        <div className="bg-card border border-border rounded-2xl p-4 mb-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5 ml-1">
                        <Calendar className="w-3 h-3" /> From Date
                    </Label>
                    <Input
                        type="date"
                        value={fromDate}
                        onChange={(e) => onFromDateChange(e.target.value)}
                        className="bg-background border-border h-10 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5 ml-1">
                        <Calendar className="w-3 h-3" /> To Date
                    </Label>
                    <Input
                        type="date"
                        value={toDate}
                        onChange={(e) => onToDateChange(e.target.value)}
                        className="bg-background border-border h-10 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5 ml-1">
                        <Layers className="w-3 h-3" /> Production Area
                    </Label>
                    <select
                        value={area}
                        onChange={(e) => onAreaChange(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                        <option value="">Select Area</option>
                        <option value="ASSEMBLY LINES">ASSEMBLY LINES</option>
                    </select>
                </div>

                {area === 'ASSEMBLY LINES' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5 ml-1">
                            <Cpu className="w-3 h-3" /> Machine / Line
                        </Label>
                        <select
                            value={machine}
                            onChange={(e) => onMachineChange(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        >
                            <option value="">Select Machine</option>
                            <option value="IDU-Line">IDU-Line</option>
                            <option value="ODU-Line">ODU-Line</option>
                        </select>
                    </div>
                )}

                <div className={area === 'ASSEMBLY LINES' ? "col-span-1" : "lg:col-span-2"}>
                    <Button
                        onClick={onSearch}
                        disabled={loading}
                        className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-md shadow-blue-500/20"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Loading...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Search className="w-4 h-4" /> Update Dashboard
                            </div>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
