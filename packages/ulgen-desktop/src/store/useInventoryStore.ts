import { create } from "zustand";

interface InventoryState {
  selectedInstanceId: string | null;
  setSelectedInstanceId: (id: string | null) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  selectedInstanceId: null,
  setSelectedInstanceId: (selectedInstanceId) => set({ selectedInstanceId }),
}));
