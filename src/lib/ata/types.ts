export const ATA_STORAGE_KEY = "trindade_ata_final_semana";

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export interface Participante {
  id: string;
  nome: string;
  funcao: string;
  empresa: string;
}

export interface Ocorrencia {
  id: string;
  descricao: string;
  local: string;
  horario: string;
  acao: string;
  observacao: string;
}

export interface PlantaInfo {
  id: string;
  planta: string;
  situacao: string;
  motivo: string;
  atividade: string;
  observacao: string;
}

export interface BancoInfo {
  id: string;
  banco: string;
  situacao: string;
  blend: string;
  atividade: string;
  observacao: string;
}

export interface Comunicado {
  id: string;
  assunto: string;
  local: string;
  equipamentos: string;
  atividade: string;
  objetivo: string;
  origem: string;
  responsavel: string;
  observacao: string;
  naDiretriz: "sim" | "nao" | "";
  alinhamentoCom: string;
  repassadoPor: string;
  observacaoDiretriz: string;
}

export interface PontoImportante {
  id: string;
  titulo: string;
  responsavel: string;
  meio: string;
  decisao: string;
  condicao: string;
  acao: string;
}

export interface AtaState {
  data: string;
  hora: string;
  segurancaStatus: string[];
  segurancaObservacao: string;
  ocorrencias: Ocorrencia[];
  participantes: Participante[];
  plantas: PlantaInfo[];
  bancos: BancoInfo[];
  comunicados: Comunicado[];
  pontos: PontoImportante[];
  proximaData: string;
  proximaHora: string;
  conteudo: string;
}

export const PLANTAS = ["Planta 01", "Planta 02", "Outro"];

export const PLANTA_SITUACOES = [
  "Operando normalmente",
  "Operando com restrição",
  "Operando com taxa reduzida",
  "Parada",
  "Aguardando material",
  "Transferência de material",
  "Outro",
];

export const BANCOS_ATA = [
  "B-960",
  "B-980",
  "B-1000",
  "B-1020",
  "B-1030",
  "B-1060",
  "B-1070",
  "B-1080",
  "B-1090",
  "B-1120",
  "Baia 03",
];

export const BANCO_SITUACOES = [
  "Operando",
  "Aguardando liberação",
  "Parado",
  "Em conformação",
  "Em manutenção",
  "Outro",
];

export const SEGURANCA_OPCOES = ["Sem ocorrências", "Reforçar padrões"];

export const MEIOS_ALINHAMENTO = [
  "Reunião",
  "Chamada",
  "WhatsApp",
  "Grupo de produção",
  "E-mail",
  "Outro",
];

export const EMPRESAS = ["Trindade", "Terra Minas", "CCO", "Outro"];

export function emptyParticipante(): Participante {
  return { id: newId(), nome: "", funcao: "", empresa: "" };
}
export function emptyOcorrencia(): Ocorrencia {
  return { id: newId(), descricao: "", local: "", horario: "", acao: "", observacao: "" };
}
export function emptyPlantaInfo(): PlantaInfo {
  return { id: newId(), planta: "", situacao: "", motivo: "", atividade: "", observacao: "" };
}
export function emptyBancoInfo(): BancoInfo {
  return { id: newId(), banco: "", situacao: "", blend: "", atividade: "", observacao: "" };
}
export function emptyComunicado(): Comunicado {
  return {
    id: newId(),
    assunto: "",
    local: "",
    equipamentos: "",
    atividade: "",
    objetivo: "",
    origem: "",
    responsavel: "",
    observacao: "",
    naDiretriz: "",
    alinhamentoCom: "",
    repassadoPor: "",
    observacaoDiretriz: "",
  };
}
export function emptyPonto(): PontoImportante {
  return { id: newId(), titulo: "", responsavel: "", meio: "", decisao: "", condicao: "", acao: "" };
}

export function emptyAta(): AtaState {
  return {
    data: "",
    hora: "",
    segurancaStatus: [],
    segurancaObservacao: "",
    ocorrencias: [],
    participantes: [],
    plantas: [],
    bancos: [],
    comunicados: [],
    pontos: [],
    proximaData: "",
    proximaHora: "",
    conteudo: "",
  };
}
