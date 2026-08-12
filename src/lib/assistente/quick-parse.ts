import {
  emptyBanco,
  emptyMovimentacao,
  type BancoEntry,
  type MovimentacaoEntry,
} from "./types";

function normalizeBanco(raw: string): string {
  const m = raw.match(/^b[-\s]?(\d{3,4})$/i);
  if (m) return `B-${m[1]}`;
  if (/^baia\s*\d+$/i.test(raw)) return raw.replace(/^baia\s*/i, "Baia ");
  return raw.toUpperCase();
}

const MOTIVO_ALIASES: Array<[RegExp, string]> = [
  [/\búmid|\bumid/i, "Material úmido"],
  [/sem\s+seca|frente\s+seca/i, "Falta de frente seca"],
  [/sem\s+material|falta\s+de\s+material/i, "Falta de material"],
  [/desmontad/i, "Falta de material desmontado"],
  [/rompedor/i, "Rompedor em manutenção"],
  [/pulm[aã]o/i, "Pulmão cheio"],
  [/caminh[oõ]/i, "Baixa disponibilidade de caminhões"],
  [/motorista/i, "Baixa disponibilidade de motoristas"],
  [/planta\s*parada/i, "Parada da planta"],
  [/manuten/i, "Equipamento em manutenção"],
  [/acesso/i, "Condição de acesso"],
  [/estoque/i, "Falta de área para estoque"],
  [/bascul/i, "Falta de área para basculamento"],
];

export interface QuickResult {
  kind: "banco" | "movimentacao" | null;
  banco?: BancoEntry;
  movimentacao?: MovimentacaoEntry;
  faltando: string[];
}

/**
 * Interpreta entradas curtas como:
 *  "B1120 P2 14/15 umido sem seca"
 *  "OM B1080-B1030 7 viagens rampa"
 * Nunca inventa dados: o que não for reconhecido fica em `faltando`.
 */
export function parseQuickEntry(input: string): QuickResult {
  const text = input.trim();
  if (!text) return { kind: null, faltando: [] };

  const tipoMatch = text.match(/^(om|reprocesso|estoque|aterro|lastro|conforma\w*|retalud\w*|rampa)\b/i);
  if (tipoMatch) {
    const tipoRaw = tipoMatch[1]!.toLowerCase();
    const tipo =
      tipoRaw === "om"
        ? "OM"
        : tipoRaw.startsWith("conforma")
          ? "Conformação"
          : tipoRaw.startsWith("retalud")
            ? "Retaludamento"
            : tipoRaw === "rampa"
              ? "Rampa operacional"
              : tipoRaw.charAt(0).toUpperCase() + tipoRaw.slice(1);

    const rest = text.slice(tipoMatch[0].length).trim();
    const mov = emptyMovimentacao(tipo);
    const faltando: string[] = [];

    const rota = rest.match(/(b[-\s]?\d{3,4}|planta\s*0?\d)\s*(?:x|-|para|>)\s*(b[-\s]?\d{3,4}|planta\s*0?\d)/i);
    if (rota) {
      mov.origem = /planta/i.test(rota[1]!) ? capPlanta(rota[1]!) : normalizeBanco(rota[1]!);
      mov.destino = /planta/i.test(rota[2]!) ? capPlanta(rota[2]!) : normalizeBanco(rota[2]!);
    } else {
      faltando.push("Origem/Destino");
    }

    const qtd = rest.match(/(\d+)\s*(viagens?|t|toneladas?|m3|m³|cargas?)?/i);
    if (qtd) {
      mov.quantidade = qtd[1]!;
      const un = (qtd[2] || "").toLowerCase();
      mov.unidade = un.startsWith("t")
        ? "Toneladas"
        : un.startsWith("m")
          ? "m³"
          : un.startsWith("carga")
            ? "Cargas"
            : "Viagens";
    } else {
      faltando.push("Quantidade");
    }

    if (/rampa/i.test(rest)) mov.finalidade = "Formação de rampa operacional";
    else if (/liberar\s+[aá]rea|libera[cç][aã]o/i.test(rest)) mov.finalidade = "Liberar área";
    else if (/aterro/i.test(rest)) mov.finalidade = "Aterro";
    else faltando.push("Finalidade");

    const mat = rest.match(/\b(sinterfeed|granulado|rom|est[eé]ril|min[eé]rio|finos|lastro)\b/i);
    if (mat) mov.material = mat[1]!.charAt(0).toUpperCase() + mat[1]!.slice(1).toLowerCase();

    return { kind: "movimentacao", movimentacao: mov, faltando };
  }

  const bancoMatch = text.match(/\b(b[-\s]?\d{3,4}|baia\s*\d+)\b/i);
  if (!bancoMatch) return { kind: null, faltando: ["Banco"] };

  const banco = emptyBanco(normalizeBanco(bancoMatch[1]!.replace(/\s+/g, "")));
  const faltando: string[] = [];

  const plantaMatch = text.match(/\bp\s*0?([12])\b/i);
  const alvo = plantaMatch?.[1] === "1" ? banco.planta01 : banco.planta02;
  if (!plantaMatch) faltando.push("Planta");

  const viagens = text.match(/(\d+)\s*\/\s*(\d+)/);
  if (viagens) {
    alvo.realizadas = viagens[1]!;
    alvo.programadas = viagens[2]!;
  }

  const motivos = MOTIVO_ALIASES.filter(([re]) => re.test(text)).map(([, label]) => label);
  if (motivos.length) alvo.motivosNaoAtendimento = Array.from(new Set(motivos));

  if (/sem\s+movimenta|n[aã]o\s+houve/i.test(text)) {
    alvo.movimentacao = "sem";
    alvo.motivos = motivos.length ? ["Outro"] : [];
    alvo.motivoOutro = motivos.join(", ");
  } else if (viagens) {
    const r = Number(viagens[1]);
    const p = Number(viagens[2]);
    alvo.status02 = r >= p ? "Atendido" : "Atendido parcialmente";
  } else {
    faltando.push("Viagens programadas/realizadas");
  }

  if (!motivos.length && alvo.status02 !== "Atendido") faltando.push("Motivos");

  return { kind: "banco", banco, faltando };
}

function capPlanta(s: string) {
  const n = s.match(/\d/)?.[0] ?? "";
  return `Planta 0${n}`;
}
