# Shift Report Pro

QUERO CRIAR UMA APLICAÇÃO WEB PROFISSIONAL PARA CRIAÇÃO E GERENCIAMENTO DE INFORMES DE TURNO DE EQUIPAMENTOS DA TRINDADE MINERAÇÃO.

IMPORTANTE:

A imagem anexada nesta conversa é a referência visual principal para o layout do INFORME EXPORTADO. Quero que a aplicação consiga gerar uma imagem muito semelhante ao modelo apresentado, mantendo a identidade visual, organização das tabelas, cabeçalho, logo, cores das situações e estrutura geral.

NÃO quero apenas uma página estática/mockup. Quero uma aplicação funcional, com autenticação, banco de dados, CRUD completo e persistência dos dados utilizando Supabase.

==================================================

1. TECNOLOGIA

==================================================

Utilizar:

- React

- TypeScript

- Vite ou estrutura equivalente compatível com Lovable

- Tailwind CSS

- shadcn/ui quando apropriado

- Supabase para autenticação e banco de dados

- Lucide React para os ícones

- Biblioteca adequada para gerar PNG/imagem do informe, como html-to-image ou equivalente.

A aplicação deve ser responsiva e funcionar em:

- Desktop

- Notebook

- Tablet

- Celular

Prioridade de uso: desktop.

==================================================

2. AUTENTICAÇÃO

==================================================

Criar sistema de login utilizando Supabase Auth.

Campos:

- E-mail

- Senha

Após o login, cada usuário deve ter seu próprio ambiente.

REGRA FUNDAMENTAL:

Os dados pertencem ao usuário logado.

Exemplo:

Usuário X:

- possui seus equipamentos

- possui seus informes

- possui seus dados salvos

Usuário Y:

- não pode visualizar os dados do usuário X

- ao entrar pela primeira vez deve visualizar seu próprio ambiente vazio

Se o usuário X fechar o navegador e entrar novamente posteriormente, todos os dados dele devem continuar disponíveis.

Utilizar Row Level Security (RLS) no Supabase para garantir isolamento entre usuários.

NUNCA permitir que um usuário consulte ou altere dados de outro usuário.

==================================================

3. DASHBOARD

==================================================

Após o login, criar uma tela inicial chamada:

"Informe de Turno"

O dashboard deve mostrar:

- Nome do usuário

- Data atual

- Quantidade de equipamentos

- Quantidade de equipamentos OPERANDO

- Quantidade DISPONÍVEL

- Quantidade em MANUTENÇÃO

- Quantidade INDISPONÍVEL

Criar botões:

[ NOVO INFORME ]

[ MEUS INFORMES ]

[ EQUIPAMENTOS ]

[ CONFIGURAÇÕES ]

Também mostrar uma lista dos informes recentes.

Exemplo:

INFORMES RECENTES

11/08/2026 - 2º Turno       [ABRIR]

10/08/2026 - 1º Turno       [ABRIR]

09/08/2026 - 2º Turno       [ABRIR]

==================================================

4. CADASTRO DE EQUIPAMENTOS

==================================================

Criar uma tela "Equipamentos".

O usuário deve conseguir:

- Cadastrar equipamento

- Editar equipamento

- Excluir equipamento

- Ativar/desativar equipamento

- Pesquisar equipamento

- Filtrar por tipo

Campos do cadastro:

- Código

- Nome

- Tipo

- Ícone

- Ativo/Inativo

Exemplo:

Código:

EH-0001

Nome:

Escavadeira

Tipo:

Escavadeira

Ícone:

Ícone de escavadeira

==================================================

5. TIPOS DE EQUIPAMENTOS

==================================================

Criar os seguintes tipos:

1. EH - Escavadeira

2. PC - Pá Carregadeira

3. CB - Caminhão Basculante

4. CA - Comboio

5. CP - Caminhão Pipa

6. MN - Motoniveladora

7. RP - Rompedor

8. RT - Retroescavadeira

9. TE - Trator

10. RC - Rolo Compactador

IMPORTANTE:

Cada tipo deve possuir um ícone visual próprio.

Não utilizar emojis.

Utilizar ícones gráficos profissionais.

Exemplo:

EH → ícone de escavadeira

PC → ícone de pá carregadeira

CB → ícone de caminhão

CA → ícone de comboio/caminhão de abastecimento

CP → ícone de caminhão pipa

MN → ícone de motoniveladora

RP → ícone de rompedor

