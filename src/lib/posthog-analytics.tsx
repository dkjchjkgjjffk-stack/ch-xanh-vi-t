import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

const PROJECT_KEY = "phc_nMpDiTKcTtgDM8qtra3CSyaePXDKvLVii7RJTWp7hy7n";
const API_HOST = "https://eu.i.posthog.com";

function isPrivatePath(path: string) {
  return path.startsWith("/quan-tri") || path.startsWith("/tai-khoan");
}

type PostHogStub = {
  __SV?: number;
  __htpInitialized?: boolean;
  init?: (key: string, options: Record<string, unknown>) => void;
  capture?: (event: string, properties?: Record<string, unknown>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

declare global {
  interface Window {
    posthog?: PostHogStub;
  }
}

function initializePostHog() {
  const w = window as Window & { posthog?: PostHogStub };
  const ph = (w.posthog || []) as PostHogStub;
  if (ph.__htpInitialized) return ph;

  // Follow PostHog's official array.js bootstrap: queue method calls on the
  // array itself and load the SDK from its dedicated assets host.
  if (!ph.__SV) {
    w.posthog = ph;
    ph.__SV = 1;
    ph._i = [];
    ph.init = function (key: string, options: Record<string, unknown>, name?: string) {
      const instance = name ? ((ph[name] = ph[name] || []) as PostHogStub) : ph;
      const methods = "capture identify alias people.set people.set_once people.unset register register_once unregister reset get_distinct_id get_session_id getGroups get_property on off debug".split(" ");
      for (const methodName of methods) {
        const parts = methodName.split(".");
        let target: PostHogStub = instance;
        let method = methodName;
        if (parts.length === 2) {
          target = (instance[parts[0]] = instance[parts[0]] || {}) as PostHogStub;
          method = parts[1];
        }
        if (typeof target[method] !== "function") {
          target[method] = (...args: unknown[]) => instance.push([methodName, ...args]);
        }
      }

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.crossOrigin = "anonymous";
      script.async = true;
      script.src = API_HOST.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js";
      const firstScript = document.getElementsByTagName("script")[0];
      if (firstScript?.parentNode) firstScript.parentNode.insertBefore(script, firstScript);
      else document.head.appendChild(script);

      ph._i.push([key, options, name]);
    };
  }

  ph.init?.(PROJECT_KEY, {
    api_host: API_HOST,
    defaults: "2026-05-30",
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    person_profiles: "identified_only",
    disable_session_recording: true,
    before_send: (event: { properties?: Record<string, unknown> }) => {
      const url = String(event?.properties?.$current_url ?? "");
      try {
        if (isPrivatePath(new URL(url).pathname)) return null;
      } catch {
        // Keep events without a URL; PostHog can populate the current URL itself.
      }
      return event;
    },
  });
  ph.__htpInitialized = true;
  return ph;
}

export function PostHogAnalytics() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined" || isPrivatePath(pathname)) return;
    const posthog = initializePostHog();
    posthog.capture?.("$pageview", { $current_url: window.location.href });
  }, [pathname]);

  return null;
}
