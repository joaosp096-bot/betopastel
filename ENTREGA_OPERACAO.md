# Beto Pastel — operação semanal

## Para começar

1. Entre no acesso próprio do Beto. A demonstração, em `/demonstracao`, reinicia ao recarregar e não grava no banco operacional.
2. Em **Configurações**, confira a tabela fotografada. Associe cada linha ao sabor correto, revise quantidades e confirme o padrão. Nomes diferentes podem ser mantidos como produtos separados. Informe os preços reais por feira quando disponíveis.
3. Abra **Nova semana**. Em **Produção**, escolha quarta ou quinta, informe os colaboradores e confira as quantidades. Cada sabor abre seus próprios ajustes. Massa batida é opcional e usa farinha como referência.
4. Se houver saldo anterior, separe o que continua pronto, foi descartado ou desmontado. Prontos aproveitados reduzem a produção nova sugerida. Confira a quantidade que realmente foi produzida antes de confirmar.
5. Em **Feiras**, consulte a lista de preparação. Extras são previsões. Marque “Essa feira não aconteceu” quando necessário: a carga segue para a próxima feira ativa, ou fica no estoque se não houver destino.
6. Depois da última feira, preencha as sobras e confirme o fechamento. “Não sobrou nada” exige uma confirmação antes de preencher todos os zeros. Extras podem ser contados, aproximados ou deixados pendentes. A margem de consumo/perdas é uma escolha explícita, não um fato observado.
7. Veja o resumo e o histórico. Quantidade produzida não equivale a quantidade vendida; valor estimado não equivale a lucro nem dinheiro disponível no banco.

Quando o padrão mudar depois de abrir uma semana ainda não produzida, use **Carregar padrão atualizado**. Depois de confirmar, ajustes da semana preservam o padrão futuro. Preços antigos só mudam por correção explícita do administrador, com motivo.

## Massinhas e salgados

**Massinhas para vender** registra lotes que podem durar várias semanas. A nova produção não encerra o lote anterior. Na conferência, informe o que resta e, se souber, as saídas sem venda. A data exata em que acabou é opcional; o app diferencia essa data da confirmação tardia. Não atribui vendas a uma feira ou semana inventada.

**Salgados comprados** registra compras, saldo anterior, sobra e ajustes. Sem distribuição suficiente, a saída semanal continua disponível e o valor por feira fica pendente. Para transportar o saldo, confira primeiro os salgados da semana anterior, inclusive quando o estoque era zero.

Financeiro, caixa, gastos e comprovantes continuam disponíveis. Nenhum comprovante é obrigatório para registrar gasto. Esta versão não calcula custo completo de receita, lucro por sabor, estoque de bebidas ou conciliação bancária.

## Conferência e correção

- Rascunho neste aparelho não significa registro confirmado. A confirmação depende da resposta do servidor.
- Se a sessão terminar, entre novamente e continue o formulário. Se houver conflito, atualize os dados; a recuperação exige conferir a nova versão antes de enviar.
- O rascunho é identificado por conta, semana, tarefa e versão. Não é backup e depende do armazenamento do navegador. Apagar os dados do navegador também apaga os rascunhos.
- Reabrir uma semana exige administrador e motivo. Semanas seguintes que usam seu saldo são reabertas para evitar estoque duplicado. O fechamento anterior fica disponível para nova conferência, e snapshots anteriores permanecem no histórico.
- Sobra maior que a carga atribuída à última feira gera distribuição incompleta; o app conserva a quantidade e mantém o valor desse sabor pendente. Revise a distribuição por meio da correção da semana.
- Fechamento antecipado é permitido na data da última feira ativa, desde que as demais tenham sido canceladas; quando todas são canceladas, a partir da produção confirmada. A pessoa confirma que a operação terminou.

## Pendências reais para o teste de 30 dias

Preços por sabor e feira, preço da massinha, margem definitiva, quantidades dos extras e compras/saldos dos salgados devem vir da equipe. A tabela da foto tem uma proposta para conferência; X, Especial 5/3/2 e carne, queijo e ovo foram esclarecidos pelo usuário. Associações entre nomes ainda precisam da revisão no cadastro. Dados da demonstração não são padrões do negócio.

## Roteiro de apresentação — aproximadamente 60 segundos

Use a demonstração identificada, com dados ilustrativos. O roteiro não é um vídeo já gravado e não promete que toda contagem real leve um minuto.

- **0–8 s:** “Aqui você acompanha o que preparou, o que sobrou e o resultado estimado das feiras.” Mostrar o início e o próximo passo.
- **8–25 s:** Abrir Conferir produção. Mostrar o padrão separado por feira, abrir um sabor, ajustar uma quantidade e informar quem participou. Confirmar.
- **25–43 s:** Simular domingo na barra da demonstração. Abrir Feiras, preencher sobras — usar zero em lote apenas no cenário em que realmente não sobrou — e mostrar extras opcionais. Escolher uma margem ilustrativa, explicando que ela é configurável. Confirmar o fechamento.
- **43–55 s:** Mostrar o resumo: novos produzidos, sobras e vendas estimadas. Abrir um sabor para explicar estoque, reserva e preço por destino. Mostrar que informações ausentes ficam pendentes.
- **55–60 s:** “A ideia é testar por 30 dias e ajustar com a rotina de vocês. Cada confirmação fica no histórico.”

## Publicação e recuperação

Worker `betopastel`, D1 `betopastel-db`, sem migração de tabela nesta entrega. Login e secrets existentes são preservados. `/api/version` informa release e commit compilado; confirme essa resposta depois de publicar.

Antes da atualização, preserve exportação autenticada do estado e anote a implantação ativa do Worker. Não execute testes, sementes ou comandos de limpeza no banco remoto. Os testes deste projeto usam D1 local descartável.

**Atenção ao rollback de dados:** o código anterior não conhece os campos V2 e pode descartá-los em uma gravação. Antes de existir registro V2, retornar à implantação anterior preserva o estado antigo. Depois de registrar V2, prefira correção adiante ou uma implantação que preserve o schema V2; suspenda gravações durante a recuperação e mantenha snapshots/exportação. Não restaure banco automaticamente nem substitua registros reais por fixture. Esta entrega não afirma ter testado uma restauração do banco de produção.

Limites atuais: 200 semanas, 20 mil registros correntes, 3 mil gastos e mil lotes de massinha por estado; revisões guardam snapshots. O teste de 30 dias está dentro dessa escala, mas isso não é promessa de crescimento ilimitado.
