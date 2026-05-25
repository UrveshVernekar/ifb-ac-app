// components/shared/Topbar.tsx
'use client';

import { Bell, Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import ProfileDropdown from './ProfileDropdown';

interface TopbarProps {
    onToggleSidebar: () => void;
    collapsed: boolean;
}

export default function Topbar({ onToggleSidebar, collapsed }: TopbarProps) {
    return (
        <header className="h-16 border-b border-border/40 bg-background px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    onClick={onToggleSidebar}
                    className="lg:hidden text-muted-foreground hover:text-foreground"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div className="text-sm text-muted-foreground">
                    {collapsed ? 'FactoryOS' : 'Manufacturing Operations Platform'}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <ThemeToggle />

                <button className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                <ProfileDropdown />
            </div>
        </header>
    );
}