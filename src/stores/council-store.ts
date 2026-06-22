import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CouncilState,
  CouncilPhase,
  Persona,
  Message,
  ConflictPair,
  DestinyReport,
  TimelineBranch,
  CouncilType,
  QuestionType,
} from '@/types';
import { generateId } from '@/lib/utils';

interface CouncilStore extends CouncilState {
  // Actions
  setQuestion: (question: string, type: QuestionType) => void;
  setCouncilType: (type: CouncilType) => void;
  setPersonas: (personas: Persona[]) => void;
  addPersona: (persona: Persona) => void;
  removePersona: (id: string) => void;
  setPhase: (phase: CouncilPhase) => void;
  setSessionNumber: (n: number) => void;
  nextRound: () => void;
  setCurrentSpeaker: (index: number) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setConflicts: (conflicts: ConflictPair[]) => void;
  setReport: (report: DestinyReport) => void;
  setTimeline: (timeline: TimelineBranch[]) => void;
  setAnimating: (animating: boolean) => void;
  setRoundTransition: (transition: boolean) => void;
  reset: () => void;
  incrementSession: () => void;
}

const initialState: CouncilState = {
  phase: 'idle',
  sessionNumber: 1,
  currentRound: 0,
  currentSpeakerIndex: -1,
  question: '',
  questionType: 'other',
  councilType: 'wisdom',
  personas: [],
  messages: [],
  conflicts: [],
  report: null,
  timeline: null,
  isAnimating: false,
  roundTransition: false,
  mentionedIds: [],
};

export const useCouncilStore = create<CouncilStore>()(
  persist(
    (set) => ({
      ...initialState,

      setQuestion: (question, type) =>
        set({ question, questionType: type }),

      setCouncilType: (type) =>
        set({ councilType: type }),

      setPersonas: (personas) =>
        set({ personas }),

      addPersona: (persona) =>
        set((state) => ({
          personas: [...state.personas, persona],
        })),

      removePersona: (id) =>
        set((state) => ({
          personas: state.personas.filter((p) => p.id !== id),
        })),

      setPhase: (phase) => set({ phase }),

      setSessionNumber: (n) => set({ sessionNumber: n }),

      nextRound: () =>
        set((state) => ({
          currentRound: state.currentRound + 1,
          currentSpeakerIndex: -1,
        })),

      setCurrentSpeaker: (index) =>
        set({ currentSpeakerIndex: index }),

      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id: generateId(),
              timestamp: Date.now(),
            },
          ],
        })),

      setConflicts: (conflicts) => set({ conflicts }),

      setReport: (report) => set({ report }),

      setTimeline: (timeline) => set({ timeline }),

      setAnimating: (isAnimating) => set({ isAnimating }),

      setRoundTransition: (roundTransition) => set({ roundTransition }),

      reset: () =>
        set((state) => ({
          ...initialState,
          sessionNumber: state.sessionNumber, // Keep session number
        })),

      incrementSession: () =>
        set((state) => ({
          sessionNumber: state.sessionNumber + 1,
        })),
    }),
    {
      name: 'lifeverse-council',
      partialize: (state) => ({
        sessionNumber: state.sessionNumber,
      }),
    }
  )
);
