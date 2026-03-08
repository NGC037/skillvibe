import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SkillLevel = "Beginner" | "Intermediate" | "Advanced";

export type Skill = {
  name: string;
  level: SkillLevel;
};

type SkillStore = {
  skills: Skill[];
  addSkill: (skill: Skill) => void;
  removeSkill: (name: string) => void;
};

export const useSkillStore = create<SkillStore>()(
  persist(
    (set) => ({
      skills: [],

      addSkill: (skill) =>
        set((state) => {
          if (state.skills.some((s) => s.name === skill.name)) {
            return state;
          }
          return { skills: [...state.skills, skill] };
        }),

      removeSkill: (name) =>
        set((state) => ({
          skills: state.skills.filter((s) => s.name !== name),
        })),
    }),
    {
      name: "skill-storage",
    }
  )
);
