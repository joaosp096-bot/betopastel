---
name: Beto Pastel
description: Marca da feira, produtos reconhecíveis e registros claros em uma interface de operação.
colors:
  primary: "#c92029"
  primary-hover: "#ab1420"
  action-red: "#a81b25"
  primary-tint: "#fff0f1"
  background: "#f7f8fa"
  foreground: "#20272d"
  card: "#fff"
  muted: "#eef0f3"
  muted-foreground: "#56616b"
  border: "#dce1e6"
  input-border: "#aeb8c2"
  sidebar: "#232323"
  sidebar-hover: "#3b3b3b"
  navigation-text: "#e5e5e5"
  secondary-ink: "#33434d"
  label-ink: "#465560"
  neutral-tint: "#eef1f4"
  success: "#216647"
  success-tint: "#eaf5ef"
  warning: "#725014"
  warning-tint: "#fff3d5"
  error: "#a31d15"
  error-tint: "#fff0ee"
typography:
  display:
    fontFamily: "Lato, Arial, sans-serif"
    fontSize: "43px"
    fontWeight: 900
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Lato, Arial, sans-serif"
    fontSize: "32px"
    fontWeight: 900
    lineHeight: 1.18
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Lato, Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 900
    lineHeight: 1.25
    letterSpacing: "-0.018em"
  subheading:
    fontFamily: "Lato, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "Lato, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Lato, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.5
  action:
    fontFamily: "Lato, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.4
  caption:
    fontFamily: "Lato, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  quantity:
    fontFamily: "Lato, Arial, sans-serif"
    fontSize: "36px"
    fontWeight: 900
    lineHeight: 1.5
rounded:
  compact: "6px"
  control: "8px"
  selection: "10px"
  surface: "12px"
  dialog: "14px"
spacing:
  compact: "8px"
  related: "12px"
  field: "16px"
  content: "20px"
  block: "24px"
  inset: "28px"
  section: "32px"
  shell: "36px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.card}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.secondary-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-text:
    textColor: "{colors.action-red}"
    rounded: "{rounded.compact}"
    padding: "8px 6px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  navigation-item:
    textColor: "{colors.navigation-text}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "50px"
  navigation-item-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.card}"
  status-neutral:
    backgroundColor: "{colors.neutral-tint}"
    textColor: "{colors.label-ink}"
    rounded: "{rounded.compact}"
    padding: "6px 9px"
  food-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.surface}"
  quantity-control:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.selection}"
    height: "76px"
---

# Design System: Beto Pastel

## Overview

**Creative North Star: "O cardápio da equipe da feira"**

A identidade reúne o vermelho do trailer, o preto do avental e o branco do boné. A interface tem títulos fortes, controles familiares e superfícies claras para a equipe reconhecer o próximo registro. A referência de cardápio e navegação do iFood se traduz em sabores reconhecíveis e ações acessíveis no celular; este sistema descreve a implementação própria do Beto Pastel.

A densidade é de uma ferramenta de operação: números legíveis, contexto próximo dos campos e estados explícitos. Nome, selo, cor e ícone mantêm o sabor reconhecível entre catálogo e tarefa. O movimento liga esses estados, enquanto o formulário continua sendo o centro da leitura.

**Key Characteristics:**
- Vermelho para ação e navegação selecionada; carvão para estrutura.
- Lato hospedada no projeto, títulos pesados e números tabulares.
- Superfícies brancas, bordas leves e profundidade contida.
- Identidade de sabor preservada ao abrir a tarefa.
- Controles com áreas de toque generosas e foco visível.

## Colors

O vermelho é direto e reconhecível; os neutros frios sustentam a leitura e as tintas suaves separam estados sem disputar a ação principal. Os valores do frontmatter são normativos. As rampas do painel são amostras de exploração, não novos tokens para a aplicação.

### Primary
- **Vermelho do trailer** (`primary`): ações de confirmação, seleção na navegação lateral e painel de marca no acesso.
- **Vermelho de resposta** (`primary-hover`): escurecimento do botão primário ao passar o ponteiro.
- **Vermelho de ação textual** (`action-red`): links de tarefa, etapa atual e ações sem preenchimento.
- **Rosa de seleção** (`primary-tint`): seleção de feira, navegação móvel ativa e resposta de ações textuais.

### Neutral
- **Fundo de trabalho** (`background`): área contínua fora dos painéis.
- **Branco de superfície** (`card`): campos, cards, barra superior e tarefas.
- **Carvão de leitura** (`foreground`): texto principal e valores.
- **Carvão do avental** (`sidebar`): navegação lateral; `sidebar-hover` responde ao ponteiro e `navigation-text` mantém os itens legíveis.
- **Cinzas de apoio** (`muted`, `neutral-tint`, `muted-foreground`): fundos secundários, estados neutros e contexto.
- **Tintas de controle** (`secondary-ink`, `label-ink`): ações secundárias e rótulos de campos.
- **Bordas de superfície e campo** (`border`, `input-border`): divisão leve entre áreas; o campo recebe a borda mais definida.