RT → ícone de retroescavadeira

TE → ícone de trator

RC → ícone de rolo compactador

Se não houver um ícone específico disponível na biblioteca, utilizar um ícone SVG apropriado e visualmente semelhante.

==================================================

6. SITUAÇÃO DOS EQUIPAMENTOS

==================================================

Cada equipamento dentro de um informe deve possuir obrigatoriamente uma situação.

As únicas situações permitidas são:

OPERANDO

DISPONÍVEL

MANUTENÇÃO

INDISPONÍVEL

Utilizar cores:

OPERANDO:

verde claro

DISPONÍVEL:

cinza/branco

MANUTENÇÃO:

vermelho claro

INDISPONÍVEL:

amarelo/laranja claro

A situação deve aparecer visualmente destacada na tabela.

Exemplo:

[ OPERANDO ]

[ DISPONÍVEL ]

[ MANUTENÇÃO ]

[ INDISPONÍVEL ]

==================================================

7. CRIAÇÃO DO INFORME

==================================================

Ao clicar em:

[ NOVO INFORME ]

abrir uma tela para criar um novo informe.

Campos do cabeçalho:

- Data

- Turno

Turnos:

- 1º Turno

- 2º Turno

O usuário poderá selecionar a data.

Depois disso será exibida a lista dos equipamentos cadastrados.

==================================================

8. TABELA DO INFORME

==================================================

Criar uma tabela semelhante à imagem de referência.

Colunas:

Ícone

Equipamento

Situação

Frente de Operação

Exemplo:

------------------------------------------------------------

| ÍCONE | EQUIPAMENTO        | SITUAÇÃO   | FRENTE          |

------------------------------------------------------------

|  🚜   | EH-0001 - Escav.  | OPERANDO   | B-1110          |

|  🚚   | CB-0121 - Caminhão| DISPONÍVEL | Sob demanda     |

|  🚜   | PC-0201 - Pá       | OPERANDO   | Planta 02       |

------------------------------------------------------------

NÃO utilizar emojis na versão final exportada.

Utilizar os ícones gráficos cadastrados.

==================================================

9. FRENTE DE OPERAÇÃO

==================================================

O campo "Frente de Operação" deve ser totalmente editável.

O usuário deve conseguir clicar no campo e digitar.

Exemplos:

B-1060

B-1110

Planta 01

Planta 02

Pulmão 01

Pulmão 02

Sob demanda

Manutenção

Oficina

Manutenção de vias

Abastecimento

Sob demanda mina/planta

Não limitar o usuário a uma lista fixa.

Deixar como campo de texto livre.

Também permitir deixar vazio quando necessário.

==================================================

10. FRENTE DE ESTACIONAMENTO

==================================================

Adicionar também um campo opcional:

"Frente de Estacionamento"

Esse campo deve ser editável.

Por padrão ele pode ficar oculto na tela principal, mas deve existir nos dados e poder ser ativado para os equipamentos que necessitarem.

Na exportação, quando estiver habilitado, mostrar uma coluna:

Frente de Estacionamento

Isso deve permitir reproduzir a estrutura da imagem de referência, que possui essa coluna na tabela de equipamentos de produção.

==================================================

11. ORGANIZAÇÃO DOS EQUIPAMENTOS

==================================================

No informe, organizar os equipamentos por grupo.

GRUPO 1:

EQUIPAMENTOS AUXILIARES

Exibir:

- CA - Comboio

- CP - Caminhão Pipa

- MN - Motoniveladora

- PC - Pá Carregadeira

- RC - Rolo Compactador

- RP - Rompedor

- RT - Retroescavadeira

- TE - Trator

GRUPO 2:

EQUIPAMENTOS DE PRODUÇÃO

Exibir:

- EH - Escavadeira

- CB - Caminhão Basculante

A ordem dos equipamentos deve ser configurável.

O usuário deve conseguir alterar a ordem dos equipamentos.

==================================================

12. EXEMPLO DE DADOS

==================================================

Ao criar o sistema pela primeira vez, utilizar como exemplos:

CA-0002 - Comboio

Situação: OPERANDO

Frente: Abastecimento

CP-0006 - Pipa

Situação: DISPONÍVEL

Frente: Sob demanda

CP-0007 - Pipa

Situação: DISPONÍVEL

Frente: Umidificando os acessos internos

MN-0001 - Motoniveladora

Situação: OPERANDO

Frente: Manutenção de vias

