import type { BillingInterval, SubscriptionStatus } from "../peacock/types";
import { PERSONAS } from "../data/personas";

/**
 * Prototype state store.
 *
 * Holds the simulated connection status and per-persona *overlays* (the mutable
 * bits layered on top of the immutable fixtures in data/personas.ts). It is a
 * tiny framework-agnostic observable so both the MockPeacockService and the
 * React UI can read/subscribe to the exact same state. Persistence uses
 * localStorage in the browser and an in-memory fallback elsewhere (tests).
 */

export interface PersonaOverlay {
  watchlist: string[];
  planId: string;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
}

export interface PrototypeState {
  version: number;
  connectedPersonaId: string | null;
  overlays: Record<string, PersonaOverlay>;
}

const STORAGE_KEY = "peacock-agent-poc:v1";
const STATE_VERSION = 1;

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getStorage(): StorageLike {
  try {
    if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) {
      return (globalThis as any).localStorage as StorageLike;
    }
  } catch {
    // Access to localStorage can throw (e.g. privacy modes); fall through.
  }
  const mem = new Map<string, string>();
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k)! : null),
    setItem: (k, v) => void mem.set(k, v),
    removeItem: (k) => void mem.delete(k),
  };
}

function overlayFromFixture(personaId: string): PersonaOverlay {
  const f = PERSONAS[personaId];
  return {
    watchlist: [...f.watchlist],
    planId: f.planId,
    status: f.status,
    billingInterval: f.billingInterval,
  };
}

function freshState(): PrototypeState {
  const overlays: Record<string, PersonaOverlay> = {};
  for (const id of Object.keys(PERSONAS)) overlays[id] = overlayFromFixture(id);
  return { version: STATE_VERSION, connectedPersonaId: null, overlays };
}

class PrototypeStore {
  private storage: StorageLike = getStorage();
  private state: PrototypeState = this.load();
  private listeners = new Set<() => void>();

  private load(): PrototypeState {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    try {
      const parsed = JSON.parse(raw) as PrototypeState;
      if (parsed.version !== STATE_VERSION) return freshState();
      const base = freshState();
      return {
        ...base,
        connectedPersonaId: parsed.connectedPersonaId ?? null,
        overlays: { ...base.overlays, ...parsed.overlays },
      };
    } catch {
      return freshState();
    }
  }

  private persist(): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  private commit(next: PrototypeState): void {
    this.state = next;
    this.persist();
    for (const l of this.listeners) l();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  };

  getSnapshot = (): PrototypeState => this.state;

  getConnectedPersonaId(): string | null {
    return this.state.connectedPersonaId;
  }

  getOverlay(personaId: string): PersonaOverlay {
    return this.state.overlays[personaId] ?? overlayFromFixture(personaId);
  }

  connect(personaId: string): void {
    if (!PERSONAS[personaId]) throw new Error(`Unknown persona: ${personaId}`);
    this.commit({ ...this.state, connectedPersonaId: personaId });
  }

  disconnect(): void {
    this.commit({ ...this.state, connectedPersonaId: null });
  }

  private updateOverlay(personaId: string, patch: Partial<PersonaOverlay>): void {
    const current = this.getOverlay(personaId);
    const overlays = { ...this.state.overlays, [personaId]: { ...current, ...patch } };
    this.commit({ ...this.state, overlays });
  }

  setWatchlist(personaId: string, watchlist: string[]): void {
    this.updateOverlay(personaId, { watchlist: [...watchlist] });
  }

  setSubscription(
    personaId: string,
    patch: Partial<Pick<PersonaOverlay, "planId" | "status" | "billingInterval">>,
  ): void {
    this.updateOverlay(personaId, patch);
  }

  resetScenario(): void {
    this.commit({ ...freshState(), connectedPersonaId: this.state.connectedPersonaId });
  }

  clearAll(): void {
    this.storage.removeItem(STORAGE_KEY);
    this.commit(freshState());
  }
}

export const prototypeStore = new PrototypeStore();
