"use client";

import { useState, useTransition } from "react";
import { signIn, signUp, signInAsDemoPatient } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HeartPulse, Lock, Mail, User, Sparkles, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFormSubmit = async (formData: FormData) => {
    setError(null);
    setSuccessMessage(null);
    startTransition(async () => {
      const action = mode === "signin" ? signIn : signUp;
      const result = await action(null, formData);
      if (result && "error" in result && result.error) {
        setError(result.error);
      } else if (result && "message" in result && result.message) {
        setSuccessMessage(result.message as string);
      }
    });
  };

  const handleDemoLogin = () => {
    setError(null);
    setSuccessMessage(null);
    startTransition(async () => {
      const result = await signInAsDemoPatient();
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 via-teal-50/20 to-white px-4 py-12 sm:px-6 lg:px-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 group mb-2">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 p-1.5 group-hover:scale-105 transition-transform dark:bg-slate-800 dark:ring-slate-700">
              <Image
                src="/careflowlogo.png"
                alt="CareFollow Logo"
                width={48}
                height={48}
                className="h-full w-full object-contain rounded-xl"
                priority
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            CareFlow
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Secure Patient Portal for Post-Care Actions & Visits
          </p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-card-hover border-slate-200/90 rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
          <CardHeader className="space-y-3 pb-4 pt-6 px-6 bg-gradient-to-b from-slate-50/60 to-transparent dark:from-slate-800/40">
            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-slate-100/90 p-1 border border-slate-200/60 dark:bg-slate-800 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                  mode === "signin"
                    ? "bg-white text-teal-900 shadow-xs dark:bg-slate-900 dark:text-teal-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                  mode === "signup"
                    ? "bg-white text-teal-900 shadow-xs dark:bg-slate-900 dark:text-teal-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Register Profile
              </button>
            </div>

            <div className="pt-1">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                {mode === "signin" ? "Sign in to Patient Workspace" : "Create Patient Profile"}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {mode === "signin"
                  ? "Access your scheduled appointments, follow-up actions, and reminders."
                  : "Register with your details to access your personal follow-up portal."}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 px-6 pb-6">
            {successMessage && (
              <Alert className="py-2.5 bg-emerald-50 border-emerald-200 text-emerald-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-xs font-medium">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <div className="space-y-2">
                <Alert variant="destructive" className="py-2.5 bg-rose-50 border-rose-200 text-rose-900">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <AlertDescription className="text-xs font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <form action={handleFormSubmit} className="space-y-3.5">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="displayName"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="displayName"
                      name="displayName"
                      type="text"
                      placeholder="e.g. Sarah Jenkins"
                      required
                      className="pl-9.5 h-10 text-xs border-slate-200 focus-visible:ring-teal-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="patient@example.com"
                    required
                    className="pl-9.5 h-10 text-xs border-slate-200 focus-visible:ring-teal-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    placeholder="••••••••"
                    required
                    className="pl-9.5 h-10 text-xs border-slate-200 focus-visible:ring-teal-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full mt-2 font-bold bg-teal-700 hover:bg-teal-800 text-white h-10 text-xs shadow-xs dark:bg-teal-600 dark:hover:bg-teal-700"
              >
                {isPending
                  ? "Authenticating..."
                  : mode === "signin"
                  ? "Sign In to Workspace"
                  : "Create Account"}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2.5 text-slate-400 font-bold tracking-wider dark:bg-slate-900 dark:text-slate-500">
                  Judge & Hackathon Fast Pass
                </span>
              </div>
            </div>

            {/* Quick Demo Login Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleDemoLogin}
              disabled={isPending}
              className="w-full border-teal-200/90 bg-gradient-to-r from-teal-50/80 via-white to-teal-50/60 text-teal-900 hover:bg-teal-100/80 hover:text-teal-950 gap-2 text-xs font-bold h-11 shadow-xs dark:border-teal-800/80 dark:from-teal-950/40 dark:via-slate-900 dark:to-teal-950/30 dark:text-teal-300 dark:hover:bg-slate-800"
            >
              <Sparkles className="h-4 w-4 text-teal-600 flex-shrink-0 dark:text-teal-400" />
              <span className="truncate">{isPending ? "Starting demo session..." : "Quick Sign-In as Demo Patient (Sarah Jenkins)"}</span>
              <ArrowRight className="h-3.5 w-3.5 ml-auto text-teal-600 flex-shrink-0 dark:text-teal-400" />
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col items-center justify-center border-t border-slate-100 bg-slate-50/70 py-3 px-6 text-center dark:border-slate-800 dark:bg-slate-950/80">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
              <span>Administrative follow-up coordinator only. Not for medical emergencies.</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}

