import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileDown, FileText, Plus, RotateCcw, ShieldCheck, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Choice, CopyButton, Field, ToggleChips } from "@/components/assistente/ui";
import { CollapsibleSection, ExpandableCard, joinSummary } from "@/components/ui/expandable-card";
import {
  ATA_STORAGE_KEY,
  BANCOS_ATA,
  BANCO_SITUACOES,
  EMPRESAS,
  MEIOS_ALINHAMENTO,
  PLANTAS,
  PLANTA_SITUACOES,
  SEGURANCA_OPCOES,
  emptyAta,
  emptyBancoInfo,
  emptyComunicado,
  emptyOcorrencia,
  emptyParticipante,
  emptyPlantaInfo,
  emptyPonto,
  type AtaState,
} from "@/lib/ata/types";
import { gerarAtaTexto, participanteLinha } from "@/lib/ata/generate";
import { baixarDocx, baixarPdf } from "@/lib/ata/export";
import { AiReviewDialog } from "@/components/ai/AiReviewDialog";

export const Route = createFileRoute("/_authenticated/ata")({
  head: () => ({
    meta: [
      { title: "Ata de Final de Semana | Trindade Mineração" },
      {
        name: "description",
        content:
          "Assistente para criação das atas de reunião de alinhamento operacional, com exportação em Word e PDF.",
      },
      { property: "og:title", content: "Ata de Final de Semana | Trindade Mineração" },
      {
        property: "og:description",
        content: "Monte a ata de alinhamento com poucos cliques e exporte em Word ou PDF.",
      },
    ],
  }),
  component: AtaPage,
});

function loadState(): AtaState {
  if (typeof window === "undefined") return emptyAta();
  try {
    const raw = window.localStorage.getItem(ATA_STORAGE_KEY);
    if (!raw) return emptyAta();
    return { ...emptyAta(), ...(JSON.parse(raw) as Partial<AtaState>) };
  } catch {
    return emptyAta();
  }
}

type ListKey = "participantes" | "ocorrencias" | "plantas" | "bancos" | "comunicados" | "pontos";

