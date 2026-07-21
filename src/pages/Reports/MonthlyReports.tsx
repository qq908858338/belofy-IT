﻿import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, FileText, FolderKanban, ListTodo } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useReportStore } from '@/store/reportStore'
import { getMonthlyReports } from '@/api/report'

export default function MonthlyReports() {
  const [loading, setLoading] = useState(true)
  const { token } = useAuthStore()
  const { monthlyReports, setMonthlyReports } = useReportStore()

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const reports = await getMonthlyReports(token!)
      setMonthlyReports(reports)
    } catch (error) {
      console.error('Failed to fetch monthly reports:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">月报</h1>
        </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : monthlyReports.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <p className="text-slate-400">暂无月报数据</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthlyReports.map((report: any) => (
            <Card key={report.userId} className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="font-medium text-white">{report.userName[0]}</span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">{report.userName}</h2>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">提交日报数量</p>
                      <p className="text-xl font-bold text-white">{report.reportCount}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <FolderKanban className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">项目数</p>
                      <p className="text-xl font-bold text-white">{report.projectCount}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <ListTodo className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">任务数</p>
                      <p className="text-xl font-bold text-white">{report.taskCount}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">本月完成量化数</p>
                      <p className="text-xl font-bold text-white">{report.totalCompleted}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}