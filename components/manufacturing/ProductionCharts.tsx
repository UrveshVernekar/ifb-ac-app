// components/manufacturing/ProductionCharts.tsx
'use client';

import ReactECharts from 'echarts-for-react';
import * as React from 'react';
import { Card } from '@/components/ui/card';
import { useTheme } from 'next-themes';

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

    if (!data) return null;

    const option = {
        backgroundColor: 'transparent',
        title: {
            text: title,
            left: 'center',
            textStyle: {
                color: isDark ? '#fff' : '#000',
                fontSize: 14,
                fontWeight: '600'
            }
        },
        tooltip: {
            trigger: 'axis',
            backgroundColor: isDark ? '#18181b' : '#fff',
            borderColor: isDark ? '#3f3f46' : '#e4e4e7',
            textStyle: { color: isDark ? '#fff' : '#000' },
            axisPointer: { type: 'shadow' }
        },
        legend: {
            data: data.seriesData?.map((s: any) => s.name),
            bottom: 0,
            textStyle: { color: isDark ? '#a1a1aa' : '#71717a' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: data.xAxisLabels,
            axisLine: { lineStyle: { color: isDark ? '#3f3f46' : '#e4e4e7' } },
            axisLabel: { color: isDark ? '#a1a1aa' : '#71717a' }
        },
        yAxis: data.yAxisSeries?.map((y: any, idx: number) => ({
            type: 'value',
            name: y.name,
            position: idx === 0 ? 'left' : 'right',
            splitLine: { lineStyle: { color: isDark ? '#27272a' : '#f4f4f5' } },
            axisLabel: { 
                color: isDark ? '#a1a1aa' : '#71717a',
                formatter: `{value}${y.formatter}`
            }
        })),
        series: data.seriesData?.map((s: any) => ({
            name: s.name,
            type: s.type,
            yAxisIndex: s.yAxisIndex,
            data: s.data,
            itemStyle: {
                color: s.name === 'Performance' ? '#10b981' : (s.name === 'Average Cycletime' ? '#3b82f6' : '#ef4444')
            },
            smooth: true,
            barWidth: '30%'
        }))
    };

    return (
        <Card className={className}>
            <ReactECharts option={option} style={{ height: '350px' }} />
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

    if (!data || !data.data) return null;

    const option = {
        backgroundColor: 'transparent',
        legend: {
            bottom: 0,
            textStyle: { color: isDark ? '#a1a1aa' : '#71717a' }
        },
        tooltip: {
            trigger: 'axis',
            backgroundColor: isDark ? '#18181b' : '#fff',
            borderColor: isDark ? '#3f3f46' : '#e4e4e7',
            textStyle: { color: isDark ? '#fff' : '#000' }
        },
        dataset: {
            source: data.data
        },
        xAxis: { 
            type: 'category',
            axisLine: { lineStyle: { color: isDark ? '#3f3f46' : '#e4e4e7' } },
            axisLabel: { color: isDark ? '#a1a1aa' : '#71717a' }
        },
        yAxis: { 
            splitLine: { lineStyle: { color: isDark ? '#27272a' : '#f4f4f5' } },
            axisLabel: { color: isDark ? '#a1a1aa' : '#71717a' }
        },
        series: [
            { type: 'bar', itemStyle: { color: '#10b981' } },
            { type: 'bar', itemStyle: { color: '#3b82f6' } },
            { type: 'bar', itemStyle: { color: '#f59e0b' } },
            { type: 'bar', itemStyle: { color: '#6366f1' } }
        ]
    };

    return (
        <Card className={className}>
            <div className="p-4">
                <h3 className="text-sm font-semibold mb-4">{title}</h3>
                <ReactECharts option={option} style={{ height: '300px' }} />
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

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: isDark ? '#18181b' : '#fff',
            borderColor: isDark ? '#3f3f46' : '#e4e4e7',
            textStyle: { color: isDark ? '#fff' : '#000' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '3%',
            containLabel: true
        },
        xAxis: { 
            type: 'value',
            splitLine: { lineStyle: { color: isDark ? '#27272a' : '#f4f4f5' } },
            axisLabel: { color: isDark ? '#a1a1aa' : '#71717a' }
        },
        yAxis: { 
            type: 'category',
            data: data.map((d: any) => d.name),
            axisLine: { lineStyle: { color: isDark ? '#3f3f46' : '#e4e4e7' } },
            axisLabel: { 
                color: isDark ? '#a1a1aa' : '#71717a',
                fontSize: 10,
                width: 100,
                overflow: 'truncate'
            }
        },
        series: [{
            type: 'bar',
            data: data.map((d: any) => d.value),
            itemStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 1, y2: 0,
                    colorStops: [
                        { offset: 0, color: '#f87171' },
                        { offset: 1, color: '#ef4444' }
                    ]
                },
                borderRadius: [0, 4, 4, 0]
            },
            label: {
                show: true,
                position: 'right',
                color: isDark ? '#fff' : '#000',
                fontSize: 10
            }
        }]
    };

    return (
        <Card className={className}>
            <div className="p-4">
                <h3 className="text-sm font-semibold mb-4">{title}</h3>
                <ReactECharts option={option} style={{ height: '300px' }} />
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

    const option = {
        backgroundColor: 'transparent',
        series: [
            {
                type: 'gauge',
                startAngle: 180,
                endAngle: 0,
                center: ['50%', '75%'],
                radius: '110%',
                min: 0,
                max: 100,
                progress: {
                    show: true,
                    width: 18,
                    itemStyle: {
                        color: value >= target ? '#10b981' : '#f59e0b'
                    }
                },
                pointer: { show: false },
                axisLine: {
                    lineStyle: {
                        width: 18,
                        color: [[1, isDark ? '#27272a' : '#f4f4f5']]
                    }
                },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: { show: false },
                anchor: { show: false },
                title: { show: false },
                detail: {
                    valueAnimation: true,
                    width: '60%',
                    lineHeight: 40,
                    borderRadius: 8,
                    offsetCenter: [0, '-15%'],
                    fontSize: 28,
                    fontWeight: 'bolder',
                    formatter: '{value}%',
                    color: isDark ? '#fff' : '#000'
                },
                data: [{ value }]
            }
        ]
    };

    return (
        <Card className={className}>
            <div className="p-4 flex flex-col items-center">
                <h3 className="text-sm font-semibold mb-2">Overall Equipment Effectiveness (OEE)</h3>
                <div className="w-full h-[180px]">
                    <ReactECharts option={option} style={{ height: '220px', marginTop: '-40px' }} />
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
