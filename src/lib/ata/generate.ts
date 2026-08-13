import type {
  AtaState,
  BancoInfo,
  Comunicado,
  Ocorrencia,
  Participante,
  PlantaInfo,
  PontoImportante,
} from "./types";

export interface AtaSecao {
  titulo: string;
  linhas: string[];
}

const t = (v?: string) => (v ?? "").trim();
const has = (v?: string) => t(v).length > 0;

export function formatDataBR(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function formatDataCurta(iso: string) {
  if (!iso) return "";
  const [, m, d] = iso.split("-");
  if (!m || !d) return formatDataBR(iso);
  return `${d}/${m}`;
}

export function formatHora(hora: string) {
  if (!hora) return "";
  const [h, mi] = hora.split(":");
  if (!h) return hora;
  return mi && mi !== "00" ? `${h}h${mi}` : `${h}h`;
}

/** Ex.: "Joelmir - Supervisor da Mina (Trindade)" */
export function participanteLinha(p: Participante) {
  const nome = t(p.nome);
  if (!nome) return "";
  const funcao = t(p.funcao);
  const empresa = t(p.empresa);
  let linha = nome;
  if (funcao) linha += ` - ${funcao}`;
  if (empresa) linha += ` (${empresa})`;
  return linha;
}

function ocorrenciaTexto(o: Ocorrencia, i: number) {
  const partes: string[] = [];
  const desc = t(o.descricao);
  partes.push(desc ? `Ocorrência ${i + 1}: ${desc}.` : `Ocorrência ${i + 1}.`);
  if (has(o.local)) partes.push(`Local: ${t(o.local)}.`);
  if (has(o.horario)) partes.push(`Horário: ${t(o.horario)}.`);
  if (has(o.acao)) partes.push(`Ação tomada: ${t(o.acao)}.`);
  if (has(o.observacao)) partes.push(`Observação: ${t(o.observacao)}.`);
  return partes.join(" ");
}

function plantaTexto(p: PlantaInfo) {
  const nome = t(p.planta);
  const situacao = t(p.situacao).toLowerCase();
  const partes: string[] = [];
  if (nome && situacao) {
    if (situacao === "parada") partes.push(`A ${nome} encontra-se parada`);
    else if (situacao === "aguardando material") partes.push(`A ${nome} encontra-se aguardando material`);
    else if (situacao === "transferência de material")
      partes.push(`A ${nome} está realizando transferência de material`);
    else partes.push(`A ${nome} está ${situacao}`);
    if (has(p.motivo)) partes.push(` devido a ${t(p.motivo)}`);
    partes.push(".");
  } else if (nome) {
    partes.push(`${nome}.`);
  } else if (situacao) {
    partes.push(`${t(p.situacao)}.`);
  }
  let texto = partes.join("");
  if (has(p.atividade)) texto += ` Está sendo executada a seguinte atividade: ${t(p.atividade)}.`;
  if (has(p.observacao)) texto += ` Observação: ${t(p.observacao)}.`;
  return texto.trim();
}

function bancoTexto(b: BancoInfo) {
  const nome = t(b.banco);
  const situacao = t(b.situacao);
  const atividade = t(b.atividade);
  let texto = "";
  if (nome && situacao) {
    if (situacao === "Aguardando liberação") {
      texto = `Neste momento, estamos aguardando a liberação do acesso ao banco ${nome}`;
      texto += atividade ? `, onde está sendo executada a ${atividade}.` : ".";
    } else if (situacao === "Em conformação") {
      texto = `O banco ${nome} encontra-se em conformação`;
      texto += atividade ? `, com a execução de ${atividade}.` : ".";
    } else if (situacao === "Parado") {
      texto = `O banco ${nome} encontra-se parado.`;
    } else if (situacao === "Em manutenção") {
      texto = `O banco ${nome} encontra-se em manutenção.`;
    } else if (situacao === "Operando") {
      texto = `O banco ${nome} está operando.`;
    } else {
      texto = `Banco ${nome}: ${situacao}.`;
    }
  } else if (nome) {
    texto = `Banco ${nome}.`;
  } else if (situacao) {
    texto = `${situacao}.`;
  }
  if (has(b.blend)) texto += ` Blend: ${t(b.blend)}.`;
  if (atividade && !texto.includes(atividade)) texto += ` Atividade: ${atividade}.`;
  if (has(b.observacao)) texto += ` Observação: ${t(b.observacao)}.`;
  return texto.trim();
}

function comunicadoTexto(c: Comunicado, i: number) {
  const assunto = t(c.assunto);
  let texto = assunto ? `${assunto}.` : `Comunicado ${String(i + 1).padStart(2, "0")}.`;
  if (has(c.local)) texto += ` Local: ${t(c.local)}.`;
  if (has(c.equipamentos)) texto += ` Equipamentos envolvidos: ${t(c.equipamentos)}.`;
  if (has(c.atividade)) texto += ` Atividade: ${t(c.atividade)}.`;
  if (has(c.objetivo)) texto += ` Objetivo: ${t(c.objetivo)}.`;
  if (has(c.origem)) texto += ` Origem do alinhamento: ${t(c.origem)}.`;
  if (has(c.responsavel)) texto += ` Responsável: ${t(c.responsavel)}.`;
  if (c.naDiretriz === "sim") {
    texto += " Atividade prevista na Diretriz Operacional.";
  } else if (c.naDiretriz === "nao") {
    texto += " Atividade não prevista na Diretriz Operacional.";
    if (has(c.alinhamentoCom)) texto += ` Alinhamento realizado com ${t(c.alinhamentoCom)}.`;
    if (has(c.repassadoPor)) texto += ` Informação repassada por ${t(c.repassadoPor)}.`;
    if (has(c.observacaoDiretriz)) texto += ` Observação: ${t(c.observacaoDiretriz)}.`;
  }
  if (has(c.observacao)) texto += ` Observação: ${t(c.observacao)}.`;
  return texto.trim();
}

function pontoTexto(p: PontoImportante) {
  const titulo = t(p.titulo);
  let texto = titulo ? `${titulo}.` : "";
  if (has(p.decisao)) texto += ` ${t(p.decisao)}${t(p.decisao).endsWith(".") ? "" : "."}`;
  if (has(p.condicao)) texto += ` Condição: ${t(p.condicao)}.`;
  if (has(p.acao)) texto += ` Ação necessária: ${t(p.acao)}.`;
  if (has(p.responsavel)) texto += ` Alinhamento realizado por ${t(p.responsavel)}`;
  if (has(p.responsavel) && has(p.meio)) texto += ` via ${t(p.meio).toLowerCase()}`;
  if (has(p.responsavel)) texto += ".";
  else if (has(p.meio)) texto += ` Meio do alinhamento: ${t(p.meio)}.`;
  return texto.trim();
}

export function proximaReuniaoTexto(state: AtaState) {
  const d = formatDataCurta(state.proximaData);
  const h = formatHora(state.proximaHora);
  if (!d && !h) return "";
  if (d && h) return `Próxima reunião: ${d} às ${h}`;
  if (d) return `Próxima reunião: ${d}`;
  return `Próxima reunião: ${h}`;
}

export function gerarSecoes(state: AtaState): AtaSecao[] {
  const secoes: AtaSecao[] = [];

  const participantes = state.participantes.map(participanteLinha).filter(Boolean);
  if (participantes.length) secoes.push({ titulo: "PRESENTES", linhas: participantes });

  const seg: string[] = [];
  if (state.segurancaStatus.includes("Sem ocorrências"))
    seg.push("Não houve registro de ocorrências de segurança no período.");
  if (state.segurancaStatus.includes("Reforçar padrões"))
    seg.push("Reforçada a necessidade do cumprimento dos padrões de segurança pelas equipes.");
  state.ocorrencias.forEach((o, i) => {
    const texto = ocorrenciaTexto(o, i);
    if (texto) seg.push(texto);
  });
  if (has(state.segurancaObservacao)) seg.push(t(state.segurancaObservacao));
  if (seg.length) secoes.push({ titulo: "SEGURANÇA", linhas: seg });

  const plantas = state.plantas.map(plantaTexto).filter(Boolean);
  if (plantas.length) secoes.push({ titulo: "PLANTA", linhas: plantas });

  const bancos = state.bancos.map(bancoTexto).filter(Boolean);
  if (bancos.length) secoes.push({ titulo: "MINA", linhas: bancos });

  const comunicados = state.comunicados.map(comunicadoTexto).filter(Boolean);
  if (comunicados.length) secoes.push({ titulo: "COMUNICADOS", linhas: comunicados });

  const pontos = state.pontos.map(pontoTexto).filter(Boolean);
  if (pontos.length) secoes.push({ titulo: "PONTO IMPORTANTE", linhas: pontos });

  const prox = proximaReuniaoTexto(state);
  if (prox) secoes.push({ titulo: "PRÓXIMA REUNIÃO", linhas: [prox] });

  return secoes;
}

export function gerarAtaTexto(state: AtaState): string {
  const linhas: string[] = ["ATA", "Reunião de alinhamento", ""];
  if (state.data) linhas.push(`DATA: ${formatDataBR(state.data)}`);
  if (state.hora) linhas.push(`HORA: ${formatHora(state.hora)}`);
  if (state.data || state.hora) linhas.push("");

  for (const s of gerarSecoes(state)) {
    linhas.push(s.titulo);
    for (const l of s.linhas) linhas.push(`• ${l}`);
    linhas.push("");
  }
  return linhas.join("\n").trim();
}

export function nomeArquivo(state: AtaState, ext: "docx" | "pdf") {
  const base = state.data ? formatDataBR(state.data).replace(/\//g, "-") : "sem-data";
  return `Ata_Reuniao_Alinhamento_${base}.${ext}`;
}
