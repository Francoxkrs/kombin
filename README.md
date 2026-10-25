# Kombin

**Lugares que combinam com você.** PWA de recomendação de restaurantes por ocasião em Campo Grande (MS).

A pessoa escolhe a ocasião ("A dois, pra conversar", "Pagode e porção"...), recebe os 3 lugares que mais combinam, com o índice de compatibilidade e os motivos, e manda as opções para o grupo votar pelo WhatsApp.

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
- O banco local já vem com 12 lugares **fictícios** (`supabase/seed.sql`) para testar. Em produção ele começa vazio.
- Login por e-mail no local: o link chega em http://127.0.0.1:54324 (caixa de e-mail falsa do Supabase).
- `npx supabase db reset` apaga tudo e recria o banco com o seed.

## Contas e painéis

| Quem | Onde | O que faz |
| --- | --- | --- |
| Qualquer pessoa, sem conta | `/`, `/o/...`, `/l/...`, `/v/...` | Escolhe ocasião e comida, vê lugares, vota em link de amigo, avalia em 3 toques |
| Cliente com conta | `/perfil` | Listas "Quero ir" e "Já fui", selo Explorador (5 avaliações), nome |
| Dono de restaurante | `/painel` | Pede acesso ao lugar; depois de aprovado vê aparições por ocasião, cliques no WhatsApp e rotas, quem salvou; edita WhatsApp, Instagram, cardápio, tipo de comida e foto de capa |
| Time Kombin (admin) | `/admin` | Revisa lugares do pipeline, cadastra lugar à mão, aprova donos, vê cliques |

Login: Google ou link mágico por e-mail (Supabase Auth). Admin é quem tem o e-mail em `ADMIN_EMAILS` ou `role = 'admin'` na tabela `profiles`.

### Ligar o login com Google em produção

1. No Google Cloud, crie um "ID do cliente OAuth" (aplicativo da Web) com a URL de redirecionamento `https://<seu-projeto>.supabase.co/auth/v1/callback`.
2. No Supabase: Authentication > Sign In / Providers > Google, cole o Client ID e o Secret.
3. Em Authentication > URL Configuration, coloque a URL do site (ex.: `https://kombin.vercel.app`) e adicione `https://kombin.vercel.app/auth/callback` nas Redirect URLs.

O login por e-mail funciona sem configurar nada (o Supabase grátis manda poucos e-mails por hora; para lançar, configure um SMTP como o Resend no plano grátis).

## O que já funciona

| Parte | Onde está |
| --- | --- |
| Home com 6 ocasiões (1 toque) | `src/app/page.tsx` |
| Ranking por ocasião + chips de tipo de comida, orçamento, sem couvert, perto de mim | `src/app/o/[slug]/page.tsx`, `src/components/QuickPrefs.tsx` |
| Tipos de comida e mapeamento dos tipos do Google | `src/lib/cuisines.ts` |
| Índice de compatibilidade (regras e pesos, sem IA em tempo real) | `src/lib/match.ts`, pesos em `src/lib/occasions.ts` |
| "Decidir com o mozão/galera": link de votação sem login, resultado ao vivo | `src/app/v/[code]`, `src/components/VoteBoard.tsx` |
| Página do lugar: motivos, sinais da galera, salvar, cardápio, dados do Google ao vivo | `src/app/l/[id]/page.tsx` |
| Botão "Reservar via WhatsApp" com mensagem pronta e clique rastreado | `src/app/api/go/[kind]/route.ts` |
| Avaliação relâmpago em 3 toques (gasto, couvert, barulho) | `src/components/MicroReview.tsx`, `src/app/api/review/route.ts` |
| Login, perfil, painel do restaurante, admin | `src/app/entrar`, `perfil`, `painel`, `admin` |
| Ingestão automática com vibe-check por IA de visão | `scripts/ingest.ts`, `scripts/lib/vision.ts` |
| Banco | `supabase/migrations/` |

## Como o índice funciona

Cada ocasião dá pesos a 5 critérios: vibe (nota da IA ou do admin para aquela ocasião), barulho, couvert, orçamento e distância. Cada critério tem um encaixe de 0 a 1 e uma confiança, que cresce com as micro-reviews:

```
compat = 100 × (Σ peso·confiança·encaixe + 0,5) / (Σ peso·confiança + 1)
```

