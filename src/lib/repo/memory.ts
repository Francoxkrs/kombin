import { DEMO_PLACES } from "../demo-data";
import type { DecisionSession, LeadKind, MicroReview, Place, PlaceSignals, Vote } from "../types";
import { newCode } from "../code";
import type { PlacePatch, Repo } from "./types";

interface Store {
  places: Place[];
  reviews: MicroReview[];
  sessions: Map<string, DecisionSession>;
  votes: Map<string, Vote[]>;
  leads: { placeId: string; occasion: string | null; kind: LeadKind; at: number }[];
}

// Guardado em globalThis para sobreviver ao hot reload do `next dev`.
const g = globalThis as unknown as { __kombinStore?: Store };
const store: Store = (g.__kombinStore ??= {
  places: structuredClone(DEMO_PLACES),
  reviews: [],
  sessions: new Map(),
  votes: new Map(),
  leads: [],
});

/** Repositório em memória: dados somem ao reiniciar o servidor. */
export const memoryRepo: Repo = {
  mode: "demo",

  async listPlaces(status) {
    return store.places.filter((p) => !status || p.status === status);
  },

  async getPlace(id) {
    return store.places.find((p) => p.id === id) ?? null;
  },

  async getPlaces(ids) {
    return ids
      .map((id) => store.places.find((p) => p.id === id))
      .filter((p): p is Place => !!p);
  },

  async updatePlace(id, patch: PlacePatch) {
    const p = store.places.find((x) => x.id === id);
    if (p) Object.assign(p, patch);
  },

  async getSignals() {
    const byPlace = new Map<string, MicroReview[]>();
    for (const r of store.reviews) {
      byPlace.set(r.placeId, [...(byPlace.get(r.placeId) ?? []), r]);
    }
    const out = new Map<string, PlaceSignals>();
    for (const [id, rs] of byPlace) {
      const avg = (f: (r: MicroReview) => number) => rs.reduce((s, r) => s + f(r), 0) / rs.length;
      out.set(id, {
        reviews: rs.length,
        spendAvg: avg((r) => r.spend),
        noiseAvg: avg((r) => r.noise),
        coverRatio: avg((r) => (r.cover ? 1 : 0)),
      });
    }
    return out;
  },

  async addMicroReview(review) {
    store.reviews.push(review);
  },

  async createSession(occasion, placeIds) {
    const code = newCode();
    store.sessions.set(code, { code, occasion, placeIds, createdAt: new Date().toISOString() });
    return code;
  },

  async getSession(code) {
    return store.sessions.get(code) ?? null;
  },

  async getVotes(code) {
    return store.votes.get(code) ?? [];
  },

  async castVote(code, vote) {
    const votes = (store.votes.get(code) ?? []).filter((v) => v.deviceId !== vote.deviceId);
    store.votes.set(code, [...votes, vote]);
  },

  async logLead(placeId, occasion, kind) {
    store.leads.push({ placeId, occasion, kind, at: Date.now() });
  },

  async leadCounts(sinceDays) {
    const since = Date.now() - sinceDays * 86_400_000;
    const counts = new Map<string, { whatsapp: number; directions: number }>();
    for (const l of store.leads.filter((x) => x.at >= since)) {
      const c = counts.get(l.placeId) ?? { whatsapp: 0, directions: 0 };
      c[l.kind]++;
      counts.set(l.placeId, c);
    }
    return [...counts].map(([placeId, c]) => ({ placeId, ...c }));
  },
};
