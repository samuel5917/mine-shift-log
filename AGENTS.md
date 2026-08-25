# MineShift — Guia para agentes de IA

Este projeto é uma aplicação web independente de plataforma.

## Regras

- Não adicione dependências de Bolt, Lovable, Replit ou outras plataformas
- Não coloque API keys, tokens ou credenciais no código
- Use variáveis de ambiente para toda configuração externa
- Mantenha `.env.example` atualizado quando adicionar novas variáveis
- O provedor de IA é configurável via `src/lib/ai/provider.ts`
- O banco de dados é Supabase, acessado via SDK público
- Não reescreva a arquitetura — estenda de forma modular

## Estrutura

- `src/routes/` — páginas (TanStack Router, file-based)
- `src/components/` — componentes reutilizáveis
- `src/lib/` — lógica de negócio
- `src/integrations/supabase/` — cliente e auth Supabase
- `supabase/migrations/` — SQL de criação de tabelas e RLS

## Comandos

```bash
npm install      # instalar dependências
npm run dev      # desenvolvimento
npm run build    # build de produção
npm run lint     # verificar código
npm run format   # formatar com prettier
```
