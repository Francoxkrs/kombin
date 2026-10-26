# Kombin

**Lugares que combinam com você.** PWA de recomendação de restaurantes por ocasião em Campo Grande (MS).

A pessoa escolhe a ocasião ("A dois, pra conversar", "Pagode e porção"...) e o tipo de comida, recebe os lugares que mais combinam, com o índice de compatibilidade e o "Por que combina com você?", e manda as 3 melhores opções para o grupo votar pelo WhatsApp, arrastando cards.

## Rodar no seu computador

Precisa de Node 20+ e Docker (o Supabase local roda em containers).

```bash
npm install
npx supabase start          # sobe Postgres, Auth, Storage e um caixa de e-mail local
cp .env.example .env.local  # cole as chaves que o comando acima imprimiu
npm run dev
```

- `NEXT_PUBLIC_SUPABASE_URL` = API URL, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = Publishable key, `SUPABASE_SECRET_KEY` = Secret key.
- Coloque seu e-mail em `ADMIN_EMAILS` para virar admin.
- O banco local já vem com 12 lugares **fictícios** (`supabase/seed.sql`, fotos de teste do Unsplash) para testar. Em produção ele começa vazio e se enche pelo botão de importação do `/admin`.
- Login com e-mail e senha. No local não precisa confirmar o e-mail; os e-mails de "esqueci a senha" chegam em http://127.0.0.1:54324 (caixa de e-mail falsa do Supabase).
- `npx supabase db reset` apaga tudo e recria o banco com o seed.

## Contas e painéis

| Quem | Onde | O que faz |
| --- | --- | --- |
| Qualquer pessoa, sem conta | `/`, `/o/...`, `/l/...`, `/v/...` | Escolhe ocasião e comida, vê lugares, vota em link de amigo, avalia em 3 toques |
| Cliente com conta | `/perfil` | Listas "Quero ir" e "Já fui", selo Explorador (5 avaliações), nome |
| Dono de restaurante | `/painel` | Pede acesso ao lugar; depois de aprovado vê aparições por ocasião, cliques no WhatsApp e rotas, quem salvou; edita WhatsApp, Instagram, cardápio, tipo de comida e foto de capa |
| Time Kombin (admin) | `/admin` | Importa restaurantes do Google com um botão, revisa lugares, marca destaques, cadastra lugar à mão, aprova donos, vê cliques |

Login: e-mail e senha (com "Criar conta" e "Esqueci a senha") e, opcionalmente, Google (Supabase Auth). Admin é quem tem o e-mail em `ADMIN_EMAILS` ou `role = 'admin'` na tabela `profiles`.

### Login em produção

1. Supabase > Authentication > URL Configuration: em Site URL coloque a URL do site (ex.: `https://kombin-seven.vercel.app`) e, em Redirect URLs, adicione `https://kombin-seven.vercel.app/auth/callback`. Sem isso, o link de "esqueci a senha" volta para o lugar errado.
2. E-mails: o Supabase grátis só manda e-mail para quem é do time do projeto e poucos por hora. Para lançar, configure um SMTP (ex.: Resend, plano grátis) em Authentication > Emails > SMTP Settings. Enquanto isso, dá para desligar "Confirm email" em Authentication > Sign In / Providers > Email: a conta já entra na hora, sem e-mail de confirmação.

### Ligar o login com Google (opcional)

1. No Google Cloud, crie um "ID do cliente OAuth" (aplicativo da Web) com a URL de redirecionamento `https://<seu-projeto>.supabase.co/auth/v1/callback`.
2. No Supabase: Authentication > Sign In / Providers > Google, cole o Client ID e o Secret.
3. Na Vercel, crie a variável `AUTH_GOOGLE=1` e faça um Redeploy. O botão "Continuar com Google" só aparece com ela, para nunca mostrar um botão que dá erro.

## O que já funciona

| Parte | Onde está |
| --- | --- |
| Descobrir: saudação do momento, ocasiões em carrossel, sua lista, "Escolhas para o seu momento" | `src/app/page.tsx`, `src/components/OccasionCard.tsx`, `src/components/RestaurantCard.tsx` |
| Filtros (momento, com quem, orçamento por pessoa, sem couvert, dá pra conversar, espaço kids, bairro) e contagem ao vivo | `src/app/buscar` |
| Ranking por ocasião ou por comida (`/o/tudo?c=pizza`) + chips rápidos | `src/app/o/[slug]/page.tsx`, `src/components/QuickPrefs.tsx` |
| Tipos de comida, etiquetas de ambiente e mapeamento dos tipos do Google | `src/lib/cuisines.ts`, `src/lib/tags.ts` |
| Índice de compatibilidade (regras e pesos, sem IA em tempo real) | `src/lib/match.ts`, pesos em `src/lib/occasions.ts` |
| "Decidir com o mozão/galera": link de votação sem login, cards para arrastar, resultado ao vivo | `src/app/v/[code]`, `src/components/VoteBoard.tsx` |
| Página do lugar: galeria, "Por que combina com você?", informações, sinais da galera, salvar | `src/app/l/[id]/page.tsx` |
| Botão "Reservar via WhatsApp" com mensagem pronta e clique rastreado | `src/app/api/go/[kind]/route.ts` |
| Avaliação relâmpago em 3 toques (gasto, couvert, barulho) | `src/components/MicroReview.tsx`, `src/app/api/review/route.ts` |
| Login com senha, cadastro, nova senha, perfil, painel do restaurante, admin | `src/app/entrar`, `redefinir-senha`, `perfil`, `painel`, `admin` |
| Importação do Google pelo `/admin` (ou terminal), notas por regra e vibe-check opcional por IA de visão | `src/app/admin/ImportPanel.tsx`, `src/app/admin/import-actions.ts`, `src/lib/ingest/` |
| Animações: transição entre telas e foto que "voa" para a página do lugar (View Transitions), abas, coração, confete | `src/app/globals.css`, `src/components/ui/` |
| Banco | `supabase/migrations/` |

