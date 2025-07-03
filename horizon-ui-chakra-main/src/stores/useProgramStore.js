import { create } from "zustand"; // Use named import

const useProgramStore = create((set) => ({
  selectedPrograms: [],
  setSelectedPrograms: (programs) => set({ selectedPrograms: programs }),
}));

export default useProgramStore;