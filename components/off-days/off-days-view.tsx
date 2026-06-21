"use client";

import { Pencil, Plus, Trash2, Umbrella } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRange } from "@/lib/date";
import type { OffDay } from "@/lib/types";
import { useActivePlan } from "@/hooks/use-active-plan";
import { useTrainingStore } from "@/store/use-training-store";

interface FormState {
  title: string;
  start: string;
  end: string;
  note: string;
}

const blank: FormState = { title: "", start: "", end: "", note: "" };

export function OffDaysView() {
  const plan = useActivePlan();
  const addOffDay = useTrainingStore((s) => s.addOffDay);
  const updateOffDay = useTrainingStore((s) => s.updateOffDay);
  const deleteOffDay = useTrainingStore((s) => s.deleteOffDay);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(blank);

  if (!plan) return null;

  const offDays = [...(plan.offDays ?? [])].sort((a, b) =>
    a.start < b.start ? -1 : a.start > b.start ? 1 : 0,
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(blank);
    setOpen(true);
  };

  const openEdit = (o: OffDay) => {
    setEditingId(o.id);
    setForm({ title: o.title, start: o.start, end: o.end, note: o.note ?? "" });
    setOpen(true);
  };

  const canSave = form.title.trim() && form.start && form.end && form.start <= form.end;

  const handleSave = () => {
    if (!canSave) return;
    const payload = {
      title: form.title.trim(),
      start: form.start,
      end: form.end,
      note: form.note.trim() || undefined,
    };
    if (editingId) updateOffDay(editingId, payload);
    else addOffDay(payload);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Vacations, trips and other periods that limit training. These show on
          your calendar and travel with your exported plan as context.
        </p>
        <Button size="sm" className="shrink-0" onClick={openAdd}>
          <Plus className="size-4" /> Add
        </Button>
      </div>

      {offDays.length === 0 ? (
        <Card className="items-center gap-2 p-8 text-center">
          <Umbrella className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">No off days yet</p>
          <p className="text-xs text-muted-foreground">
            Add a vacation or trip so it&apos;s factored into your training.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {offDays.map((o) => (
            <Card key={o.id} className="flex-row items-center gap-3 p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-tempo/15 text-tempo">
                <Umbrella className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{o.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatRange(o.start, o.end)}
                  {o.note ? ` · ${o.note}` : ""}
                </p>
              </div>
              <button
                type="button"
                aria-label="Edit off day"
                onClick={() => openEdit(o)}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Delete off day"
                onClick={() => deleteOffDay(o.id)}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit off day" : "Add off day"}</DialogTitle>
            <DialogDescription>
              Describe the period and whether any training is possible.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Title">
              <Input
                placeholder="e.g. Vacation to Ghent"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From">
                <Input
                  type="date"
                  value={form.start}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, start: e.target.value }))
                  }
                />
              </Field>
              <Field label="To">
                <Input
                  type="date"
                  value={form.end}
                  onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                />
              </Field>
            </div>
            <Field label="Note (training possibility)">
              <Input
                placeholder="e.g. Likely no training / very limited running"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
            </Field>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!canSave} onClick={handleSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
