"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function NoPlanState() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Card className="items-center gap-2 p-8 text-center">
      <span className="grid size-11 place-items-center rounded-2xl bg-primary text-2xl text-primary-foreground">
        🏃
      </span>
      <p className="mt-1 text-sm font-medium">{t("dashboard.noPlanTitle")}</p>
      <p className="text-xs text-muted-foreground">{t("dashboard.noPlanBody")}</p>
      <Button className="mt-2" onClick={() => router.push("/plan/new")}>
        <Plus className="size-4" /> {t("common.createPlan")}
      </Button>
    </Card>
  );
}
