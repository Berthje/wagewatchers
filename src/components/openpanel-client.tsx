"use client";

import { usePathname } from "next/navigation";
import { OpenPanelComponent } from "@openpanel/nextjs";

// Client wrapper that remounts the OpenPanel SDK on pathname changes
// so `trackScreenViews` picks up app-router navigations.
export default function OpenPanelClient() {
  const pathname = usePathname();

  return (
    <OpenPanelComponent
      key={pathname}
      clientId="2b4449fb-b1c5-4694-9496-bf50048d810f"
      trackScreenViews={true}
      trackAttributes={true}
      trackOutgoingLinks={true}
    />
  );
}
