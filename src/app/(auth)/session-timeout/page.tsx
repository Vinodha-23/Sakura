"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SessionTimeoutPage() {
  const router = useRouter();

  return (
    <Card className="border-0 shadow-elevated">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
          <Clock className="h-7 w-7 text-amber-600" />
        </div>
        <CardTitle className="text-2xl">Session expired</CardTitle>
        <CardDescription>
          Your session ended after 30 minutes of inactivity for security. Sign in again to
          continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button className="w-full" onClick={() => router.push("/login")}>
          <LogIn className="h-4 w-4" />
          Sign in again
        </Button>
        <Link
          href="/forgot-password"
          className="block text-center text-sm text-sakura-600 hover:text-sakura-700"
        >
          Forgot password?
        </Link>
      </CardContent>
    </Card>
  );
}
