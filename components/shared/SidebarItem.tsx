// components/shared/SidebarItem.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
    icon: LucideIcon;
    label: string;
    href: string;
    collapsed: boolean;
}

export default function SidebarItem({ icon: Icon, label, href, collapsed }: SidebarItemProps) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all hover:bg-accent group ${collapsed ? 'p-3 justify-center' : 'px-4 py-3'} ${isActive ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
            {collapsed && (
                <span className="absolute left-full ml-4 px-3 py-2 bg-card border border-border rounded-xl text-xs opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                    {label}
                </span>
            )}
        </Link>
    );
}