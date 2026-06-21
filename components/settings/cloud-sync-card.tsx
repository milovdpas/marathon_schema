"use client";

import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  Cloud,
  CloudOff,
  Loader2,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMounted } from "@/hooks/use-mounted";
import { isSyncConfigured } from "@/lib/google-drive";
import { useSyncStore } from "@/store/use-sync-store";

const REAUTH_HINT = "Sign-in expired — reconnect to resume syncing.";

export function CloudSyncCard() {
  const status = useSyncStore((s) => s.status);
  const connected = useSyncStore((s) => s.connected);
  const needsReauth = useSyncStore((s) => s.needsReauth);
  const user = useSyncStore((s) => s.user);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const error = useSyncStore((s) => s.error);
  const connect = useSyncStore((s) => s.connect);
  const disconnect = useSyncStore((s) => s.disconnect);
  const syncNow = useSyncStore((s) => s.syncNow);

  const mounted = useMounted();

  const busy =
    status === "connecting" ||
    status === "syncing" ||
    status === "reconnecting";

  // Not configured: render a static, hydration-safe note.
  if (!isSyncConfigured()) {
    return (
      <Card className="gap-0 p-4">
        <div className="mb-1 flex items-center gap-2">
          <CloudOff className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Cloud sync</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Google Drive sync isn&apos;t configured for this deployment. Your data
          is saved locally in this browser. See{" "}
          <span className="font-mono">NEXT_PUBLIC_GOOGLE_CLIENT_ID</span> in the
          README to enable it.
        </p>
      </Card>
    );
  }

  return (
    <Card className="gap-0 p-4">
      <div className="mb-1 flex items-center gap-2">
        <Cloud className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Cloud sync</h3>
        {mounted && connected ? (
          needsReauth ? (
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-tempo">
              <span className="size-1.5 rounded-full bg-tempo" /> Reconnect needed
            </span>
          ) : status === "reconnecting" ? (
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Reconnecting…
            </span>
          ) : (
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-easy">
              <span className="size-1.5 rounded-full bg-easy" /> Connected
            </span>
          )
        ) : null}
      </div>

      {!mounted ? (
        <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
      ) : connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {user?.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.picture}
                alt=""
                className="size-9 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="grid size-9 place-items-center rounded-full bg-muted text-sm">
                {user?.name?.[0] ?? "?"}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {status === "syncing"
              ? "Syncing…"
              : status === "reconnecting"
                ? "Reconnecting…"
                : needsReauth
                  ? REAUTH_HINT
                  : lastSyncedAt
                    ? `Last synced ${formatDistanceToNow(new Date(lastSyncedAt), {
                        addSuffix: true,
                      })}`
                    : "Backing up to your hidden Drive app folder."}
          </p>

          <div className="flex gap-2">
            {needsReauth ? (
              <Button size="sm" disabled={busy} onClick={() => void connect()}>
                <RefreshCw className="size-4" /> Reconnect
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void syncNow()}
              >
                {status === "syncing" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Sync now
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={disconnect}>
              <LogOut className="size-4" /> Disconnect
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Connect your Google account to back up your progress to Drive and
            sync it across devices. Without it, data stays local to this browser.
          </p>
          <Button size="sm" disabled={busy} onClick={() => void connect()}>
            {status === "connecting" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Cloud className="size-4" />
            )}
            Connect Google Drive
          </Button>
        </div>
      )}

      {mounted && error && !needsReauth ? (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-destructive">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </Card>
  );
}