MN-0003 - Motoniveladora

Situação: OPERANDO

Frente: Manutenção de vias

PC-0201 - Pá Carregadeira

Situação: OPERANDO

Frente: Planta 02

PC-0203 - Pá Carregadeira

Situação: DISPONÍVEL

Frente: Sob demanda

PC-0204 - Pá Carregadeira

Situação: OPERANDO

Frente: Planta 02

PC-0205 - Pá Carregadeira

Situação: DISPONÍVEL

Frente: Sob demanda externa

PC-0206 - Pá Carregadeira

Situação: DISPONÍVEL

Frente: Sob demanda

RC-0001 - Rolo Compactador

Situação: DISPONÍVEL

Frente: Sob demanda

RP-0002 - Rompedor

Situação: OPERANDO

Frente: B-1060

RT-0004 - Retroescavadeira

Situação: OPERANDO

Frente: Sob demanda mina/planta

TE-0101 - Trator

Situação: MANUTENÇÃO

Frente: Em manutenção na oficina

TE-0102 - Trator

Situação: DISPONÍVEL

Frente: Sob demanda externa

EH-0001 - Escavadeira

Situação: DISPONÍVEL

EH-0004 - Escavadeira

Situação: DISPONÍVEL

EH-0005 - Escavadeira

Situação: DISPONÍVEL

EH-0008 - Escavadeira

Situação: OPERANDO

Frente: B-1110

CB-0121 - Caminhão Basculante

Situação: DISPONÍVEL

Frente: Sob demanda

CB-1049 - Caminhão Basculante

Situação: DISPONÍVEL

Frente: Sob demanda

CB-1050 - Caminhão Basculante

Situação: MANUTENÇÃO

Frente: Em manutenção na oficina

CB-1051 - Caminhão Basculante

Situação: DISPONÍVEL

Frente: Sob demanda

CB-1052 - Caminhão Basculante

Situação: DISPONÍVEL

Frente: Sob demanda

CB-1073 - Caminhão Basculante

Situação: DISPONÍVEL

Frente: Sob demanda

CB-1083 - Caminhão Basculante

Situação: DISPONÍVEL

Frente: Sob demanda

CB-1102 - Caminhão Basculante

Situação: DISPONÍVEL

Frente: Sob demanda

CB-1103 - Caminhão Basculante

Situação: DISPONÍVEL

Frente: Sob demanda

CB-1122 - Caminhão Basculante

Situação: DISPONÍVEL

Frente: Sob demanda

CB-1129 - Caminhão Basculante

Situação: MANUTENÇÃO

Frente: Em manutenção na oficina

CB-1138 - Caminhão Basculante

Situação: DISPONÍVEL

Frente: Sob demanda

CB-2006 - Caminhão Basculante

Situação: MANUTENÇÃO

Frente: Lavagem externa

Esses dados são apenas exemplos iniciais.

O usuário poderá editar, excluir e adicionar novos equipamentos.

==================================================

13. SALVAMENTO AUTOMÁTICO

==================================================

O sistema deve salvar as alterações no banco de dados.

Ao alterar:

- Situação

- Frente de operação

- Frente de estacionamento

- Equipamento

salvar no Supabase.

Implementar debounce para evitar excesso de requisições.

Mostrar um pequeno indicador:

"Salvo"

ou

"Salvando..."

Não perder dados caso o usuário atualize a página.

==================================================

14. HISTÓRICO DE INFORMES

==================================================

Criar página:

"Meus Informes"

Mostrar:

Data

Turno

Quantidade de equipamentos

Data de criação

Última alteração

Ações:

[ ABRIR ]

[ DUPLICAR ]

[ EXCLUIR ]

[ EXPORTAR ]

A opção DUPLICAR deve criar um novo informe baseado no anterior, permitindo alterar a data e o turno.

Isso será muito útil para o preenchimento diário.

==================================================

15. EXPORTAÇÃO PARA IMAGEM

==================================================

ESSA É UMA DAS PARTES MAIS IMPORTANTES DO PROJETO.

Criar botão:

[ EXPORTAR INFORME ]

Ao clicar, gerar automaticamente uma imagem PNG de alta resolução.

A imagem deve reproduzir visualmente o informe fornecido como referência.

O layout exportado deve conter:

- Logo da TRINDADE MINERAÇÃO no canto superior esquerdo

- Título "Informe de Turno"

- Nome da seção

- Tabelas

- Linhas e bordas

