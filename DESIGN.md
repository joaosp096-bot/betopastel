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
  weekly-warning: "#76520f"
  weekly-warning-tint: "#fff1d1"
  weekly-notice-ink: "#67470c"
  weekly-success-tint: "#e5f2e9"
  leftover-series: "#dca843"
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
  next-work:
    fontFamily: "Lato, Arial, sans-serif"
    fontSize: "clamp(25px, 2.6vw, 36px)"
    fontWeight: 900
    lineHeight: 1.12
    letterSpacing: "-0.03em"
  weekly-metric:
    fontFamily: "Lato, Arial, sans-serif"
    fontSize: "clamp(24px, 2.5vw, 34px)"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  detail:
    fontFamily: "Lato, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  compact: "6px"
  control: "8px"
  selection: "10px"
  surface: "12px"
  dialog: "14px"
  feature: "16px"
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
  next-work:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.feature}"
  next-work-title:
    textColor: "{colors.primary}"
    typography: "{typography.next-work}"
  weekly-status-pending:
    backgroundColor: "{colors.weekly-warning-tint}"
    textColor: "{colors.weekly-warning}"
    rounded: "{rounded.compact}"
    padding: "5px 8px"
  weekly-status-done:
    backgroundColor: "{colors.weekly-success-tint}"
    textColor: "{colors.success}"
    rounded: "{rounded.compact}"
    padding: "5px 8px"
  weekly-notice:
    backgroundColor: "{colors.weekly-warning-tint}"
    textColor: "{colors.weekly-notice-ink}"
    rounded: "{rounded.surface}"
    padding: "18px 20px"
  weekly-metric:
    textColor: "{colors.foreground}"
    typography: "{typography.weekly-metric}"
  weekly-agenda-item:
    textColor: "{colors.foreground}"
    padding: "13px 10px"
  finance-tab:
    textColor: "{colors.muted-foreground}"
    padding: "10px 0 15px"
  finance-tab-active:
    textColor: "{colors.primary}"
  receipt-control:
    textColor: "{colors.foreground}"
    rounded: "{rounded.selection}"
    padding: "10px"
  history-record:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.surface}"
    padding: "18px"
---

# Design System: Beto Pastel

## Overview

**Creative North Star: "O cardápio da equipe da feira"**

A identidade reúne o vermelho do trailer, o preto do avental e o branco do boné. A interface tem títulos fortes, controles familiares e superfícies claras para a equipe reconhecer o próximo registro. A referência de cardápio e navegação do iFood se traduz em sabores reconhecíveis e ações acessíveis no celular; este sistema descreve a implementação própria do Beto Pastel.

A densidade é de uma ferramenta de operação: números legíveis, contexto próximo dos campos e estados explícitos. Nome, imagem ilustrativa, cor e selo mantêm o sabor reconhecível; o ícone de ingrediente é o fallback quando não há imagem. Listas e tabelas aproximam informações relacionadas sem cercar cada dado de um card. O movimento liga estados, enquanto conteúdo e formulário continuam sendo o centro da leitura.

Esta edição incorpora a evolução semanal aprovada em (15/10/2026), extraída do código e das capturas revisadas. Preserva o mundo existente; a referência iFood orienta reconhecimento e acesso à tarefa, sem compromisso de reprodução visual. A composição de cada página permanece no contrato de superfície, fora das regras globais.

**Key Characteristics:**
- Vermelho para ação e navegação selecionada; carvão para estrutura.
- Lato hospedada no projeto, títulos pesados e números tabulares.
- Superfícies brancas, bordas leves e profundidade contida.
- Identidade de sabor preservada ao abrir a tarefa.
- Contexto de cobertura junto dos números e distinção visual entre previsão e registro.
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

Na gestão semanal, `weekly-warning` e `weekly-warning-tint` formam as etiquetas de pendência; `weekly-notice-ink` dá leitura aos avisos sobre essa mesma tinta. A etiqueta concluída usa `success` com `weekly-success-tint` e check. Essas combinações pertencem a esses componentes, sem substituir as tintas incumbentes de prévia, erro ou confirmação. No comparativo semanal, `leftover-series` distingue sobras da série vermelha de produção; legenda e valores mantêm o significado acessível sem depender só da cor.

**The Action and State Rule.** Use o vermelho da marca para agir ou selecionar. Uma confirmação usa verde e uma advertência usa âmbar, acompanhados de texto ou ícone de estado.

