"use client";

import { useEffect } from "react";
import type { AnalyticsEventName } from "@/lib/analytics";
import { trackEvent } from "@/lib/analytics";

type TrackViewProps = {
  event: AnalyticsEventName;
  params?: Record<string, string | number | boolean | undefined>;
};

export function TrackView({ event, params }: TrackViewProps) {
  useEffect(() => {
    trackEvent(event, params);
  }, [event, params]);

  return null;
}
