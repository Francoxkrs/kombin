# Kombin

**Lugares que combinam com você.** PWA de recomendação de restaurantes por ocasião em Campo Grande (MS).

A pessoa escolhe a ocasião ("A dois, pra conversar", "Pagode e porção"...), recebe os 3 lugares que mais combinam, com o índice de compatibilidade e os motivos, e manda as opções para o grupo votar pelo WhatsApp.

## Rodar em 1 minuto (modo demonstração)

```bash
npm install
npm run dev
```

Abra http://localhost:3000. Sem nenhuma chave configurada, o app usa 10 lugares **fictícios** em memória. O admin fica em `/admin` com a senha `demo`.

## O que já funciona

| Parte | Onde está |
| --- | --- |
| Home com 6 ocasiões (1 toque) | `src/app/page.tsx` |
| Ranking por ocasião + chips de orçamento, sem couvert, perto de mim | `src/app/o/[slug]/page.tsx`, `src/components/QuickPrefs.tsx` |
| Índice de compatibilidade (regras e pesos, sem IA em tempo real) | `src/lib/match.ts`, pesos em `src/lib/occasions.ts` |
| "Decidir com o mozão/galera": link de votação sem login, resultado ao vivo | `src/app/v/[code]`, `src/components/VoteBoard.tsx`, `src/app/api/v/[code]` |
| Página do lugar com motivos, sinais da galera e dados do Google ao vivo | `src/app/l/[id]/page.tsx` |
| Botão "Reservar via WhatsApp" com mensagem pronta e clique rastreado | `src/app/api/go/[kind]/route.ts` |
| Avaliação relâmpago em 3 toques (gasto, couvert, barulho) | `src/components/MicroReview.tsx`, `src/app/api/review/route.ts` |
| Admin: revisar lugares do pipeline, editar dados, ver cliques de 30 dias | `src/app/admin` |
| Ingestão automática com vibe-check por IA de visão | `scripts/ingest.ts`, `scripts/lib/vision.ts` |
| Banco (Supabase/Postgres) | `supabase/migrations/0001_init.sql` |

## Como o índice funciona

Cada ocasião dá pesos a 5 critérios: vibe (nota da IA ou do admin para aquela ocasião), barulho, couvert, orçamento e distância. Cada critério tem um encaixe de 0 a 1 e uma confiança, que cresce com as micro-reviews:

```
compat = 100 × (Σ peso·confiança·encaixe + 0,5) / (Σ peso·confiança + 1)
```

Lugar sem dados fica em 50%. Filtros duros ("sem couvert", orçamento muito abaixo) tiram o lugar da lista. O resultado nunca passa de 99% e sempre vem com até 3 motivos e 1 alerta. Para mudar o comportamento, mexa nos pesos em `src/lib/occasions.ts`. Os testes estão em `tests/match.test.ts` (`npm test`).

## Ligar a base real

1. Crie um projeto grátis no [Supabase](https://supabase.com) e rode `supabase/migrations/0001_init.sql` no SQL Editor.
2. Copie `.env.example` para `.env.local` e preencha `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `ADMIN_PASSWORD`.
3. No Google Cloud, ative a **Places API (New)**, crie uma chave e coloque em `GOOGLE_MAPS_API_KEY`. **Antes de rodar qualquer coisa**, crie um alerta de orçamento de US$ 1 e limite a cota diária da API.
4. Pegue uma chave grátis do Gemini em aistudio.google.com e coloque em `GEMINI_API_KEY` (ou use `ANTHROPIC_API_KEY` com `--provider anthropic`).
5. Teste a ingestão sem gravar: `npm run ingest -- --dry-run --limit 10`. Confira `scripts/out/`.
6. Rode de verdade: `npm run ingest -- --limit 60`. Depois aprove os "pendentes" em `/admin` e cadastre o WhatsApp de cada lugar.
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
- **Sem login.** Cada aparelho recebe um id anônimo (cookie `kb_did`) para votos e avaliações.
- **"Como foi?" na próxima abertura**, 90 minutos depois do clique em WhatsApp ou Como chegar. Um PWA não consegue avisar ao sair do local.
- **cacheComponents desligado** no `next.config.ts`: tudo renderiza por requisição, mais simples de entender.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm test` | testes do índice |
| `npm run lint` / `npm run typecheck` | qualidade |
| `npm run ingest -- [--dry-run] [--limit N] [--provider gemini\|anthropic]` | pipeline de ingestão |
| `npm run refresh` | renova coordenadas do Google |
