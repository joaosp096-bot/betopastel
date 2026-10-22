# Beto Pastel

Sistema independente de produção, carga, retorno e caixa para as feiras de Amarais (sexta), Nova Odessa (sábado) e Morungaba (domingo). A produção da base acontece em um único dia, quarta **ou** quinta, escolhido por rodada. React/TypeScript, Vinext/Vite, Workers/D1, Drizzle, Zod e framer-motion 12.23.24.

## Usar

1. Entre com seu e-mail e senha. Em Configurações, cadastre uma vez as quantidades padrão e a distribuição por feira, além dos preços reais por sabor/feira.
2. Use Nova semana e escolha quarta **ou** quinta. O dia de produção não muda as datas das três feiras.
3. Em Produção, confira o padrão, informe os colaboradores e confirme as quantidades. Ajustar esta semana afeta só a confirmação atual. Carregar o padrão atual numa semana já aberta é uma ação explícita.
4. Em Feiras, consulte cargas e preços. Não há venda por venda nem retorno diário obrigatório. Registre os gastos de cada colaborador com seu valor, quando necessário.
5. No domingo ou na segunda, conte as sobras de cada sabor e confirme quanto foi preparado na feira. Zero precisa ser explícito. Perdas são separadas das sobras e não devem ser registradas nas duas quantidades.
6. Em Financeiro → Caixa, registre dinheiro contado, Pix, débito, crédito, troco levado e retiradas. Escolha um fechamento semanal ou por feira; não some as duas formas. O caixa independe da contagem de pastéis.
7. Use Registrar gasto em qualquer dia, mesmo sem semana aberta. Valor, descrição e data bastam. Nota é **opcional**. Marque Pago ou A pagar; registrar o pagamento depois atualiza a mesma despesa.
8. No Histórico, filtre por período, tipo, pessoa e sabor; abra os dados e as correções. Cancelamento mantém o rastro. Exportar registros baixa o estado atual em JSON; versões anteriores ficam no D1.

Administradores definem padrão, preços, horários e acessos. Colaboradores que produziram e pessoas que receberam pela feira não precisam de uma conta de usuário. A seção Minha senha permite alterar a senha e encerra sessões anteriores.

## Demonstração

`/demonstracao` usa quantidades, preços, pessoas e relógio fictícios. As alterações não chamam a API operacional, não vão ao D1 e reiniciam ao recarregar. O banco do negócio começa sem padrões nem lançamentos inventados. Valores reais ainda devem ser fornecidos pela equipe.

## Quantidades e financeiro

- Produção confirmada é o realizado na base; médias de preparo na feira permanecem previsões até o fechamento.
- Na contagem semanal: saída estimada = produzido na base + preparado confirmado na feira − sobras − perdas. Sobras são contagem física final; não significam automaticamente desperdício.
- Nos registros legados por feira: saída estimada = levado − retorno − perdas + ajuste. Saldo não alocado = produzido + reaproveitável de retornos concluídos − cargas, inclusive futuras. Os cálculos continuam legíveis sem converter a história.
- Movimentação informada = dinheiro contado + Pix + débito + crédito + cartão legado + retiradas − troco. O cartão legado é mantido separado quando não houve detalhamento. Nunca lançar a venda na máquina e o depósito dela como duas entradas.
- Diferença parcial = movimentação registrada − gastos vinculados à semana, pagos ou a pagar. Completude depende dos registros; não representa lucro completo nem saldo disponível em banco.
- Faturamento de pastéis por quantidade é estimativa. Semanas antigas usam uma faixa; semanas novas usam a distribuição versionada, cancelamentos, margem explícita e preços por destino; não inventa venda exata por feira. Não se soma esse valor aos recebimentos das máquinas, que podem incluir outros produtos.

Preços capturados nas cargas e previsões de semanas existentes são preservados. Sobra entre semanas passa por conferência de pronto, descarte e desmontagem; reabrir a origem reabre dependentes; não há custeio completo por pastel sem insumos e critérios reais.

## Comprovantes opcionais

Foto ou PDF pode ser anexado ao gasto ou posteriormente. Uma falha no envio preserva a despesa salva. Os arquivos exigem sessão do estabelecimento e ficam em tabela D1 separada, fora dos snapshots JSON, sem URLs públicas. JPEG, PNG, WebP e PDF; até 768 KB por arquivo, três por gasto e 50 MB por estabelecimento. Fotos grandes podem ser reduzidas no navegador antes do envio. Os bytes são conferidos no servidor, com limites de tamanho e mesma origem. A tabela adicional é criada de forma idempotente na primeira consulta autenticada; a migration `0002_optional_receipts.sql` registra a mesma estrutura para instalações novas.

As 18 imagens de sabores em `public/images/sabores` são ilustrativas. Prompts e origem estão em `ORIGEM.json` e nos metadados dos arquivos; fotos reais podem substituí-las posteriormente.

## Acesso e dados

