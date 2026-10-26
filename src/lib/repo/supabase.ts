import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { newCode } from "../code";
import type { ChoiceEvent, SearchEvent } from "../taste";
import type {
  DecisionSession,
  LeadKind,
  MicroReview,
  Place,
  PlaceSignals,
  PlaceStatus,
  Vote,
} from "../types";

interface PlaceRow {
  id: string;
  google_place_id: string | null;
  name: string;
  category: string | null;
  neighborhood: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  whatsapp: string | null;
  instagram: string | null;
  cover_url: string | null;
  menu_url: string | null;
  cuisines: string[] | null;
  status: Place["status"];
  seed_spend: Place["seedSpend"];
  seed_noise: Place["seedNoise"];
  seed_cover: boolean | null;
  vibe: Record<string, number> | null;
  ai_summary: string | null;
  ai_model: string | null;
  tags: string[] | null;
  featured: boolean | null;
}

const PLACE_COLUMNS =
  "id, google_place_id, name, category, neighborhood, address, lat, lng, whatsapp, instagram, cover_url, menu_url, cuisines, status, seed_spend, seed_noise, seed_cover, vibe, ai_summary, ai_model, tags, featured";
/** Colunas de antes da migração 0003 (tags, featured), para o app não cair se ela ainda não rodou. */
const LEGACY_PLACE_COLUMNS = PLACE_COLUMNS.replace(", tags, featured", "");
let placeColumns = PLACE_COLUMNS;
/** WhatsApp falso dos lugares fictícios de supabase/seed.sql. */
const DEMO_WHATSAPP = "5567999999999";

function toPlace(r: PlaceRow): Place {
  return {
    id: r.id,
    googlePlaceId: r.google_place_id,
    name: r.name,
    category: r.category,
    neighborhood: r.neighborhood,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    whatsapp: r.whatsapp,
    instagram: r.instagram,
    coverUrl: r.cover_url,
    menuUrl: r.menu_url,
    cuisines: r.cuisines ?? [],
    status: r.status,
    seedSpend: r.seed_spend,
    seedNoise: r.seed_noise,
    seedCover: r.seed_cover,
    vibe: r.vibe ?? {},
    aiSummary: r.ai_summary,
    aiModel: r.ai_model,
    tags: r.tags ?? [],
    featured: !!r.featured,
  };
}

export type PlacePatch = Partial<
  Pick<
    Place,
    | "name"
    | "category"
    | "address"
    | "status"
    | "whatsapp"
    | "instagram"
    | "coverUrl"
    | "menuUrl"
    | "cuisines"
    | "seedSpend"
    | "seedNoise"
    | "seedCover"
    | "vibe"
    | "neighborhood"
    | "googlePlaceId"
    | "tags"
    | "featured"
    | "aiSummary"
  >
>;

const PATCH_COLUMNS: Record<keyof PlacePatch, string> = {
  name: "name",
  category: "category",
  address: "address",
  status: "status",
  whatsapp: "whatsapp",
  instagram: "instagram",
  coverUrl: "cover_url",
  menuUrl: "menu_url",
  cuisines: "cuisines",
  seedSpend: "seed_spend",
  seedNoise: "seed_noise",
  seedCover: "seed_cover",
  vibe: "vibe",
  neighborhood: "neighborhood",
  googlePlaceId: "google_place_id",
  tags: "tags",
  featured: "featured",
  aiSummary: "ai_summary",
};

function patchToRow(patch: PlacePatch): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [k, col] of Object.entries(PATCH_COLUMNS)) {
    const v = patch[k as keyof PlacePatch];
    if (v !== undefined) row[col] = v;
  }
  return row;
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return res.data;
}