function AtaPage() {
  const [state, setState] = useState<AtaState>(emptyAta());
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState<Record<ListKey, string | null>>({
    participantes: null,
    ocorrencias: null,
    plantas: null,
    bancos: null,
    comunicados: null,
    pontos: null,
  });
  const [preview, setPreview] = useState("");
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    const s = loadState();
    setState(s);
    setPreview(s.conteudo ?? "");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(ATA_STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const patch = (p: Partial<AtaState>) => setState((s) => ({ ...s, ...p }));
  const setOpenIn = (key: ListKey, id: string | null) =>
    setOpen((o) => ({ ...o, [key]: o[key] === id ? null : id }));

  function addItem<K extends ListKey>(key: K, item: AtaState[K][number]) {
    setState((s) => ({ ...s, [key]: [...s[key], item] }) as AtaState);
    setOpen((o) => ({ ...o, [key]: (item as { id: string }).id }));
  }
  function removeItem(key: ListKey, id: string) {
    setState((s) => ({ ...s, [key]: s[key].filter((x) => x.id !== id) }) as AtaState);
    setOpen((o) => ({ ...o, [key]: o[key] === id ? null : o[key] }));
  }
  function updateItem<K extends ListKey>(key: K, id: string, up: Partial<AtaState[K][number]>) {
    setState(
      (s) =>
        ({
          ...s,
          [key]: s[key].map((x) => (x.id === id ? { ...x, ...up } : x)),
        }) as AtaState,
    );
  }

  const texto = useMemo(() => gerarAtaTexto(state), [state]);

  function gerar() {
    const t = gerarAtaTexto(state);
    setPreview(t);
    setEditando(false);
    patch({ conteudo: t });
    toast.success("Ata gerada");
  }

  function novaAta() {
    if (!window.confirm("Tem certeza que deseja iniciar uma nova ata? O rascunho atual será substituído.")) return;
    const s = emptyAta();
    setState(s);
    setPreview("");
    setEditando(false);
    toast.success("Nova ata iniciada");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ata de Reunião de Alinhamento</h1>
          <p className="text-sm text-muted-foreground">
            Preencha apenas o necessário — a redação é gerada automaticamente.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={novaAta}>
          <RotateCcw size={14} /> Nova ata
        </Button>
      </div>

      {/* Cabeçalho */}
      <section className="rounded-lg border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Data">
            <Input type="date" value={state.data} onChange={(e) => patch({ data: e.target.value })} />
          </Field>
          <Field label="Hora">
            <Input type="time" value={state.hora} onChange={(e) => patch({ hora: e.target.value })} />
          </Field>
          <Field label="Próxima reunião (data)">
            <Input
              type="date"
              value={state.proximaData}
              onChange={(e) => patch({ proximaData: e.target.value })}
            />
          </Field>
        </div>
      </section>

      {/* PRESENTES */}
      <CollapsibleSection
        title="Presentes"
        defaultOpen
        badge={state.participantes.length || undefined}
        action={
          <Button size="sm" onClick={() => addItem("participantes", emptyParticipante())}>
            <Plus size={14} /> Adicionar participante
          </Button>
        }
      >
        {state.participantes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum participante adicionado.</p>
        ) : null}
        {state.participantes.map((p, i) => (
          <ExpandableCard
            key={p.id}
            title={p.nome.trim() || `Participante ${String(i + 1).padStart(2, "0")}`}
            summary={participanteLinha(p) || undefined}
            open={open.participantes === p.id}
            onToggle={() => setOpenIn("participantes", p.id)}
            onDelete={() => removeItem("participantes", p.id)}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Nome">
                <Input
                  autoFocus
                  value={p.nome}
                  onChange={(e) => updateItem("participantes", p.id, { nome: e.target.value })}
                />
              </Field>
              <Field label="Função">
                <Input
                  value={p.funcao}
                  onChange={(e) => updateItem("participantes", p.id, { funcao: e.target.value })}
                  placeholder="Supervisor da Mina"
                />
              </Field>
              <Field label="Empresa">
                <Input
                  list="lista-empresas"
                  value={p.empresa}
                  onChange={(e) => updateItem("participantes", p.id, { empresa: e.target.value })}
                />
              </Field>
            </div>
          </ExpandableCard>
        ))}
        <datalist id="lista-empresas">
          {EMPRESAS.map((e) => (
            <option key={e} value={e} />
          ))}
        </datalist>
      </CollapsibleSection>

      {/* SEGURANÇA */}
      <CollapsibleSection
        title="Segurança"
        action={
          <Button size="sm" onClick={() => addItem("ocorrencias", emptyOcorrencia())}>
            <Plus size={14} /> Adicionar ocorrência
          </Button>
        }
      >
        <ToggleChips
          options={SEGURANCA_OPCOES}
          selected={state.segurancaStatus}
          onToggle={(v) =>
            patch({
              segurancaStatus: state.segurancaStatus.includes(v)
                ? state.segurancaStatus.filter((x) => x !== v)
                : [...state.segurancaStatus, v],
            })
          }
        />
        {state.ocorrencias.map((o, i) => (
          <ExpandableCard
            key={o.id}
            title={`Ocorrência ${String(i + 1).padStart(2, "0")}`}
            summary={joinSummary(o.descricao, o.local, o.horario)}
            open={open.ocorrencias === o.id}
            onToggle={() => setOpenIn("ocorrencias", o.id)}
            onDelete={() => removeItem("ocorrencias", o.id)}
          >
            <Field label="Descrição">
              <Textarea
                autoFocus
                rows={2}
                value={o.descricao}
                onChange={(e) => updateItem("ocorrencias", o.id, { descricao: e.target.value })}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Local">
                <Input
                  value={o.local}
                  onChange={(e) => updateItem("ocorrencias", o.id, { local: e.target.value })}
                />
              </Field>
              <Field label="Horário">
                <Input
                  value={o.horario}
                  onChange={(e) => updateItem("ocorrencias", o.id, { horario: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Ação tomada">
              <Input
                value={o.acao}
                onChange={(e) => updateItem("ocorrencias", o.id, { acao: e.target.value })}
              />
            </Field>
            <Field label="Observação">
              <Input
                value={o.observacao}
                onChange={(e) => updateItem("ocorrencias", o.id, { observacao: e.target.value })}
              />
            </Field>
          </ExpandableCard>
        ))}
        <Field label="Observação geral de segurança">
          <Input
            value={state.segurancaObservacao}
            onChange={(e) => patch({ segurancaObservacao: e.target.value })}
          />
        </Field>
      </CollapsibleSection>

      {/* PLANTA */}
      <CollapsibleSection
        title="Planta"
        badge={state.plantas.length || undefined}
        action={
          <Button size="sm" onClick={() => addItem("plantas", emptyPlantaInfo())}>
            <Plus size={14} /> Adicionar informação
          </Button>
        }
      >
        {state.plantas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma informação da planta.</p>
        ) : null}
        {state.plantas.map((p, i) => (
          <ExpandableCard
            key={p.id}
            title={p.planta.trim() || `Informação ${String(i + 1).padStart(2, "0")}`}
            summary={joinSummary(p.situacao, p.motivo, p.atividade)}
            open={open.plantas === p.id}
            onToggle={() => setOpenIn("plantas", p.id)}
            onDelete={() => removeItem("plantas", p.id)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Choice
                label="Planta"
                value={p.planta}
                onChange={(v) => updateItem("plantas", p.id, { planta: v })}
                options={PLANTAS}
              />
              <Choice
                label="Situação"
                value={p.situacao}
                onChange={(v) => updateItem("plantas", p.id, { situacao: v })}
                options={PLANTA_SITUACOES}
              />
            </div>
            <Field label="Motivo">
              <Input
                value={p.motivo}
                onChange={(e) => updateItem("plantas", p.id, { motivo: e.target.value })}
                placeholder="umidade do material"
              />
            </Field>
            <Field label="Atividade">
              <Input
                value={p.atividade}
                onChange={(e) => updateItem("plantas", p.id, { atividade: e.target.value })}
              />
            </Field>
            <Field label="Observação">
              <Input
                value={p.observacao}
                onChange={(e) => updateItem("plantas", p.id, { observacao: e.target.value })}
              />
            </Field>
          </ExpandableCard>
        ))}
      </CollapsibleSection>

      {/* MINA */}
      <CollapsibleSection
        title="Mina"
        badge={state.bancos.length || undefined}
        action={
          <Button size="sm" onClick={() => addItem("bancos", emptyBancoInfo())}>
            <Plus size={14} /> Adicionar banco
          </Button>
        }
      >
        {state.bancos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum banco adicionado.</p>
        ) : null}
        {state.bancos.map((b, i) => (
          <ExpandableCard
            key={b.id}
            title={b.banco.trim() || `Banco ${String(i + 1).padStart(2, "0")}`}
            summary={joinSummary(b.situacao, b.blend, b.atividade)}
            open={open.bancos === b.id}
            onToggle={() => setOpenIn("bancos", b.id)}
            onDelete={() => removeItem("bancos", b.id)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Banco">
                <Input
                  autoFocus
                  list="lista-bancos-ata"
                  value={b.banco}
                  onChange={(e) => updateItem("bancos", b.id, { banco: e.target.value })}
                  placeholder="B-1060"
                />
              </Field>
              <Choice
                label="Situação"
                value={b.situacao}
                onChange={(v) => updateItem("bancos", b.id, { situacao: v })}
                options={BANCO_SITUACOES}
              />
            </div>
            <Field label="Blend">
              <Input
                value={b.blend}
                onChange={(e) => updateItem("bancos", b.id, { blend: e.target.value })}
                placeholder="conforme definido"
              />
            </Field>
            <Field label="Atividade">
              <Input
                value={b.atividade}
                onChange={(e) => updateItem("bancos", b.id, { atividade: e.target.value })}
                placeholder="conformação do acesso"
              />
            </Field>
            <Field label="Observação">
              <Input
                value={b.observacao}
                onChange={(e) => updateItem("bancos", b.id, { observacao: e.target.value })}
              />
            </Field>
          </ExpandableCard>
        ))}
        <datalist id="lista-bancos-ata">
          {BANCOS_ATA.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
      </CollapsibleSection>

      {/* COMUNICADOS */}
      <CollapsibleSection
        title="Comunicados"
        badge={state.comunicados.length || undefined}
        action={
          <Button size="sm" onClick={() => addItem("comunicados", emptyComunicado())}>
            <Plus size={14} /> Adicionar comunicado
          </Button>
        }
      >
        {state.comunicados.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum comunicado adicionado.</p>
        ) : null}
        {state.comunicados.map((c, i) => (
          <ExpandableCard
            key={c.id}
            title={c.assunto.trim() || `Comunicado ${String(i + 1).padStart(2, "0")}`}
            summary={joinSummary(c.local, c.atividade, c.objetivo)}
            open={open.comunicados === c.id}
            onToggle={() => setOpenIn("comunicados", c.id)}
            onDelete={() => removeItem("comunicados", c.id)}
          >
            <Field label="Assunto">
              <Input
                autoFocus
                value={c.assunto}
                onChange={(e) => updateItem("comunicados", c.id, { assunto: e.target.value })}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Local">
                <Input
                  value={c.local}
                  onChange={(e) => updateItem("comunicados", c.id, { local: e.target.value })}
                />
              </Field>
              <Field label="Equipamentos envolvidos">
                <Input
                  value={c.equipamentos}
                  onChange={(e) => updateItem("comunicados", c.id, { equipamentos: e.target.value })}
                />
              </Field>
              <Field label="Atividade">
                <Input
                  value={c.atividade}
                  onChange={(e) => updateItem("comunicados", c.id, { atividade: e.target.value })}
                />
              </Field>
              <Field label="Objetivo">
                <Input
                  value={c.objetivo}
                  onChange={(e) => updateItem("comunicados", c.id, { objetivo: e.target.value })}
                />
              </Field>
              <Field label="Origem do alinhamento">
                <Input
                  value={c.origem}
                  onChange={(e) => updateItem("comunicados", c.id, { origem: e.target.value })}
                />
              </Field>
              <Field label="Responsável">
                <Input
                  value={c.responsavel}
                  onChange={(e) => updateItem("comunicados", c.id, { responsavel: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Atividade prevista na diretriz?">
              <ToggleChips
                options={["Sim", "Não"]}
                multiple={false}
                selected={c.naDiretriz === "sim" ? ["Sim"] : c.naDiretriz === "nao" ? ["Não"] : []}
                onToggle={(v) => {
                  const val = v === "Sim" ? "sim" : "nao";
                  updateItem("comunicados", c.id, {
                    naDiretriz: c.naDiretriz === val ? "" : (val as "sim" | "nao"),
                  });
                }}
              />
            </Field>
            {c.naDiretriz === "nao" ? (
              <div className="space-y-3 rounded-md bg-muted/40 p-3">
                <Field label="Com quem foi realizado o alinhamento?">
                  <Input
                    value={c.alinhamentoCom}
                    onChange={(e) =>
                      updateItem("comunicados", c.id, { alinhamentoCom: e.target.value })
                    }
                  />
                </Field>
                <Field label="Quem repassou a informação?">
                  <Input
                    value={c.repassadoPor}
                    onChange={(e) =>
                      updateItem("comunicados", c.id, { repassadoPor: e.target.value })
                    }
                  />
                </Field>
                <Field label="Observação">
                  <Input
                    value={c.observacaoDiretriz}
                    onChange={(e) =>
                      updateItem("comunicados", c.id, { observacaoDiretriz: e.target.value })
                    }
                  />
                </Field>
              </div>
            ) : null}
            <Field label="Observação">
              <Input
                value={c.observacao}
                onChange={(e) => updateItem("comunicados", c.id, { observacao: e.target.value })}
              />
            </Field>
          </ExpandableCard>
        ))}
      </CollapsibleSection>

      {/* PONTO IMPORTANTE */}
      <CollapsibleSection
        title="Ponto importante"
        badge={state.pontos.length || undefined}
        action={
          <Button size="sm" onClick={() => addItem("pontos", emptyPonto())}>
            <Plus size={14} /> Adicionar ponto
          </Button>
        }
      >
        {state.pontos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum ponto adicionado.</p>
        ) : null}
        {state.pontos.map((p, i) => (
          <ExpandableCard
            key={p.id}
            title={p.titulo.trim() || `Ponto ${String(i + 1).padStart(2, "0")}`}
            summary={joinSummary(p.decisao, p.responsavel, p.meio)}
            open={open.pontos === p.id}
            onToggle={() => setOpenIn("pontos", p.id)}
            onDelete={() => removeItem("pontos", p.id)}
          >
            <Field label="Título">
              <Input
                autoFocus
                value={p.titulo}
                onChange={(e) => updateItem("pontos", p.id, { titulo: e.target.value })}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Responsável pelo alinhamento">
                <Input
                  value={p.responsavel}
                  onChange={(e) => updateItem("pontos", p.id, { responsavel: e.target.value })}
                />
              </Field>
              <Choice
                label="Meio do alinhamento"
                value={p.meio}
                onChange={(v) => updateItem("pontos", p.id, { meio: v })}
                options={MEIOS_ALINHAMENTO}
              />
            </div>
            <Field label="Decisão / regra">
              <Textarea
                rows={2}
                value={p.decisao}
                onChange={(e) => updateItem("pontos", p.id, { decisao: e.target.value })}
              />
            </Field>
            <Field label="Condição">
              <Input
                value={p.condicao}
                onChange={(e) => updateItem("pontos", p.id, { condicao: e.target.value })}
              />
            </Field>
            <Field label="Ação necessária">
              <Input
                value={p.acao}
                onChange={(e) => updateItem("pontos", p.id, { acao: e.target.value })}
              />
            </Field>
          </ExpandableCard>
        ))}
      </CollapsibleSection>

      {/* PRÓXIMA REUNIÃO */}
      <CollapsibleSection title="Próxima reunião">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Data">
            <Input
              type="date"
              value={state.proximaData}
              onChange={(e) => patch({ proximaData: e.target.value })}
            />
          </Field>
          <Field label="Hora">
            <Input
              type="time"
              value={state.proximaHora}
              onChange={(e) => patch({ proximaHora: e.target.value })}
            />
          </Field>
        </div>
      </CollapsibleSection>

      {/* Ações */}
      <div className="flex flex-wrap items-center gap-2">
        <AiReviewDialog
          kind="ata"
          structured={texto}
          current={preview}
          onApply={(t) => {
            setPreview(t);
            setEditando(false);
            patch({ conteudo: t });
          }}
        />
        <Button size="lg" onClick={gerar}>
          <Wand2 size={18} /> Gerar ata
        </Button>
        {preview ? (
          <>
            <Button variant="outline" onClick={() => setEditando((v) => !v)}>
              <ShieldCheck size={16} /> {editando ? "Concluir edição" : "Editar"}
            </Button>
            <Button variant="outline" onClick={gerar}>
              <Wand2 size={16} /> Gerar novamente
            </Button>
            <CopyButton text={preview} label="Copiar ata" size="default" variant="secondary" />
            <Button
              variant="outline"
              onClick={() =>
                baixarDocx({ ...state, conteudo: preview }).catch(() =>
                  toast.error("Não foi possível gerar o Word"),
                )
              }
            >
              <FileText size={16} /> Baixar Word
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                baixarPdf({ ...state, conteudo: preview }).catch(() =>
                  toast.error("Não foi possível gerar o PDF"),
                )
              }
            >
              <FileDown size={16} /> Baixar PDF
            </Button>
          </>
        ) : null}
      </div>

      {preview ? (
        <section className="rounded-lg border bg-card">
          <header className="border-b px-4 py-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-card-foreground">
              Pré-visualização da ata
            </h2>
          </header>
          <div className="p-4">
            {editando ? (
              <Textarea
                rows={20}
                value={preview}
                onChange={(e) => {
                  setPreview(e.target.value);
                  patch({ conteudo: e.target.value });
                }}
                className="font-sans text-sm"
              />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-card-foreground">
                {preview}
              </pre>
            )}
          </div>
        </section>
      ) : (
        <p className="text-xs text-muted-foreground">
          {texto ? "Clique em Gerar ata para visualizar o documento." : ""}
        </p>
      )}
    </div>
  );
}
