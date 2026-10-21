import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

const PROJECT_KEY = "phc_nMpDiTKcTtgDM8qtra3CSyaePXDKvLVii7RJTWp7hy7n";
const API_HOST = "https://eu.i.posthog.com";
const SCRIPT_ID = "htp-posthog-sdk";

function isPrivatePath(path: string) {
  return path.startsWith("/quan-tri") || path.startsWith("/tai-khoan");
}

declare global {
  interface Window {
    posthog?: {
      init: (key: string, options: Record<string, unknown>) => void;
      capture: (event: string, properties?: Record<string, unknown>) => void;
      __loaded?: boolean;
      __initialized?: boolean;
      [key: string]: unknown;
    };
  }
}

export function PostHogAnalytics() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined" || isPrivatePath(pathname)) return;

    const existing = window.posthog as (Window["posthog"] & { __initialized?: boolean }) | undefined;
    if (existing?.__initialized) {
      existing.capture("$pageview", { $current_url: window.location.href });
      return;
    }

    // Queue calls until the official PostHog browser SDK finishes loading.
    const w = window as Window & { posthog?: any };
    if (!w.posthog) {
      const ph: any = function (...args: unknown[]) {
        ph.push(...args);
      };
      ph._i = [];
      ph.push = (...args: unknown[]) => ph._i.push(args);
      ph.init = function (key: string, options: Record<string, unknown>, name?: string) {
        const target = name ? (ph[name] = ph[name] || []) : ph;
        target.__initialized = true;
        target._i = target._i || [];
        target._i.push([key, options, name]);
        if (!document.getElementById(SCRIPT_ID)) {
          const script = document.createElement("script");
          script.id = SCRIPT_ID;
          script.async = true;
          script.src = `${API_HOST}/static/array.js`;
          script.onerror = () => console.warn("PostHog SDK failed to load");
          document.head.appendChild(script);
        }
      };
      ph.capture = (...args: unknown[]) => ph.push("capture", ...args);
      w.posthog = ph;
    }

    w.posthog.init(PROJECT_KEY, {
      api_host: API_HOST,
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: true,
      person_profiles: "identified_only",
      disable_session_recording: true,
      before_send: (event: { event?: string; properties?: Record<string, unknown> }) => {
        const url = String(event?.properties?.$current_url ?? "");
        try {
          if (isPrivatePath(new URL(url).pathname)) return null;
        } catch {
          // Keep events without a URL; PostHog can populate the current URL itself.
        }
        return event;
      },
    });
    w.posthog.capture("$pageview", { $current_url: window.location.href });
  }, [pathname]);

  return null;
}
