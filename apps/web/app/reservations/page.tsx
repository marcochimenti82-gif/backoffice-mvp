"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listReservations, patchReservation } from "@/lib/api";
import type { ReservationPublic, ReservationStatus } from "@backoffice/shared";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";

const PatchSchema = z.object({
  startAt: z.string().datetime().optional(),
  durationMinutes: z.coerce.number().int().min(15).max(24 * 60).optional(),
  pax: z.coerce.number().int().min(1).max(999).optional(),
  notes: z.string().max(4000).nullable().optional(),
  experienceType: z.string().max(200).nullable().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]).optional()
});
type PatchForm = z.infer<typeof PatchSchema>;

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" });
}

export default function ReservationsPage() {
  const qc = useQueryClient();
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<ReservationStatus | "">("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["reservations", q, status],
    queryFn: () =>
      listReservations({
        q: q || undefined,
        status: (status || undefined) as any
      })
  });

  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<ReservationPublic | null>(null);

  const form = useForm<PatchForm>({
    resolver: zodResolver(PatchSchema),
    defaultValues: {}
  });

  const mutation = useMutation({
    mutationFn: async (vars: { id: string; input: PatchForm }) => patchReservation(vars.id, vars.input as any),
    onSuccess: async () => {
      toast.success("Prenotazione aggiornata");
      setOpen(false);
      setSelected(null);
      await qc.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (e: any) => toast.error(`Errore: ${e.message}`)
  });

  function openEdit(r: ReservationPublic) {
    setSelected(r);
    form.reset({
      startAt: r.startAt,
      durationMinutes: r.durationMinutes,
      pax: r.pax,
      notes: r.notes ?? "",
      experienceType: r.experienceType ?? "",
      status: r.status
    });
    setOpen(true);
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!selected) return;
    await mutation.mutateAsync({
      id: selected.id,
      input: {
        ...values,
        notes: values.notes === "" ? null : values.notes,
        experienceType: values.experienceType === "" ? null : values.experienceType
      }
    });
  });

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Prenotazioni</h1>
          <p className="text-sm text-muted-foreground">Lista tenant-aware (max 200 righe).</p>
        </div>

        <div className="flex gap-2 items-center">
          <Input
            placeholder="Cerca nome o telefono..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-56"
          />
          <select
            className="h-10 rounded-md border border-border bg-background px-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="">Tutti</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Caricamento…</div>}
      {isError && <div className="text-sm text-red-600">Errore: {(error as any)?.message}</div>}

      {data && (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Ora</TableHead>
                <TableHead>Contatto</TableHead>
                <TableHead>Pax</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Esperienza</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{formatDateTime(r.startAt)}</TableCell>
                  <TableCell>
                    <div className="font-medium">{r.contact?.fullName ?? "-"}</div>
                    <div className="text-xs text-muted-foreground">{r.contact?.phoneE164 ?? ""}</div>
                  </TableCell>
                  <TableCell>{r.pax}</TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{r.experienceType ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openEdit(r)}>
                      Modifica
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-sm text-muted-foreground">
                    Nessun risultato.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica prenotazione</DialogTitle>
            <DialogDescription>
              Nel MVP: modifica base (orario, pax, note, esperienza, stato).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label>Start (ISO)</Label>
              <Input {...form.register("startAt")} placeholder="2026-01-11T12:00:00.000Z" />
              {form.formState.errors.startAt && (
                <div className="text-xs text-red-600">{form.formState.errors.startAt.message}</div>
              )}
              <div className="text-xs text-muted-foreground">
                Tip: puoi copiare lo startAt esistente e cambiare l'orario.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Durata (min)</Label>
                <Input type="number" {...form.register("durationMinutes")} />
              </div>
              <div className="space-y-1">
                <Label>Pax</Label>
                <Input type="number" {...form.register("pax")} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Esperienza</Label>
              <Input {...form.register("experienceType")} placeholder="Piscina + pranzo" />
            </div>

            <div className="space-y-1">
              <Label>Stato</Label>
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-2 text-sm"
                {...form.register("status")}
              >
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label>Note</Label>
              <textarea
                className="min-h-[90px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register("notes")}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvataggio…" : "Salva"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
