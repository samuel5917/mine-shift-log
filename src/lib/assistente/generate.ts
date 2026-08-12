import type {
  AssistenteState,
  BancoEntry,
  ImpactoEntry,
  MovimentacaoEntry,
  ObservacaoEntry,
  ParadaEntry,
  PlantaEntry,
} from "./types";

/** Frases operacionais associadas a cada motivo, para redação natural. */
const MOTIVO_FRASE: Record<string, string> = {
  "Material úmido": "da elevada umidade do material",
  "Falta de frente seca": "da indisponibilidade de frente seca para blendagem",
  "Falta de material": "da falta de material",
  "Falta de material desmontado": "da falta de material desmontado",
  "Rompedor em manutenção": "do rompedor em manutenção",
  "Aguardando geração de material": "da espera pela geração de material",
  "Pulmão cheio": "do pulmão cheio",
  "Baixa disponibilidade de caminhões": "da baixa disponibilidade de caminhões",
  "Baixa disponibilidade de motoristas": "da baixa disponibilidade de motoristas",
  "Parada da planta": "da parada da planta",
  "Parada operacional": "de parada operacional",
  "Equipamento em manutenção": "de equipamento em manutenção",
  "Problema operacional": "de problema operacional",
  "Condição de acesso": "das condições de acesso",
  "Falta de área para estoque": "da falta de área para estoque",
  "Falta de área para basculamento": "da falta de área para basculamento",
  "Planta parada": "da planta parada",
  "Sem necessidade operacional": "da ausência de necessidade operacional",
  "Aguardando atividade": "da espera por liberação de atividade",
  "Orientação operacional": "de orientação operacional",
  "Problemas de acesso": "das condições de acesso",
  "Manutenção de equipamentos": "de manutenção de equipamentos",
  "Paradas operacionais": "de paradas operacionais",
  "Condição climática": "das condições climáticas",
  "Energia elétrica": "de indisponibilidade de energia elétrica",
  "Falta de geração de material": "da falta de geração de material",
  "Falta de rompedor": "da indisponibilidade de rompedor",
  "Aguardando gerar material": "da espera pela geração de material",
  "Necessidade interna": "de necessidade interna",
  Manutenção: "de manutenção",
  "Falta de caminhões": "da falta de caminhões",
  "Falta de motorista": "da falta de motorista",
  "Falta de área": "da falta de área",
};

function frase(motivo: string, outro: string) {
  if (motivo === "Outro") return outro.trim() ? outro.trim() : "";
  return MOTIVO_FRASE[motivo] ?? motivo.toLowerCase();
}

function joinList(items: string[]) {
  const list = items.filter(Boolean);
  if (list.length === 0) return "";
  if (list.length === 1) return list[0] ?? "";
  return `${list.slice(0, -1).join(", ")} e ${list[list.length - 1] ?? ""}`;
}

function motivosTexto(motivos: string[], outro: string) {
  return joinList(motivos.map((m) => frase(m, outro)));
}

const NUM_EXTENSO: Record<number, string> = {
  1: "uma",
  2: "duas",
  3: "três",
  4: "quatro",
  5: "cinco",
  6: "seis",
  7: "sete",
  8: "oito",
  9: "nove",
  10: "dez",
};

export function viagensResumo(programadas: string, realizadas: string) {
  const p = Number(programadas);
  const r = Number(realizadas);
  if (!programadas || !realizadas || Number.isNaN(p) || Number.isNaN(r) || p <= 0) return null;
  const dif = p - r;
  const pct = (r / p) * 100;
  return {
    programadas: p,
    realizadas: r,
    diferenca: dif,
    percentual: pct,
    percentualLabel: `${pct.toFixed(1).replace(".", ",")}% de atendimento`,
    diferencaLabel:
      dif > 0
        ? `${dif} viagem${dif > 1 ? "s" : ""} abaixo do planejado`
        : dif < 0
          ? `${Math.abs(dif)} viagem${Math.abs(dif) > 1 ? "s" : ""} acima do planejado`
          : "Programação integralmente atendida",
  };
}

