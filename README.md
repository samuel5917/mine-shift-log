# MineShift

Sistema web para gestão de informes de turno, justificativa do blend,
elaboração de atas e acompanhamento operacional de mineração.

## Tecnologias

- **React 19** + **TypeScript**
- **Vite** (build e dev server)
- **TanStack Router** + **TanStack Start** (SSR/SSG)
- **TanStack Query** (cache de dados)
- **Tailwind CSS 4** + **shadcn/ui** (componentes)
- **Supabase** (banco de dados, autenticação, storage)
- **Lucide React** (ícones)
- **html-to-image** (exportação PNG)
- **OpenRouter** (IA — provedor configurável)

## Instalação

```bash
git clone <repositorio>
cd mineshift
npm install
```

## Configuração

### Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

Variáveis obrigatórias:

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase (navegador) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública do Supabase (navegador) |
| `SUPABASE_URL` | URL do projeto Supabase (servidor) |
| `SUPABASE_PUBLISHABLE_KEY` | Chave pública do Supabase (servidor) |
| `SUPABASE_SECRET_KEY` | Chave administrativa do Supabase (servidor, nunca no navegador) |

Variáveis opcionais:

| Variável | Descrição |
|---|---|
| `WARPULSE_API_KEY` | Chave da API de monitoramento de raios |
| `AI_PROVIDER` | Provedor de IA padrão (ex: `openrouter`) |
| `AI_MODEL` | Modelo de IA padrão |
| `AI_SITE_NAME` | Nome do app para atribuição no OpenRouter |
| `AI_SITE_URL` | URL do app para atribuição no OpenRouter |

### Banco de dados (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Configure as variáveis de ambiente com as credenciais do projeto
3. As migrations em `supabase/migrations/` criam as tabelas, RLS e funções
4. Para aplicar manualmente, execute os arquivos SQL no SQL Editor do Supabase

### IA (Inteligência Artificial)

A IA é usada para revisar informes de turno e atas de reunião.

- O provedor padrão é **OpenRouter**
- Cada usuário configura sua própria API Key em Configurações → IA
- A chave é armazenada no banco, nunca no código
- Para trocar o provedor, edite `src/lib/ai/provider.ts` e adicione um novo provider

Camada de abstração:

```
Aplicação → src/lib/ai/provider.ts (interface AiProvider) → Provider concreto
```

Para adicionar um novo provedor (ex: OpenAI, Gemini):

1. Crie uma classe que implementa `AiProvider`
2. Adicione um `case` no `createAiProvider` em `src/lib/ai/provider.ts`
3. Pronto — a aplicação usa o novo provedor sem mudanças na lógica

## Execução

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

## Estrutura do projeto

```
src/
├── components/          # Componentes reutilizáveis (UI, dashboard, etc.)
│   ├── ui/              # Componentes shadcn/ui base
│   ├── dashboard/       # Cards do dashboard (manutenção, tarefas, blend, etc.)
│   ├── ai/              # Dialog de revisão com IA
│   ├── assistente/      # Interface do assistente de turno
│   └── weather/         # Mapa de raios
├── routes/              # Páginas (TanStack Router file-based)
│   ├── _authenticated/  # Páginas protegidas por login
│   ├── auth.tsx         # Tela de login/cadastro
│   └── index.tsx        # Landing page
├── lib/                 # Lógica de negócio
│   ├── ai/              # Camada de IA (provider, prompt, server functions)
│   ├── assistente/      # Geração do assistente de turno
│   ├── ata/             # Geração de atas
│   ├── dashboard/       # Assets do dashboard (blend, diretriz)
│   ├── lightning/       # Monitoramento de raios
│   ├── domain.ts        # Tipos e constantes do domínio
│   ├── reports.ts       # Lógica de relatórios
│   └── theme.ts         # Modo claro/escuro
├── integrations/
│   └── supabase/        # Cliente Supabase, auth middleware, tipos
└── assets/              # Logo e imagens
```

## Funcionalidades

- **Dashboard**: equipamentos em manutenção, tarefas do turno, blend, diretriz, raios
- **Equipamentos**: CRUD completo, filtros, tipos com ícones
- **Informes de Turno**: criação, edição inline, duplicação, exportação PNG
- **Justificativa do Blend**: geração e revisão com IA
- **Elaboração de Ata**: geração e revisão com IA
- **Clima**: monitoramento de raios em tempo real
- **Configurações**: perfil, senha, logo, IA, modo escuro
- **Modo escuro**: alternável, salvo por navegador
- **Isolamento de dados**: cada usuário vê apenas seus dados (RLS no Supabase)

## Portabilidade

Este projeto não depende de nenhuma plataforma de desenvolvimento por IA.

- Todas as credenciais ficam em variáveis de ambiente
- O banco de dados é Supabase (serviço externo configurável)
- A IA usa uma camada de abstração com provedor configurável
- O armazenamento de arquivos usa Supabase Storage
- O modo escuro usa `localStorage` (independente de plataforma)
- O código pode ser clonado do GitHub e executado localmente

## Dependências externas

- [Supabase](https://supabase.com) — banco, auth e storage
- [OpenRouter](https://openrouter.ai) — IA (opcional, configurável)
- [WarPulse](https://api.warpulse.com) — monitoramento de raios (opcional)