/** Lê lugares; se a migração 0003 não rodou (coluna inexistente, 42703), lê sem as colunas novas. */
async function selectPlaces<T>(
  run: (columns: string) => PromiseLike<{ data: T; error: { message: string; code?: string } | null }>,
): Promise<T> {
  const res = await run(placeColumns);
  if (res.error?.code === "42703" && placeColumns !== LEGACY_PLACE_COLUMNS) {
    console.warn("Kombin: rode supabase/migrations/0003_tags_destaque.sql no SQL Editor do Supabase.");
    placeColumns = LEGACY_PLACE_COLUMNS;
    return check(await run(placeColumns));
  }
  return check(res);
}

export interface Profile {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  role: "user" | "admin";
}

export interface Claim {
  id: number;
  placeId: string;
  placeName: string;
  userId: string;
  userName: string | null;
  contact: string;
  message: string | null;
  createdAt: string;
}

export interface PlaceStats {
  impressions: { occasion: string; count: number }[];
  whatsapp: number;
  directions: number;
  saves: number;
  reviews: number;
}

export type SavedList = "want" | "been";

/**
 * Acesso ao banco com a chave secreta, SÓ no servidor. Toda regra de quem pode
 * fazer o quê é checada no código das rotas antes de chamar estas funções.
 */
