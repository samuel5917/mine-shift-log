import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, Wand2, Zap, BookmarkPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Choice, CopyButton, Field, SectionCard, ToggleChips } from "@/components/assistente/ui";
import { ExpandableCard, joinSummary } from "@/components/ui/expandable-card";
import {
  BANCOS,
  CATEGORIAS_OBSERVACAO,
  IMPACTOS,
  LOCAIS_PARADA,
  MOTIVOS_NAO_ATENDIMENTO,
  MOTIVOS_PARADA,
  PLANTA02_STATUS,
  PLANTA_MOTIVOS,
  REINICIO_FORMAS,
  STORAGE_KEY,
  TIPOS_MOVIMENTACAO,
  UNIDADES,
  emptyBanco,
  emptyMovimentacao,
  emptyParada,
  emptyState,
  newId,
  type AssistenteState,
  type BancoEntry,
  type ImpactoEntry,
  type PlantaEntry,
} from "@/lib/assistente/types";
import {
  duracaoParada,
  gerarTextos,
  textoCompleto,
  viagensResumo,
} from "@/lib/assistente/generate";
import { parseQuickEntry } from "@/lib/assistente/quick-parse";

export const Route = createFileRoute("/_authenticated/assistente")({
  head: () => ({
    meta: [
      { title: "Assistente do Turno | Trindade Mineração" },
      {
        name: "description",
        content:
          "Assistente guiado para redação das justificativas operacionais do turno: blend, movimentações, paradas, impactos e observações.",
      },
      { property: "og:title", content: "Assistente do Turno | Trindade Mineração" },
      {
        property: "og:description",
        content: "Gere justificativas operacionais profissionais com poucos cliques.",
      },
    ],
  }),
  component: Assistente,
});

function loadState(): AssistenteState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return { ...emptyState(), ...(JSON.parse(raw) as Partial<AssistenteState>) };
  } catch {
    return emptyState();
  }
}

