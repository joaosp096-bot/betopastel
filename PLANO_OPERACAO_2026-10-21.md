# Operação semanal — execução de 21/10/2026

Base: `c260e08`, branch `feat/beto-operacao-semanal`. Beto mantém Worker, D1, autenticação, IDs, imagens e tecnologias próprios. O Carmelo não participa desta alteração.

| Requisito | Encontrado | Alteração | Verificação |
|---|---|---|---|
| Conferir um dia de produção | Confirmação semanal, edição de 48 campos | Conferência por sabor, quarta OU quinta, farinha opcional | Domínio, teclado e mobile |
| Estoque e preços históricos | Produção e cargas; estimativa por faixa | Método versionado, reservas e preço de cada destino | Conservação, três preços, dados antigos |
| Cancelamentos | Ausente | Recalcular transferência sem modificar a carga de origem | Sexta/domingo/sucessivas/todas |
| Sobra semanal | Extras obrigatórios | Contagem base, extras opcionais, margem explícita | Nulo versus zero, preço pendente, margem limitada |
| Sobra entre semanas | Apenas retorno diário legado | Revisão pronto/descarte/desmontagem; descontar produção nova | Transporte único e correções dependentes |
| Massinhas | Ausente | Lotes com observação e datas de confirmação/término distintas | Várias semanas, perdas, correção |
| Salgados comprados | Ausente | Saldo anterior, compras, sobra e ajustes | Equação do estoque, transporte entre semanas |
| Rascunhos | Alertas em memória | Recuperação por usuário, semana e versão | Recarga, conflito, erro e reautenticação |
| Cadastro real | Padrão vazio; demo fictícia | Proposta da foto com associação explícita de IDs | Não inserir automaticamente exemplos |
| Persistência | JSON versionado, requestId, revisões | Extensão aditiva; nenhuma migration destrutiva | API local isolada, replay e concorrência |
| Visual | Vermelho, Lato, imagens de sabores | Preparar → fechar → resumo; financeiro secundário | Capturas 320/390/desktop, contraste, movimento reduzido |

## Decisões

- Semanas antigas preservam seu método. Somente semanas criadas pela nova interface usam `weekly-allocation-v2`.
- Sobra acima da última carga fica com distribuição pendente. Quantidade não desaparece e valor daquele sabor não é inventado.
- Reserva e carga de uma última feira cancelada ficam em estoque, fora da saída estimada.
- Fechamento permitido a partir da data da última feira ativa; se todas canceladas, a partir da produção confirmada. Não presume horário de retorno: a confirmação é do responsável.
- Margem começa pendente. A pessoa escolhe zero, um, dois ou outro valor; ajuste explícito por sabor/feira substitui a margem.
- Reabrir uma origem reabre também as dependentes; a nova confirmação relê o saldo da origem. Nunca duplicar transferências.
- Preços faltantes continuam pendentes. Valor conhecido é subtotal parcial, nunca lucro nem saldo bancário.
- Usuário confirmou nesta conversa os X como ausência de preparo, Especial 5/3/2 e nome carne, queijo e ovo. As outras linhas e associações com nomes do catálogo passam por conferência explícita.
- Massinhas não ganham feira ou semana de venda fictícia. Salgados sem distribuição mostram unidades; valor por feira fica pendente.

## Skills e referências

Impeccable: adotar Operate, edição localizada, revisão independente e movimento útil. UI UX Pro Max: adaptar hierarquia e acessibilidade à identidade existente. Taste: aplicar redução de ruído e estados completos; não trocar a stack. Humanizer: usar português direto, sem slogans técnicos. Sem nova biblioteca.

Referências de interação: W3C formulários e notificações; Loyverse produção/ajustes; documentação de estoque Odoo. Usadas para separar produção, movimentação e motivo de correção, sem copiar uma operação de ERP para o Beto.

## Limites e publicação

JSON mantém limites existentes de 200 semanas, 20 mil registros e 3 mil gastos; não representa escala ilimitada. Históricos de revisão guardam snapshots. Nenhum dado sintético vai para o banco remoto. Publicar somente build validado e verificar a versão servida; GitHub atualizado não prova implantação.
