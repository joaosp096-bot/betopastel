# Beto Pastel

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React/TypeScript, Vinext/App Router, Vite, Cloudflare Workers/D1, Drizzle, Zod e framer-motion 12.23.24. Base recuperada do pacote V2, com fórmulas preservadas, acesso por sessão e rotinas corrigidas. App e dados separados do Carmelo.

## Users

João administra o sistema. Robson e Erly/Erli operam produção e feiras. Administradores configuram preços, horários e acessos; operadores registram rotina, caixa e gastos. A primeira conta é configurada por secrets do Worker; novas pessoas são cadastradas pelo administrador. Não há autocadastro público nem contas operacionais fictícias no banco real.

## Product Purpose

Organizar rodada, produção na base, carga, retorno/reaproveitamento informado e histórico, com financeiro agregado complementar. A equipe não registra venda por venda.

## Operating Context

- Produção na base quarta OU quinta, um único dia por rodada.
- Sexta: Amarais / Santa Mônica / Chácara dos Amarais, Campinas. Sábado: Nova Odessa. Domingo: Morungaba.
- Semana quarta–terça agrupa a história; escolher quinta não desloca as feiras.
- Jornada aproximada 04h–16h inclui logística; vendas terminam aproximadamente 12h–13h. Horários exatos só valem quando configurados.
- Registrar depois é possível pela data da operação. Fuso America/Sao_Paulo.
- Contagem gerencial, sem explicar perda por unidade ou exigir estoque rigoroso de insumos.

## Capabilities and Constraints

- Card por sabor abre foco protegido. Salvar contagem → separar → salvar confirmado → próximo sabor. Mini linha do tempo, erros inline e campos preservados em rede/conflito/sessão expirada.
- Preços por sabor e feira; preço capturado na carga preserva história.
- Carga futura pode ser alterada sem reenviar a feira passada. Feira iniciada/encerrada fica protegida; correção administrativa usa motivo.
- Retorno inclui preparo na feira e zero explícito. Reaproveitável não ultrapassa retorno. Perdas já incluídas no retorno não entram de novo.
- Três retornos bastam para encerrar a operação. Caixa e gastos podem ser registrados depois.
- Saída estimada, receita registrada, saldo não alocado e resultado parcial mantêm as quatro fórmulas recuperadas. Retorno não é desperdício nem resultado parcial lucro completo.
- Histórico guarda snapshots e autoria; correções mantêm identidade. Reenvio é idempotente; concorrência usa versão.
- Catálogo recuperado de 19 sabores é referência a validar com a equipe. Preços reais, custos, recipientes, volumes e horários não foram fornecidos.
- Sobra entre rodadas não tem transferência automática; não prometer estoque físico auditado, custeio completo, banco conciliado ou backup automático.
- Não ampliar para ERP, PDV, fiscal, delivery, IA no runtime ou ficha técnica obrigatória.

## Brand Commitments

Vermelho do trailer, preto do avental e branco do boné. Referência iFood: produtos reconhecíveis, navegação clara e tarefa acessível no celular, sem checkout de consumidor. Autonomia de design concedida pelo usuário. Lato hospedada no projeto, controles familiares, toque de 44px, contraste e movimento reduzido. Imagem de pastel do pacote é ilustrativa; os demais sabores usam nome, cor, selo e ícone.

## Product Principles

1. A operação física define a tarefa, e cada confirmação precisa ser real.
2. Registrar pouco e mostrar cobertura do que falta.
3. Separar retorno, estimativa, reaproveitamento informado e recebimentos.
4. Preservar cálculo, identidade e estados anteriores de uma correção.
5. Demonstração é identificada e não grava na API operacional.
