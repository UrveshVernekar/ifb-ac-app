// components/manufacturing/ProductionCharts.tsx
'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import {
    ResponsiveContainer,
    ComposedChart,
    BarChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
    Cell,
    PieChart,
    Pie
} from 'recharts';

interface ChartProps {
    data: any;
    title: string;
    className?: string;
}

export function PerformanceTrendChart({ data, title, className }: ChartProps) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        setMounted(true);
    }, []);
    const isDark = mounted && resolvedTheme === 'dark';

    const chartData = React.useMemo(() => {
        if (!data || !data.xAxisLabels) return [];
        return data.xAxisLabels.map((label: string, idx: number) => {
            const row: any = { name: label };
            data.seriesData?.forEach((series: any) => {
                row[series.name] = series.data[idx];
            });
            return row;
        });
    }, [data]);

    if (!data) return null;

    return (
        <Card className={className}>
            <div className="p-4">
                <h3 className="text-sm font-semibold mb-4 text-center text-foreground">{title}</h3>
                <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={chartData} margin={{ top: 25, right: 10, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e4e4e7'} vertical={false} />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 10 }}
                            tickLine={{ stroke: isDark ? '#3f3f46' : '#e4e4e7' }}
                            axisLine={{ stroke: isDark ? '#3f3f46' : '#e4e4e7' }}
                        />
                        {data.yAxisSeries?.map((y: any, idx: number) => (
                            <YAxis
                                key={idx}
                                yAxisId={idx}
                                orientation={idx === 0 ? 'left' : 'right'}
                                tick={{ fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 10 }}
                                tickLine={{ stroke: isDark ? '#3f3f46' : '#e4e4e7' }}
                                axisLine={{ stroke: isDark ? '#3f3f46' : '#e4e4e7' }}
                                tickFormatter={(value) => `${value}${y.formatter || ''}`}
                                label={{
                                    value: y.name,
                                    angle: idx === 0 ? -90 : 90,
                                    position: idx === 0 ? 'insideLeft' : 'insideRight',
                                    offset: 10,
                                    style: { textAnchor: 'middle', fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 10 }
                                }}
                            />
                        ))}
                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDark ? '#18181b' : '#fff',
                                borderColor: isDark ? '#3f3f46' : '#e4e4e7',
                                color: isDark ? '#fff' : '#000',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                            formatter={(value: any, name: any) => {
                                const yConfig = data.yAxisSeries?.find((y: any, idx: number) => {
                                    const matchedSeries = data.seriesData?.find((s: any) => s.name === name);
                                    return matchedSeries?.yAxisIndex === idx;
                                });
                                return [`${value}${yConfig?.formatter || ''}`, name];
                            }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value) => <span className="text-xs font-semibold text-muted-foreground">{value}</span>}
                        />
                        {data.seriesData?.map((s: any) => {
                            const color = s.name === 'Performance' ? '#10b981' : (s.name === 'Average Cycletime' ? '#3b82f6' : '#ef4444');
                            if (s.type === 'bar') {
                                return (
                                    <Bar
                                        key={s.name}
                                        yAxisId={s.yAxisIndex || 0}
                                        dataKey={s.name}
                                        fill={color}
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={30}
                                    />
                                );
                            } else {
                                return (
                                    <Line
                                        key={s.name}
                                        yAxisId={s.yAxisIndex || 0}
                                        type="monotone"
                                        dataKey={s.name}
                                        stroke={color}
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                );
                            }
                        })}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

export function DailyEfficiencyChart({ data, title, className }: ChartProps) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        setMounted(true);
    }, []);
    const isDark = mounted && resolvedTheme === 'dark';

    const chartData = React.useMemo(() => {
        if (!data || !data.data || data.data.length === 0) return [];
        if (Array.isArray(data.data[0])) {
            const headers = data.data[0];
            return data.data.slice(1).map((row: any) => {
                const obj: any = {};
                headers.forEach((h: string, idx: number) => {
                    obj[h] = row[idx];
                });
                return obj;
            });
        }
        return data.data;
    }, [data]);

    const xAxisKey = React.useMemo(() => {
        if (!data || !data.data || data.data.length === 0) return '';
        if (Array.isArray(data.data[0])) {
            return data.data[0][0];
        }
        return Object.keys(data.data[0])[0];
    }, [data]);

    const seriesNames = React.useMemo(() => {
        if (!data || !data.data || data.data.length === 0) return [];
        if (Array.isArray(data.data[0])) {
            return data.data[0].slice(1);
        }
        return Object.keys(data.data[0]).slice(1);
    }, [data]);

    if (!data || !data.data) return null;

    return (
        <Card className={className}>
            <div className="p-4">
                <h3 className="text-sm font-semibold mb-4 text-foreground">{title}</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e4e4e7'} vertical={false} />
                        <XAxis
                            dataKey={xAxisKey}
                            tick={{ fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 10 }}
                            tickLine={{ stroke: isDark ? '#3f3f46' : '#e4e4e7' }}
                            axisLine={{ stroke: isDark ? '#3f3f46' : '#e4e4e7' }}
                        />
                        <YAxis
                            tick={{ fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 10 }}
                            tickLine={{ stroke: isDark ? '#3f3f46' : '#e4e4e7' }}
                            axisLine={{ stroke: isDark ? '#3f3f46' : '#e4e4e7' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDark ? '#18181b' : '#fff',
                                borderColor: isDark ? '#3f3f46' : '#e4e4e7',
                                color: isDark ? '#fff' : '#000',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value) => <span className="text-xs font-semibold text-muted-foreground">{value}</span>}
                        />
                        {seriesNames.map((name: string, index: number) => {
                            const colors = ['#10b981', '#3b82f6', '#f59e0b', '#6366f1'];
                            const color = colors[index % colors.length];
                            return (
                                <Bar
                                    key={name}
                                    dataKey={name}
                                    fill={color}
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={30}
                                />
                            );
                        })}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

export function TopDefectsChart({ data, title, className }: ChartProps) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        setMounted(true);
    }, []);
    const isDark = mounted && resolvedTheme === 'dark';

    if (!data) return null;

    return (
        <Card className={className}>
            <div className="p-4">
                <h3 className="text-sm font-semibold mb-4 text-foreground">{title}</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                        layout="vertical"
                        data={data}
                        margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                    >
                        <defs>
                            <linearGradient id="colorDefects" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#f87171" />
                                <stop offset="100%" stopColor="#ef4444" />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e4e4e7'} horizontal={false} />
                        <XAxis
                            type="number"
                            tick={{ fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 10 }}
                            tickLine={{ stroke: isDark ? '#3f3f46' : '#e4e4e7' }}
                            axisLine={{ stroke: isDark ? '#3f3f46' : '#e4e4e7' }}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={100}
                            tick={{ fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 9 }}
                            tickLine={{ stroke: isDark ? '#3f3f46' : '#e4e4e7' }}
                            axisLine={{ stroke: isDark ? '#3f3f46' : '#e4e4e7' }}
                            tickFormatter={(value) => (value && value.length > 15 ? value.substring(0, 15) + '…' : value)}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDark ? '#18181b' : '#fff',
                                borderColor: isDark ? '#3f3f46' : '#e4e4e7',
                                color: isDark ? '#fff' : '#000',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                        />
                        <Bar
                            dataKey="value"
                            fill="url(#colorDefects)"
                            radius={[0, 4, 4, 0]}
                            maxBarSize={20}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

export function OEEGaugeChart({ value, target, className }: { value: number, target: number, className?: string }) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        setMounted(true);
    }, []);
    const isDark = mounted && resolvedTheme === 'dark';

    const chartData = React.useMemo(() => {
        return [
            { value: value, fill: value >= target ? '#10b981' : '#f59e0b' },
            { value: 100 - value, fill: isDark ? '#27272a' : '#f4f4f5' }
        ];
    }, [value, target, isDark]);

    return (
        <Card className={className}>
            <div className="p-4 flex flex-col items-center">
                <h3 className="text-sm font-semibold mb-2 text-foreground">Overall Equipment Effectiveness (OEE)</h3>
                <div className="w-full h-[180px] relative flex items-center justify-center overflow-hidden">
                    <div className="absolute text-center mt-12">
                        <span className="text-3xl font-black text-foreground block">
                            {value}%
                        </span>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart margin={{ top: 0, bottom: 0 }}>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="70%"
                                startAngle={180}
                                endAngle={0}
                                innerRadius={65}
                                outerRadius={85}
                                dataKey="value"
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex gap-4 mt-2">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Target</span>
                        <span className="text-lg font-bold text-blue-500">{target}%</span>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Status</span>
                        <span className={isDark ? "text-lg font-bold text-white" : "text-lg font-bold text-black"}>
                            {value >= target ? 'EXCELLENT' : 'STABLE'}
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    );
}