export function createRepo(url: string, secretKey: string) {
  const db: SupabaseClient = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const sinceIso = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

  return {
    db,

    // ---------- Lugares ----------

    async listPlaces(status?: PlaceStatus): Promise<Place[]> {
      const rows = await selectPlaces((columns) => {
        const q = db.from("places").select(columns).order("name");
        return status ? q.eq("status", status) : q;
      });
      return (rows as unknown as PlaceRow[]).map(toPlace);
    },

    async getPlace(id: string): Promise<Place | null> {
      if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
      const row = (await selectPlaces((columns) =>
        db.from("places").select(columns).eq("id", id).maybeSingle(),
      )) as unknown as PlaceRow | null;
      return row ? toPlace(row) : null;
    },

    async getPlaces(ids: string[]): Promise<Place[]> {
      if (ids.length === 0) return [];
      const rows = (await selectPlaces((columns) => db.from("places").select(columns).in("id", ids))) as unknown as PlaceRow[];
      const byId = new Map(rows.map((r) => [r.id, toPlace(r)]));
      return ids.map((id) => byId.get(id)).filter((p): p is Place => !!p);
    },

    async createPlace(patch: PlacePatch & { name: string }): Promise<string> {
      const row = check(
        await db.from("places").insert(patchToRow(patch)).select("id").single(),
      ) as { id: string };
      return row.id;
    },

    async updatePlace(id: string, patch: PlacePatch): Promise<void> {
      check(
        await db
          .from("places")
          .update({ ...patchToRow(patch), updated_at: new Date().toISOString() })
          .eq("id", id),
      );
    },

    async uploadCover(placeId: string, file: File): Promise<string> {
      const ext = (file.type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
      const path = `${placeId}/${Date.now()}.${ext}`;
      const { error } = await db.storage
        .from("covers")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw new Error(`Upload: ${error.message}`);
      return db.storage.from("covers").getPublicUrl(path).data.publicUrl;
    },

    /** google_place_id de todos os lugares já no banco (para a importação pular). */
    async knownGoogleIds(): Promise<Set<string>> {
      const rows = check(
        await db.from("places").select("google_place_id").not("google_place_id", "is", null),
      ) as { google_place_id: string }[];
      return new Set(rows.map((r) => r.google_place_id));
    },

    /** Quantos lugares fictícios do seed de desenvolvimento existem (WhatsApp falso e sem Google). */
    async countDemoPlaces(): Promise<number> {
      const { count, error } = await db
        .from("places")
        .select("id", { count: "exact", head: true })
        .eq("whatsapp", DEMO_WHATSAPP)
        .is("google_place_id", null);
      if (error) throw new Error(`Supabase: ${error.message}`);
      return count ?? 0;
    },

    /** Apaga os lugares fictícios (votos, avaliações e salvos deles vão junto). */
    async deleteDemoPlaces(): Promise<number> {
      const rows = check(
        await db.from("places").delete().eq("whatsapp", DEMO_WHATSAPP).is("google_place_id", null).select("id"),
      ) as { id: string }[];
      return rows.length;
    },

    /** Grava um lugar vindo da importação do Google (cria ou atualiza pelo place_id). */
    async upsertImported(row: Record<string, unknown>): Promise<string> {
      const res = check(
        await db
          .from("places")
          .upsert({ ...row, imported_at: new Date().toISOString() }, { onConflict: "google_place_id" })
          .select("id")
          .single(),
      ) as { id: string };
      return res.id;
    },

    /** Lugares do Google que ainda não passaram pelo vibe-check da IA de visão. */
    async placesWithoutVision(): Promise<{ id: string; name: string; googlePlaceId: string; category: string | null }[]> {
      const rows = check(
        await db
          .from("places")
          .select("id, name, google_place_id, category")
          .not("google_place_id", "is", null)
          .is("ai_model", null)
          .neq("status", "rejected")
          .order("name"),
      ) as { id: string; name: string; google_place_id: string; category: string | null }[];
      return rows.map((r) => ({ id: r.id, name: r.name, googlePlaceId: r.google_place_id, category: r.category }));
    },

    async setVision(id: string, row: Record<string, unknown>) {
      check(await db.from("places").update({ ...row, updated_at: new Date().toISOString() }).eq("id", id));
    },

    // ---------- Sinais da galera ----------

    async getSignals(): Promise<Map<string, PlaceSignals>> {
      type Row = {
        place_id: string;
        reviews: number;
        spend_avg: number;
        noise_avg: number;
        cover_ratio: number;
        verified?: number;
        weight?: number;
      };
      const base = "place_id, reviews, spend_avg, noise_avg, cover_ratio";
      let res = await db.from("place_signals").select(`${base}, verified, weight`);
      // Sem a migração 0004 a view não tem as colunas de visita confirmada: segue sem elas.
      if (res.error?.code === "42703") res = await db.from("place_signals").select(base);
      const rows = check(res) as unknown as Row[];
      return new Map(
        rows.map((r) => [
          r.place_id,
          {
            reviews: r.reviews,
            spendAvg: r.spend_avg,
            noiseAvg: r.noise_avg,
            coverRatio: r.cover_ratio,
            verified: r.verified ?? undefined,
            weight: r.weight ?? undefined,
          },
        ]),
      );
    },

    /** Com conta: substitui a avaliação anterior da pessoa naquele lugar. */
    async addMicroReview(r: MicroReview & { userId: string | null }): Promise<void> {
      if (r.userId) {
        check(await db.from("micro_reviews").delete().eq("place_id", r.placeId).eq("user_id", r.userId));
      }
      const row: Record<string, unknown> = {
        place_id: r.placeId,
        user_id: r.userId,
        device_id: r.deviceId,
        occasion: r.occasion,
        spend: r.spend,
        cover: r.cover,
        noise: r.noise,
      };
      if (r.verified) row.verified = true;
      const res = await db.from("micro_reviews").insert(row);
      // Sem a migração 0004 não há a coluna "verified": grava a avaliação mesmo assim.
      if (res.error && r.verified && res.error.message.includes("verified")) {
        delete row.verified;
        check(await db.from("micro_reviews").insert(row));
      } else check(res);
    },

    /** Este aparelho clicou em "Como chegar" deste lugar entre `minMinutes` e `maxHours` atrás? */
    async clickedDirections(placeId: string, deviceId: string, minMinutes: number, maxHours: number): Promise<boolean> {
      const { count, error } = await db
        .from("lead_clicks")
        .select("id", { count: "exact", head: true })
        .eq("place_id", placeId)
        .eq("device_id", deviceId)
        .eq("kind", "directions")
        .gte("created_at", new Date(Date.now() - maxHours * 3_600_000).toISOString())
        .lte("created_at", new Date(Date.now() - minMinutes * 60_000).toISOString());
      if (error) throw new Error(error.message);
      return (count ?? 0) > 0;
    },

    async countUserReviews(userId: string): Promise<number> {
      const { count, error } = await db
        .from("micro_reviews")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return count ?? 0;
    },

    // ---------- Buscas e gosto da pessoa ----------

    /** Grava a busca, a menos que seja igual à última deste aparelho nos últimos 10 minutos (voltar não conta). */
    async logSearch(e: {
      userId: string | null;
      deviceId: string;
      occasion: string;
      cuisine: string | null;
      budget: number | null;
      party: string | null;
      neighborhood: string | null;
      tags: string[];
      quiet: boolean;
      noCover: boolean;
    }): Promise<void> {
      const row = {
        user_id: e.userId,
        device_id: e.deviceId,
        occasion: e.occasion,
        cuisine: e.cuisine,
        budget: e.budget,
        party: e.party,
        neighborhood: e.neighborhood,
        tags: [...e.tags].sort(),
        quiet: e.quiet,
        no_cover: e.noCover,
      };
      const last = check(
        await db
          .from("search_log")
          .select("user_id, occasion, cuisine, budget, party, neighborhood, tags, quiet, no_cover")
          .eq("device_id", e.deviceId)
          .gte("created_at", sinceIso(10 / 1440))
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ) as Record<string, unknown> | null;
      const same = (r: Record<string, unknown>) =>
        JSON.stringify([r.user_id, r.occasion, r.cuisine, r.budget, r.party, r.neighborhood, r.tags, r.quiet, r.no_cover]);
      if (last && same(last) === same(row)) return;
      check(await db.from("search_log").insert(row));
    },

    /**
     * O que serve para aprender o gosto: as últimas buscas (da conta, ou do aparelho sem conta)
     * e os lugares escolhidos (Como chegar e WhatsApp do aparelho, salvos e avaliados da conta).
     */
    async tasteEvents(userId: string | null, deviceId: string | null): Promise<{ searches: SearchEvent[]; choices: ChoiceEvent[] }> {
      const since = sinceIso(180);
      type SearchRow = { occasion: string; cuisine: string | null; budget: number | null; tags: string[] | null; quiet: boolean; created_at: string };
      type ChoiceRow = { place_id: string; created_at: string };
      const none = Promise.resolve({ data: [], error: null });
      const searchQ = db
        .from("search_log")
        .select("occasion, cuisine, budget, tags, quiet, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(100);
      const [searches, leads, saved, reviews] = await Promise.all([
        userId ? searchQ.eq("user_id", userId) : deviceId ? searchQ.eq("device_id", deviceId) : none,
        deviceId
          ? db.from("lead_clicks").select("place_id, created_at").eq("device_id", deviceId).gte("created_at", since).limit(100)
          : none,
        userId ? db.from("saved_places").select("place_id, created_at").eq("user_id", userId).limit(100) : none,
        userId
          ? db.from("micro_reviews").select("place_id, created_at").eq("user_id", userId).gte("created_at", since).limit(100)
          : none,
      ]);
      return {
        searches: (check(searches) as SearchRow[]).map((r) => ({
          at: Date.parse(r.created_at),
          occasion: r.occasion,
          cuisine: r.cuisine,
          budget: r.budget,
          tags: r.tags ?? [],
          quiet: r.quiet,
        })),
        choices: [leads, saved, reviews].flatMap((r) =>
          (check(r) as ChoiceRow[]).map((c) => ({ at: Date.parse(c.created_at), placeId: c.place_id })),
        ),
      };
    },

    // ---------- Decidir com o grupo ----------

    async createSession(occasion: string, placeIds: string[], userId: string | null): Promise<string> {
      const code = newCode();
      check(
        await db
          .from("decision_sessions")
          .insert({ code, occasion, place_ids: placeIds, created_by: userId }),
      );
      return code;
    },

    async getSession(code: string): Promise<DecisionSession | null> {
      const row = check(
        await db
          .from("decision_sessions")
          .select("code, occasion, place_ids, created_at")
          .eq("code", code)
          .maybeSingle(),
      ) as { code: string; occasion: string; place_ids: string[]; created_at: string } | null;
      return row
        ? { code: row.code, occasion: row.occasion, placeIds: row.place_ids, createdAt: row.created_at }
        : null;
    },

    async getVotes(code: string): Promise<Vote[]> {
      const rows = check(
        await db.from("decision_votes").select("device_id, place_id, voter_name").eq("session_code", code),
      ) as { device_id: string; place_id: string; voter_name: string | null }[];
      return rows.map((r) => ({ deviceId: r.device_id, placeId: r.place_id, voterName: r.voter_name }));
    },

    async castVote(code: string, vote: Vote): Promise<void> {
      check(
        await db.from("decision_votes").upsert({
          session_code: code,
          device_id: vote.deviceId,
          place_id: vote.placeId,
          voter_name: vote.voterName,
        }),
      );
    },

    // ---------- Métricas para o restaurante ----------

    async logLead(placeId: string, occasion: string | null, kind: LeadKind, deviceId: string) {
      check(await db.from("lead_clicks").insert({ place_id: placeId, occasion, kind, device_id: deviceId }));
    },

    async addImpressions(placeIds: string[], occasion: string) {
      if (placeIds.length === 0) return;
      check(await db.rpc("add_impressions", { place_ids: placeIds, occ: occasion }));
    },

    async leadCounts(days: number) {
      const rows = check(
        await db.from("lead_clicks").select("place_id, kind").gte("created_at", sinceIso(days)),
      ) as { place_id: string; kind: LeadKind }[];
      const counts = new Map<string, { whatsapp: number; directions: number }>();
      for (const r of rows) {
        const c = counts.get(r.place_id) ?? { whatsapp: 0, directions: 0 };
        c[r.kind]++;
        counts.set(r.place_id, c);
      }
      return [...counts].map(([placeId, c]) => ({ placeId, ...c }));
    },

    async placeStats(placeId: string, days: number): Promise<PlaceStats> {
      const since = sinceIso(days);
      const [imp, leads, saves, reviews] = await Promise.all([
        db
          .from("place_impressions")
          .select("occasion, count")
          .eq("place_id", placeId)
          .gte("day", since.slice(0, 10)),
        db.from("lead_clicks").select("kind").eq("place_id", placeId).gte("created_at", since),
        db.from("saved_places").select("user_id", { count: "exact", head: true }).eq("place_id", placeId),
        db.from("micro_reviews").select("id", { count: "exact", head: true }).eq("place_id", placeId),
      ]);
      const byOcc = new Map<string, number>();
      for (const r of (check(imp) as { occasion: string; count: number }[]) ?? []) {
        byOcc.set(r.occasion, (byOcc.get(r.occasion) ?? 0) + r.count);
      }
      const kinds = check(leads) as { kind: LeadKind }[];
      return {
        impressions: [...byOcc].map(([occasion, count]) => ({ occasion, count })).sort((a, b) => b.count - a.count),
        whatsapp: kinds.filter((k) => k.kind === "whatsapp").length,
        directions: kinds.filter((k) => k.kind === "directions").length,
        saves: saves.count ?? 0,
        reviews: reviews.count ?? 0,
      };
    },

    // ---------- Contas ----------

    async getProfile(userId: string): Promise<Profile | null> {
      const row = check(
        await db.from("profiles").select("id, name, avatar_url, role").eq("id", userId).maybeSingle(),
      ) as { id: string; name: string | null; avatar_url: string | null; role: Profile["role"] } | null;
      return row ? { id: row.id, name: row.name, avatarUrl: row.avatar_url, role: row.role } : null;
    },

    /** Garante o perfil (o gatilho do banco cria; isto cobre contas criadas antes dele). */
    async ensureProfile(userId: string, name: string | null, avatarUrl: string | null) {
      check(
        await db
          .from("profiles")
          .upsert({ id: userId, name, avatar_url: avatarUrl }, { onConflict: "id", ignoreDuplicates: true }),
      );
    },

    async updateProfileName(userId: string, name: string) {
      check(await db.from("profiles").update({ name }).eq("id", userId));
    },

    async setSaved(userId: string, placeId: string, list: SavedList, saved: boolean) {
      if (saved) {
        check(
          await db
            .from("saved_places")
            .upsert({ user_id: userId, place_id: placeId, list }, { ignoreDuplicates: true }),
        );
      } else {
        check(
          await db.from("saved_places").delete().eq("user_id", userId).eq("place_id", placeId).eq("list", list),
        );
      }
    },

    async savedLists(userId: string, placeId: string): Promise<SavedList[]> {
      const rows = check(
        await db.from("saved_places").select("list").eq("user_id", userId).eq("place_id", placeId),
      ) as { list: SavedList }[];
      return rows.map((r) => r.list);
    },

    /** Todos os lugares salvos da pessoa, por lista (para marcar os corações nas telas). */
    async savedIndex(userId: string): Promise<{ want: string[]; been: string[] }> {
      const rows = check(
        await db.from("saved_places").select("place_id, list").eq("user_id", userId),
      ) as { place_id: string; list: SavedList }[];
      return {
        want: rows.filter((r) => r.list === "want").map((r) => r.place_id),
        been: rows.filter((r) => r.list === "been").map((r) => r.place_id),
      };
    },

    async listSaved(userId: string, list: SavedList): Promise<Place[]> {
      const rows = check(
        await db
          .from("saved_places")
          .select("place_id, created_at")
          .eq("user_id", userId)
          .eq("list", list)
          .order("created_at", { ascending: false }),
      ) as { place_id: string }[];
      return this.getPlaces(rows.map((r) => r.place_id));
    },

    // ---------- Donos de restaurante ----------

    async ownedPlaces(userId: string): Promise<Place[]> {
      const rows = check(
        await db.from("place_owners").select("place_id").eq("user_id", userId),
      ) as { place_id: string }[];
      return this.getPlaces(rows.map((r) => r.place_id));
    },

    async isOwner(userId: string, placeId: string): Promise<boolean> {
      const { count } = await db
        .from("place_owners")
        .select("place_id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("place_id", placeId);
      return (count ?? 0) > 0;
    },

    async createClaim(placeId: string, userId: string, contact: string, message: string | null) {
      const { error } = await db
        .from("place_claims")
        .insert({ place_id: placeId, user_id: userId, contact, message });
      // Pedido repetido em aberto: tudo bem, já está na fila.
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    },

    async hasOpenClaim(userId: string, placeId: string): Promise<boolean> {
      const { count } = await db
        .from("place_claims")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("place_id", placeId)
        .eq("status", "pending");
      return (count ?? 0) > 0;
    },

    async listOpenClaims(): Promise<Claim[]> {
      const rows = check(
        await db
          .from("place_claims")
          .select("id, place_id, user_id, contact, message, created_at, places(name), profiles(name)")
          .eq("status", "pending")
          .order("created_at"),
      ) as unknown as {
        id: number;
        place_id: string;
        user_id: string;
        contact: string;
        message: string | null;
        created_at: string;
        places: { name: string } | null;
        profiles: { name: string | null } | null;
      }[];
      return rows.map((r) => ({
        id: r.id,
        placeId: r.place_id,
        placeName: r.places?.name ?? "?",
        userId: r.user_id,
        userName: r.profiles?.name ?? null,
        contact: r.contact,
        message: r.message,
        createdAt: r.created_at,
      }));
    },

    async resolveClaim(id: number, approve: boolean) {
      const claim = check(
        await db.from("place_claims").select("place_id, user_id").eq("id", id).single(),
      ) as { place_id: string; user_id: string };
      if (approve) {
        check(
          await db
            .from("place_owners")
            .upsert({ place_id: claim.place_id, user_id: claim.user_id }, { ignoreDuplicates: true }),
        );
      }
      check(await db.from("place_claims").update({ status: approve ? "approved" : "rejected" }).eq("id", id));
    },
  };
}

export type Repo = ReturnType<typeof createRepo>;