Verde (`success`, `success-tint`) indica confirmação e retorno registrado; âmbar (`warning`, `warning-tint`) pede conferência; vermelho de erro (`error`, `error-tint`) acompanha mensagens inline. Esses papéis são semânticos, não uma segunda marca.

**The Action and State Rule.** Use o vermelho da marca para agir ou selecionar. Uma confirmação usa verde e uma advertência usa âmbar, acompanhados de texto ou ícone de estado.

As combinações de acento e tinta de cada sabor pertencem a `lib/flavor-identity.ts`. Elas reaparecem no topo do card, no selo, no ícone e na área de identidade da tarefa. Preserve essa associação ao estender o catálogo; uma cor de ingrediente não ganha significado de erro ou sucesso.

## Typography

**Display Font:** Lato, com Arial e sans-serif como fallback.
**Body Font:** Lato, com os mesmos fallbacks. Não há uma segunda família para títulos ou números.

**Character:** formas familiares e abertas, com contraste de peso em vez de ornamentação. Os arquivos locais fornecem os pesos regular (400), negrito (700) e pesado (900).

### Hierarchy
- **Display:** mensagem de marca da tela de acesso; não é o tamanho padrão de toda página.
- **Headline:** título principal de página. No celular, reduz para (27px), mantendo o peso pesado e o ritmo compacto.
- **Title:** cabeçalhos de seção, reduzidos para (22px) no celular.
- **Subheading:** títulos menores de painéis; o nome no card de sabor usa (17px), depois (16px) no celular e (15px) em telas muito estreitas.
- **Body:** texto e campos comuns. Contexto de operação usa frequentemente (14px–15px) e descrições usam (13px).
- **Label / Action / Caption:** rótulos de campo, ações e apoio têm papéis distintos; preserve a caixa de frase que o app usa.
- **Quantity:** valor de contagem, reduzido para (34px) no celular. Totais e valores financeiros também usam peso pesado e algarismos tabulares.

**The Title First Rule.** Apresente o título antes do contexto de apoio. Datas, local de preparo e estado explicam a tarefa; não os transforme em um título decorativo acima dela.

## Layout

A aplicação combina navegação lateral de (16rem), barra superior de (72px) e conteúdo com largura máxima de (1500px). O respiro principal usa `shell`; grupos próximos usam `related` e `field`, enquanto blocos maiores usam `block` e `section`. Esses passos descrevem os valores recorrentes do código, não uma exigência de que toda distância seja múltipla de um único módulo.

O catálogo usa quatro colunas, três até (1250px), duas até (767px) e cinco a partir de (1600px), com gaps de (18px), (12px) no celular e (10px) até (360px). Cards de feira e agenda passam de três colunas para uma até (900px). O resumo passa de quatro métricas para duas colunas no celular. Use `minmax(0, 1fr)` para manter os textos dentro do espaço disponível.

Até (767px), a barra superior tem (64px); o conteúdo recebe margens internas laterais de (16px), reduzidas para (13px) até (360px). A navegação inferior fica fixa e reserva espaço no final da página, incluindo a safe area. As ações persistentes ficam acima dela, com deslocamento inferior de (84px).

A tarefa de sabor ocupa a viewport com altura dinâmica (`100dvh`). No desktop, identidade e formulário usam proporção (38% / 62%). No celular, a identidade vira uma faixa horizontal e o formulário vem abaixo. As linhas de separação mantêm nome/contexto ao lado da quantidade até (360px), quando empilham os dois grupos.

## Elevation & Depth

As superfícies são planas em repouso. Fundo, borda, tinta e divisão de área estabelecem a hierarquia. Uma sombra suave aparece no hover do card de sabor; diálogos comuns usam sombra ambiente e a tarefa de sabor usa tela inteira. Não há sombra dura deslocada.

### Shadow Vocabulary
- **Card em resposta:** `0 5px 18px -8px #20303d25`, junto da borda mais escura no hover.
- **Diálogo:** `0 18px 70px -20px #17212c55`, disponível em `--shadow-dialog` para painéis de edição.
- **Fundo de tarefa:** sobreposição translúcida `#17212c55`, atrás da tarefa protegida.

**The Quiet Surface Rule.** Separe áreas em repouso com cor e borda. Reserve a elevação para a resposta do card ou um diálogo sobre a página.

## Shapes

Os cantos são suavemente arredondados: controles usam `control`, seletores e contagens usam `selection`, cards e listas usam `surface`, e diálogos usam `dialog`. Estados compactos usam `compact`. A tarefa de sabor em tela inteira tem cantos retos, de acordo com a viewport.