- Equipamentos

- Ícones dos equipamentos

- Situação

- Frente de Operação

- Frente de Estacionamento quando habilitada

- Data

- Turno

O visual deve ser corporativo, limpo e semelhante ao documento de referência.

==================================================

16. CABEÇALHO DA IMAGEM

==================================================

Utilizar o logo fornecido como referência na imagem anexada.

Não substituir o logo por um texto genérico se houver possibilidade de utilizar o arquivo da logo.

Criar cabeçalho semelhante:

[LOGO TRINDADE MINERAÇÃO]              INFORME DE TURNO

                                         Equipamentos Auxiliares

O título deve ser grande, em negrito e centralizado.

==================================================

17. ESTILO DA TABELA EXPORTADA

==================================================

A tabela deve possuir:

- Bordas pretas/cinza escuras

- Cabeçalho branco

- Texto preto

- Fonte semelhante à imagem de referência

- Equipamentos em negrito

- Situação destacada por cores

- Ícones pequenos ao lado do equipamento

- Linhas organizadas

Não utilizar aparência de dashboard na imagem exportada.

A imagem exportada deve parecer um documento corporativo.

==================================================

18. PREVIEW ANTES DA EXPORTAÇÃO

==================================================

Antes de baixar a imagem, permitir visualizar uma prévia.

Tela:

┌─────────────────────────────────────┐

│       PRÉ-VISUALIZAÇÃO              │

│                                     │

│      [ INFORME GERADO ]             │

│                                     │

└─────────────────────────────────────┘

Botões:

[ VOLTAR ]

[ EXPORTAR PNG ]

==================================================

19. NOME DO ARQUIVO

==================================================

Ao exportar, utilizar automaticamente:

Informe_de_Turno_YYYY-MM-DD_Turno-X.png

Exemplo:

Informe_de_Turno_2026-08-11_Turno-2.png

==================================================

20. EDIÇÃO DO INFORME

==================================================

Dentro de um informe já criado, o usuário deve poder:

- Alterar data

- Alterar turno

- Alterar situação

- Alterar frente de operação

- Alterar frente de estacionamento

- Adicionar equipamento ao informe

- Remover equipamento do informe

- Reordenar equipamentos

Não alterar o cadastro original do equipamento quando estiver editando somente um informe.

IMPORTANTE:

O equipamento pode estar:

OPERANDO hoje

e

DISPONÍVEL amanhã.

Portanto a situação deve pertencer ao INFORME, e não ficar gravada permanentemente no cadastro do equipamento.

==================================================

21. BANCO DE DADOS

==================================================

Criar as tabelas necessárias no Supabase.

Sugestão:

profiles

id

name

created_at

equipment_types

id

code_prefix

name

icon

category

created_at

equipments

id

user_id

code

name

type_id

active

display_order

created_at

updated_at

shift_reports

id

user_id

report_date

shift

created_at

updated_at

shift_report_equipment

id

report_id

equipment_id

situation

operation_front

parking_front

display_order

created_at

updated_at

Criar relacionamentos adequados.

==================================================

22. SEGURANÇA DO BANCO

==================================================

Implementar Row Level Security no Supabase.

Cada usuário só pode:

SELECT

INSERT

UPDATE

DELETE

nos próprios registros.

Nenhum usuário pode visualizar dados pertencentes a outro usuário.

Garantir isso no banco, não somente no frontend.

==================================================

23. EXPERIÊNCIA DE USO

==================================================

Quero que o sistema seja muito simples para quem trabalha no turno.

O fluxo deve ser:

1. Entrar no sistema

2. Clicar em NOVO INFORME

3. Selecionar data

4. Selecionar turno

5. Sistema carrega os equipamentos cadastrados

6. Alterar situação

7. Preencher frente de operação

8. Salvar

9. Clicar em EXPORTAR

10. Gerar imagem pronta para enviar

Evitar telas desnecessárias.

==================================================

24. EDIÇÃO RÁPIDA

==================================================

Na tabela do informe, permitir edição diretamente na linha.

Exemplo:

Equipamento:

EH-0008

Situação:

[ OPERANDO ▼ ]

Frente:

[ B-1110                  ]

O usuário não precisa abrir uma janela separada para cada equipamento.

Criar dropdown para situação.

Criar campo de texto para frente.

==================================================

25. FILTROS

==================================================

Adicionar filtros:

Todos

Operando

Disponível

Manutenção

Indisponível