As combinações de acento e tinta de cada sabor pertencem a `lib/flavor-identity.ts`, com associação estável pelo ID, assim como a imagem. Elas reaparecem no topo do card, no selo, no fallback de ícone e na área de identidade da tarefa. As listas compactas podem omitir o selo para priorizar nome, descrição e quantidade. Preserve essa associação ao estender o catálogo; uma cor de ingrediente não ganha significado de erro ou sucesso.

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
- **Next work:** título vermelho da faixa de próximo trabalho, com largura limitada a (18ch); reduz para (24px) até (640px). Não substitui o título de página.
- **Weekly metric:** números do resumo semanal, com apoio imediatamente abaixo; no celular usam (26px). O financeiro ajusta seus totais ao espaço e conserva rótulo e explicação juntos.
- **Detail:** datas, unidades e contexto compacto recorrente. Metadados menores existentes em componentes específicos não formam uma nova escala geral para textos ou campos.

**The Title First Rule.** Apresente o título antes do contexto de apoio. Datas, local de preparo e estado explicam a tarefa; não os transforme em um título decorativo acima dela.

## Layout

A aplicação combina navegação lateral de (16rem), barra superior de (72px) e conteúdo com largura máxima de (1500px). O respiro principal usa `shell`; grupos próximos usam `related` e `field`, enquanto blocos maiores usam `block` e `section`. Esses passos descrevem os valores recorrentes do código, não uma exigência de que toda distância seja múltipla de um único módulo.

O catálogo de cards usa quatro colunas, três até (1250px), duas até (767px) e cinco a partir de (1600px), com gaps de (18px), (12px) no celular e (10px) até (360px). Os cards legados de feira passam de três colunas para uma até (900px). Use `minmax(0, 1fr)` para manter os textos dentro do espaço disponível.

Os padrões semanais acrescentam uma densidade própria: agenda em quatro colunas, resumo em três, lista de produção em duas e área de feiras/gastos em proporção (1.4fr / 1fr). Até (1100px), a produção passa para uma coluna. Até (640px), a agenda ocupa duas colunas; o resumo usa duas com a movimentação numa linha inteira; feiras e gastos se empilham. A faixa ilustrada reserva (34%) à imagem, (33%) no celular, sem colocar texto sobre a comida. A tabela editável mantém largura mínima de (550px) e rolagem horizontal dentro de seu contêiner, sem alargar a página. Os preparados na feira usam três colunas e duas até (640px).

Até (767px), a barra superior tem (64px); o conteúdo recebe margens internas laterais de (16px), reduzidas para (13px) até (360px). A navegação inferior fica fixa e reserva espaço no final da página, incluindo a safe area. As ações persistentes ficam acima dela, com deslocamento inferior de (84px).

Até (1280px), título e controles podem quebrar linha. Até (640px), o seletor de semana e atualizar ocupam a primeira linha, seguidos por nova semana e registrar gasto. Priorize controles legíveis e largura útil do campo ao comprimir o cabeçalho. Filtros de gastos e histórico passam para duas colunas no celular; detalhes de histórico passam de pares lado a lado para rótulo acima do valor.

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

A faixa ilustrada usa `feature` no desktop e `surface` até (640px). Miniaturas de produção usam cantos de superfície. Raios pequenos de barras e legendas são detalhes locais; não estabelecem uma forma nova para botões ou campos.

Bordas comuns têm (1px); cards de sabor acrescentam borda superior de (2px) na cor da identidade. Selos pequenos têm cantos discretos, não formato de cápsula. Círculos são próprios dos pontos de progresso e das confirmações. Ícones são SVG de traço; o ícone do ingrediente usa traço mais leve (1.3).

## Components

### Buttons

Ações diretas e familiares. O primário e o secundário compartilham tamanho mínimo de (48px), padding e peso; o primário usa vermelho/branco, o secundário branco/tinta escura com borda de campo. A ação textual tem altura mínima de (44px) e resposta rosa. Controles de ícone usam botões de (44px–46px).

Hover muda a cor; a pressão desloca o botão (1px) para baixo. O foco tem contorno vermelho de (3px) e distância de (3px). Desabilitados mantêm a geometria e reduzem a opacidade para (0.48). As transições comuns duram (0.15s); movimento reduzido remove a transição dos botões.

