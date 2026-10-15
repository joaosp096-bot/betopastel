# Validação — Beto Pastel

Implementação de 14–15/10/2026. As verificações abaixo usam dados fictícios em banco D1 local isolado. Nenhum teste de produção, retorno ou caixa grava no banco operacional Cloudflare.

## Evidências

- TypeScript sem erros e build completo de cliente, SSR e Worker Cloudflare, com lockfile preservado.
- 33 verificações de domínio: produção quarta **ou** quinta, feiras fixas sexta/sábado/domingo, reedição sem duplicar contagem, carga por feira, preservação de cargas anteriores, preço histórico, retorno independente do caixa, caixa posterior ao encerramento, registros zero, correção com motivo e permissões.
- Comparação literal das quatro funções `estimated`, `revenue`, `available` e `stats` com a fonte recuperada. Contratos numéricos verificam saída, disponibilidade, receita e resultado.
- 37 verificações contra a API compilada e D1 local: autenticação, autorização, concorrência e versão, idempotência vinculada à operação, histórico, preços, origens externas, logout, troca de senha e limitação de tentativas de login.
- Login, demonstração, imagem e fonte servidos pelo Worker com HTTP 200.
- Segunda rodada de navegador em 1440, 390 e 320px: 36 estados capturados e nove cenários de fluxo. Nessas amostras, zero achados Axe WCAG A/AA, overflow horizontal ou erros JavaScript. A contagem e a separação persistiram após recarregar; uma falha de rede manteve o valor digitado e não avançou; a reautenticação manteve o formulário operacional.
- Revisão visual independente das capturas obrigatórias e de quatro estados adicionais. Lato local e a identidade dos sabores foram preservados. Correções solicitadas: mensagens de transporte em português, reautenticação nas configurações e título antes do contexto nas tarefas.
- Após essas correções, 24 estados direcionados nas mesmas três larguras: mensagens em português com rede indisponível; 401 ao carregar/salvar acessos e trocar senha; formulário preservado após login e nova tentativa de salvar confirmada. Zero achados Axe A/AA, overflow ou erros JS nessas amostras. TypeScript, build e os 37 testes de API/D1 passaram novamente.

As capturas mostram a rota operacional real com `admin@example.test` e volumes fictícios. Não representam a conta do estabelecimento nem a rota pública `/demonstracao`. A demonstração é identificada na interface e não persiste no D1.

## Limites

Os testes de acessibilidade são amostras automatizadas, não certificação. Não houve uso em celular físico, teclado nativo ou homologação com a equipe. Animações não foram avaliadas temporalmente pelo revisor; a QA usa movimento reduzido. Não há comp aprovada nem QUALITY BAR visual para afirmar equivalência ao acabamento do iFood.

O cardápio recuperado precisa ser conferido. Preços, horários reais, unidades, custos e acessos dos operadores devem ser configurados com a equipe. O sistema inicia sem registros operacionais inventados. Saída é estimativa gerencial; retorno não é desperdício. Custo completo por pastel e transferência de sobra entre rodadas não foram inventados nem automatizados.

Publicação e login remotos têm evidência própria após o deploy. Este arquivo não substitui a homologação operacional.

## Repetir

Com Node 24 e pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
node node_modules/typescript/bin/tsc --noEmit
node tests/model-contract.mjs
node tests/workflow-contract.mjs
npm run build
python3 scripts/check-local.py
```

`check-local.py` inicia o Worker compilado em Miniflare sem observador de arquivos, aplica as migrations em banco temporário, executa a integração e encerra o processo. O banco é removido ao final. Os testes aceitam somente endereço local. Não execute a suíte nem fixtures no banco remoto.
