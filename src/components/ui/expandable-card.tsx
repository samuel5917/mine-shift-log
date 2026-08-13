import { type ReactNode, useState } from "react";
import { ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable accordion card used across the whole app.
 * Only one card per list should be open at a time — the parent controls `open`.
 */
export function ExpandableCard({
  title,
  summary,
  open,
  onToggle,
  onDelete,
  children,
  confirmMessage = "Tem certeza que deseja excluir este item?",
}: {
  title: string;
  summary?: string | undefined;
  open: boolean;
  onToggle: () => void;
  onDelete?: (() => void) | undefined;
  children: ReactNode;
  confirmMessage?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border transition-colors",
        open ? "border-primary/60 bg-card shadow-sm" : "bg-card/60",
      )}
    >
      <div className="flex items-start gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
        >
          <ChevronRight
            size={16}
            className={cn(
              "mt-0.5 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-90 text-primary",
            )}
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-card-foreground">
              {title}
            </span>
            {!open && summary ? (
              <span className="block truncate text-xs text-muted-foreground">{summary}</span>
            ) : null}
          </span>
        </button>
        {onDelete ? (
          <button
            type="button"
            aria-label="Excluir item"
            className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              if (window.confirm(confirmMessage)) onDelete();
            }}
          >
            <Trash2 size={15} />
          </button>
        ) : null}
      </div>
      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 border-t px-3 py-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Collapsible top-level section wrapper. */
export function CollapsibleSection({
  title,
  description,
  action,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
  children: ReactNode;
  defaultOpen?: boolean | undefined;
  badge?: string | number | undefined;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <header className="flex flex-wrap items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronRight
            size={16}
            className={cn(
              "shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-90 text-primary",
            )}
          />
          <span className="min-w-0">
            <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-card-foreground">
              {title}
              {badge ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {badge}
                </span>
              ) : null}
            </span>
            {description ? (
              <span className="block truncate text-xs font-normal normal-case text-muted-foreground">
                {description}
              </span>
            ) : null}
          </span>
        </button>
        {open ? action : null}
      </header>
      {open ? <div className="space-y-3 border-t p-4">{children}</div> : null}
    </section>
  );
}

/** Small helper to build a card summary from optional pieces. */
export function joinSummary(...parts: Array<string | number | undefined | null | false>) {
  return parts
    .map((p) => (typeof p === "number" ? String(p) : p))
    .filter((p): p is string => Boolean(p && p.trim()))
    .join(" | ");
}
