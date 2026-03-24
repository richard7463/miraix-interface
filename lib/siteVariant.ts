export const TODAYS_ORDERS_VARIANT = "todays-orders";

export const isTodaysOrdersVariant =
  process.env.NEXT_PUBLIC_SITE_VARIANT === TODAYS_ORDERS_VARIANT;

export const siteMetadataBase = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"),
);
