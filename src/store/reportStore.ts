import { create } from 'zustand'
import type { Report, Comment, Review } from '@/types'

interface ReportStore {
  dailyReports: Report[]
  weeklyReports: any[]
  monthlyReports: any[]
  comments: Comment[]
  reviews: Review[]
  setDailyReports: (reports: Report[]) => void
  setWeeklyReports: (reports: any[]) => void
  setMonthlyReports: (reports: any[]) => void
  addReport: (report: Report) => void
  updateReport: (report: Report) => void
  deleteReport: (reportId: number) => void
  addComment: (comment: Comment) => void
  addReview: (review: Review) => void
}

export const useReportStore = create<ReportStore>()((set) => ({
  dailyReports: [],
  weeklyReports: [],
  monthlyReports: [],
  comments: [],
  reviews: [],
  setDailyReports: (reports) => set({ dailyReports: reports }),
  setWeeklyReports: (reports) => set({ weeklyReports: reports }),
  setMonthlyReports: (reports) => set({ monthlyReports: reports }),
  addReport: (report) => set((state) => ({
    dailyReports: [...state.dailyReports, report]
  })),
  updateReport: (report) => set((state) => ({
    dailyReports: state.dailyReports.map((r) => (r.id === report.id ? report : r))
  })),
  deleteReport: (reportId) => set((state) => ({
    dailyReports: state.dailyReports.filter((r) => r.id !== reportId)
  })),
  addComment: (comment) => set((state) => ({
    comments: [...state.comments, comment]
  })),
  addReview: (review) => set((state) => ({
    reviews: [...state.reviews, review]
  })),
}))