import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { newCode } from "../code";
import type {
  DecisionSession,
  LeadKind,
  MenuPhoto,
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
  menu_photos?: MenuPhoto[] | null;
  cover_blurhash?: string | null;
  about?: string | null;
}

const PLACE_COLUMNS =
  "id, google_place_id, name, category, neighborhood, address, lat, lng, whatsapp, instagram, cover_url, menu_url, cuisines, status, seed_spend, seed_noise, seed_cover, vibe, ai_summary, ai_model, tags, featured, menu_photos, cover_blurhash, about";
/**
 * Colunas de antes das migrações 0005 (cardápio) e 0003 (tags, featured), da mais nova para a
 * mais antiga, para o app não cair se alguma ainda não rodou.
 */
const COLUMN_SETS = [
  { columns: PLACE_COLUMNS, migration: null },
  { columns: PLACE_COLUMNS.replace(", menu_photos, cover_blurhash, about", ""), migration: "0005_cardapio_dono.sql" },
  {
    columns: PLACE_COLUMNS.replace(", tags, featured, menu_photos, cover_blurhash, about", ""),
    migration: "0003_tags_destaque.sql",
  },
];
let columnSet = 0;
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
    coverBlurhash: r.cover_blurhash ?? null,
    menuUrl: r.menu_url,
    menuPhotos: Array.isArray(r.menu_photos) ? r.menu_photos : [],
    about: r.about ?? null,
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
    | "coverBlurhash"
    | "menuUrl"
    | "menuPhotos"
    | "about"
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
  coverBlurhash: "cover_blurhash",
  menuUrl: "menu_url",
  menuPhotos: "menu_photos",
  about: "about",
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

/** Lê lugares; se uma migração não rodou (coluna inexistente, 42703), lê sem as colunas dela. */
async function selectPlaces<T>(
  run: (columns: string) => PromiseLike<{ data: T; error: { message: string; code?: string } | null }>,
): Promise<T> {
  let res = await run(COLUMN_SETS[columnSet].columns);
  while (res.error?.code === "42703" && columnSet < COLUMN_SETS.length - 1) {
    columnSet++;
    console.warn(`Kombin: rode supabase/migrations/${COLUMN_SETS[columnSet].migration} no SQL Editor do Supabase.`);
    res = await run(COLUMN_SETS[columnSet].columns);
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

    /** Foto já validada e sem metadados (veja src/lib/upload.ts), na pasta da capa ou do cardápio. */
    async uploadImage(
      placeId: string,
      image: { bytes: Uint8Array; type: string; ext: string },
      folder: "capa" | "cardapio" = "capa",
    ): Promise<string> {
      const path = `${placeId}/${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${image.ext}`;
      const { error } = await db.storage
        .from("covers")
        .upload(path, image.bytes, { contentType: image.type, upsert: false, cacheControl: "31536000" });
      if (error) throw new Error(`Upload: ${error.message}`);
      return db.storage.from("covers").getPublicUrl(path).data.publicUrl;
    },

    /** Apaga do bucket uma foto do próprio lugar (URL de fora ou de outra pasta fica intacta). */
    async deleteImage(placeId: string, url: string): Promise<void> {
      const marker = "/storage/v1/object/public/covers/";
      const i = url.indexOf(marker);
      if (i < 0) return;
      const path = decodeURIComponent(url.slice(i + marker.length));
      if (!path.startsWith(`${placeId}/`) || path.includes("..")) return;
      await db.storage.from("covers").remove([path]);
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
      const rows = check(
        await db.from("place_signals").select("place_id, reviews, spend_avg, noise_avg, cover_ratio"),
      ) as {
        place_id: string;
        reviews: number;
        spend_avg: number;
        noise_avg: number;
        cover_ratio: number;
      }[];
      return new Map(
        rows.map((r) => [
          r.place_id,
          { reviews: r.reviews, spendAvg: r.spend_avg, noiseAvg: r.noise_avg, coverRatio: r.cover_ratio },
        ]),
      );
    },

    /** Com conta: substitui a avaliação anterior da pessoa naquele lugar. */
    async addMicroReview(r: MicroReview & { userId: string | null }): Promise<void> {
      if (r.userId) {
        check(await db.from("micro_reviews").delete().eq("place_id", r.placeId).eq("user_id", r.userId));
      }
      check(
        await db.from("micro_reviews").insert({
          place_id: r.placeId,
          user_id: r.userId,
          device_id: r.deviceId,
          occasion: r.occasion,
          spend: r.spend,
          cover: r.cover,
          noise: r.noise,
        }),
      );
    },

    async countUserReviews(userId: string): Promise<number> {
      const { count, error } = await db
        .from("micro_reviews")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return count ?? 0;
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
