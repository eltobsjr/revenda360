"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { atualizarEtapaLead, converterLeadEmVenda } from "@/app/(app)/vendas/leads/actions";
import { ETAPAS_LEAD, type LeadRow } from "./types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EtapaLead } from "@/types/database.types";

function LeadCard({ lead }: { lead: LeadRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  function converter() {
    startTransition(async () => {
      const resultado = await converterLeadEmVenda(lead.id);
      if (resultado.clienteId) {
        router.push(`/vendas/nova?clienteId=${resultado.clienteId}`);
      }
    });
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      className={cn(
        "cursor-grab touch-none rounded-lg border bg-card p-3 text-sm shadow-sm active:cursor-grabbing",
        isDragging && "z-10 opacity-70",
      )}
    >
      <p className="font-medium">{lead.nome}</p>
      {lead.contato ? <p className="text-xs text-muted-foreground">{lead.contato}</p> : null}
      {lead.veiculoInteresse ? (
        <p className="text-xs text-muted-foreground">Interesse: {lead.veiculoInteresse}</p>
      ) : null}
      {lead.vendedor ? <p className="text-xs text-muted-foreground">{lead.vendedor}</p> : null}
      {lead.etapa === "Ganho" ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="mt-2 w-full"
          disabled={pending}
          onClick={converter}
        >
          {pending ? "Convertendo…" : "Converter em venda"}
        </Button>
      ) : null}
    </div>
  );
}

function Coluna({ etapa, leads }: { etapa: EtapaLead; leads: LeadRow[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa });

  return (
    <div
      ref={setNodeRef}
      role="list"
      aria-label={etapa}
      className={cn(
        "flex w-64 shrink-0 flex-col gap-2 rounded-lg border bg-muted/30 p-2",
        isOver && "border-primary bg-primary/5",
      )}
    >
      <div className="flex items-center justify-between px-1 py-1">
        <span className="text-sm font-semibold">{etapa}</span>
        <span className="text-xs text-muted-foreground">{leads.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

export function LeadsBoard({ leadsIniciais }: { leadsIniciais: LeadRow[] }) {
  const [leads, setLeads] = useState(leadsIniciais);
  const [leadsIniciaisAnterior, setLeadsIniciaisAnterior] = useState(leadsIniciais);
  const [erro, setErro] = useState<string | null>(null);

  if (leadsIniciais !== leadsIniciaisAnterior) {
    setLeadsIniciaisAnterior(leadsIniciais);
    setLeads(leadsIniciais);
  }

  // Distância mínima antes de ativar o drag: sem isso, o listener de pointer
  // do card inteiro captura até cliques no botão "Converter em venda" lá
  // dentro, e o clique nunca chega no botão.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const novaEtapa = over.id as EtapaLead;
    const leadId = active.id as string;
    const leadAtual = leads.find((l) => l.id === leadId);
    if (!leadAtual || leadAtual.etapa === novaEtapa) return;

    const etapaAnterior = leadAtual.etapa;
    setLeads((ls) => ls.map((l) => (l.id === leadId ? { ...l, etapa: novaEtapa } : l)));

    atualizarEtapaLead(leadId, novaEtapa).then((resultado) => {
      if (resultado.error) {
        setErro(resultado.error);
        setLeads((ls) => ls.map((l) => (l.id === leadId ? { ...l, etapa: etapaAnterior } : l)));
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <Card>
          <CardContent className="overflow-x-auto">
            <div className="flex gap-3">
              {ETAPAS_LEAD.map((etapa) => (
                <Coluna key={etapa} etapa={etapa} leads={leads.filter((l) => l.etapa === etapa)} />
              ))}
            </div>
          </CardContent>
        </Card>
      </DndContext>
    </div>
  );
}
