"use client";
import { useEffect, useRef, useState } from "react";
import { DodoPayments } from "dodopayments-checkout";

const DODO_PRO_RECRUTEUR_PRODUCT = "pdt_0NeCdQ3yRgmRCI1tfsHJj";

export default function ProRecruteurButton() {
  const [loading,  setLoading]  = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [polling,  setPolling]  = useState(false);
  const [error,    setError]    = useState<string|null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>|null>(null);

  useEffect(() => {
    DodoPayments.Initialize({
      mode: "test",
      displayType: "inline",
      onEvent: (event: any) => {
        if (event.name === "checkout.pay_button_clicked") {
          setPolling(true);
        }
      },
    });
  }, []);

  const startPolling = (paymentId: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/dodo/check-payment?payment_id=${paymentId}`);
        const { status } = await res.json();
        if (status === "succeeded") {
          clearInterval(intervalRef.current!);
          setPolling(false);
          setShowForm(false);
          window.location.href = "/employeur/dashboard?upgrade=success";
        }
      } catch { /* continue */ }
    }, 2000);
    setTimeout(() => { clearInterval(intervalRef.current!); setPolling(false); }, 600_000);
  };

  const openCheckout = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/dodo/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: DODO_PRO_RECRUTEUR_PRODUCT }),
      });
      if (!res.ok) throw new Error("Session impossible");
      const { paymentLink, paymentId } = await res.json();
      setShowForm(true);
      setTimeout(() => {
        DodoPayments.Checkout.open({ checkoutUrl: paymentLink, elementId: "dodo-pro-recruteur" });
        startPolling(paymentId);
      }, 150);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (showForm) return (
    <div style={{ border:"1.5px solid #ede9fe", borderRadius:12, overflow:"hidden" }}>
      {polling ? (
        <div style={{ padding:32, textAlign:"center" }}>
          <div style={{ width:32, height:32, border:"3px solid #ede9fe", borderTopColor:"#7c3aed", borderRadius:"50%", margin:"0 auto 12px" }}/>
          <div style={{ fontSize:13, color:"#7c3aed", fontWeight:700 }}>Confirmation du paiement…</div>
        </div>
      ) : (
        <div id="dodo-pro-recruteur" style={{ minHeight:380 }}/>
      )}
    </div>
  );

  return (
    <>
      <button
        onClick={openCheckout}
        disabled={loading}
        style={{ display:"block", width:"100%", background:"linear-gradient(135deg,#7c3aed,#4f46e5)", color:"white", padding:"12px", borderRadius:10, textAlign:"center", fontWeight:700, fontSize:13, border:"none", cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", transition:"all .2s" }}>
        {loading ? "Chargement…" : "Démarrer Pro Recruteur →"}
      </button>
      {error && <div style={{ fontSize:12, color:"#dc2626", marginTop:6, textAlign:"center" }}>⚠ {error}</div>}
    </>
  );
}
