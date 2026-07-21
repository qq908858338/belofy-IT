import { create } from 'zustand'
import type { Achievement } from '@/types'

interface AchievementStore {
  achievements: Achievement[]
  setAchievements: (achievements: Achievement[]) => void
  addAchievement: (achievement: Achievement) => void
  updateAchievement: (id: number, achievement: Partial<Achievement>) => void
  deleteAchievement: (id: number) => void
}

export const useAchievementStore = create<AchievementStore>((set) => ({
  achievements: [],
  setAchievements: (achievements) => set({ achievements }),
  addAchievement: (achievement) => set((state) => ({
    achievements: [...state.achievements, achievement],
  })),
  updateAchievement: (id, achievement) => set((state) => ({
    achievements: state.achievements.map((a) =>
      a.id === id ? { ...a, ...achievement } : a
    ),
  })),
  deleteAchievement: (id) => set((state) => ({
    achievements: state.achievements.filter((a) => a.id !== id),
  })),
}))