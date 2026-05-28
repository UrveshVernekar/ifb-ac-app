// app/(auth)/register/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Factory } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
    return (
        <Card className="w-full max-w-md bg-card border-border">
            <CardHeader className="space-y-1 flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <Factory className="w-9 h-9 text-foreground" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">Create account</CardTitle>
                <CardDescription className="text-muted-foreground">
                    Get started with FactoryOS
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Urvesh Vernekar" className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="urvesh@factoryos.com" className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" className="bg-background border-border" />
                </div>
                <Button className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700">
                    Create Account
                </Button>
                <p className="text-center text-sm text-zinc-500">
                    Already have an account?{' '}
                    <Link href="/login" className="text-blue-500 hover:underline">
                        Sign in
                    </Link>
                </p>
            </CardContent>
        </Card>
    );
}