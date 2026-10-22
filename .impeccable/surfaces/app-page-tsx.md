---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/globals.css","components/beto/FlavorTask.tsx","components/beto/FoodCard.tsx"]
---

Mode: Operate. Redesign do sistema recuperado, com rotina definida no contexto mestre e autonomia de design concedida pelo usuário.

## Direction contract

THESIS: o próximo trabalho da semana fica evidente e um sabor abre uma tarefa de foco protegido. A página é uma ferramenta da equipe da feira.
OWN-WORLD: vermelho do trailer, preto do avental e branco do boné; superfícies brancas, texto carvão, uma família sans de interface, números tabulares. Cards de sabores têm identidade e selos; a carga e o caixa usam controles usuais.
STORY: preparar a semana, fechar a semana, entender o resultado. Conferir um sabor por vez; escolher quarta OU quinta; revisar sobras aproveitadas e confirmar produção. Consultar cargas e extras previstos, registrar cancelamentos e contar sobras uma vez. Massinhas e salgados têm controles próprios; financeiro continua acessível como função secundária. Salvar só é confirmado pelo servidor; rascunho tem recuperação explícita.
FIRST VIEWPORT: semana e próximo trabalho ao lado do pastel ilustrativo, com ação única. Abaixo, sequência preparar/fechar/resumo e agenda das três feiras; números com completude e consulta por sabor. No celular a ação vem antes dos números, com navegação inferior. Semanas vazias explicam cadastro e preparação; semanas fechadas mostram vendas estimadas, pendências e estoque disponível.
FORM: leitura de cardápio e marca do trailer/iFood, direção 5 da lista; seed a7b77f5e. Caminho code-led. A preferência iFood e a autonomia já fornecidas substituem nova aprovação estética.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Interação assinatura: o card abre a contagem, salvar leva à separação e a confirmação leva ao próximo sabor, mantendo nome, cor e foco.

Lista fundamentada: 1 cardápio familiar; 2 faixas gráficas da feira; 3 etiquetas de cores de frutas/mercado; 4 linguagem de embalagem alimentar; 5 marca do trailer e cardápio iFood; 6 cartaz tipográfico de bairro; 7 placa de localização urbana.

Challengers: concourse board declinado (ritual temporal interessante, informação densa errada para o formulário); catalog sleeve declinado (códigos prejudicam reconhecer sabor); boarding pass declinado (sequência útil, símbolos de embarque alheios); orienteering declinado (cores e mapa quebram marca e tarefa); goods roster competitivo apenas no reconhecimento do sabor, não na identificação da marca; type specimen declinado (tipografia experimental reduz leitura). Disciplinas retidas: prioridade temporal clara; identidade estável; estado persistente da mudança; legenda de estados; catálogo reconhecível; grid alinhado. Não importar ornamentação ou controles desses mundos.

Restrição: nenhuma venda individual, domínio/Carmelo independentes, fórmulas recuperadas mantidas, dados fictícios só em modo prévia identificado. A direção não altera regras de segurança.

Atualização aprovada em 15/10/2026: plano de evolução, correção Brócolis, contagem e caixa semanal, comprovante opcional e extensão da identidade existente. Sem nova identidade ou comp obrigatório. Movimento: transição de área de 180 ms em opacidade; conteúdo e formulários preservados por área; tarefa protegida de carga herda imagem/cor; preferência de movimento reduzido respeitada. Imagens dos 18 sabores são ilustrativas, com origem/prompt registrados.
