# Validação — evolução semanal do Beto Pastel

15/10/2026. Dados fictícios foram usados somente em D1 local isolado. Testes de produção, caixa, gasto e arquivo não gravam no banco operacional Cloudflare.

## Verificações

- TypeScript e build completos de cliente, SSR e Worker Cloudflare, preservando stack e lockfile.
- Contratos numéricos de saída, disponibilidade, preço histórico, caixa e resultado legado.
- 33 testes de fluxo legado, com catálogo corrigido para 18 sabores ativos e 19 IDs preservados.
- 28 testes do fluxo semanal: padrão é previsão, confirmação única quarta OU quinta, colaboradores/autoria, correção substitutiva, sobras com zero explícito, preparo na feira confirmado, fechamento independente, formas de pagamento, gastos sem semana e cancelamento com rastro. Preços cadastrados após abrir a semana atualizam apenas cargas futuras não confirmadas; preços já capturados permanecem históricos.
- 52 verificações no Worker compilado e D1 local: sessão própria, papéis, mesma origem, versão/concorrência atômica, idempotência, histórico e paginação, preços por feira, comprovantes privados, assinatura/tamanho/tipo de arquivo, gasto sem rodada/nota, pagamento único, logout, troca de senha e limites de login.
- 27 capturas dos nove estados principais em 1440, 390 e 320 px: zero achados Axe WCAG A/AA, overflow horizontal ou erros JavaScript nas amostras. Captura adicional em 1280 px validou a quebra dos controles do cabeçalho.
- No navegador móvel emulado, voltar preservou a produção em edição; falha de rede manteve colaboradores e permitiu confirmar uma vez; uma contagem de 18 sabores fechou a operação; caixa semanal posterior separou débito/crédito.
- Registro de gasto sem semana pela interface, anexo privado consultável e pagamento do mesmo gasto foram confirmados contra o estado persistido; nenhum gasto duplicado foi criado.
- Reautenticação preservou valor e descrição do gasto, e a tentativa rejeitada não criou despesa. A navegação acionou a transição de 180 ms e foco na nova área; com movimento reduzido, a transição foi omitida. Isso verifica comportamento, não taxa de quadros ou desempenho em telefone físico.
- Impeccable: detector executado uma vez; quatro avisos de Lato incumbente, mantida por continuidade, e advisories frente aos tokens anteriores. Proveniência conferida: 19 rasters, zero sem origem, incluindo as 18 novas imagens ilustrativas.
- Revisão independente: `disposition: ship`, sem achados materiais no código visual amostrado e nas capturas de Início, Produção, Financeiro, gasto e Configurações. A extensão para 1280 px também manteve `ship`.

## Limites e dados reais

As capturas mostram uma conta e números de QA, não informações da pastelaria. A rota pública `/demonstracao` identifica dados fictícios, não grava na API operacional e reinicia ao recarregar.

Quantidades padrão, preços e horários reais continuam a cargo da equipe; o usuário informou que ainda não tem a lista. Não foram usados números da demonstração como padrão do negócio. As 18 imagens são ilustrativas e não representam fotos reais do estabelecimento.

As verificações de acessibilidade são amostras automatizadas. Não houve homologação com a equipe ou teste em telefone físico/teclado nativo. Custo integral por pastel, transferência de sobras entre semanas, estoque de bebidas e acesso direto de fornecedores são etapas posteriores. Movimentação não é saldo bancário; estimativa por quantidade não é lucro.

Comprovantes são opcionais e privados, limitados a três arquivos de até 768 KB por gasto e 50 MB por estabelecimento. A exportação JSON não contém os binários; não é uma promessa de backup/restauração testada. Não há certificação de antivírus ou validação fiscal das notas.

Publicação e verificação remotas são registradas separadamente após o deploy. Esta validação local não substitui essa verificação nem a homologação do gestor.

## Repetir

Node 24 e pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
node node_modules/typescript/bin/tsc --noEmit
node tests/model-contract.mjs
node tests/workflow-contract.mjs
node tests/weekly-contract.mjs
npm run build
python3 scripts/check-local.py
```

`check-local.py` inicia o Worker compilado em Miniflare sem observador de arquivos, aplica migrations em banco temporário, executa a integração e encerra o processo. Aceita somente endereço local e remove o banco ao final. Não execute fixtures no banco remoto.
