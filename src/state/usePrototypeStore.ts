import { useSyncExternalStore } from "react";
import { prototypeStore, type PrototypeState } from "./prototype-store";

/** React binding for the framework-agnostic prototype store. */
export function usePrototypeStore(): PrototypeState {
  return useSyncExternalStore(prototypeStore.subscribe, prototypeStore.getSnapshot);
}
