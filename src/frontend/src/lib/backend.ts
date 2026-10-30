import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import type { backendInterface } from "@/backend";

export type Backend = backendInterface;

/**
 * Resolve the shared backend actor. Call at hook top level only.
 */
export function useBackendActor() {
  return useActor(createActor);
}

export { createActor };
