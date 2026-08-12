import { type ReactNode, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function Choice({
  label,
  value,
  onChange,
  options,
  placeholder = "Selecionar",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function ToggleChips({
  options,
  selected,
  onToggle,
  multiple = true,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  multiple?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(o)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {multiple && active ? "✓ " : ""}
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function CopyButton({
  text,
  label = "Copiar",
  size = "sm",
  variant = "outline",
}: {
  text: string;
  label?: string;
  size?: "sm" | "default";
  variant?: "outline" | "default" | "secondary";
}) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setDone(true);
    toast.success("Texto copiado");
    setTimeout(() => setDone(false), 1500);
  }

  return (
    <Button type="button" size={size} variant={variant} onClick={copy} disabled={!text.trim()}>
      {done ? <Check size={14} /> : <Copy size={14} />} {label}
    </Button>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-card-foreground">{title}</h2>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </header>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}
