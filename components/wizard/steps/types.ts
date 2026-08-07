import type { Draft } from "@/lib/plan-request";

/** Patch one field of the wizard draft. Shared by every step component. */
export type SetDraft = <K extends keyof Draft>(key: K, value: Draft[K]) => void;
