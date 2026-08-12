export type PlantaMotivo =
  | "Planta parada"
  | "Pulmão cheio"
  | "Sem necessidade operacional"
  | "Aguardando atividade"
  | "Orientação operacional"
  | "Outro";

export type Planta02Status = "Atendido" | "Atendido parcialmente" | "Não atendido" | "Não se aplica";

export interface PlantaEntry {
  movimentacao: "sem" | "com" | "";
  motivos: string[];
  motivoOutro: string;
  status02?: Planta02Status | "";
  programadas: string;
  realizadas: string;
  motivosNaoAtendimento: string[];
  motivoNaoAtendimentoOutro: string;
}

export interface BancoEntry {
  id: string;
  banco: string;
  planta01: PlantaEntry;
  planta02: PlantaEntry;
  reiniciado: "sim" | "nao" | "";
  reinicioForma: string;
  reinicioOutro: string;
}

export interface MovimentacaoEntry {
  id: string;
  tipo: string;
  origem: string;
  destino: string;
  material: string;
  quantidade: string;
  unidade: string;
  finalidade: string;
  observacao: string;
}

export interface ParadaEntry {
  id: string;
  local: string;
  localOutro: string;
  inicio: string;
  fim: string;
  motivo: string;
  motivoOutro: string;
  observacao: string;
}

export interface ImpactoEntry {
  nome: string;
  descricaoOutro: string;
  alvo: string;
  horario: string;
  duracao: string;
  observacao: string;
}

export interface ObservacaoEntry {
  id: string;
  categoria: string;
  texto: string;
}

export interface ModeloFrase {
  id: string;
  nome: string;
  situacao: string;
  texto: string;
}

export interface AssistenteState {
  bancos: BancoEntry[];
  movimentacoes: MovimentacaoEntry[];
  paradas: ParadaEntry[];
  impactos: ImpactoEntry[];
  observacoes: ObservacaoEntry[];
  modelos: ModeloFrase[];
  textos: Record<string, string>;
}

export const STORAGE_KEY = "trindade_assistente_turno";

export const BANCOS = [
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

export const PLANTA_MOTIVOS: string[] = [
  "Planta parada",
  "Pulmão cheio",
  "Sem necessidade operacional",
  "Aguardando atividade",
  "Orientação operacional",
  "Outro",
];

export const PLANTA02_STATUS: Planta02Status[] = [
  "Atendido",
  "Atendido parcialmente",
  "Não atendido",
  "Não se aplica",
];

export const MOTIVOS_NAO_ATENDIMENTO: string[] = [
  "Material úmido",
  "Falta de frente seca",
  "Falta de material",
  "Falta de material desmontado",
  "Rompedor em manutenção",
  "Aguardando geração de material",
  "Pulmão cheio",
  "Baixa disponibilidade de caminhões",
  "Baixa disponibilidade de motoristas",
  "Parada da planta",
  "Parada operacional",
  "Equipamento em manutenção",
  "Problema operacional",
  "Condição de acesso",
  "Falta de área para estoque",
  "Falta de área para basculamento",
  "Outro",
];

export const REINICIO_FORMAS = [
  "De maneira proporcional",
  "Mantendo a proporção entre as frentes",
  "Conforme Diretriz Operacional",
  "Após normalização da operação",
  "Outro",
];

export const TIPOS_MOVIMENTACAO = [
  "OM",
  "Reprocesso",
  "Estoque",
  "Aterro",
  "Lastro",
  "Conformação",
  "Retaludamento",
  "Rampa operacional",
  "Outros",
];

export const UNIDADES = ["Viagens", "Toneladas", "m³", "Cargas"];

export const LOCAIS_PARADA = [
  "Planta 01",
  "Planta 02",
  "Pulmão Planta 01",
  "Pulmão Planta 02",
  "Banco",
  "Outro",
];

export const MOTIVOS_PARADA = [
  "Pulmão cheio",
  "Falta de material",
  "Aguardando gerar material",
  "Falta de rompedor",
  "Planta parada",
  "Necessidade interna",
  "Manutenção",
  "Falta de caminhões",
  "Falta de motorista",
  "Falta de área",
  "Outro",
];

export const IMPACTOS = [
  "Baixa disponibilidade de caminhões",
  "Baixa disponibilidade de motoristas",
  "Falta de material desmontado",
  "Material úmido",
  "Pulmão cheio",
  "Planta parada",
  "Rompedor em manutenção",
  "Falta de geração de material",
  "Falta de área para estoque",
  "Falta de área para basculamento",
  "Problemas de acesso",
  "Manutenção de equipamentos",
  "Paradas operacionais",
  "Condição climática",
  "Energia elétrica",
  "Outro",
];

export const CATEGORIAS_OBSERVACAO = [
  "Planta 01",
  "Planta 02",
  "Pulmão",
  "Equipamentos",
  "Blend",
  "Estoque",
  "Próximo turno",
  "Outros",
];

export function emptyPlanta(): PlantaEntry {
  return {
    movimentacao: "",
    motivos: [],
    motivoOutro: "",
    status02: "",
    programadas: "",
    realizadas: "",
    motivosNaoAtendimento: [],
    motivoNaoAtendimentoOutro: "",
  };
}

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export function emptyBanco(banco = ""): BancoEntry {
  return {
    id: newId(),
    banco,
    planta01: emptyPlanta(),
    planta02: emptyPlanta(),
    reiniciado: "",
    reinicioForma: "",
    reinicioOutro: "",
  };
}

export function emptyMovimentacao(tipo = "OM"): MovimentacaoEntry {
  return {
    id: newId(),
    tipo,
    origem: "",
    destino: "",
    material: "",
    quantidade: "",
    unidade: "Viagens",
    finalidade: "",
    observacao: "",
  };
}

export function emptyParada(): ParadaEntry {
  return {
    id: newId(),
    local: "",
    localOutro: "",
    inicio: "",
    fim: "",
    motivo: "",
    motivoOutro: "",
    observacao: "",
  };
}

export function emptyState(): AssistenteState {
  return {
    bancos: [],
    movimentacoes: [],
    paradas: [],
    impactos: [],
    observacoes: [],
    modelos: [
      {
        id: newId(),
        nome: "Blend atendido",
        situacao: "Blend",
        texto: "Blend atendido conforme a Diretriz Operacional.",
      },
    ],
    textos: {},
  };
}
