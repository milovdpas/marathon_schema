"use client";

import { useTranslation } from "react-i18next";

export function PageHeader({
  titleKey,
  subtitleKey,
  action,
}: {
  titleKey: string;
  subtitleKey?: string;
  action?: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t(titleKey)}</h1>
        {subtitleKey ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{t(subtitleKey)}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
