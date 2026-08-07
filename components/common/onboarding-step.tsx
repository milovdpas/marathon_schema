"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * One onboarding prompt: icon, title, body, an optional preview, and a
 * two-button footer. Dismissing the dialog counts as skipping, so there is no
 * way to close it without a decision being recorded.
 */
export function OnboardingStep({
  icon: Icon,
  title,
  body,
  children,
  skipLabel,
  confirmLabel,
  onSkip,
  onConfirm,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  /** Optional preview between the body and the buttons. */
  children?: React.ReactNode;
  skipLabel: string;
  confirmLabel: string;
  onSkip: () => void;
  onConfirm: () => void;
  className?: string;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onSkip()}>
      <DialogContent className={cn("sm:max-w-sm", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="size-5 text-primary" /> {title}
          </DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={onSkip}>
            {skipLabel}
          </Button>
          <Button onClick={onConfirm}>
            <Icon className="size-4" /> {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
