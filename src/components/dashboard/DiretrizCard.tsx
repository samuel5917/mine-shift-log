import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FileText, Paperclip, Play, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { fetchAsset, removeAsset, uploadAsset } from "@/lib/dashboard/assets";

export function DiretrizCard() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  const { data: asset } = useQuery({
    queryKey: ["dashboard-asset", "diretriz"],
    queryFn: () => fetchAsset("diretriz"),
  });

  const upload = useMutation({
    mutationFn: (file: File) => {
      if (file.type !== "application/pdf") {
        return Promise.reject(new Error("A Diretriz deve ser um arquivo PDF."));
      }
      return uploadAsset("diretriz", file);
    },
    onSuccess: () => {
      toast.success("Diretriz atualizada");
      queryClient.invalidateQueries({ queryKey: ["dashboard-asset", "diretriz"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: () => removeAsset("diretriz"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard-asset", "diretriz"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="flex items-center gap-2 font-semibold text-card-foreground">
          <FileText size={16} /> Diretriz
        </h2>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
            <Paperclip size={14} /> Anexar Diretriz
          </Button>
          {asset ? (
            <Button size="icon" variant="ghost" aria-label="Remover Diretriz" onClick={() => del.mutate()}>
              <Trash2 size={14} />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="p-4">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
            e.target.value = "";
          }}
        />

        {upload.isPending ? (
          <p className="text-sm text-muted-foreground">Enviando arquivo…</p>
        ) : asset?.url ? (
          <div className="space-y-2">
            <div className="h-40 overflow-hidden rounded-md border bg-background">
              <iframe
                src={`${asset.url}#toolbar=0&view=FitH`}
                title="Pré-visualização da Diretriz"
                className="pointer-events-none h-full w-full"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-muted-foreground">{asset.fileName}</span>
              <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                <ExternalLink size={14} /> Abrir
              </Button>
            </div>
          </div>
        ) : (
          <p className="rounded-md border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
            Nenhuma Diretriz anexada. Envie um arquivo PDF.
          </p>
        )}
      </div>

      {asset?.url ? (
        <DiretrizViewer open={open} onOpenChange={setOpen} src={asset.url} name={asset.fileName} />
      ) : null}
    </section>
  );
}

function DiretrizViewer({
  open,
  onOpenChange,
  src,
  name,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  src: string;
  name: string;
}) {
  const [presenting, setPresenting] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onChange() {
      if (!document.fullscreenElement) setPresenting(false);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  async function startPresentation() {
    setPresenting(true);
    try {
      await stageRef.current?.requestFullscreen?.();
    } catch {
      /* fullscreen bloqueado: mantém o modo tela cheia interno */
    }
  }

  async function exitPresentation() {
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
    setPresenting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[95vh] w-[98vw] max-w-none gap-2 p-3 sm:max-w-none">
        <DialogTitle className="truncate text-base">{name}</DialogTitle>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={startPresentation}>
            <Play size={14} /> Apresentação
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <a href={src} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> Abrir em nova aba
            </a>
          </Button>
        </div>

        <div
          ref={stageRef}
          className={
            presenting
              ? "fixed inset-0 z-[100] bg-background"
              : "flex-1 overflow-hidden rounded-md border bg-background"
          }
        >
          {presenting ? (
            <Button
              size="sm"
              variant="secondary"
              className="absolute right-4 top-4 z-10"
              onClick={exitPresentation}
            >
              <X size={14} /> Sair da apresentação (ESC)
            </Button>
          ) : null}
          <iframe src={src} title="Diretriz" className="h-full w-full" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