function Assistente() {
  const [state, setState] = useState<AssistenteState>(emptyState());
  const [hydrated, setHydrated] = useState(false);
  const [quick, setQuick] = useState("");
  const [gerado, setGerado] = useState(false);
  const [openBanco, setOpenBanco] = useState<string | null>(null);
  const [openMov, setOpenMov] = useState<string | null>(null);
  const [openParada, setOpenParada] = useState<string | null>(null);
  const [openImpacto, setOpenImpacto] = useState<string | null>(null);
  const [openObs, setOpenObs] = useState<string | null>(null);
  const [openModelo, setOpenModelo] = useState<string | null>(null);

  const toggleOpen =
    (current: string | null, set: (v: string | null) => void) => (id: string) =>
      set(current === id ? null : id);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const patch = (p: Partial<AssistenteState>) => setState((s) => ({ ...s, ...p }));

  const secoes = useMemo(() => gerarTextos(state), [state]);
  const tudo = useMemo(() => textoCompleto(secoes), [secoes]);

  // ---------- Blend ----------
  function updateBanco(id: string, up: Partial<BancoEntry>) {
    patch({ bancos: state.bancos.map((b) => (b.id === id ? { ...b, ...up } : b)) });
  }
  function updatePlanta(id: string, key: "planta01" | "planta02", up: Partial<PlantaEntry>) {
    patch({
      bancos: state.bancos.map((b) => (b.id === id ? { ...b, [key]: { ...b[key], ...up } } : b)),
    });
  }

  function toggle(list: string[], value: string) {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  // ---------- Entrada rápida ----------
  function applyQuick() {
    const res = parseQuickEntry(quick);
    if (!res.kind) {
      toast.error("Não foi possível identificar os dados. Informe ao menos o banco ou o tipo.");
      return;
    }
    if (res.kind === "banco" && res.banco) {
      patch({ bancos: [...state.bancos, res.banco] });
      setOpenBanco(res.banco.id);
    } else if (res.movimentacao) {
      patch({ movimentacoes: [...state.movimentacoes, res.movimentacao] });
      setOpenMov(res.movimentacao.id);
    }
    setQuick("");
    toast.success(
      res.faltando.length
        ? `Registro criado. Faltam: ${res.faltando.join(", ")}.`
        : "Registro criado a partir da entrada rápida.",
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assistente do Turno</h1>
          <p className="text-sm text-muted-foreground">
            Selecione as informações e o assistente redige as justificativas operacionais.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const b = emptyBanco();
              patch({ bancos: [...state.bancos, b] });
              setOpenBanco(b.id);
            }}
          >
            <Zap size={14} /> Blend não atendido
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const b = emptyBanco();
              b.planta01.movimentacao = "sem";
              patch({ bancos: [...state.bancos, b] });
              setOpenBanco(b.id);
            }}
          >
            <Zap size={14} /> Sem movimentação
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const x = emptyParada();
              patch({ paradas: [...state.paradas, x] });
              setOpenParada(x.id);
            }}
          >
            <Zap size={14} /> Parada
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const x = emptyMovimentacao("Estoque");
              patch({ movimentacoes: [...state.movimentacoes, x] });
              setOpenMov(x.id);
            }}
          >
            <Zap size={14} /> Estoque
          </Button>
        </div>
      </div>

      {/* Entrada rápida */}
      <SectionCard
        title="Entrada rápida"
        description='Ex.: "B1120 P2 14/15 umido sem seca" ou "OM B1080-B1030 7 viagens rampa"'
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyQuick();
            }}
            placeholder="Digite de forma abreviada e pressione Enter"
          />
          <Button onClick={applyQuick} disabled={!quick.trim()}>
            <Wand2 size={16} /> Interpretar
          </Button>
        </div>
      </SectionCard>

      {/* Blend */}
      <SectionCard
        title="Justificativa do Blend"
        action={
          <Button
            size="sm"
            onClick={() => {
              const b = emptyBanco();
              patch({ bancos: [...state.bancos, b] });
              setOpenBanco(b.id);
            }}
          >
            <Plus size={14} /> Adicionar banco
          </Button>
        }
      >
        {state.bancos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum banco adicionado.</p>
        ) : null}
        {state.bancos.map((b, idx) => (
          <ExpandableCard
            key={b.id}
            title={b.banco.trim() || `Banco ${String(idx + 1).padStart(2, "0")}`}
            summary={joinSummary(
              b.planta02.status02 || undefined,
              b.planta02.programadas && b.planta02.realizadas
                ? `${b.planta02.realizadas}/${b.planta02.programadas} viagens`
                : undefined,
              b.planta02.motivosNaoAtendimento[0],
            )}
            open={openBanco === b.id}
            onToggle={() => toggleOpen(openBanco, setOpenBanco)(b.id)}
            onDelete={() => {
              patch({ bancos: state.bancos.filter((x) => x.id !== b.id) });
              setOpenBanco(null);
            }}
          >
            <Field label="Banco">
              <Input
                autoFocus
                list="lista-bancos"
                value={b.banco}
                onChange={(e) => updateBanco(b.id, { banco: e.target.value })}
                placeholder="B-1120"
              />
            </Field>

            {/* Planta 01 */}
            <div className="space-y-3 rounded-md bg-muted/40 p-3">
              <p className="text-xs font-bold uppercase text-muted-foreground">Planta 01</p>
              <ToggleChips
                options={["Não houve movimentação", "Houve movimentação"]}
                selected={
                  b.planta01.movimentacao === "sem"
                    ? ["Não houve movimentação"]
                    : b.planta01.movimentacao === "com"
                      ? ["Houve movimentação"]
                      : []
                }
                multiple={false}
                onToggle={(v) =>
                  updatePlanta(b.id, "planta01", {
                    movimentacao:
                      v === "Não houve movimentação"
                        ? b.planta01.movimentacao === "sem"
                          ? ""
                          : "sem"
                        : b.planta01.movimentacao === "com"
                          ? ""
                          : "com",
                  })
                }
              />
              {b.planta01.movimentacao === "sem" ? (
                <>
                  <p className="text-xs text-muted-foreground">Motivos</p>
                  <ToggleChips
                    options={PLANTA_MOTIVOS}
                    selected={b.planta01.motivos}
                    onToggle={(v) =>
                      updatePlanta(b.id, "planta01", { motivos: toggle(b.planta01.motivos, v) })
                    }
                  />
                  {b.planta01.motivos.includes("Outro") ? (
                    <Input
                      value={b.planta01.motivoOutro}
                      onChange={(e) =>
                        updatePlanta(b.id, "planta01", { motivoOutro: e.target.value })
                      }
                      placeholder="Descreva o motivo"
                    />
                  ) : null}
                </>
              ) : null}
            </div>

            {/* Planta 02 */}
            <div className="space-y-3 rounded-md bg-muted/40 p-3">
              <p className="text-xs font-bold uppercase text-muted-foreground">Planta 02</p>
              <ToggleChips
                options={PLANTA02_STATUS}
                multiple={false}
                selected={b.planta02.status02 ? [b.planta02.status02] : []}
                onToggle={(v) =>
                  updatePlanta(b.id, "planta02", {
                    status02: (b.planta02.status02 === v ? "" : v) as NonNullable<
                      PlantaEntry["status02"]
                    >,
                  })
                }
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Viagens programadas">
                  <Input
                    inputMode="numeric"
                    value={b.planta02.programadas}
                    onChange={(e) =>
                      updatePlanta(b.id, "planta02", { programadas: e.target.value })
                    }
                  />
                </Field>
                <Field label="Viagens realizadas">
                  <Input
                    inputMode="numeric"
                    value={b.planta02.realizadas}
                    onChange={(e) => updatePlanta(b.id, "planta02", { realizadas: e.target.value })}
                  />
                </Field>
              </div>
              <ViagensResumo p={b.planta02.programadas} r={b.planta02.realizadas} />

              {b.planta02.status02 === "Atendido parcialmente" ||
              b.planta02.status02 === "Não atendido" ? (
                <>
                  <p className="text-xs text-muted-foreground">Motivos do não atendimento</p>
                  <ToggleChips
                    options={MOTIVOS_NAO_ATENDIMENTO}
                    selected={b.planta02.motivosNaoAtendimento}
                    onToggle={(v) =>
                      updatePlanta(b.id, "planta02", {
                        motivosNaoAtendimento: toggle(b.planta02.motivosNaoAtendimento, v),
                      })
                    }
                  />
                  {b.planta02.motivosNaoAtendimento.includes("Outro") ? (
                    <Input
                      value={b.planta02.motivoNaoAtendimentoOutro}
                      onChange={(e) =>
                        updatePlanta(b.id, "planta02", {
                          motivoNaoAtendimentoOutro: e.target.value,
                        })
                      }
                      placeholder="Descreva o motivo"
                    />
                  ) : null}
                </>
              ) : null}
            </div>

            {/* Reinício */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase text-muted-foreground">
                Blend foi reiniciado?
              </p>
              <ToggleChips
                options={["Sim", "Não"]}
                multiple={false}
                selected={b.reiniciado === "sim" ? ["Sim"] : b.reiniciado === "nao" ? ["Não"] : []}
                onToggle={(v) =>
                  updateBanco(b.id, {
                    reiniciado: v === "Sim" ? (b.reiniciado === "sim" ? "" : "sim") : b.reiniciado === "nao" ? "" : "nao",
                  })
                }
              />
              {b.reiniciado === "sim" ? (
                <>
                  <Choice
                    label="Como?"
                    value={b.reinicioForma}
                    onChange={(v) => updateBanco(b.id, { reinicioForma: v })}
                    options={REINICIO_FORMAS}
                  />
                  {b.reinicioForma === "Outro" ? (
                    <Input
                      value={b.reinicioOutro}
                      onChange={(e) => updateBanco(b.id, { reinicioOutro: e.target.value })}
                      placeholder="Descreva"
                    />
                  ) : null}
                </>
              ) : null}
            </div>
          </ExpandableCard>
        ))}
        <datalist id="lista-bancos">
          {BANCOS.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
      </SectionCard>

      {/* Movimentações */}
      <SectionCard
        title="Outras movimentações"
        action={
          <Button
            size="sm"
            onClick={() => patch({ movimentacoes: [...state.movimentacoes, emptyMovimentacao()] })}
          >
            <Plus size={14} /> Adicionar movimentação
          </Button>
        }
      >
        {state.movimentacoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma movimentação adicionada.</p>
        ) : null}
        {state.movimentacoes.map((m) => {
          const up = (u: Partial<typeof m>) =>
            patch({
              movimentacoes: state.movimentacoes.map((x) => (x.id === m.id ? { ...x, ...u } : x)),
            });
          return (
            <div key={m.id} className="space-y-3 rounded-md border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Choice
                    label="Tipo"
                    value={m.tipo}
                    onChange={(v) => up({ tipo: v })}
                    options={TIPOS_MOVIMENTACAO}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remover movimentação"
                  onClick={() =>
                    patch({ movimentacoes: state.movimentacoes.filter((x) => x.id !== m.id) })
                  }
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Origem">
                  <Input
                    list="lista-bancos"
                    value={m.origem}
                    onChange={(e) => up({ origem: e.target.value })}
                  />
                </Field>
                <Field label="Destino">
                  <Input
                    list="lista-bancos"
                    value={m.destino}
                    onChange={(e) => up({ destino: e.target.value })}
                  />
                </Field>
                {m.tipo === "Estoque" || m.tipo === "Reprocesso" || m.tipo === "Outros" ? (
                  <Field label="Material">
                    <Input value={m.material} onChange={(e) => up({ material: e.target.value })} />
                  </Field>
                ) : null}
                <Field label="Quantidade">
                  <Input
                    inputMode="numeric"
                    value={m.quantidade}
                    onChange={(e) => up({ quantidade: e.target.value })}
                  />
                </Field>
                <Choice
                  label="Unidade"
                  value={m.unidade}
                  onChange={(v) => up({ unidade: v })}
                  options={UNIDADES}
                />
                <Field label={m.tipo === "Reprocesso" ? "Motivo / Finalidade" : "Finalidade"}>
                  <Input
                    value={m.finalidade}
                    onChange={(e) => up({ finalidade: e.target.value })}
                    placeholder="Formação de rampa operacional"
                  />
                </Field>
              </div>
              <Field label="Observação">
                <Input value={m.observacao} onChange={(e) => up({ observacao: e.target.value })} />
              </Field>
            </div>
          );
        })}
      </SectionCard>

      {/* Paradas */}
      <SectionCard
        title="Paradas operacionais"
        action={
          <Button size="sm" onClick={() => patch({ paradas: [...state.paradas, emptyParada()] })}>
            <Plus size={14} /> Adicionar parada
          </Button>
        }
      >
        {state.paradas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma parada registrada.</p>
        ) : null}
        {state.paradas.map((p) => {
          const up = (u: Partial<typeof p>) =>
            patch({ paradas: state.paradas.map((x) => (x.id === p.id ? { ...x, ...u } : x)) });
          const dur = duracaoParada(p.inicio, p.fim);
          return (
            <div key={p.id} className="space-y-3 rounded-md border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Choice
                    label="Local"
                    value={p.local}
                    onChange={(v) => up({ local: v })}
                    options={LOCAIS_PARADA}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remover parada"
                  onClick={() => patch({ paradas: state.paradas.filter((x) => x.id !== p.id) })}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              {p.local === "Outro" || p.local === "Banco" ? (
                <Field label={p.local === "Banco" ? "Qual banco?" : "Qual local?"}>
                  <Input
                    list="lista-bancos"
                    value={p.localOutro}
                    onChange={(e) => up({ localOutro: e.target.value })}
                  />
                </Field>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Início">
                  <Input type="time" value={p.inicio} onChange={(e) => up({ inicio: e.target.value })} />
                </Field>
                <Field label="Fim">
                  <Input type="time" value={p.fim} onChange={(e) => up({ fim: e.target.value })} />
                </Field>
                <div className="flex items-end pb-2 text-sm font-medium text-muted-foreground">
                  {dur ? `Duração: ${dur}` : "Duração: —"}
                </div>
              </div>
              <Choice
                label="Motivo"
                value={p.motivo}
                onChange={(v) => up({ motivo: v })}
                options={MOTIVOS_PARADA}
              />
              {p.motivo === "Outro" ? (
                <Input
                  value={p.motivoOutro}
                  onChange={(e) => up({ motivoOutro: e.target.value })}
                  placeholder="Descreva o motivo"
                />
              ) : null}
              <Field label="Observação">
                <Input value={p.observacao} onChange={(e) => up({ observacao: e.target.value })} />
              </Field>
            </div>
          );
        })}
      </SectionCard>

      {/* Impactos */}
      <SectionCard title="Impactos do turno">
        <ToggleChips
          options={IMPACTOS}
          selected={state.impactos.map((i) => i.nome)}
          onToggle={(v) =>
            patch({
              impactos: state.impactos.some((i) => i.nome === v)
                ? state.impactos.filter((i) => i.nome !== v)
                : [
                    ...state.impactos,
                    {
                      nome: v,
                      descricaoOutro: "",
                      alvo: "",
                      horario: "",
                      duracao: "",
                      observacao: "",
                    } satisfies ImpactoEntry,
                  ],
            })
          }
        />
        {state.impactos.map((i) => {
          const up = (u: Partial<ImpactoEntry>) =>
            patch({
              impactos: state.impactos.map((x) => (x.nome === i.nome ? { ...x, ...u } : x)),
            });
          return (
            <div key={i.nome} className="space-y-3 rounded-md border p-3">
              <p className="text-sm font-semibold text-card-foreground">{i.nome}</p>
              {i.nome === "Outro" ? (
                <Input
                  value={i.descricaoOutro}
                  onChange={(e) => up({ descricaoOutro: e.target.value })}
                  placeholder="Descreva o impacto"
                />
              ) : null}
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Equipamento / banco">
                  <Input value={i.alvo} onChange={(e) => up({ alvo: e.target.value })} />
                </Field>
                <Field label="Horário">
                  <Input value={i.horario} onChange={(e) => up({ horario: e.target.value })} />
                </Field>
                <Field label="Duração">
                  <Input value={i.duracao} onChange={(e) => up({ duracao: e.target.value })} />
                </Field>
              </div>
              <Field label="Observação">
                <Input value={i.observacao} onChange={(e) => up({ observacao: e.target.value })} />
              </Field>
            </div>
          );
        })}
      </SectionCard>

      {/* Observações */}
      <SectionCard
        title="Observações do turno"
        action={
          <Button
            size="sm"
            onClick={() =>
              patch({
                observacoes: [...state.observacoes, { id: newId(), categoria: "", texto: "" }],
              })
            }
          >
            <Plus size={14} /> Adicionar observação
          </Button>
        }
      >
        {state.observacoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma observação registrada.</p>
        ) : null}
        {state.observacoes.map((o) => {
          const up = (u: Partial<typeof o>) =>
            patch({
              observacoes: state.observacoes.map((x) => (x.id === o.id ? { ...x, ...u } : x)),
            });
          return (
            <div key={o.id} className="space-y-3 rounded-md border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Choice
                    label="Categoria"
                    value={o.categoria}
                    onChange={(v) => up({ categoria: v })}
                    options={CATEGORIAS_OBSERVACAO}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remover observação"
                  onClick={() =>
                    patch({ observacoes: state.observacoes.filter((x) => x.id !== o.id) })
                  }
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              <Field label="Informação">
                <Textarea
                  value={o.texto}
                  onChange={(e) => up({ texto: e.target.value })}
                  placeholder="B-1030 precisa de rompedor"
                  rows={2}
                />
              </Field>
            </div>
          );
        })}
      </SectionCard>

      {/* Modelos */}
      <SectionCard
        title="Memória de expressões"
        description="Modelos de frases reutilizáveis"
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              patch({
                modelos: [...state.modelos, { id: newId(), nome: "", situacao: "", texto: "" }],
              })
            }
          >
            <BookmarkPlus size={14} /> Adicionar modelo
          </Button>
        }
      >
        {state.modelos.map((mo) => {
          const up = (u: Partial<typeof mo>) =>
            patch({ modelos: state.modelos.map((x) => (x.id === mo.id ? { ...x, ...u } : x)) });
          return (
            <div key={mo.id} className="space-y-3 rounded-md border p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nome do modelo">
                  <Input value={mo.nome} onChange={(e) => up({ nome: e.target.value })} />
                </Field>
                <Field label="Situação">
                  <Input value={mo.situacao} onChange={(e) => up({ situacao: e.target.value })} />
                </Field>
              </div>
              <Field label="Texto padrão">
                <Textarea value={mo.texto} onChange={(e) => up({ texto: e.target.value })} rows={2} />
              </Field>
              <div className="flex gap-2">
                <CopyButton text={mo.texto} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => patch({ modelos: state.modelos.filter((x) => x.id !== mo.id) })}
                >
                  <Trash2 size={14} /> Remover
                </Button>
              </div>
            </div>
          );
        })}
      </SectionCard>

      {/* Resultado */}
      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={() => setGerado(true)}>
          <Wand2 size={18} /> Gerar justificativas
        </Button>
        <CopyButton text={tudo} label="Copiar tudo" size="default" variant="secondary" />
      </div>

      {gerado ? (
        secoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma informação preenchida — nada foi gerado.
          </p>
        ) : (
          <div className="space-y-4">
            {secoes.map((s) => (
              <SectionCard key={s.key} title={s.titulo} action={<CopyButton text={s.texto} />}>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-card-foreground">
                  {s.texto}
                </pre>
              </SectionCard>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}

function ViagensResumo({ p, r }: { p: string; r: string }) {
  const v = viagensResumo(p, r);
  if (!v) return null;
  return (
    <p className="text-xs font-medium text-muted-foreground">
      {v.diferencaLabel} · {v.percentualLabel}
    </p>
  );
}
