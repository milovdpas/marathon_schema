"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlanOptionLabel } from "@/components/settings/plan-option-label";
import { useActivePlan } from "@/hooks/use-active-plan";
import { useTrainingStore } from "@/store/use-training-store";

/** Switch between plans, add one, or delete the active one. */
export function PlansCard({ onDeleted }: { onDeleted: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const plans = useTrainingStore((s) => s.plans);
  const activePlanId = useTrainingStore((s) => s.activePlanId);
  const activePlan = useActivePlan();
  const selectPlan = useTrainingStore((s) => s.selectPlan);
  const deletePlan = useTrainingStore((s) => s.deletePlan);

  const planList = Object.values(plans);

  return (
    <Card className="gap-0 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("settings.plans")}</h3>
        <Button size="sm" onClick={() => router.push("/app/plan/new")}>
          <Plus className="size-4" /> {t("settings.addPlan")}
        </Button>
      </div>

      <Label className="text-xs text-muted-foreground">
        {t("settings.activePlan")}
      </Label>
      <Select
        value={activePlanId ?? undefined}
        onValueChange={(v) => selectPlan(v as string)}
      >
        <SelectTrigger className="mt-1.5 w-full">
          <SelectValue>
            {(value) => {
              const p = value ? plans[value as string] : undefined;
              return p ? <PlanOptionLabel plan={p} /> : "";
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {planList.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <PlanOptionLabel plan={p} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Deleting the last plan re-seeds the example, so only offer it when
          there's another plan to fall back to. */}
      {planList.length > 1 ? (
        <Dialog>
          <DialogTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 self-start text-destructive hover:text-destructive"
              />
            }
          >
            <Trash2 className="size-4" /> {t("settings.deleteThisPlan")}
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t("settings.deletePlanTitle")}</DialogTitle>
              <DialogDescription>
                {t("settings.deletePlanDesc", { name: activePlan?.name })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-end">
              <DialogClose render={<Button variant="outline" />}>
                {t("common.cancel")}
              </DialogClose>
              <DialogClose
                render={
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (activePlanId) deletePlan(activePlanId);
                      onDeleted();
                    }}
                  />
                }
              >
                {t("common.delete")}
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </Card>
  );
}
