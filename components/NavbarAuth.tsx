"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function NavbarAuth() {
  const [user,     setUser]     = useState<any>(undefined);
  const [open,     setOpen]     = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getUser().then(({ data: { user } }) => setUser(user ?? null));
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (user === undefined) return null;

  if (!user) {
    return (
      <div style={{ display:"flex", gap:8 }}>
        <a href="/auth/login"
          style={{ color:"#6d28d9", textDecoration:"none", fontSize:13, fontWeight:600, padding:"7px 13px", borderRadius:9, border:"1.5px solid #ddd6fe", background:"#f5f3ff" }}>
          Connexion
        </a>
        <a href="/auth/register"
          style={{ color:"white", textDecoration:"none", fontSize:13, fontWeight:700, padding:"7px 14px", borderRadius:9, background:"linear-gradient(135deg,#7c3aed,#5b21b6)", boxShadow:"0 2px 8px rgba(124,58,237,.3)" }}
          className="hide-sm">
          Inscription
        </a>
      </div>
    );
  }

  const name       = user.user_metadata?.name || user.email?.split("@")[0] || "?";
  const initial    = name.charAt(0).toUpperCase();
  const photoUrl   = user.user_metadata?.photo_url || null;
  const isEmployer = user.user_metadata?.role === "employer";
  const dashHref   = isEmployer ? "/employeur/dashboard" : "/dashboard";
  const profileHref = isEmployer ? "/employeur/dashboard?tab=profile" : "/dashboard?tab=profile";

  return (
    <div ref={ref} style={{ position:"relative" }}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{ display:"flex", alignItems:"center", gap:8, background:"white", border:"1.5px solid #e5e7eb", borderRadius:100, padding:"4px 10px 4px 4px", cursor:"pointer", fontFamily:"inherit", transition:"all .18s", boxShadow: open?"0 0 0 3px rgba(124,58,237,.15)":"none" }}>
        {/* Avatar */}
        <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#5b21b6)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0 }}>
          {photoUrl
            ? <img src={photoUrl} alt={name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            : <span style={{ fontSize:13, fontWeight:700, color:"white" }}>{initial}</span>}
        </div>
        <span style={{ fontSize:13, fontWeight:600, color:"#0f172a", maxWidth:100, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} className="hide-sm">
          {name}
        </span>
        <span style={{ fontSize:10, color:"#9ca3af", transform:open?"rotate(180deg)":"rotate(0)", transition:"transform .2s" }}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, background:"white", border:"1.5px solid #e5e7eb", borderRadius:12, boxShadow:"0 8px 24px rgba(0,0,0,.12)", minWidth:200, zIndex:200, overflow:"hidden" }}>
          {/* User info header */}
          <div style={{ padding:"12px 16px", borderBottom:"1px solid #f0f0f0", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#5b21b6)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0 }}>
              {photoUrl
                ? <img src={photoUrl} alt={name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                : <span style={{ fontSize:14, fontWeight:700, color:"white" }}>{initial}</span>}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</div>
              <div style={{ fontSize:11, color:"#9ca3af", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.email}</div>
            </div>
          </div>
          {/* Links */}
          <div style={{ padding:"6px" }}>
            <a href={dashHref} onClick={()=>setOpen(false)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, textDecoration:"none", color:"#374151", fontSize:13, fontWeight:600, transition:"background .15s" }}
              onMouseEnter={e=>(e.currentTarget.style.background="#f5f3ff")}
              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
              📊 <span>Mon dashboard</span>
            </a>
            <a href={profileHref} onClick={()=>setOpen(false)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, textDecoration:"none", color:"#374151", fontSize:13, fontWeight:600, transition:"background .15s" }}
              onMouseEnter={e=>(e.currentTarget.style.background="#f5f3ff")}
              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
              👤 <span>Mon profil</span>
            </a>
            <a href="/cv" onClick={()=>setOpen(false)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, textDecoration:"none", color:"#374151", fontSize:13, fontWeight:600, transition:"background .15s" }}
              onMouseEnter={e=>(e.currentTarget.style.background="#f5f3ff")}
              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
              📄 <span>Mon CV</span>
            </a>
            <div style={{ height:1, background:"#f0f0f0", margin:"4px 0" }}/>
            <button
              onClick={()=>{ getSupabase().auth.signOut(); setUser(null); setOpen(false); }}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, width:"100%", background:"none", border:"none", color:"#dc2626", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", textAlign:"left", transition:"background .15s" }}
              onMouseEnter={e=>(e.currentTarget.style.background="#fef2f2")}
              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
              🚪 <span>Déconnexion</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
