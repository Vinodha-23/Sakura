"use client";

import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Password reset uses demo on-screen temp password (no email). */
export default function ResetPasswordPage() {
  return (
    <Card className="border-0 shadow-elevated">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sakura-50">
          <KeyRound className="h-7 w-7 text-sakura-600" />
        </div>
        <CardTitle className="text-2xl">Reset password</CardTitle>
        <CardDescription>
          Sakura does not send reset emails. Use demo forgot-password to generate a temporary
          password on screen, then change it under Profile → Security after signing in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link href="/forgot-password">
          <Button className="w-full">Go to forgot password</Button>
        </Link>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
