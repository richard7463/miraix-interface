import { TodaysOrdersLanding } from "@/components/TodaysOrders/TodaysOrdersLanding";
import { siteMetadataBase } from "@/lib/siteVariant";

export const metadata = {
  metadataBase: siteMetadataBase,
  title: {
    absolute: "Today's Orders",
  },
  description:
    "A standalone onchain command system that compresses wallet intelligence into one approved daily order, one forbidden order, and one receipt-backed debrief.",
  openGraph: {
    title: "Today's Orders",
    description:
      "A standalone onchain command system that compresses wallet intelligence into one approved daily order, one forbidden order, and one receipt-backed debrief.",
    images: ["/onchain-war-room/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Today's Orders",
    description:
      "A standalone onchain command system that compresses wallet intelligence into one approved daily order, one forbidden order, and one receipt-backed debrief.",
    images: ["/onchain-war-room/opengraph-image"],
  },
};

export default function OnchainWarRoomPage() {
  return <TodaysOrdersLanding />;
}
