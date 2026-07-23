﻿﻿﻿﻿﻿import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GitCompare } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useReportStore } from '@/store/reportStore'
import { getWeeklyReports } from '@/api/report'

export default function WeeklyReports() {
  const [loading, setLoading] = useState(true)
  const { token } = useAuthStore()
  const { weeklyReports, setWeeklyReports } = useReportStore()

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const reports = await getWeeklyReports(token!)
      setWeeklyReports(reports)
    } catch (error) {
      console.error('Failed to fetch weekly reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupedReports = weeklyReports.reduce((acc: Record<string, any[]>, report: any) => {
    const key = report.userName || '未知用户'
    if (!acc[key]) acc[key] = []
    acc[key].push(report)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">周报</h1>
        </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : Object.keys(groupedReports).length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <p className="text-slate-400">暂无周报数据</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedReports).map(([userName, reports]) => (
          <Card key={userName} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="font-medium text-white">{userName[0]}</span>
                </div>
                <h2 className="font-semibold text-white">{userName}</h2>
              </div>
              
              <div className="space-y-4">
                {(reports as any[]).map((report: any) => (
                  <div key={`${report.taskId}-${report.userId}`} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-slate-700/50 text-slate-400">
                            {report.taskType}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-white mb-2">{report.taskName}</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">本周完成量化数</span>
                            <p className="text-white font-medium">{report.totalCompleted}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">总工时</span>
                            <p className="text-white font-medium">{report.totalUsedHours.toFixed(1)}h</p>
                          </div>
                        </div>
                      </div>
                      
                      <GitCompare className="w-5 h-5 text-slate-500 cursor-pointer hover:text-green-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}