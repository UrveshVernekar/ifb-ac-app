'use client';

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { encryptValue, getApiBaseUrl } from "@/lib/auth-client";

export default function RegisterPage() {
    const router = useRouter();
    const [employeeCode, setEmployeeCode] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side validations
        if (!employeeCode.trim()) {
            toast.error("Employee Code is required");
            return;
        }
        if (!name.trim()) {
            toast.error("Full Name is required");
            return;
        }
        if (!email.trim()) {
            toast.error("Email Address is required");
            return;
        }

        // Password strength checks
        if (password.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }
        if (!/[a-z]/.test(password)) {
            toast.error("Password must contain at least one lowercase letter");
            return;
        }
        if (!/[A-Z]/.test(password)) {
            toast.error("Password must contain at least one uppercase letter");
            return;
        }
        if (!/[0-9]/.test(password)) {
            toast.error("Password must contain at least one number");
            return;
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            toast.error("Password must contain at least one special character");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsSubmitting(true);
        try {
            const apiBase = getApiBaseUrl();
            const res = await fetch(`${apiBase}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.toLowerCase().trim(),
                    name: name.trim(),
                    employeeCode: encryptValue(employeeCode.trim()),
                    password: encryptValue(password),
                }),
            });
            const data = await res.json();

            if (!data?.success) {
                toast.error(data?.message || "Failed to create account. Please try again.");
                return;
            }

            toast.success("Account created successfully! Redirecting...");
            setTimeout(() => {
                router.push("/login");
            }, 1500);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create account. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-md border border-white/60 dark:border-zinc-800 shadow-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl p-2 sm:p-4 rounded-3xl">
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
            </div>

            <CardHeader className="text-center pb-3 pt-4">
                <CardTitle className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                    Create Account
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                    Get started with IFB IIOT Portal (AC Plant)
                </CardDescription>
            </CardHeader>

            <CardContent className="px-4 sm:px-6 pb-6">
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            value={employeeCode}
                            onChange={(e) => setEmployeeCode(e.target.value)}
                            placeholder="Employee Code"
                            className="w-full px-4 py-2.5 rounded-2xl border bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            disabled={isSubmitting}
                        // required
                        />
                    </div>

                    <div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full Name"
                            className="w-full px-4 py-2.5 rounded-2xl border bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            disabled={isSubmitting}
                        // required
                        />
                    </div>

                    <div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address"
                            className="w-full px-4 py-2.5 rounded-2xl border bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            disabled={isSubmitting}
                        // required
                        />
                    </div>

                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create Password"
                            className="w-full px-4 py-2.5 pr-12 rounded-2xl border bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            disabled={isSubmitting}
                        // required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-4 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm Password"
                            className="w-full px-4 py-2.5 pr-12 rounded-2xl border bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            disabled={isSubmitting}
                        // required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            className="absolute right-4 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                        >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1.5 px-1 bg-zinc-50 dark:bg-zinc-950/50 p-2.5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <p className="font-semibold text-[10px] uppercase tracking-wider text-zinc-400">Password requirements:</p>
                        <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
                            <li className={`flex items-center gap-1 ${password.length >= 8 ? "text-green-600 dark:text-green-400 font-medium" : ""}`}>
                                <span className={password.length >= 8 ? "text-green-600" : "text-zinc-300"}>●</span> Min 8 characters
                            </li>
                            <li className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? "text-green-600 dark:text-green-400 font-medium" : ""}`}>
                                <span className={/[A-Z]/.test(password) ? "text-green-600" : "text-zinc-300"}>●</span> 1 uppercase letter
                            </li>
                            <li className={`flex items-center gap-1 ${/[a-z]/.test(password) ? "text-green-600 dark:text-green-400 font-medium" : ""}`}>
                                <span className={/[a-z]/.test(password) ? "text-green-600" : "text-zinc-300"}>●</span> 1 lowercase letter
                            </li>
                            <li className={`flex items-center gap-1 ${/[0-9]/.test(password) ? "text-green-600 dark:text-green-400 font-medium" : ""}`}>
                                <span className={/[0-9]/.test(password) ? "text-green-600" : "text-zinc-300"}>●</span> 1 number
                            </li>
                            <li className={`flex items-center gap-1 col-span-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-green-600 dark:text-green-400 font-medium" : ""}`}>
                                <span className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-green-600" : "text-zinc-300"}>●</span> 1 special character
                            </li>
                        </ul>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-5 text-sm font-semibold rounded-2xl mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2 justify-center">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating Account...
                            </span>
                        ) : (
                            "Create Account"
                        )}
                    </Button>

                    <p className="text-center text-sm text-zinc-500 pt-2">
                        Already have an account?{' '}
                        <Link href="/login" className="text-blue-600 hover:underline font-medium">
                            Sign in
                        </Link>
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}