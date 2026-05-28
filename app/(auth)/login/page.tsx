// app/(auth)/login/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Factory } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();

    const handleLogin = () => {
        // Mock authentication
        localStorage.setItem('isAuthenticated', 'true');
        router.push('/manufacturing');
    };

    return (
        <Card className="w-full max-w-md bg-card border-border">
            <CardHeader className="space-y-1 flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <Factory className="w-9 h-9 text-foreground" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">Welcome back</CardTitle>
                <CardDescription className="text-muted-foreground">
                    Sign in to access your manufacturing dashboard
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                    onClick={handleLogin}
                    className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700"
                >
                    Login
                </Button>
                <p className="text-center text-xs text-zinc-500 mt-6">
                    Demo credentials • Click to continue
                </p>
            </CardContent>
        </Card>
    );
}