import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <Card className="border-0 shadow-elevated">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
          <ShieldX className="h-7 w-7 text-red-600" />
        </div>
        <CardTitle className="text-2xl">Access denied</CardTitle>
        <CardDescription>
          You don&apos;t have permission to access this resource. Contact your administrator if you believe this is an error.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Link href="/dashboard">
          <Button variant="outline" className="w-full">Return to dashboard</Button>
        </Link>
        <Link href="/login">
          <Button variant="ghost" className="w-full">Sign in with a different account</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
