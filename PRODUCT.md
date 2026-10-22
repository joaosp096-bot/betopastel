# Beto Pastel

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React/TypeScript, Vinext/App Router, Vite, Cloudflare Workers/D1, Drizzle, Zod e framer-motion 12.23.24. Base recuperada do pacote V2, com acesso por sessão e evolução semanal aprovada em 15/10/2026. App e dados separados do Carmelo.

## Users

João administra o sistema. Robson e Erly/Erli operam produção e feiras. Administradores configuram preços, horários e acessos; operadores registram rotina, caixa e gastos. A primeira conta é configurada por secrets do Worker; novas pessoas são cadastradas pelo administrador. Não há autocadastro público nem contas operacionais fictícias no banco real.

## Product Purpose

Preparar a semana, fechar as sobras e entender o resultado. Acompanhar pastéis, massinhas por lote e salgados comprados. Caixa e gastos permanecem acessíveis como funções secundárias. A equipe não registra venda por venda.

## Operating Context

- Produção na base quarta OU quinta, um único dia por rodada.
- Sexta: Amarais / Santa Mônica / Chácara dos Amarais, Campinas. Sábado: Nova Odessa. Domingo: Morungaba.
- Semana quarta–terça agrupa a história; escolher quinta não desloca as feiras.
- Jornada aproximada 04h–16h inclui logística; vendas terminam aproximadamente 12h–13h. Horários exatos só valem quando configurados.
- Registrar depois é possível pela data da operação. Fuso America/Sao_Paulo.
- Contagem gerencial, sem explicar perda por unidade ou exigir estoque rigoroso de insumos.

## Capabilities and Constraints

- Configurações guarda o padrão por sabor e a distribuição prevista nas três feiras. Uma produção na quarta OU quinta confirma todas as quantidades da base e os colaboradores que participaram. Contas de acesso e colaboradores são identidades distintas.
- Padrões não são realização. Extras preparados por pedido podem ficar pendentes, receber contagem ou ter a previsão confirmada explicitamente como estimativa. Não sofrem margem automática. Alterar o padrão não reescreve a previsão de semanas existentes; carregar o padrão atual numa semana é uma ação explícita.
- Feiras oferece consulta das cargas e preços históricos. Correções mantêm motivo e autoria. Semana nova sugere contagem única de sobras no domingo ou segunda; registro posterior continua permitido. Campo vazio não é zero.
- A contagem consolidada fecha a operação sem exigir caixa. O caixa pode ser fechado por semana ou por feira, separando dinheiro, Pix, débito e crédito. Registros semanais e diários do mesmo período não são somados duas vezes.
- Gastos funcionam sem rodada: valor, descrição e data. Categoria, fornecedor/colaborador e vínculo com semana/feira completam o contexto. Nota ou comprovante é opcional e não condiciona salvar gasto, produção ou caixa.
- Pago/A pagar pertence ao mesmo gasto. Registrar pagamento atualiza esse gasto; cancelamento retém registro e rastro, retirando seu efeito dos totais.
- Comprovantes JPEG/PNG/WebP/PDF privados ficam em tabela D1 separada dos snapshots; até 768 KB por arquivo, três por gasto e 50 MB por estabelecimento nesta versão. Fotos grandes podem ser reduzidas antes do envio. Acesso exige sessão do mesmo estabelecimento; conteúdo é validado e falha do anexo não desfaz o gasto.
- Custo de equipe: um gasto por colaborador, com valor variável e feira opcional. Fornecedores aparecem nos lançamentos; não têm acesso próprio nesta entrega.
- Semanas novas usam weekly-allocation-v2: cargas anteriores presumidas esgotadas no conjunto do fim de semana, sobra atribuída à última feira ativa, preços históricos por destino, margem explícita ou ajuste informado. Semanas anteriores preservam o método original. Reserva não levada e carga cancelada sem destino ficam fora da saída. Sobra maior que a última carga permanece com distribuição incompleta e valor pendente. Não se soma às entradas reais e não representa lucro. Movimentação em máquinas não é saldo disponível em banco; bebidas e salgados podem compor as entradas.
- Histórico filtra registros por período, tipo, autor e sabor, mostra dados confirmados e correção anterior; snapshots completos mantêm versões anteriores. Reenvio é idempotente; concorrência usa versão. Exportação JSON contém o estado atual, não os binários de comprovantes.
- Semanas com contagem consolidada alimentam comparação de produção e sobras. Não fabricar tendência, recomendação ou lucro com registros incompletos.
- Estados e cálculos legados por feira continuam legíveis. Não converter nem somar contagens antigas com contagem semanal. Fórmulas de saída e disponibilidade antigas permanecem; os agregadores evoluem para os fechamentos semanais e novas formas de pagamento.
- 19 IDs de catálogo preservados, 18 sabores ativos: Brócolis tem brócolis, queijo, calabresa e bacon; o antigo item Calabresa e bacon fica inativo. Não rotular Brócolis como vegetariano.
- A foto foi transcrita como proposta de padrão. O usuário confirmou X como ausência de preparo, Especial 5/3/2 e nome carne, queijo e ovo. As associações de nomes e demais quantidades passam por revisão explícita na interface. Preços reais, margem definitiva, extras e horários ainda dependem da equipe. Não usar números da demonstração como padrão do negócio. Custos completos e unidades físicas precisam da equipe.
- Sobra pronta, reserva e carga cancelada sem destino passam para revisão da próxima semana: prontos aproveitados, descarte ou desmontagem. Somente prontos reduzem a produção nova. Reabrir a origem reabre as dependentes para nova conferência, preservando revisões e o preenchimento anterior do fechamento. Não prometer estoque físico auditado, custeio completo, banco conciliado ou backup/restauração sem teste.
- Estoque de bebidas, integrações, metas, envio direto por fornecedor com aprovação e permissões próprias ficam para etapas posteriores. Não criar módulos vazios nem ampliar para PDV, fiscal, delivery ou IA no runtime.

