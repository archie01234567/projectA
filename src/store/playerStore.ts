import { create } from "zustand";

type Vec3 = [number, number, number];

type PlayerState = {
  position: Vec3;
  unlockedAreas: string[];
  collectedItems: string[];
  objectives: { id: string; label: string; completed: boolean }[];
};

type PlayerActions = {
  setPosition: (position: Vec3) => void;
  unlockArea: (areaId: string) => void;
  collectItem: (itemId: string) => void;
  setObjectiveComplete: (objectiveId: string, completed?: boolean) => void;
  reset: () => void;
};

type PlayerStore = PlayerState & PlayerActions;

const initialState: PlayerState = {
  position: [0, 1, 0],
  unlockedAreas: ["central-plaza"],
  collectedItems: [],
  objectives: [
    { id: "meet-guide", label: "Meet the guide at the plaza.", completed: false },
    { id: "collect-crystal", label: "Collect the elemental crystal.", completed: false },
    { id: "activate-teleporter", label: "Activate a teleporter.", completed: false },
  ],
};

export const usePlayerStore = create<PlayerStore>((set) => ({
  ...initialState,
  setPosition: (position) => set({ position }),
  unlockArea: (areaId) =>
    set((state) =>
      state.unlockedAreas.includes(areaId)
        ? state
        : { unlockedAreas: [...state.unlockedAreas, areaId] }
    ),
  collectItem: (itemId) =>
    set((state) =>
      state.collectedItems.includes(itemId)
        ? state
        : { collectedItems: [...state.collectedItems, itemId] }
    ),
  setObjectiveComplete: (objectiveId, completed = true) =>
    set((state) => ({
      objectives: state.objectives.map((objective) =>
        objective.id === objectiveId
          ? { ...objective, completed }
          : objective
      ),
    })),
  reset: () => set(initialState),
}));

export const selectPlayerPosition = (state: PlayerStore) => state.position;
export const selectUnlockedAreas = (state: PlayerStore) => state.unlockedAreas;
export const selectCollectedItems = (state: PlayerStore) => state.collectedItems;
export const selectObjectives = (state: PlayerStore) => state.objectives;
