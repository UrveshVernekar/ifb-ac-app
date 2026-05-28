// app/(dashboard)/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
// import Sidebar from '@/components/shared/Sidebar';
import Topbar from '@/components/shared/Topbar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        const auth = localStorage.getItem('isAuthenticated');
        if (!auth) {
            router.replace('/login');
        } else {
            setIsAuthenticated(true);
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                setSidebarCollapsed(true);
            }
        }
    }, [router]);

    // Handle screen size responsiveness on mount and resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setSidebarCollapsed(true);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Automatically collapse sidebar on mobile when route changes
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setSidebarCollapsed(true);
        }
    }, [pathname]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
            <Sidebar
                collapsed={sidebarCollapsed}
                onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar
                    onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
                    collapsed={sidebarCollapsed}
                />

                <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-6 bg-background">
                    {children}
                </main>
            </div>
        </div>
    );
}