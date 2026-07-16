import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-slate-500">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