## Como o índice funciona

Cada ocasião dá pesos aos critérios: vibe (nota por regra, da IA ou do admin para aquela ocasião), barulho, couvert, orçamento, distância, etiquetas que a ocasião pede (ex.: aniversário quer "bom pra grupos" e "aceita reserva") e tamanho do grupo. Cada critério tem um encaixe de 0 a 1 e uma confiança, que cresce com as micro-reviews:

```
compat = 100 × (Σ peso·confiança·encaixe + 0,5) / (Σ peso·confiança + 1)
```

Lugar sem dados fica em 50%. Filtros duros (tipo de comida, bairro, etiquetas marcadas, "sem couvert", orçamento muito abaixo) tiram o lugar da lista. O resultado nunca passa de 99% e sempre vem com até 3 motivos e 1 alerta. Para mudar o comportamento, mexa nos pesos em `src/lib/occasions.ts`. Os testes estão em `tests/match.test.ts` (`npm test`).

## Ligar a base real

1. Crie um projeto grátis no [Supabase](https://supabase.com), direto ou pela integração da Vercel (Storage > Create > Supabase). **Crie as tabelas:** abra o projeto no Supabase (na Vercel: Storage > o banco > "Open in Supabase"), vá em **SQL Editor** e rode, um de cada vez, `supabase/migrations/0001_init.sql`, `0002_contas_paineis_culinaria.sql`, `0003_tags_destaque.sql`, `0004_seguranca.sql` e `0005_cardapio_dono.sql`. O editor de consultas da Vercel não serve: ele não roda vários comandos de uma vez.
2. Chaves: com a integração da Vercel, as variáveis que ela cria já funcionam. Sem ela, preencha `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY`. Nos dois casos, cadastre `ADMIN_EMAILS` na Vercel.
3. No Google Cloud, ative a **Places API (New)**, crie uma chave e cadastre `GOOGLE_MAPS_API_KEY` na Vercel (Settings > Environment Variables), depois faça um Redeploy. **Antes**, crie um alerta de orçamento de US$ 1 e limite a cota diária da API.
4. Entre em `/admin` > **Importar do Google** > **Começar importação**. Primeiro entram, pelo nome, as casas essenciais de Campo Grande (lista `ESSENTIALS` em `src/lib/ingest/google.ts`: Enoteca Decanter, Turista Sushi, Mr. VIP...). Depois vêm 16 buscas (pizzarias, japoneses, bares com música...); entram só lugares abertos, com nota 4,2+ e 150+ avaliações, já aprovados e com notas por ocasião calculadas a partir dos atributos do Google (música ao vivo, bom pra grupos, cardápio infantil...). Dá para rodar de novo: só entram lugares novos. Lugar específico que faltou: campo "Adicionar um lugar específico" na mesma tela.
5. (Opcional) Pegue uma chave grátis do Gemini em aistudio.google.com e cadastre `GEMINI_API_KEY` (ou `ANTHROPIC_API_KEY`). Em `/admin` > Importar aparece "Refinar com IA de visão": a IA olha 3 fotos de cada lugar e ajusta as notas pelo ambiente; ambiente feio volta para "Para revisar".
6. Em `/admin` > Aprovados, confira o tipo de comida, marque os **destaques** (aparecem primeiro no Descobrir) e cadastre o WhatsApp de cada lugar.
7. Uma vez por semana: `npm run refresh` (renova as coordenadas, regra dos 30 dias do Google).

Pelo terminal, a mesma importação: `npm run ingest -- --dry-run` (não grava, salva `scripts/out/`), `--limit 40`, `--vision`, `--min-rating 4.3`, `--min-reviews 200`, `--provider anthropic`. Precisa das chaves no `.env.local` (`npx vercel env pull .env.local` baixa as da Vercel).

### Custos do pipeline (cotas grátis mensais, out/2026)

| Etapa | Cota grátis | Depois |
| --- | --- | --- |
| Importação: Text Search com atributos (Enterprise + Atmosphere) | 1.000 chamadas | US$ 40 por mil |
| Fotos exibidas no app (Place Photos) | 1.000 fotos | US$ 7 por mil |
| Vibe-check no Gemini Flash (opcional, 3 fotos por lugar) | plano gratuito (com limite por minuto) | ver preços do Google AI |
| Página do lugar: nota e horário ao vivo (Enterprise) | 1.000 | US$ 20 por mil |

Uma importação completa gasta 16 buscas. As fotos passam pelo nosso servidor (`/api/photo/...`) e ficam no cache da Vercel por 1 dia; a nota e o horário ao vivo, por 30 minutos. Assim cada foto é cobrada no máximo uma vez por dia, e não a cada visita. No plano gratuito do Gemini, o Google pode usar as imagens enviadas para melhorar os modelos.

### Regras do Google que o código respeita

- Guardamos o `place_id` (permitido para sempre) e as coordenadas por até 30 dias.
- Nota, fotos e reviews do Google são buscadas **ao vivo** e exibidas com atribuição.
- Nome e endereço também são guardados para o app funcionar. É uma área cinzenta dos termos; para ficar 100% dentro, troque por dados do Foursquare Open Source Places ou do OpenStreetMap.
- Não use dados do Google em mapa que não seja do Google. O "Como chegar" abre o Google Maps.

## Deploy grátis

Suba o repositório no GitHub e importe na [Vercel](https://vercel.com) (plano Hobby). Cadastre as mesmas variáveis do `.env.local` no painel da Vercel. O plano Hobby é para uso não comercial: quando começarem a cobrar restaurantes, migrem para o Pro ou para outro provedor.

## Visual

Direção "Tela cheia": a foto do lugar ocupa a tela e o resto é noite.

- **Cores:** fundo marrom-noite `#2A1B12`, superfícies `#36251A` e `#423024`, texto `#F6F0E6`, secundário `#B9B0A6`. Um destaque só, o amarelo do ipê `#FFC81E`: botão principal, "% combina" e o sublinhado da aba ativa. Tokens em `src/app/globals.css`.
- **Tipo:** uma fonte, Bricolage Grotesque (variável). Títulos com a utilidade `title` (semibold, letra apertada); o tamanho do nome do lugar vem de `posterNameSize` em `src/lib/screen.ts`.
- **Controles:** botão é pílula (`btn()` e `BTN_*` em `src/components/ui/styles.ts`), foto não tem canto arredondado, botão por cima de foto é um círculo claro (`ROUND_LIGHT`). Sem vidro, sem sombra, sem gradiente de enfeite; o véu escuro só existe embaixo de texto em cima de foto (`scrim-bottom`, `scrim-top`).
- **Descobrir:** um lugar por tela (`src/components/Discover.tsx`), passa pra cima para o próximo; a última tela da ocasião manda os 3 primeiros pra votar ou abre a lista com filtros. O servidor já manda o ranking das 6 ocasiões, então trocar de aba é instantâneo.
- **Fotos:** sempre a foto do próprio lugar (Google ou do dono). Entrar e perfil abrem com a foto da casa que mais combina no geral, com o nome dela.
- **Barra de baixo:** navegação em texto, colada no rodapé; some nas telas com barra de ação própria (lista `HIDDEN` em `src/components/ui/TabBar.tsx`).

## Decisões do produto

- **PWA, não app de loja.** Instala na tela inicial, abre por link do WhatsApp e não paga loja.
- **Login opcional.** Navegar, votar e avaliar não pedem conta (cada aparelho tem um id anônimo, cookie `kb_did`). Conta serve para listas, selo e painéis.
- **O banco só é acessado pelo servidor** com a chave secreta; o navegador usa a chave pública só para o login. Toda permissão (dono, admin) é checada nas server actions.
- **"Como foi?" na próxima abertura**, 90 minutos depois do clique em WhatsApp ou Como chegar. Um PWA não consegue avisar ao sair do local.
- **Rápido sem complicar.** O catálogo de lugares fica em cache por 5 minutos (`src/lib/catalog.ts`) e é renovado na hora quando o admin ou um dono muda algo. O login só é verificado quando há cookie de sessão. Dados do Google ao vivo carregam depois da página. Cada tela tem esqueleto de carregamento.
- **Animações nativas.** Transições entre telas usam View Transitions do React (`<ViewTransition>`); gestos (arrastar card, folha de avaliação) usam `motion`. Tudo respeita "reduzir movimento" do sistema.
- **Dica:** na Vercel, em Settings > Functions, escolha a mesma região do banco (ex.: **São Paulo, gru1**, se o Supabase estiver em São Paulo; a Vercel usa Washington por padrão) para cortar a latência de cada página.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm test` | testes do índice e da importação |
| `npx supabase start` / `npx supabase db reset` | banco local / recriar com dados fictícios |
| `npx tsx scripts/gen-seed.ts` | regenera `supabase/seed.sql` a partir de `tests/fixtures.ts` |
| `npm run lint` / `npm run typecheck` | qualidade |
| `npm run ingest -- [--dry-run] [--limit N] [--vision] [--provider gemini\|anthropic]` | importação pelo terminal |
| `npm run refresh` | renova coordenadas do Google |