### Chips

Etiquetas de estado são compactas, com texto em negrito (13px), sem sombra. Neutro, retorno confirmado e dia de feira usam suas combinações semânticas de texto/tinta. O filtro de local de preparo é um grupo de botões, não uma etiqueta: área neutra, botão selecionado branco e texto vermelho, com `aria-pressed`.

As etiquetas semanais usam texto compacto em negrito (11px), cantos `compact` e os pares de cor específicos do frontmatter. Concluído acrescenta check e texto; pendência continua escrita. Esse tamanho pertence à etiqueta, não ao rótulo de um campo.

### Cards / Containers

Painéis brancos têm borda leve e cantos de superfície; o padding recorrente varia entre (20px–26px) conforme a densidade. Listas compartilham uma superfície e separam suas linhas com bordas, evitando um card externo para cada campo.

O card de sabor é um botão inteiro. A face combina imagem ilustrativa e selo, com ícone como fallback. O corpo mostra nome, descrição, quantidade e unidade; o estado registrado acrescenta um check verde. O hover altera borda e sombra, preservando a cor que identifica o sabor.

As (18) imagens WebP ativas compartilham massa dourada, recheio visível, fundo claro, luz e enquadramento consistentes. O mapeamento é por ID em `lib/flavor-identity.ts`, não pela posição visível da lista. Os textos alternativos identificam sabor e caráter ilustrativo; a faixa usa legenda visível. Origem e prompts ficam em `public/images/sabores/ORIGEM.json` e nos metadados dos assets. São ilustrações geradas, sem acesso a fotos reais do Facebook ou do estabelecimento. Brócolis mantém os quatro ingredientes da descrição, sem selo vegetariano; o item antigo inativo não ganha imagem nem reaparece por reordenação.

### Inputs / Fields

Campos brancos, borda de controle, altura mínima de (48px), padding e cantos de controle. O rótulo fica acima; contexto e erro permanecem próximos. Foco usa contorno vermelho de (2px), com afastamento de (2px). Em grupos de moeda e senha, o contorno do campo fica para dentro do grupo para preservar a borda externa.

Erros inline usam tinta vermelha suave, texto explícito e `role="alert"`. Falhas de transporte são descritas em português. Expiração de sessão apresenta o diálogo de novo acesso sobre o conteúdo preenchido; o formulário de trabalho permanece montado.

### Navigation

A navegação lateral usa fundo carvão, ícones de traço e itens claros. Hover usa carvão mais claro; seleção usa vermelho e texto branco em negrito. No celular, destinos frequentes aparecem na barra inferior branca, com ícone, rótulo e seleção rosa/vermelha; “Mais” abre a navegação completa.

Cabeçalho e navegação permanecem estáveis ao trocar de área. O conteúdo abaixo do cabeçalho passa de opacidade (0.72) a (1) em (180ms), com `ease-out`; movimento reduzido pula essa transição. Painéis de trabalho continuam montados ao serem ocultados, preservando campos e posição de leitura por área. Não anime a página inteira nem condicione acesso aos campos ao fim da animação.

### Agenda, cobertura e comparativo

A agenda é uma linha de botões entre divisórias leves: ícone vermelho, nome, data e check ou seta. Cada item tem altura mínima de (76px), reduzida para (64px) no celular. O resumo aproxima rótulo, valor e unidade/completude, sem borda externa em cada métrica. Um dado não confirmado usa travessão com contexto de espera; um caixa parcial é identificado como parcial.

O comparativo usa barras horizontais alinhadas por semana, produção em vermelho e sobras em âmbar, com datas, valores escritos e legenda. O estado vazio explica a ausência de semanas concluídas. Dados sintéticos das capturas de QA não definem números, metas ou padrões do negócio.

### Listas de produção, padrões e sobras

A linha de produção alinha miniatura, nome/ingredientes e quantidade à direita. A miniatura usa (74px), reduzida para (58px × 64px) no celular; o espaço central cede sem empurrar a quantidade para fora. Distribuições editáveis ficam em três campos abaixo da linha. O grupo de colaboradores e a confirmação pertencem ao conjunto, evitando um botão de salvar por sabor.

