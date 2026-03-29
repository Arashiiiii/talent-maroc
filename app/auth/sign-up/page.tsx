import { Suspense } from "react";
import { SignUpForm } from "@/components/sign-up-form";

function SignUpFallback() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-xl border p-6 text-sm text-muted-foreground">
        Chargement...
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <Suspense fallback={<SignUpFallback />}>
        <div className="w-full max-w-md">
          <SignUpForm />
        </div>
      </Suspense>
    </div>
  );
}