Lugar sem dados fica em 50%. Filtros duros ("sem couvert", orçamento muito abaixo) tiram o lugar da lista. O resultado nunca passa de 99% e sempre vem com até 3 motivos e 1 alerta. Para mudar o comportamento, mexa nos pesos em `src/lib/occasions.ts`. Os testes estão em `tests/match.test.ts` (`npm test`).

## Ligar a base real

1. Crie um projeto grátis no [Supabase](https://supabase.com). Ligue o CLI a ele (`npx supabase link`) e rode `npx supabase db push`, ou cole os arquivos de `supabase/migrations/` em ordem no SQL Editor.
2. Preencha `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` e `ADMIN_EMAILS` (no `.env.local` para rodar scripts, e na Vercel para o site).
3. No Google Cloud, ative a **Places API (New)**, crie uma chave e coloque em `GOOGLE_MAPS_API_KEY`. **Antes de rodar qualquer coisa**, crie um alerta de orçamento de US$ 1 e limite a cota diária da API.
4. Pegue uma chave grátis do Gemini em aistudio.google.com e coloque em `GEMINI_API_KEY` (ou use `ANTHROPIC_API_KEY` com `--provider anthropic`).
5. Teste a ingestão sem gravar: `npm run ingest -- --dry-run --limit 10`. Confira `scripts/out/`.
6. Rode de verdade: `npm run ingest -- --limit 60`. Depois aprove os "pendentes" em `/admin`, confira o tipo de comida e cadastre o WhatsApp de cada lugar. Lugares que faltarem dá para cadastrar à mão em `/admin` > "+ Lugar".
7. Uma vez por semana: `npm run refresh` (renova as coordenadas, regra dos 30 dias do Google).

### Custos do pipeline (cotas grátis mensais, out/2026)

| Etapa | Cota grátis | Depois |
| --- | --- | --- |
| Text Search com nota (Enterprise) | 1.000 chamadas | US$ 35 por mil |
| Fotos do Google (3 por candidato) | 1.000 fotos | US$ 7 por mil |
| Vibe-check no Gemini Flash | plano gratuito (com limite por minuto) | ver preços do Google AI |
| Página do lugar: nota e horário ao vivo (Enterprise) | 1.000 | US$ 20 por mil |

Com `--limit 60`, uma rodada gasta cerca de 42 buscas e 180 fotos, dentro das cotas grátis. No plano gratuito do Gemini, o Google pode usar as imagens enviadas para melhorar os modelos.

### Regras do Google que o código respeita

- Guardamos o `place_id` (permitido para sempre) e as coordenadas por até 30 dias.
- Nota, fotos e reviews do Google são buscadas **ao vivo** e exibidas com atribuição.
- Nome e endereço também são guardados para o app funcionar. É uma área cinzenta dos termos; para ficar 100% dentro, troque por dados do Foursquare Open Source Places ou do OpenStreetMap.
- Não use dados do Google em mapa que não seja do Google. O "Como chegar" abre o Google Maps.

## Deploy grátis

Suba o repositório no GitHub e importe na [Vercel](https://vercel.com) (plano Hobby). Cadastre as mesmas variáveis do `.env.local` no painel da Vercel. O plano Hobby é para uso não comercial: quando começarem a cobrar restaurantes, migrem para o Pro ou para outro provedor.

## Decisões do MVP

- **PWA, não app de loja.** Instala na tela inicial, abre por link do WhatsApp e não paga loja.
- **Login opcional.** Navegar, votar e avaliar não pedem conta (cada aparelho tem um id anônimo, cookie `kb_did`). Conta serve para listas, selo e painéis.
- **O banco só é acessado pelo servidor** com a chave secreta; o navegador usa a chave pública só para o login. Toda permissão (dono, admin) é checada nas server actions.
- **"Como foi?" na próxima abertura**, 90 minutos depois do clique em WhatsApp ou Como chegar. Um PWA não consegue avisar ao sair do local.
- **cacheComponents desligado** no `next.config.ts`: tudo renderiza por requisição, mais simples de entender.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm test` | testes do índice |
| `npx supabase start` / `npx supabase db reset` | banco local / recriar com dados fictícios |
| `npx tsx scripts/gen-seed.ts` | regenera `supabase/seed.sql` a partir de `tests/fixtures.ts` |
| `npm run lint` / `npm run typecheck` | qualidade |
| `npm run ingest -- [--dry-run] [--limit N] [--provider gemini\|anthropic]` | pipeline de ingestão |
| `npm run refresh` | renova coordenadas do Google |
