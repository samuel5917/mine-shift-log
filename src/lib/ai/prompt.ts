export type AiDocKind = "assistente" | "ata";

export const AI_SYSTEM_PROMPT =
  "Você é um assistente responsável por revisar e organizar informes operacionais de uma mina. " +
  "Sua função é transformar informações fornecidas pelo usuário em um texto profissional, claro, objetivo e fiel aos dados originais. " +
  "Nunca invente informações, horários, causas, valores, equipamentos, ocorrências ou acontecimentos. " +
  "Quando uma informação não estiver disponível, simplesmente não a inclua. " +
  "Preserve integralmente números, horários, nomes de equipamentos e demais dados fornecidos. " +
  "Corrija erros gramaticais e de digitação, melhore a clareza e a fluidez, evite repetições e mantenha linguagem profissional e operacional " +
  '(ex.: "conforme a Diretriz Operacional", "visando liberar área"). ' +
  "Responda apenas com o texto final revisado, sem comentários, sem títulos extras e sem marcações de markdown.";

const FOCO: Record<AiDocKind, string> = {
  assistente:
    "Tipo do documento: ASSISTENTE DE TURNO (justificativas operacionais do turno). " +
    "Priorize: situação operacional, equipamentos, produção, frentes, paradas, manutenção, ocorrências, horários e informações relevantes do turno. " +
    "Organize em parágrafos curtos por assunto. Não use formato de ata de reunião.",
  ata:
    "Tipo do documento: ATA DE REUNIÃO (alinhamento operacional). " +
    "Priorize: assuntos discutidos, ocorrências, decisões, responsáveis, pendências, encaminhamentos, prazos e informações relevantes da reunião. " +
    "Mantenha a estrutura de ata com seções e tópicos. Não use formato de informe de turno.",
};

export function buildUserPrompt(input: {
  kind: AiDocKind;
  structured: string;
  current: string;
  raw: string;
}) {
  const parts: string[] = [FOCO[input.kind]];
  if (input.structured.trim()) {
    parts.push(`DADOS ESTRUTURADOS PREENCHIDOS NO APLICATIVO:\n${input.structured.trim()}`);
  }
  if (input.current.trim()) {
    parts.push(`TEXTO ATUAL DO INFORME:\n${input.current.trim()}`);
  }
  if (input.raw.trim()) {
    parts.push(
      `TEXTO BRUTO ENVIADO PELO USUÁRIO (ex.: mensagem de WhatsApp) — interprete e aproveite apenas as informações realmente presentes:\n${input.raw.trim()}`,
    );
  }
  parts.push(
    "Produza a versão revisada e organizada do documento usando somente as informações acima.",
  );
  return parts.join("\n\n");
}
