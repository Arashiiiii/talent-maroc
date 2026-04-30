"use client";
import { useEffect, useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

const PADDLE_CLIENT_TOKEN = "test_f6beac788c5a1289b346269ad2a";
const PADDLE_ENV          = "sandbox" as "sandbox" | "production";
const PRO_RECRUTEUR_PRICE = "pri_01kqf9f7gxfhyt04a1prvaq0af";

export default function ProRecruteurButton() {
  const [paddle,  setPaddle]  = useState<Paddle | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializePaddle({ environment: PADDLE_ENV, token: PADDLE_CLIENT_TOKEN })
      .then(p => { if (p) setPaddle(p); });
  }, []);

  const openCheckout = () => {
    if (!paddle) return;
    setLoading(true);
    try {
      paddle.Checkout.open({
        items: [{ priceId: PRO_RECRUTEUR_PRICE, quantity: 1 }],
        settings: {
          displayMode: "overlay",
          theme: "light",
          locale: "fr",
          successUrl: `${window.location.origin}/employeur/dashboard?upgrade=success`,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={openCheckout}
      disabled={loading}
      style={{
        display:"block", width:"100%",
        background: paddle ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "#e5e7eb",
        color: paddle ? "white" : "#9ca3af",
        padding:"12px", borderRadius:10, textAlign:"center",
        fontWeight:700, fontSize:13, border:"none", cursor: paddle ? "pointer" : "default",
        fontFamily:"inherit", transition:"all .2s",
      }}
    >
      {!paddle ? "Chargement…" : loading ? "Ouverture…" : "Démarrer Pro Recruteur →"}
    </button>
  );
}
