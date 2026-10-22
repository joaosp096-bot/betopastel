# Validação da operação semanal — 22/10/2026

Ambiente: Worker compilado com Miniflare/D1 local isolado; Chromium instalado no ambiente. Nenhum teste abaixo grava dados operacionais remotos.

| Verificação | Resultado |
|---|---|
| TypeScript `tsc --noEmit` | Passou |
| Build de produção Vinext/Vite | Passou; aviso conhecido de classificação estática de rotas do Vinext |
| `tests/model-contract.mjs` | Passou, contratos e catálogo legado |
| `tests/workflow-contract.mjs` | 33 grupos passaram |
| `tests/weekly-contract.mjs` | 28 grupos passaram, método semanal anterior preservado |
| `tests/operation-contract.mjs` | 17 grupos passaram, método novo |
| `scripts/check-local.py` | 56 verificações da API, mais páginas/assets servidos pelo Worker |
| `tests/operation-browser.py` | 12 verificações no navegador autenticado passaram |
| `tests/operation-captures.py` | 12 capturas: 1440, 390 e 320 px; zero violações axe detectadas, zero overflow horizontal e zero erros JavaScript |

O domínio cobre três preços, reserva não vendida, margem pendente/limitada/substituída, extras opcionais, preço ausente, cancelamentos sucessivos/totais, sobra acima da última carga, encerramento antecipado, reaproveitamento/descarte/desmontagem, reabertura dependente, lotes que atravessam semanas, saldo de salgados e proteção de preços/IDs históricos.

API: sessão própria e papéis no servidor, origens, autoria, idempotência, concorrência atômica, snapshots, comprovantes opcionais privados, senha e limite de tentativas. O fechamento V2 foi gravado e relido, inclusive extras nulos. Reenvio não duplicou transferência nem revisão.

Navegador: edição de um sabor e colaboradores recuperados após recarga; conflito manteve formulário; rascunho de versão anterior exigiu revisão; rede indisponível apresentou recuperação; sessão expirada manteve campos; reentrada permitiu confirmar uma única produção; zero em lote exigiu confirmação; fechamento persistiu após recarga sem obrigar extras.

## Evidência de interação

Na demonstração de 12 sabores base, a edição anterior apresentava 48 campos de quantidades simultaneamente. A conferência nova mostra as quantidades em linhas compactas; abrir um sabor revela quatro campos. A captura de produção tinha dois inputs visíveis (colaboradores e farinha), e a de ajuste tinha seis, além do seletor de dia. Não há segunda digitação da lista de preparação.

O caminho padrão envolve abrir produção, informar colaboradores e confirmar; selecionar outro dia ou registrar farinha é opcional. Ajustar um sabor acrescenta abrir a linha e alterar o campo. O fechamento sem sobras envolve abrir Feiras, acionar “Não sobrou nada”, confirmar os zeros, escolher margem ou deixá-la pendente e confirmar fechamento. Não se promete conclusão de uma contagem real em três toques ou um minuto.

## Revisão visual

Capturas locais em `.impeccable/review/operation/`; relatório automatizado em `work/captures-operation.json`. Todas as 12 foram abertas e conferidas pelo autor antes da revisão independente. Usam fonte e imagens carregadas, início do documento e movimento reduzido. A barra inferior fixa aparece na posição da viewport nas imagens de página inteira.

Detector Impeccable executado uma vez nos arquivos alterados: quatro avisos sobre Lato, fonte da marca preservada intencionalmente, e 142 sugestões de documentação de tokens, em grande parte anteriores. As sugestões novas são tamanhos tipográficos e tons de aviso/legenda; não foram tratadas como defeito sem evidência visual. Relatório bruto em `work/detector-operation.json`.

## Encerramento Impeccable e proveniência

A revisão independente recebeu as 12 capturas e concluiu **ship**, sem correções materiais. O anexo original não estava disponível nesta rodada; o resumo do pedido e os contratos do projeto orientaram a conferência. Essa conclusão visual não substitui a confirmação de publicação.

A documentação conferiu `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, o contrato `.impeccable/surfaces/app-page-tsx.md`, `app/globals.css` e os componentes de `components/beto/SeasonWorkspace.tsx`. Esta é uma extensão do mundo existente. `DESIGN.md` e seu sidecar foram preservados: vermelho de ação, Lato local, superfícies claras, identidade por sabor, números tabulares e movimento reduzido continuam aplicáveis. Edição compacta, extras opcionais e resumo parcial pertencem à superfície operacional. As diferenças locais de tamanho, raio e tinta de aviso apontadas pelo detector permanecem registradas como diferenças locais, sem promoção automática a tokens globais.

Nenhuma imagem nova foi produzida. As 18 ilustrações de sabores reutilizadas têm origem e prompts em `public/images/sabores/ORIGEM.json` e sidecars junto dos WebP. A faixa reutiliza `public/images/pastel.png`, já presente na base; seu PNG não contém metadados de origem e não foi encontrado registro do autor/prompt original. A interface o identifica como imagem ilustrativa; a autoria original permanece não verificada. As capturas em `.impeccable/review/operation/` são evidência local de QA, não fotografias do estabelecimento. Não foram incorporadas ao catálogo.

## Limites da evidência operacional

Antes da publicação, o domínio real e o login próprio do Beto responderam HTTP 200. Uma cópia autenticada do estado na versão 4, com uma semana, foi preservada localmente em arquivo ignorado pelo Git e com permissão restrita. Nenhum registro operacional remoto foi alterado por esses testes. A implantação anterior correspondia ao commit `c260e08`, com build Cloudflare bem-sucedido.

Axe e automação não substituem leitura com tecnologia assistiva nem uso em celular físico, câmera ou teclado virtual real. Não foi realizado teste de carga nem restauração do D1 de produção. Preços, margem e associações da tabela dependem da conferência da equipe. O status de publicação deve ser confirmado separadamente pela resposta de `/api/version` e pela navegação no domínio real.
