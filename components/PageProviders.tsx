"use client";

import { useEffect, useState } from "react";
import { Header } from "./Header";
import { PaymentModal } from "./PaymentModal";
import { PRICING_TIERS } from "@/data/content";

export function PageProviders() {
  const [paymentPlan, setPaymentPlan] = useState<{ id: string; name: string; price: string } | null>(null);

  // Listen for payment trigger events
  useEffect(() => {
    const handler = (e: Event) => {
      const { planId, planName, planPrice } = (e as CustomEvent).detail;
      setPaymentPlan({ id: planId, name: planName, price: planPrice });
    };
    window.addEventListener("lifeos-open-payment", handler);
    return () => window.removeEventListener("lifeos-open-payment", handler);
  }, []);

  return (
    <>
      <Header />
      {paymentPlan && (
        <PaymentModal
          planId={paymentPlan.id}
          planName={paymentPlan.name}
          planPrice={paymentPlan.price}
          onClose={() => setPaymentPlan(null)}
        />
      )}
    </>
  );
}
