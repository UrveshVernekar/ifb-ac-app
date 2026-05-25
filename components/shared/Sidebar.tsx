// components/shared/Sidebar.tsx
'use client';

import { Factory, Menu, X, ChevronRight, ChevronLeft, Shield, Calendar, Gauge, Wrench, Users } from 'lucide-react';
import SidebarItem from './SidebarItem';
import SidebarProfile from './SidebarProfile';
import { useState } from 'react';

interface SidebarProps {
    collapsed: boolean;
    onCollapse: () => void;
}

const menuItems = [
    {
        label: 'Manufacturing',
        icon: Factory,
        href: '/manufacturing'
    },
    {
        label: 'Safety',
        icon: Shield,
        href: '/safety'
    },
    {
        label: 'Planning',
        icon: Calendar,
        href: '/planning'
    },
    {
        label: 'Quality',
        icon: Gauge,
        href: '/quality'
    },
    {
        label: 'Maintenance',
        icon: Wrench,
        href: '/maintenance'
    },
    {
        label: 'HR',
        icon: Users,
        href: '/hr'
    },
];

export default function Sidebar({ collapsed, onCollapse }: SidebarProps) {
    return (
        <div className={`h-full bg-background border-r border-border/40 flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'}`}>
            {/* Header */}
            <div className={`flex items-center transition-all duration-300 ${collapsed ? 'p-6 justify-between' : 'p-6 justify-between'}`}>
                <div className="flex items-center gap-3">
                    <div className={`bg-emerald-600 rounded-xl flex-shrink-0 flex items-center justify-center transition-all duration-300 ${collapsed ? 'w-8 h-8' : 'w-9 h-9'}`}>
                        <Factory className={`${collapsed ? 'w-4 h-4' : 'w-5 h-5'} text-foreground`} />
                    </div>
                    {!collapsed && (
                        <div className="transition-opacity duration-300">
                            <p className="font-semibold tracking-tight">FactoryOS</p>
                            <p className="text-xs text-zinc-500 -mt-1">Manufacturing</p>
                        </div>
                    )}
                </div>
                <button
                    onClick={onCollapse}
                    className={`text-muted-foreground hover:text-foreground transition-colors ${collapsed ? 'w-8 h-8 flex items-center justify-center hover:bg-accent rounded-xl' : ''}`}
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                    <SidebarItem
                        key={item.href}
                        icon={item.icon}
                        label={item.label}
                        href={item.href}
                        collapsed={collapsed}
                    />
                ))}
            </div>

            {/* Profile */}
            <SidebarProfile collapsed={collapsed} />
        </div>
    );
}