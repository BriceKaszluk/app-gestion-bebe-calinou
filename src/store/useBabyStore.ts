// src/store/useBabyStore.ts
"use client";

import { create } from "zustand";

//
// 🔹 Types
//
export type Parent = { email: string };

const EVENT_TYPES = ["biberon", "dodo", "repas", "caca", "pipi", "bain"] as const;
export type EventType = typeof EVENT_TYPES[number];

export type Baby = {
  _id: string;
  name: string;
  parents: Parent[];
};

export type EventDoc = {
  type: EventType;
  startedAt?: string;
  endedAt?: string;
};

export type EventsMap = Record<EventType, EventDoc | null>;

type BabyStore = {
  babies: Baby[];
  activeBaby: Baby | null;
  events: EventsMap;
  loadingBabies: boolean;
  loadingEvents: boolean;
  saving: boolean;
  error?: string | null;

  init: () => Promise<void>;
  loadBabies: () => Promise<void>;
  setActiveBabyId: (id: string | null) => Promise<void>;
  addBaby: (name: string) => Promise<Baby | null>;
  inviteParent: (babyId: string, email: string) => Promise<void>;
  revokeParent: (babyId: string, email: string) => Promise<void>;
  loadEvents: (babyId?: string) => Promise<void>;
  toggleEvent: (type: EventType, babyId?: string) => Promise<void>;
  clear: () => void;
};

//
// 🔹 Utils
//
const emptyEvents = (): EventsMap => ({
  biberon: null,
  dodo: null,
  repas: null,
  caca: null,
  pipi: null,
  bain: null,
});

const readActiveId = (): string | null => {
  try {
    return localStorage.getItem("activeBabyId");
  } catch {
    return null;
  }
};

const writeActiveId = (id: string | null) => {
  try {
    if (id) localStorage.setItem("activeBabyId", id);
    else localStorage.removeItem("activeBabyId");
  } catch {
    // noop
  }
};

// Helper fetch JSON strict (sans any)
async function fetchJSON<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // pas de JSON retourné
  }
  if (!res.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

//
// 🔹 Store
//
export const useBabyStore = create<BabyStore>((set, get) => {
  let babiesOnce = false;

  const loadBabies = async () => {
    if (get().loadingBabies) return;
    set({ loadingBabies: true, error: null });

    try {
      const data = await fetchJSON<Baby[]>("/api/babies");

      const savedId = readActiveId();
      const active =
        (savedId && data.find((b) => b._id === savedId)) || data[0] || null;

      writeActiveId(active ? active._id : null);

      set({ babies: data, activeBaby: active });

      if (active) {
        await get().loadEvents(active._id);
      } else {
        set({ events: emptyEvents() });
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error(err);
      set({ error: err.message });
    } finally {
      set({ loadingBabies: false });
    }
  };

  const setActiveBabyId = async (id: string | null) => {
    if (!id) {
      writeActiveId(null);
      set({ activeBaby: null, events: emptyEvents() });
      return;
    }

    const found = get().babies.find((b) => b._id === id) ?? null;
    if (!found) {
      await loadBabies(); // recharge la liste si nécessaire
      return;
    }

    writeActiveId(found._id);
    set({ activeBaby: found });
    await get().loadEvents(found._id);
  };

  const addBaby = async (name: string) => {
    const clean = name.trim();
    if (!clean) return null;

    set({ saving: true, error: null });
    try {
      const baby = await fetchJSON<Baby>("/api/babies/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clean }),
      });

      // On recharge pour refléter les permissions côté serveur
      await loadBabies();
      await setActiveBabyId(baby._id);
      return baby;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error(err);
      set({ error: err.message });
      return null;
    } finally {
      set({ saving: false });
    }
  };

  const inviteParent = async (babyId: string, email: string) => {
    await fetchJSON<unknown>("/api/babies/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ babyId, email }),
    });
  };

  const revokeParent = async (babyId: string, email: string) => {
    await fetchJSON<unknown>("/api/babies/removeParent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ babyId, email }),
    });
    await loadBabies();
  };

  const loadEvents = async (babyId?: string) => {
    const id = babyId ?? get().activeBaby?._id;
    if (!id || get().loadingEvents) return;

    set({ loadingEvents: true, error: null });
    try {
      const entries = emptyEvents();

      await Promise.all(
        EVENT_TYPES.map(async (type) => {
          // /api/events?type=<type>&babyId=<id> doit retourner { last?: EventDoc }
          const data = await fetchJSON<{ last?: EventDoc }>(
            `/api/events?type=${encodeURIComponent(type)}&babyId=${encodeURIComponent(id)}`
          );
          entries[type] = data.last ?? null;
        })
      );

      set({ events: entries });
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error(err);
      set({ error: err.message });
    } finally {
      set({ loadingEvents: false });
    }
  };

  const toggleEvent = async (type: EventType, babyId?: string) => {
    const id = babyId ?? get().activeBaby?._id;
    if (!id) return;

    const current = get().events[type];
    const now = new Date().toISOString();

    // Pour "dodo" : toggle start/stop. Pour les autres : on enregistre un "start" ponctuel.
    const body =
      type === "dodo" && current && !current.endedAt
        ? { type, babyId: id, endedAt: now }
        : { type, babyId: id, startedAt: now };

    await fetchJSON<unknown>("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    await get().loadEvents(id);
  };

  const init = async () => {
    if (babiesOnce) return;
    babiesOnce = true;
    await loadBabies();
  };

  const clear = () => {
    writeActiveId(null);
    set({
      babies: [],
      activeBaby: null,
      events: emptyEvents(),
      loadingBabies: false,
      loadingEvents: false,
      saving: false,
      error: null,
    });
  };

  return {
    babies: [],
    activeBaby: null,
    events: emptyEvents(),
    loadingBabies: false,
    loadingEvents: false,
    saving: false,
    error: null,

    init,
    loadBabies,
    setActiveBabyId,
    addBaby,
    inviteParent,
    revokeParent,
    loadEvents,
    toggleEvent,
    clear,
  };
});
