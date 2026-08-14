import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { reviewWithAi } from "@/lib/ai/gemini.functions";
import type { AiDocKind } from "@/lib/ai/prompt";

interface Props {
  kind: AiDocKind;
  /** Dados estruturados já preenchidos no aplicativo (texto legível). */
  structured: string;
  /** Texto atual do informe, se houver. */
  current: string;
  onApply: (texto: string) => void;
}

export function AiReviewDialog({ kind, structured, current, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const review = useServerFn(reviewWithAi);

  async function run() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await review({ data: { kind, structured, current, raw } });
      setResult(res.texto);
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Não foi possível realizar a revisão com IA. Verifique sua conexão e a configuração da API Key.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (loading) return;
        setOpen(v);
        if (!v) setResult("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Bot size={16} /> Revisão com IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🤖 Revisão com IA</DialogTitle>
          <DialogDescription>
            A IA revisa e organiza {kind === "ata" ? "a ata" : "as justificativas do turno"} usando
            os dados preenchidos e, opcionalmente, um texto bruto. Ela não cria informações novas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Texto bruto (opcional)
          </label>
          <Textarea
            rows={6}
            placeholder="Cole aqui a mensagem recebida (WhatsApp, anotações do turno...)"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
        </div>

        {result ? (
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Resultado da revisão
            </label>
            <Textarea
              rows={14}
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="font-sans text-sm"
            />
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button onClick={run} disabled={loading} variant={result ? "outline" : "default"}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Analisando com IA...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> {result ? "Revisar novamente" : "Revisar com IA"}
                </>
              )}
            </Button>
            {result ? (
              <Button
                onClick={() => {
                  onApply(result);
                  setOpen(false);
                  setResult("");
                  toast.success("Texto revisado aplicado ao informe.");
                }}
                disabled={loading}
              >
                Aplicar ao informe
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