E filtro por tipo:

Todos

Escavadeiras

Caminhões

Pás Carregadeiras

Comboios

Pipas

Motoniveladoras

Rompedores

Retroescavadeiras

Tratores

Rolos Compactadores

Adicionar também campo:

"Pesquisar equipamento..."

==================================================

26. CONFIGURAÇÕES

==================================================

Criar página de configurações.

Permitir:

- Alterar nome do usuário

- Alterar senha

- Gerenciar equipamentos

- Gerenciar tipos de equipamento

- Configurar logo do relatório

A logo padrão deve ser a da Trindade Mineração fornecida como referência.

==================================================

27. DESIGN DA APLICAÇÃO

==================================================

A interface do SISTEMA deve ser moderna e profissional.

Usar:

- Branco

- Cinza

- Verde inspirado na identidade visual da Trindade

- Preto para textos

- Vermelho para manutenção

- Amarelo para indisponível quando aplicável

Cards com bordas suaves.

Botões claros.

Tabelas fáceis de ler.

Não exagerar em efeitos ou animações.

A aplicação deve parecer um sistema corporativo de mineração.

==================================================

28. RESPONSIVIDADE

==================================================

No celular:

- Tabela deve permitir rolagem horizontal

- Botões devem permanecer acessíveis

- Campos devem ser fáceis de tocar

- Menu deve virar menu mobile

No desktop:

- Utilizar toda a área disponível

- Tabela ampla

- Dashboard centralizado

==================================================

29. ESTADOS E FEEDBACK

==================================================

Mostrar feedback visual para:

- Salvando

- Salvo

- Erro ao salvar

- Equipamento criado

- Equipamento excluído

- Informe criado

- Informe excluído

- Exportação concluída

Utilizar Toasts.

Antes de excluir:

"Tem certeza que deseja excluir este equipamento?"

"Tem certeza que deseja excluir este informe?"

==================================================

30. IMPORTANTE SOBRE O INFORME EXPORTADO

==================================================

A aplicação possui DUAS aparências:

1. INTERFACE DO SISTEMA

Moderna, responsiva e interativa.

2. INFORME EXPORTADO

Visual corporativo e semelhante à imagem de referência.

Não misturar os dois estilos.

A exportação deve ser fiel ao modelo apresentado.

==================================================

31. DADOS INICIAIS

==================================================

Criar os tipos de equipamento e os equipamentos de exemplo listados acima.

Porém, os equipamentos iniciais devem ser associados ao usuário que está criando/utilizando o sistema.

Não criar equipamentos globalmente compartilhados entre usuários.

==================================================

32. FUNCIONALIDADES FUTURAS

==================================================

Estruturar o código de forma que futuramente seja possível adicionar:

- PDF

- Excel

- Mais empresas

- Mais usuários

- Permissões de administrador

- Relatórios históricos

- Estatísticas de disponibilidade

- Indicadores de manutenção

- Impressão

- Logo personalizada

- Assinatura do responsável

Não é necessário implementar essas funções agora.

==================================================

33. RESULTADO FINAL ESPERADO

==================================================

Quero uma aplicação FUNCIONAL.

Não entregar somente um protótipo visual.

Preciso que:

- Login funcione

- Supabase funcione

- Banco funcione

- Usuários sejam isolados

- Equipamentos possam ser cadastrados

- Equipamentos possam ser editados

- Equipamentos possam ser excluídos

- Informes possam ser criados

- Informes possam ser editados

- Informes sejam salvos

- Informes antigos possam ser consultados

- Situações funcionem

- Frentes sejam editáveis

- Equipamentos tenham ícones

- Dados permaneçam salvos após fechar o navegador

- Exportação PNG funcione

- Exportação reproduza o modelo da imagem fornecida

- Logo da Trindade apareça no informe

- Aplicação seja responsiva

Antes de finalizar, testar todos esses fluxos.

Não criar funcionalidades falsas ou botões que não fazem nada.

Se alguma configuração do Supabase for necessária, criar as migrations/SQL necessárias e indicar claramente quais variáveis de ambiente precisam ser configuradas.

PRIORIDADE ABSOLUTA:

1. Persistência dos dados

2. Login e isolamento dos usuários

3. CRUD de equipamentos

4. Criação/edição de informes

5. Exportação PNG fiel ao modelo

6. Interface profissional

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://mine-shift-log.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e05a9520-761e-419f-ba4e-19ca16fb9e0b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
