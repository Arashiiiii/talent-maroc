"use client";

const CHECKOUT_URL =
  "https://test.checkout.dodopayments.com/buy/pdt_0NeCdQ3yRgmRCI1tfsHJj?quantity=1&redirect_url=https%3A%2F%2Ftalentmaroc.shop%2Fsuccess%3Ftype%3Drecruteur";

export default function ProRecruteurButton() {
  return (
    <a
      href={CHECKOUT_URL}
      style={{
        display: "block", width: "100%", textAlign: "center",
        background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
        color: "white", padding: "12px", borderRadius: 10,
        fontWeight: 700, fontSize: 13, textDecoration: "none",
        fontFamily: "inherit", transition: "all .2s",
        boxShadow: "0 4px 14px rgba(124,58,237,.3)",
      }}>
      Démarrer Pro Recruteur →
    </a>
  );
}
