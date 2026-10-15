# Beto Pastel

Sistema independente de produção, carga, retorno e caixa para as feiras de Amarais (sexta), Nova Odessa (sábado) e Morungaba (domingo). A produção da base acontece em um único dia, quarta **ou** quinta, escolhido por rodada. React/TypeScript, Vinext/Vite, Workers/D1, Drizzle, Zod e framer-motion 12.23.24.

## Usar

1. Entre com o acesso criado pelo administrador.
2. Inicie a rodada e escolha o dia de produção. O dia não muda as datas das feiras.
3. Abra cada sabor de base. Informe a quantidade produzida, salve, separe para as três feiras e salve novamente. O próximo sabor abre após a confirmação do servidor. Registre zero quando não produziu.
4. Conclua a produção e confira cada carga pela tela Feiras. Uma carga pode ter quantidade e preço diferentes das outras. Alterar a carga seguinte preserva as feiras anteriores.
5. Após a feira, registre o que voltou, a parte reaproveitável e, nos sabores feitos na feira, o total preparado. Perdas/consumo fora do retorno e ajustes são opcionais. Não registre cada venda.
6. Conclua os três retornos para encerrar a operação da rodada. O caixa e os gastos permanecem disponíveis para registro posterior.
7. Consulte o Histórico para corrigir com motivo ou abrir o estado de uma revisão. Exportar registros baixa o estado atual em JSON; as revisões completas permanecem no D1.

Em Configurar, o administrador define horários e preços por sabor e feira, ativa/inativa sabores e cria acessos da equipe. Operadores registram a rotina; não podem administrar preços ou acessos. A seção Minha senha permite trocar a senha e encerra as sessões anteriores.

## Demonstração

`/demonstracao` usa dados fictícios, pessoas e relógio simulados. As alterações não chamam a API operacional, não vão ao D1 e reiniciam ao recarregar. O aplicativo principal persiste seus registros no banco e exige sessão. A prévia HTML em `work/` tem o mesmo comportamento de demonstração.

## Quantidades e financeiro

As quatro funções `estimated`, `revenue`, `available` e `stats` mantêm as fórmulas recuperadas literalmente, conferidas pelos testes:

- Saída estimada = levado − retorno − perdas/consumo + ajuste. Em preparados na feira, o total preparado é informado no ajuste. Perdas já incluídas no retorno não entram novamente.
- Saldo não alocado = produzido + reaproveitável de retornos concluídos − cargas, inclusive futuras. Não é uma contagem independente do estoque físico.
- Receita registrada = dinheiro contado + Pix + cartão + retiradas − troco inicial. Inclua gastos pagos com dinheiro da feira e retiradas pessoais no campo Dinheiro retirado, uma vez.
- Resultado parcial = receita dos caixas registrados − gastos da rodada. Cartão registrado não confirma depósito; faltam custos quando eles não foram informados.

Preço guardado na carga é histórico. Uma mudança no catálogo não reescreve uma carga já registrada. Gastos podem ser atribuídos a uma feira ou à rodada; não há rateio automático. Retorno não é sinônimo de desperdício. Custo completo por pastel depende de insumos, volumes e critérios reais, que não foram fornecidos. Sobra entre rodadas não tem transferência automática.

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