Bordas comuns têm (1px); cards de sabor acrescentam borda superior de (2px) na cor da identidade. Selos pequenos têm cantos discretos, não formato de cápsula. Círculos são próprios dos pontos de progresso e das confirmações. Ícones são SVG de traço; o ícone do ingrediente usa traço mais leve (1.3).

## Components

### Buttons

Ações diretas e familiares. O primário e o secundário compartilham tamanho mínimo de (48px), padding e peso; o primário usa vermelho/branco, o secundário branco/tinta escura com borda de campo. A ação textual tem altura mínima de (44px) e resposta rosa. Controles de ícone usam botões de (44px–46px).

Hover muda a cor; a pressão desloca o botão (1px) para baixo. O foco tem contorno vermelho de (3px) e distância de (3px). Desabilitados mantêm a geometria e reduzem a opacidade para (0.48). As transições comuns duram (0.15s); movimento reduzido remove a transição dos botões.

### Chips

Etiquetas de estado são compactas, com texto em negrito (13px), sem sombra. Neutro, retorno confirmado e dia de feira usam suas combinações semânticas de texto/tinta. O filtro de local de preparo é um grupo de botões, não uma etiqueta: área neutra, botão selecionado branco e texto vermelho, com `aria-pressed`.

### Cards / Containers

Painéis brancos têm borda leve e cantos de superfície; o padding recorrente varia entre (20px–26px) conforme a densidade. Listas compartilham uma superfície e separam suas linhas com bordas, evitando um card externo para cada campo.

O card de sabor é um botão inteiro. A face combina tinta, selo e ícone ou a imagem ilustrativa existente. O corpo mostra nome, descrição, quantidade e unidade; o estado registrado acrescenta um check verde. O hover altera borda e sombra, preservando a cor que identifica o sabor.

### Inputs / Fields

Campos brancos, borda de controle, altura mínima de (48px), padding e cantos de controle. O rótulo fica acima; contexto e erro permanecem próximos. Foco usa contorno vermelho de (2px), com afastamento de (2px). Em grupos de moeda e senha, o contorno do campo fica para dentro do grupo para preservar a borda externa.

Erros inline usam tinta vermelha suave, texto explícito e `role="alert"`. Falhas de transporte são descritas em português. Expiração de sessão apresenta o diálogo de novo acesso sobre o conteúdo preenchido; o formulário de trabalho permanece montado.

### Navigation

A navegação lateral usa fundo carvão, ícones de traço e itens claros. Hover usa carvão mais claro; seleção usa vermelho e texto branco em negrito. No celular, destinos frequentes aparecem na barra inferior branca, com ícone, rótulo e seleção rosa/vermelha; “Mais” abre a navegação completa.

### Tarefa e contagem de sabor

A identidade do card reaparece na tarefa: o nome e a face compartilham a transição, e a cor permanece estável. A contagem tem valor central pesado e botões laterais de aumentar/diminuir com áreas mínimas de (44px). A largura cede ao layout; o valor mantém algarismos tabulares.

A mini linha do tempo distingue etapa atual, concluída e futura por número/check, texto e cor. A pergunta vem antes do contexto, da quantidade e dos detalhes opcionais. A confirmação visual e o avanço só aparecem depois do registro confirmado. O footer pode quebrar linha e a ação ocupa a largura disponível no celular.

O movimento de identidade usa spring com stiffness (340) e damping (32); a troca de conteúdo do formulário usa (0.2s). A aplicação respeita a preferência de movimento reduzido através de `MotionConfig` e do tratamento de saída da tarefa. Preserve essa preferência ao adicionar novas transições.

## Do's and Don'ts

### Do:
- **Do** preserve nome, cor, selo e ícone do sabor entre o card e a tarefa.
- **Do** use vermelho para ação/seleção e estados semânticos com texto ou ícone explícito.
- **Do** mantenha o título antes do contexto e os rótulos próximos dos campos.
- **Do** mantenha superfícies planas em repouso, foco visível e áreas de toque de pelo menos (44px).
- **Do** use algarismos tabulares em quantidades, totais e valores financeiros.
- **Do** adapte a separação para uma coluna em telas estreitas e reserve espaço para a navegação fixa.
- **Do** respeite movimento reduzido e preserve os campos ao apresentar erros ou novo acesso.

### Don't:
- **Don't** transforme datas, estados ou contexto de preparo em eyebrows decorativos.
- **Don't** misture as cores de identidade do catálogo com os significados de erro e confirmação.
- **Don't** use uma sombra dura deslocada em superfícies deste sistema.
- **Don't** substitua os SVG de traço por caracteres tipográficos como ícones.
- **Don't** trate a imagem ilustrativa existente como fotografia específica de todos os sabores.
- **Don't** mostre uma confirmação visual antes da resposta de sucesso do registro.
