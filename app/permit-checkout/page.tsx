import type { Metadata } from "next";
import PermitCheckoutConsole from "@/components/PermitCheckout/PermitCheckoutConsole";

export const metadata: Metadata = {
  title: "Permit Checkout",
  description:
    "Buy one bounded onchain action, issue a temporary permit, run guardrails, and store a receipt.",
};

export default function PermitCheckoutPage() {
  return <PermitCheckoutConsole />;
}