- Feiras canceladas transferem a carga uma única vez para a próxima ativa; se não houver destino, conservam estoque. Fechamento abre na data da última feira ativa (ou produção, se todas canceladas), com confirmação do responsável.
- Massinhas: data, unidades, preço único por lote, observação de sobra/saídas sem venda e término exato opcional. Confirmação tardia não inventa data ou feira de venda. Histórico mostra duração e intervalo entre produções.
- Salgados comprados: saldo anterior, compra, sobra, ajuste e distribuição opcional. Sem distribuição/preço suficiente, unidades continuam visíveis e valor fica pendente.
- Rascunhos operacionais locais isolados por conta/semana/tarefa/versão, com recuperação explícita e conferência obrigatória quando a versão muda. Não são confirmação de persistência.

## Brand Commitments

Vermelho do trailer, preto do avental e branco do boné. Referência iFood: produtos reconhecíveis, navegação clara e tarefa acessível no celular, sem checkout de consumidor. Autonomia de design concedida pelo usuário. Lato hospedada no projeto, controles familiares, toque de 44px, contraste e movimento reduzido. Os 18 sabores ativos têm imagens ilustrativas produzidas no mesmo enquadramento, nomes e cores estáveis por ID. Fotos reais do trailer não foram acessadas; não usar imagens de negócios homônimos. As ilustrações não representam fotos reais do estabelecimento. A faixa inicial tem altura limitada e uma ação principal de preparação, consulta ou resumo. Gasto rápido permanece no Financeiro. Transições curtas de opacidade, campos preservados entre áreas e movimento reduzido.

## Product Principles

1. A operação física define a tarefa, e cada confirmação precisa ser real.
2. Registrar pouco e mostrar cobertura do que falta.
3. Separar retorno, estimativa, reaproveitamento informado e recebimentos.
4. Preservar cálculo, identidade e estados anteriores de uma correção.
5. Demonstração é identificada e não grava na API operacional.
