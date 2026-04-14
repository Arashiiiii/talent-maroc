// This page exists only to catch the Supabase starter kit redirect.
// The middleware.ts redirects /protected → /dashboard automatically.
// This is a fallback in case middleware doesn't fire.
import { redirect } from "next/navigation";

export default function ProtectedPage() {
  redirect("/dashboard");
}