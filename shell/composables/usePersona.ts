import { computed, ref } from 'vue';
import { DEFAULT_PERSONA_ID, PERSONAS, Persona } from '@shell/config/personas';

const STORAGE_KEY = 'rancher-persona';

const readStored = (): string => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    return PERSONAS.some((p) => p.id === stored) ? stored as string : DEFAULT_PERSONA_ID;
  } catch {
    return DEFAULT_PERSONA_ID;
  }
};

// Shared across all callers so every component sees the same active persona
const activePersonaId = ref<string>(readStored());

/**
 * The personas available to the current user and the one they're currently using.
 *
 * Prototype: the choice lives in local storage. It should move to a user preference once personas
 * are configurable.
 */
export const usePersona = () => {
  const personas = computed<Persona[]>(() => PERSONAS);

  const activePersona = computed<Persona>(() => personas.value.find((p) => p.id === activePersonaId.value) || personas.value[0]);

  const setPersona = (id: string) => {
    if (!personas.value.some((p) => p.id === id)) {
      return;
    }

    activePersonaId.value = id;

    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Storage isn't available; the choice holds for this session only
    }
  };

  return {
    personas, activePersona, setPersona
  };
};