function plantaTexto(p: PlantaEntry, rotulo: string): string {
  const partes: string[] = [];

  if (p.movimentacao === "sem") {
    const m = motivosTexto(p.motivos, p.motivoOutro);
    partes.push(m ? `Não houve movimentação em virtude ${m}.` : "Não houve movimentação.");
  } else if (p.movimentacao === "com") {
    partes.push("Houve movimentação.");
  }

  const v = viagensResumo(p.programadas, p.realizadas);
  const motivosNA = motivosTexto(p.motivosNaoAtendimento, p.motivoNaoAtendimentoOutro);

  if (p.status02 === "Atendido") {
    partes.push(
      v
        ? `Blend atendido conforme planejamento, com ${v.realizadas} de ${v.programadas} viagens realizadas.`
        : "Blend atendido conforme a Diretriz Operacional.",
    );
  } else if (p.status02 === "Atendido parcialmente" || p.status02 === "Não atendido") {
    const cabeca =
      p.status02 === "Não atendido" ? "Blend não atendido" : "Blend não atendido integralmente";
    let s = cabeca;
    if (v && v.diferenca > 0) {
      const n = NUM_EXTENSO[v.diferenca] ?? String(v.diferenca);
      s += `, com ${n} viagem${v.diferenca > 1 ? "s" : ""} abaixo do planejado (${v.realizadas} de ${v.programadas} viagens, ${v.percentualLabel})`;
    } else if (v) {
      s += ` (${v.realizadas} de ${v.programadas} viagens)`;
    }
    if (motivosNA) s += `, em virtude ${motivosNA}`;
    partes.push(`${s}.`);
  } else if (p.status02 === "Não se aplica") {
    partes.push("Não se aplica.");
  } else if (v || motivosNA) {
    let s = "Blend não atendido integralmente";
    if (v && v.diferenca > 0) {
      const n = NUM_EXTENSO[v.diferenca] ?? String(v.diferenca);
      s += `, com ${n} viagem${v.diferenca > 1 ? "s" : ""} abaixo do planejado`;
    }
    if (motivosNA) s += `, em virtude ${motivosNA}`;
    partes.push(`${s}.`);
  }

  if (partes.length === 0) return "";
  return `${rotulo}: ${partes.join(" ")}`;
}

export function bancoTexto(b: BancoEntry): string {
  const blocos = [plantaTexto(b.planta01, "Planta 01"), plantaTexto(b.planta02, "Planta 02")].filter(
    Boolean,
  );
  if (blocos.length === 0 && b.reiniciado !== "sim") return "";

  let texto = `${b.banco || "Banco não informado"}: ${blocos.join(" ")}`.trim();

  if (b.reiniciado === "sim") {
    const forma =
      b.reinicioForma === "Outro"
        ? b.reinicioOutro.trim()
        : b.reinicioForma
          ? b.reinicioForma.charAt(0).toLowerCase() + b.reinicioForma.slice(1)
          : "";
    texto += forma
      ? ` Blend posteriormente reiniciado ${forma}, mantendo a proporcionalidade adequada entre as frentes.`
      : " Blend posteriormente reiniciado.";
  }
  return texto.trim();
}

export function movimentacaoTexto(m: MovimentacaoEntry): string {
  const qtd = m.quantidade.trim();
  const un = qtd ? ` ${(m.unidade || "").toLowerCase()}`.trimEnd() : "";
  const quantidade = qtd ? `${qtd}${un}` : "";
  const finalidade = m.finalidade.trim();
  const obs = m.observacao.trim();

  let base = "";
  if (m.tipo === "OM") {
    const rota = m.origem && m.destino ? `${m.origem} x ${m.destino}` : m.origem || m.destino;
    base = `OM${rota ? ` ${rota}` : ""}${finalidade ? ` para ${finalidade.toLowerCase()}` : ""}${
      quantidade ? `: ${quantidade}` : ""
    }`;
  } else if (m.tipo === "Estoque") {
    const partes = ["Produto destinado ao estoque:"];
    const mat = [quantidade, m.material.trim() ? `de ${m.material.trim()}` : ""]
      .filter(Boolean)
      .join(" ");
    if (mat) partes.push(mat);
    if (m.origem) partes.push(`da ${m.origem}`);
    if (m.destino) partes.push(`para a ${m.destino}`);
    if (finalidade) partes.push(`visando ${finalidade.toLowerCase()}`);
    base = partes.join(" ");
  } else if (m.tipo === "Reprocesso") {
    const partes = ["Reprocesso"];
    if (m.material) partes.push(`de ${m.material}`);
    if (quantidade) partes.push(`(${quantidade})`);
    if (m.origem) partes.push(`da ${m.origem}`);
    if (m.destino) partes.push(`para ${m.destino}`);
    if (finalidade) partes.push(`em razão de ${finalidade.toLowerCase()}`);
    base = partes.join(" ");
  } else {
    const partes = [m.tipo || "Movimentação"];
    if (m.material) partes.push(`de ${m.material}`);
    const rota = m.origem && m.destino ? `${m.origem} x ${m.destino}` : m.origem || m.destino;
    if (rota) partes.push(rota);
    if (finalidade) partes.push(`para ${finalidade.toLowerCase()}`);
    if (quantidade) partes.push(`: ${quantidade}`);
    base = partes.join(" ").replace(" : ", ": ");
  }

  base = base.trim();
  if (!base) return "";
  if (!base.endsWith(".")) base += ".";
  return obs ? `${base} ${obs.endsWith(".") ? obs : `${obs}.`}` : base;
}

