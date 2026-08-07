"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Copy text and flash a confirmation.
 *
 * Never throws: `navigator.clipboard` rejects on a permission denial or a
 * non-secure context, and the four hand-rolled copies this replaces all left
 * that as an unhandled rejection with no feedback. The reset timer is cleared
 * on unmount so it can't fire against a gone component.
 */
export function useCopyToClipboard(resetMs = 1500): {
  copied: boolean;
  copy: (text: string) => Promise<boolean>;
} {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        console.error("Copy to clipboard failed:", e);
        return false;
      }
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), resetMs);
      return true;
    },
    [resetMs],
  );

  return { copied, copy };
}
