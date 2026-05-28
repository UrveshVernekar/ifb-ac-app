// components/manufacturing/StatusCard.tsx
'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUpRight, TrendingUp, Clock, Percent, Target } from 'lucide-react';
import Link from 'next/link';

interface StatusCardProps {
    label: string;
    value: string | number;
    type?: 'text' | 'rate' | 'cycle' | 'count';
    target?: number;
    onClick?: {
        status: boolean;
        url: string;
    };
    className?: string;
}

export default function StatusCard({ label, value, type, target, onClick, className }: StatusCardProps) {
    const isClickable = onClick?.status && onClick?.url;

    const Icon = () => {
        if (label.toLowerCase().includes('oee')) return <Target className="w-4 h-4" />;
        if (type === 'rate') return <Percent className="w-4 h-4" />;
        if (type === 'cycle') return <Clock className="w-4 h-4" />;
        return <TrendingUp className="w-4 h-4" />;
    };

    const content = (
        <Card className={cn(
            "p-5 transition-all duration-300 hover:shadow-lg group relative overflow-hidden",
            isClickable && "cursor-pointer border-blue-500/20 hover:border-blue-500/50",
            className
        )}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />

            <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        isClickable ? "bg-blue-500/10 text-blue-500" : "bg-muted text-muted-foreground"
                    )}>
                        <Icon />
                    </div>
                </div>

                <div className="flex items-baseline gap-2 mt-2">
                    <h3 className="text-2xl font-bold tracking-tight">
                        {value}
                        {type === 'rate' && !String(value).includes('%') && '%'}
                        {type === 'cycle' && 's'}
                    </h3>
                    {isClickable && <ArrowUpRight className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0" />}
                </div>

                {target !== undefined && (
                    <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                            <span>TARGET: {target}%</span>
                            <span>{Math.round((Number(value) / target) * 100)}% ACHIEVED</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    Number(value) >= target ? "bg-blue-500" : "bg-amber-500"
                                )}
                                style={{ width: `${Math.min((Number(value) / target) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );

    if (isClickable) {
        return (
            <Link href={onClick.url} className="block">
                {content}
            </Link>
        );
    }

    return content;
}
