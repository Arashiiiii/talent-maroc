"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function NavbarAuth() {
  const [user, setUser] = useState<any>(undefined); // undefined = loading

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getUser().then(({ data: { user } }) => setUser(user ?? null));
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Still loading — render nothing to avoid layout shift
  if (user === undefined) return null;

  if (!user) {
    return (
      <a href="/auth/login"
        style={{ color:"#6d28d9", textDecoration:"none", fontSize:13, fontWeight:600, padding:"7px 13px", borderRadius:9, transition:"all .18s", border:"1.5px solid #ddd6fe", background:"#f5f3ff" }}
        className="hide-sm">
        Connexion
      </a>
    );
  }

  const initial = (user.user_metadata?.name || user.email || "?").charAt(0).toUpperCase();
  const isEmployer = user.user_metadata?.role === "employer";

  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <a href={isEmployer ? "/employeur/dashboard" : "/dashboard"}
        style={{ display:"flex", alignItems:"center", justifyContent:"center", width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#5b21b6)", fontSize:13, fontWeight:700, color:"white", textDecoration:"none", boxShadow:"0 2px 8px rgba(124,58,237,0.35)" }}
        title={user.email}>
        {initial}
      </a>
      <button
        onClick={() => { getSupabase().auth.signOut(); setUser(null); }}
        style={{ background:"none", border:"1.5px solid #e5e7eb", borderRadius:8, padding:"5px 11px", fontSize:12, fontWeight:600, color:"#374151", cursor:"pointer", fontFamily:"inherit" }}
        className="hide-sm">
        Déconnexion
      </button>
    </div>
  );
}