A tabela de padrões mantém cabeçalhos claros e inputs usuais. Sobras usa linhas alinhadas com campos de contagem e contexto de reaproveitamento próximo. Preserve a distinção escrita entre previsto e confirmado e entre vazio e zero; não substitua campos legíveis por controles decorativos.

### Financeiro e registro de gasto

Resumo, Caixa e Gastos usam abas textuais sobre uma divisória: texto neutro no repouso, vermelho pesado e sublinhado de (2px) na seleção. A área mínima de interação é (44px). Totais financeiros ficam junto de suas ressalvas; uma referência estimada tem bloco próprio e não assume a aparência de entrada realizada.

O gasto abre em diálogo com largura limitada de (540px). Valor, descrição, data e situação aparecem primeiro; categoria, fornecedor e vínculo ficam em detalhes expansíveis. A nota opcional tem seção independente, controle tracejado com altura mínima de (48px), foco visível e nome do arquivo legível. Anexos privados abrem por link autenticado, sem miniaturas públicas. Falha do anexo tem mensagem própria e não apresenta o gasto salvo como perdido. A ação de pagamento atualiza o mesmo gasto e seu estado; não cria uma segunda linha visual de despesa.

### Histórico de registros

Filtros precedem uma lista com divisórias. Cada resumo mostra tipo, autoria, data e indicação de correção; a expansão revela rótulos e valores em uma superfície branca, incluindo o antes e o confirmado quando presentes. Use texto de negócio, valores formatados e quebra de palavras para manter a leitura no celular, em vez de apresentar o snapshot como JSON bruto.

### Tarefa e contagem de sabor

A identidade do card reaparece na tarefa: o nome e a face compartilham a transição, e a cor permanece estável. A contagem tem valor central pesado e botões laterais de aumentar/diminuir com áreas mínimas de (44px). A largura cede ao layout; o valor mantém algarismos tabulares.

A mini linha do tempo distingue etapa atual, concluída e futura por número/check, texto e cor. A pergunta vem antes do contexto, da quantidade e dos detalhes opcionais. A confirmação visual e o avanço só aparecem depois do registro confirmado. O footer pode quebrar linha e a ação ocupa a largura disponível no celular.

O movimento de identidade usa spring com stiffness (340) e damping (32); a troca de conteúdo do formulário usa (0.2s). A aplicação respeita a preferência de movimento reduzido através de `MotionConfig` e do tratamento de saída da tarefa. Preserve essa preferência ao adicionar novas transições.

## Do's and Don'ts

### Do:
- **Do** preserve nome, cor, imagem e identidade do sabor pelo ID entre lista, card e tarefa; use o ícone como fallback.
- **Do** use vermelho para ação/seleção e estados semânticos com texto ou ícone explícito.
- **Do** mantenha o título antes do contexto e os rótulos próximos dos campos.
- **Do** mantenha superfícies planas em repouso, foco visível e áreas de toque de pelo menos (44px).
- **Do** use algarismos tabulares em quantidades, totais e valores financeiros.
- **Do** adapte a separação para uma coluna em telas estreitas e reserve espaço para a navegação fixa.
- **Do** respeite movimento reduzido e preserve os campos ao apresentar erros ou novo acesso.
- **Do** mantenha completude, unidade e ressalvas próximas do número, com previsão e confirmação nomeadas.
- **Do** mantenha a nota opcional visível e os erros de anexo separados do resultado de salvar o gasto.

### Don't:
- **Don't** transforme datas, estados ou contexto de preparo em eyebrows decorativos.
- **Don't** misture as cores de identidade do catálogo com os significados de erro e confirmação.
- **Don't** use uma sombra dura deslocada em superfícies deste sistema.
- **Don't** substitua os SVG de traço por caracteres tipográficos como ícones.
- **Don't** apresente ilustrações geradas como fotos reais do estabelecimento ou troque o recheio por uma imagem genérica de outro sabor.
- **Don't** mostre uma confirmação visual antes da resposta de sucesso do registro.
- **Don't** transforme valores, horários ou nomes sintéticos de QA em conteúdo padrão do negócio.

Os literais auxiliares anteriores de cor, tamanho e raio apontados em `work/evolucao/detector-final.json` continuam fora da escala geral quando não correspondem a um padrão reutilizado acima. Não foram reparados nem incorporados só para eliminar avisos. Lato é uma decisão incumbente preservada por continuidade autorizada; os quatro avisos do detector não motivam troca de família nesta evolução.
