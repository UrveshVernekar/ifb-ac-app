"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("urvesh_vernekar@ifbglobal.com");
    const [password, setPassword] = useState("admin123");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Mock authentication timeout
        setTimeout(() => {
            localStorage.setItem("isAuthenticated", "true");
            router.push("/manufacturing");
            setIsSubmitting(false);
        }, 800);
    };

    return (
        <Card className="w-full max-w-md border border-white/60 dark:border-zinc-800 shadow-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl p-2 sm:p-4 rounded-3xl">
            {/* BRAND LOGO */}
            <div className="flex flex-col items-center pt-6 pb-2">
                <div className="relative w-36 h-12 mb-2">
                    <Image
                        src="/images/IFB.png"
                        alt="IFB Logo"
                        fill
                        className="object-contain dark:invert"
                        priority
                    />
                </div>
                <p className="text-[10px] tracking-[4px] uppercase text-zinc-500 dark:text-zinc-400 font-bold">
                    FactoryOS • Manufacturing OS
                </p>
            </div>

            <CardHeader className="text-center pb-3 pt-4">
                <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Sign In</CardTitle>
                <CardDescription className="text-sm mt-1">
                    Demo credentials pre-filled below
                </CardDescription>
            </CardHeader>

            <CardContent className="px-4 sm:px-6 pb-6">
                <form onSubmit={handleLogin} className="space-y-4">
                    {/* Email/ID Field */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-3 w-5 h-5 text-zinc-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@ifbglobal.com"
                                className="w-full pl-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-foreground"
                                disabled={isSubmitting}
                                required
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-3 w-5 h-5 text-zinc-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-11 pr-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-foreground"
                                disabled={isSubmitting}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-5 text-sm font-semibold rounded-2xl mt-4 shadow-lg shadow-blue-500/10 hover:shadow-xl transition-all active:scale-[0.985] bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2 justify-center">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Signing in...
                            </span>
                        ) : (
                            "Sign In"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}