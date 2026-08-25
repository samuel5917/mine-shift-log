import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SquareCheck as CheckSquare, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Task = { id: string; title: string; done: boolean; created_at: string };

export function TasksCard() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");

  const { data: tasks } = useQuery({
    queryKey: ["shift-tasks"],
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from("shift_tasks")
        .select("id, title, done, created_at")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["shift-tasks"] });

  const add = useMutation({
    mutationFn: async (value: string) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("shift_tasks")
        .insert({ user_id: auth.user!.id, title: value });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (task: Task) => {
      const { error } = await supabase
        .from("shift_tasks")
        .update({ done: !task.done })
        .eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shift_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const list = tasks ?? [];
  const done = list.filter((t) => t.done).length;
  const pct = list.length ? Math.round((done / list.length) * 100) : 0;

  return (
    <section className="flex flex-col rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="flex items-center gap-2 font-semibold text-card-foreground">
          <CheckSquare size={16} /> Tarefas do turno
        </h2>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const value = title.trim();
            if (!value) return;
            add.mutate(value);
          }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nova tarefa do turno"
          />
          <Button type="submit" size="icon" disabled={add.isPending} aria-label="Adicionar tarefa">
            <Plus size={16} />
          </Button>
        </form>

        {list.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma tarefa cadastrada.
          </p>
        ) : (
          <ul className="flex-1 space-y-1">
            {list.map((t) => (
              <li key={t.id} className="group flex items-center gap-2 rounded-md px-1 py-1.5">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggle.mutate(t)}
                  className="size-4 accent-primary"
                  aria-label={t.title}
                />
                <span
                  className={cn(
                    "flex-1 text-sm text-card-foreground",
                    t.done && "text-muted-foreground line-through opacity-70",
                  )}
                >
                  {t.title}
                </span>
                <button
                  onClick={() => remove.mutate(t.id)}
                  className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label={`Excluir ${t.title}`}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {list.length > 0 ? (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {done} de {list.length} concluída{list.length > 1 ? "s" : ""}
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-right text-xs text-muted-foreground">{pct}%</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
