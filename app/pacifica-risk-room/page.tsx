import { Suspense } from "react";
import PacificaRiskRoomPage from "@/components/PacificaRiskRoom/PacificaRiskRoomPage";
import { siteMetadataBase } from "@/lib/siteVariant";

export const metadata = {
  metadataBase: siteMetadataBase,
  title: {
    absolute: "Pacifica Risk Room",
  },
  description:
    "Real-time risk, funding, liquidation, and account replay intelligence for Pacifica perpetuals.",
  openGraph: {
    title: "Pacifica Risk Room",
    description:
      "Real-time risk, funding, liquidation, and account replay intelligence for Pacifica perpetuals.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pacifica Risk Room",
    description:
      "Real-time risk, funding, liquidation, and account replay intelligence for Pacifica perpetuals.",
  },
};

export default function PacificaRiskRoom() {
  return (
    <Suspense fallback={null}>
      <PacificaRiskRoomPage />
    </Suspense>
  );
}
