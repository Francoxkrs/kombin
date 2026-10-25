import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { newCode } from "../code";
import type { Place, PlaceSignals } from "../types";
import type { PlacePatch, Repo } from "./types";

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
  status: Place["status"];
  seed_spend: Place["seedSpend"];
  seed_noise: Place["seedNoise"];
  seed_cover: boolean | null;
  vibe: Record<string, number> | null;
  ai_summary: string | null;
}

const PLACE_COLUMNS =
  "id, google_place_id, name, category, neighborhood, address, lat, lng, whatsapp, instagram, cover_url, status, seed_spend, seed_noise, seed_cover, vibe, ai_summary";

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
    status: r.status,
    seedSpend: r.seed_spend,
    seedNoise: r.seed_noise,
    seedCover: r.seed_cover,
    vibe: r.vibe ?? {},
    aiSummary: r.ai_summary,
  };
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return res.data;
}

export function createSupabaseRepo(url: string, serviceKey: string): Repo {
  const db: SupabaseClient = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  return {
    mode: "supabase",

    async listPlaces(status) {
      let q = db.from("places").select(PLACE_COLUMNS).order("name");
      if (status) q = q.eq("status", status);
      return (check(await q) as PlaceRow[]).map(toPlace);
    },

    async getPlace(id) {
      const res = await db.from("places").select(PLACE_COLUMNS).eq("id", id).maybeSingle();
      const row = check(res) as PlaceRow | null;
      return row ? toPlace(row) : null;
    },

    async getPlaces(ids) {
      if (ids.length === 0) return [];
      const rows = check(await db.from("places").select(PLACE_COLUMNS).in("id", ids)) as PlaceRow[];
      const byId = new Map(rows.map((r) => [r.id, toPlace(r)]));
      return ids.map((id) => byId.get(id)).filter((p): p is Place => !!p);
    },

    async updatePlace(id, patch: PlacePatch) {
      const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (patch.status !== undefined) row.status = patch.status;
      if (patch.whatsapp !== undefined) row.whatsapp = patch.whatsapp;
      if (patch.instagram !== undefined) row.instagram = patch.instagram;
      if (patch.coverUrl !== undefined) row.cover_url = patch.coverUrl;
      if (patch.seedSpend !== undefined) row.seed_spend = patch.seedSpend;
      if (patch.seedNoise !== undefined) row.seed_noise = patch.seedNoise;
      if (patch.seedCover !== undefined) row.seed_cover = patch.seedCover;
      if (patch.vibe !== undefined) row.vibe = patch.vibe;
      if (patch.neighborhood !== undefined) row.neighborhood = patch.neighborhood;
      check(await db.from("places").update(row).eq("id", id));
    },

    async getSignals() {
      const rows = check(
        await db.from("place_signals").select("place_id, reviews, spend_avg, noise_avg, cover_ratio"),
      ) as {
        place_id: string;
        reviews: number;
        spend_avg: number;
        noise_avg: number;
        cover_ratio: number;
      }[];
      return new Map<string, PlaceSignals>(
        rows.map((r) => [
          r.place_id,
          {
            reviews: r.reviews,
            spendAvg: r.spend_avg,
            noiseAvg: r.noise_avg,
            coverRatio: r.cover_ratio,
          },
        ]),
      );
    },

    async addMicroReview(r) {
      check(
        await db.from("micro_reviews").insert({
          place_id: r.placeId,
          device_id: r.deviceId,
          occasion: r.occasion,
          spend: r.spend,
          cover: r.cover,
          noise: r.noise,
        }),
      );
    },

    async createSession(occasion, placeIds) {
      const code = newCode();
      check(await db.from("decision_sessions").insert({ code, occasion, place_ids: placeIds }));
      return code;
    },

    async getSession(code) {
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

    async getVotes(code) {
      const rows = check(
        await db
          .from("decision_votes")
          .select("device_id, place_id, voter_name")
          .eq("session_code", code),
      ) as { device_id: string; place_id: string; voter_name: string | null }[];
      return rows.map((r) => ({ deviceId: r.device_id, placeId: r.place_id, voterName: r.voter_name }));
    },

    async castVote(code, vote) {
      check(
        await db.from("decision_votes").upsert({
          session_code: code,
          device_id: vote.deviceId,
          place_id: vote.placeId,
          voter_name: vote.voterName,
        }),
      );
    },

    async logLead(placeId, occasion, kind, deviceId) {
      check(
        await db
          .from("lead_clicks")
          .insert({ place_id: placeId, occasion, kind, device_id: deviceId }),
      );
    },

    async leadCounts(sinceDays) {
      const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString();
      const rows = check(
        await db.from("lead_clicks").select("place_id, kind").gte("created_at", since),
      ) as { place_id: string; kind: "whatsapp" | "directions" }[];
      const counts = new Map<string, { whatsapp: number; directions: number }>();
      for (const r of rows) {
        const c = counts.get(r.place_id) ?? { whatsapp: 0, directions: 0 };
        c[r.kind]++;
        counts.set(r.place_id, c);
      }
      return [...counts].map(([placeId, c]) => ({ placeId, ...c }));
    },
  };
}