A API ignora identidade oai enviada pelo visitante. Sessões próprias usam tokens aleatórios, guardados no D1 somente como hash, e cookie `__Host-beto_session` com HttpOnly, Secure e SameSite. Senhas usam PBKDF2 SHA-256 com salt próprio e 100.000 iterações, compatível com Workers. Login tem limites por IP, e-mail e global; gravações exigem mesma origem, sessão e permissão.

A primeira conta é criada uma única vez pelas variáveis `BETO_BOOTSTRAP_EMAIL` e `BETO_BOOTSTRAP_PASSWORD_HASH`, configuradas como secrets no Worker. Nunca coloque senha, hash de produção ou token no código, no GitHub ou neste README. `BETO_WORKSPACE_ID` identifica o estabelecimento; o padrão é `beto-pastel`. Troca de senha não reativa a senha de bootstrap.

O estado do estabelecimento permanece em `beto_workspaces`; cada gravação confirmada guarda snapshot em `beto_revisions`. Controle de versão evita sobrescrita entre pessoas. Reenvio com o mesmo ID e operação não duplica; reutilizar o ID com outra operação é rejeitado. Dados antigos de dois dias permanecem legíveis, sem converter suas quantidades para a regra nova. A flag de retorno de registros antigos é inferida do estado já concluído; números e IDs são preservados.

## Rodar e verificar

Node 24, pnpm 11.25.0. Instalação preserva o lockfile:

```sh
pnpm install --frozen-lockfile
node node_modules/typescript/bin/tsc --noEmit
node tests/model-contract.mjs
node tests/workflow-contract.mjs
node tests/weekly-contract.mjs
node tests/operation-contract.mjs
npm run build
python3 scripts/check-local.py
```

O teste de integração usa o Worker compilado e D1 em Miniflare sem observador de arquivos, para não reiniciar durante os testes. Cria e remove banco temporário, com contas fictícias; aceita somente URL local. Não grava no banco Cloudflare. As migrations `0000_organic_black_crow.sql` e `0001_beto_access.sql` inicializam um banco local vazio. Não reaplique a migration em um banco já inicializado.

`node scripts/qa-runtime.mjs browser` inicia uma avaliação local com fixture de acesso e banco em `work/`. Esse comando não usa contas reais nem o banco remoto. Para desenvolvimento com dados próprios, configure secrets locais em arquivo ignorado, aplique as migrations locais e use o Worker compilado. Não compartilhe `.wrangler`, `.sites-runtime`, `work`, `.env*` ou banco local.

## Publicar

O Worker `betopastel` usa o D1 exclusivo `betopastel-db`, separado do Carmelo. O build emite `dist/server/wrangler.json` com nome e binding DB. Na integração GitHub/Cloudflare:

```sh
npx --yes pnpm@11.25.0 install --frozen-lockfile && npm run build
npx wrangler deploy --config dist/server/wrangler.json
```

Configure os secrets de bootstrap no Worker e mantenha a proteção da API por sessão. O schema remoto é preparado no banco exclusivo antes do primeiro uso; não execute os testes ou migrations em recursos Carmelo. Confira publicação e login reais antes de apresentar a URL como operacional.

O projeto começa sem registros, metas ou preços operacionais inventados. O cardápio recuperado tem 19 sabores e deve ser conferido com a equipe. A imagem do pastel é ilustrativa; Lato vem do Google Fonts sob SIL Open Font License. Interface orientada pelas referências iFood e product-card-food, com Impeccable, UI UX Pro Max, Taste e Humanizer.

## Operação semanal V2 (22/10/2026)

Novas semanas usam `weekly-allocation-v2`; não convertem registros antigos. Produção nova, saldo aproveitado, reserva e cargas têm papéis distintos. Extras podem ficar pendentes. Cancelamento transfere a quantidade para o próximo destino ativo ou conserva estoque. O resumo mostra valores estimados e pendências, sem confundir preço ausente com venda de valor zero.

Massinhas usam lotes independentes de semanas; salgados comprados têm saldo, compra, sobra e ajuste, com distribuição opcional. A tabela da foto é uma proposta revisável em Configurações, nunca um seed automático. Preços e margem reais continuam a cargo da equipe.

O fechamento pode ocorrer a partir da última feira ativa, ou da produção quando todas foram canceladas. Fechamento sem distribuição coerente registra quantidades e mantém o valor pendente. Corrigir uma semana encerrada exige administrador, motivo e nova conferência; os fechamentos antigos continuam nos snapshots. Rascunhos são locais e exigem revisão explícita quando a versão salva muda.

`tests/operation-browser.py` verifica o fluxo autenticado, recuperação, falha de rede, conflito e reautenticação no QA local vazio. `tests/operation-captures.py` avalia a demo em 1440, 390 e 320 px com axe e movimento reduzido. Inicie `scripts/qa-runtime.mjs browser <diretório-local-vazio>` somente depois do build terminar.

A rota pública `/api/version` expõe apenas identificador de release e commit do build para verificar publicação, sem configuração ou secrets. Ver [ENTREGA_OPERACAO.md](ENTREGA_OPERACAO.md) para uso, roteiro de demonstração e recuperação.
