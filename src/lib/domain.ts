export type Situation = "OPERANDO" | "DISPONIVEL" | "MANUTENCAO" | "INDISPONIVEL";

export const SITUATIONS: Situation[] = ["OPERANDO", "DISPONIVEL", "MANUTENCAO", "INDISPONIVEL"];

export const SITUATION_LABEL: Record<Situation, string> = {
  OPERANDO: "Operando",
  DISPONIVEL: "Disponível",
  MANUTENCAO: "Manutenção",
  INDISPONIVEL: "Indisponível",
};

/** Colors used ONLY inside the exported corporate document (not the app UI). */
export const SITUATION_DOC_STYLE: Record<Situation, { bg: string; color: string }> = {
  OPERANDO: { bg: "#C6E0B4", color: "#1F5C1F" },
  DISPONIVEL: { bg: "#FFFFFF", color: "#000000" },
  MANUTENCAO: { bg: "#FFC7CE", color: "#9C0006" },
  INDISPONIVEL: { bg: "#FFFF99", color: "#7F6000" },
};

/** Tailwind classes for the app interface badges. */
export const SITUATION_UI_CLASS: Record<Situation, string> = {
  OPERANDO: "bg-status-operando text-status-operando-foreground",
  DISPONIVEL: "bg-status-disponivel text-status-disponivel-foreground",
  MANUTENCAO: "bg-status-manutencao text-status-manutencao-foreground",
  INDISPONIVEL: "bg-status-indisponivel text-status-indisponivel-foreground",
};

export type Category = "auxiliar" | "producao";

export const CATEGORY_TITLE: Record<Category, string> = {
  auxiliar: "Equipamentos Auxiliares",
  producao: "Equipamentos de Produção",
};

export const SHIFT_LABEL: Record<number, string> = { 1: "1º Turno", 2: "2º Turno" };

export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function todayISO(): string {
  const now = new Date();
  const off = now.getTimezoneOffset();
  return new Date(now.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function reportFileName(date: string, shift: number): string {
  return `Informe_de_Turno_${date}_Turno-${shift}.png`;
}