export function duracaoParada(inicio: string, fim: string): string | null {
  if (!inicio || !fim) return null;
  const [hi = NaN, mi = NaN] = inicio.split(":").map(Number);
  const [hf = NaN, mf = NaN] = fim.split(":").map(Number);
  if ([hi, mi, hf, mf].some((n) => Number.isNaN(n))) return null;
  let mins = hf * 60 + mf - (hi * 60 + mi);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}min`;
}

export function paradaTexto(p: ParadaEntry): string {
  const local = p.local === "Outro" ? p.localOutro.trim() : p.local;
  const motivo = p.motivo === "Outro" ? p.motivoOutro.trim() : p.motivo;
  if (!local && !motivo && !p.inicio) return "";
  const horario = p.inicio && p.fim ? `${p.inicio} às ${p.fim}` : p.inicio || "";
  const dur = duracaoParada(p.inicio, p.fim);
  const partes: string[] = [];
  if (horario) partes.push(horario);
  if (dur) partes.push(`duração de ${dur}`);
  let texto = local ? `${local}` : "Parada operacional";
  if (partes.length) texto += `: ${partes.join(", ")}`;
  if (motivo) texto += ` — ${motivo}`;
  if (p.observacao.trim()) texto += `, ${p.observacao.trim()}`;
  if (!texto.endsWith(".")) texto += ".";
  return texto;
}

export function impactoTexto(i: ImpactoEntry): string {
  const nome = i.nome === "Outro" ? i.descricaoOutro.trim() : i.nome;
  if (!nome) return "";
  const det: string[] = [];
  if (i.alvo.trim()) det.push(i.alvo.trim());
  if (i.horario.trim()) det.push(i.horario.trim());
  if (i.duracao.trim()) det.push(`duração de ${i.duracao.trim()}`);
  let texto = nome;
  if (det.length) texto += ` (${det.join(", ")})`;
  if (i.observacao.trim()) texto += ` — ${i.observacao.trim()}`;
  if (!texto.endsWith(".")) texto += ".";
  return texto;
}

export function observacaoTexto(o: ObservacaoEntry): string {
  const t = o.texto.trim();
  if (!t) return "";
  const corpo = t.endsWith(".") ? t : `${t}.`;
  return o.categoria ? `${o.categoria}: ${corpo}` : corpo;
}

export interface SecaoTexto {
  key: string;
  titulo: string;
  texto: string;
}

export function gerarTextos(state: AssistenteState): SecaoTexto[] {
  const blend = state.bancos.map(bancoTexto).filter(Boolean).join("\n");
  const mov = state.movimentacoes.map(movimentacaoTexto).filter(Boolean).join("\n");
  const par = state.paradas.map(paradaTexto).filter(Boolean).join("\n");
  const impLinhas = state.impactos.map(impactoTexto).filter(Boolean);
  const imp = impLinhas.length
    ? `O turno foi impactado por: ${impLinhas.length === 1 ? impLinhas[0] : ""}${
        impLinhas.length > 1 ? "\n" + impLinhas.map((l) => `- ${l}`).join("\n") : ""
      }`.trim()
    : "";
  const obs = state.observacoes.map(observacaoTexto).filter(Boolean).join("\n");

  return [
    { key: "blend", titulo: "JUSTIFICATIVA DO BLEND", texto: blend },
    { key: "movimentacoes", titulo: "OUTRAS MOVIMENTAÇÕES", texto: mov },
    { key: "paradas", titulo: "PARADAS OPERACIONAIS", texto: par },
    { key: "impactos", titulo: "IMPACTOS DO TURNO", texto: imp },
    { key: "observacoes", titulo: "OBSERVAÇÕES DO TURNO", texto: obs },
  ].filter((s) => s.texto.trim().length > 0);
}

export function textoCompleto(secoes: SecaoTexto[]): string {
  return secoes.map((s) => `${s.titulo}\n${s.texto}`).join("\n\n");
}
