import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChartBar as BarChart3, Maximize2, Minus, Paperclip, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BLEND_ACCEPT, fetchAsset, removeAsset, uploadAsset } from "@/lib/dashboard/assets";

export function BlendCard() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const { data: asset } = useQuery({
    queryKey: ["dashboard-asset", "blend"],
    queryFn: () => fetchAsset("blend"),
  });

  const upload = useMutation({
    mutationFn: (file: File) => {
      if (!BLEND_ACCEPT.includes(file.type)) {
        return Promise.reject(new Error("Use uma imagem PNG, JPG, JPEG ou WEBP."));
      }
      return uploadAsset("blend", file);
    },
    onSuccess: () => {
      toast.success("Blend atualizado");
      queryClient.invalidateQueries({ queryKey: ["dashboard-asset", "blend"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: () => removeAsset("blend"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard-asset", "blend"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  // Colar imagem com Ctrl + V na área do Blend.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const el = dropRef.current;
      if (!el) return;
      const active = document.activeElement;
      const insideArea = el.contains(active) || active === document.body;
      if (!insideArea) return;
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/"),
      );
      if (!item) return;
      const file = item.getAsFile();
      if (!file) return;
      e.preventDefault();
      upload.mutate(file);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [upload]);

  return (
    <section className="rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="flex items-center gap-2 font-semibold text-card-foreground">
          <BarChart3 size={16} /> Blend
        </h2>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
            <Paperclip size={14} /> Anexar imagem
          </Button>
          {asset ? (
            <Button
              size="icon"
              variant="ghost"
              aria-label="Remover Blend"
              onClick={() => del.mutate()}
            >
              <Trash2 size={14} />
            </Button>
          ) : null}
        </div>
      </div>

      <div ref={dropRef} tabIndex={-1} className="p-4">
        <input
          ref={inputRef}
          type="file"
          accept={BLEND_ACCEPT.join(",")}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
            e.target.value = "";
          }}
        />

        {upload.isPending ? (
          <p className="text-sm text-muted-foreground">Enviando imagem…</p>
        ) : asset?.url ? (
          <div className="space-y-2">
            <button
              onClick={() => setOpen(true)}
              className="block w-full overflow-hidden rounded-md border bg-background"
              aria-label="Ampliar Blend"
            >
              <img
                src={asset.url}
                alt="Blend do turno"
                className="max-h-40 w-full object-contain"
              />
            </button>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-muted-foreground">{asset.fileName}</span>
              <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                <Maximize2 size={14} /> Ampliar
              </Button>
            </div>
          </div>
        ) : (
          <p className="rounded-md border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
            Cole a imagem com Ctrl + V ou use “Anexar imagem”.
          </p>
        )}
      </div>

      {asset?.url ? <BlendViewer open={open} onOpenChange={setOpen} src={asset.url} /> : null}
    </section>
  );
}

function BlendViewer({
  open,
  onOpenChange,
  src,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  src: string;
}) {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  useEffect(() => {
    if (open) setZoom(1);
  }, [open]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const next = Math.min(6, Math.max(0.5, zoomRef.current * Math.exp(-dy * 0.0015)));
      setZoom(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[95vh] w-[98vw] max-w-none gap-2 p-3 sm:max-w-none">
        <DialogTitle className="text-base">Blend</DialogTitle>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            aria-label="Diminuir zoom"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
          >
            <Minus size={14} />
          </Button>
          <span className="w-14 text-center text-xs text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            size="icon"
            variant="outline"
            aria-label="Aumentar zoom"
            onClick={() => setZoom((z) => Math.min(6, z + 0.25))}
          >
            <Plus size={14} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Redefinir zoom"
            onClick={() => setZoom(1)}
          >
            <RotateCcw size={14} />
          </Button>
        </div>
        <div ref={containerRef} className="flex-1 overflow-auto rounded-md border bg-background">
          <img
            src={src}
            alt="Blend do turno ampliado"
            style={{ width: `${zoom * 100}%` }}
            className="max-w-none origin-top-left"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
