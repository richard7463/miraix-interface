"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { TODAYS_ORDERS_VARIANT } from "@/lib/siteVariant";

export function ConditionalHeader() {
  const pathname = usePathname();
  const isTodaysOrdersStandalone =
    process.env.NEXT_PUBLIC_SITE_VARIANT === TODAYS_ORDERS_VARIANT;

  if (isTodaysOrdersStandalone || pathname?.startsWith("/onchain-war-room")) {
    return null;
  }

  return <Header />;
}
