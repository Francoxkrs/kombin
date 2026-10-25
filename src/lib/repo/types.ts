import type {
  DecisionSession,
  LeadCount,
  LeadKind,
  MicroReview,
  Place,
  PlaceSignals,
  PlaceStatus,
  Vote,
} from "../types";

export type PlacePatch = Partial<
  Pick<
    Place,
    | "status"
    | "whatsapp"
    | "instagram"
    | "coverUrl"
    | "seedSpend"
    | "seedNoise"
    | "seedCover"
    | "vibe"
    | "neighborhood"
  >
>;

/** Tudo que o app lê e grava. Há duas implementações: memória (demo) e Supabase. */
export interface Repo {
  readonly mode: "demo" | "supabase";
  listPlaces(status?: PlaceStatus): Promise<Place[]>;
  getPlace(id: string): Promise<Place | null>;
  getPlaces(ids: string[]): Promise<Place[]>;
  updatePlace(id: string, patch: PlacePatch): Promise<void>;
  getSignals(): Promise<Map<string, PlaceSignals>>;
  addMicroReview(review: MicroReview): Promise<void>;
  createSession(occasion: string, placeIds: string[]): Promise<string>;
  getSession(code: string): Promise<DecisionSession | null>;
  getVotes(code: string): Promise<Vote[]>;
  castVote(code: string, vote: Vote): Promise<void>;
  logLead(placeId: string, occasion: string | null, kind: LeadKind, deviceId: string): Promise<void>;
  leadCounts(sinceDays: number): Promise<LeadCount[]>;
}
