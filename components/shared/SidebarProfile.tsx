// components/shared/SidebarProfile.tsx
'use client';

import { LogOut, Settings, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SidebarProfileProps {
    collapsed: boolean;
}

export default function SidebarProfile({ collapsed }: SidebarProfileProps) {
    return (
        <div className={`border-t border-border transition-all duration-300 ${collapsed ? 'p-2' : 'p-4'}`}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className={`flex items-center gap-3 cursor-pointer hover:bg-accent rounded-xl transition-colors ${collapsed ? 'p-2 justify-center' : 'p-3'}`}>
                        <Avatar className="w-9 h-9 border border-border flex-shrink-0">
                            <AvatarFallback className="bg-emerald-600 text-foreground font-semibold">UV</AvatarFallback>
                        </Avatar>
                        {!collapsed && (
                            <div className="flex-1 min-w-0 transition-opacity duration-300">
                                <p className="font-medium text-sm truncate">Urvesh Vernekar</p>
                                <p className="text-xs text-emerald-500">Admin</p>
                            </div>
                        )}
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                    <DropdownMenuItem className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="cursor-pointer text-red-400 focus:text-red-400"
                        onClick={() => {
                            localStorage.removeItem('isAuthenticated');
                            window.location.href = '/login';
                        }}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}