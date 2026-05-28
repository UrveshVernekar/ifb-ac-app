// components/manufacturing/ModelTable.tsx
'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ModelDetail {
    modelCode: string;
    model_description: string;
    modelName: string;
    plan: number;
    production: number;
    backflush: number;
    achieved: string;
}

interface ModelTableProps {
    data: ModelDetail[];
}

export default function ModelTable({ data }: ModelTableProps) {
    if (!data || data.length === 0) return null;

    return (
        <Card className="overflow-hidden border border-border shadow-sm">
            <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="text-sm font-semibold">Production Details by Model</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                            <th className="px-4 py-3">Model Code / Name</th>
                            <th className="px-4 py-3 text-right">Plan</th>
                            <th className="px-4 py-3 text-right">Actual</th>
                            <th className="px-4 py-3 text-right">Backflush</th>
                            <th className="px-4 py-3 text-right">Achieved</th>
                            <th className="px-4 py-3">Progress</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.map((item, idx) => {
                            const achievedVal = parseFloat(item.achieved);
                            return (
                                <tr key={idx} className="hover:bg-accent/50 transition-colors group">
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-foreground">{item.modelCode}</span>
                                            <span className="text-xs text-muted-foreground truncate max-w-[300px]" title={item.modelName}>
                                                {item.modelName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right font-medium">{item.plan}</td>
                                    <td className="px-4 py-4 text-right font-medium text-blue-500">{item.production}</td>
                                    <td className="px-4 py-4 text-right font-medium text-blue-500">{item.backflush}</td>
                                    <td className={cn(
                                        "px-4 py-4 text-right font-bold",
                                        achievedVal >= 100 ? "text-blue-500" : (achievedVal >= 90 ? "text-amber-500" : "text-red-500")
                                    )}>
                                        {item.achieved}%
                                    </td>
                                    <td className="px-4 py-4 min-w-[120px]">
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-500",
                                                    achievedVal >= 100 ? "bg-blue-500" : (achievedVal >= 90 ? "bg-amber-500" : "bg-red-500")
                                                )}
                                                style={{ width: `${Math.min(achievedVal, 100)}%` }}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
