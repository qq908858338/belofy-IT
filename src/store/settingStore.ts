import { create } from 'zustand'
import type { SystemSetting, SystemLog } from '@/types'

interface SettingStore {
  settings: Record<string, string>
  logs: SystemLog[]
  setSettings: (settings: Record<string, string>) => void
  setLogs: (logs: SystemLog[]) => void
  updateSetting: (key: string, value: string) => void
}

export const useSettingStore = create<SettingStore>()((set) => ({
  settings: {
    workDaysPerMonth: '22',
    dailyReportWeight: '30',
    taskOnTimeWeight: '30',
    taskReviewWeight: '40',
    loadBaseHours: '40',
  },
  logs: [],
  setSettings: (settings) => set({ settings }),
  setLogs: (logs) => set({ logs }),
  updateSetting: (key, value) => set((state) => ({
    settings: { ...state.settings, [key]: value }
  })),
}))