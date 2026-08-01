﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="font-medium text-white text-sm">{userName[0]}</span>
                </div>
                <h2 className="font-semibold text-white text-base">{userName}</h2>
              </div>
              
              <div className="space-y-2">
                {(reports as any[]).map((report: any) => {
                  const progress = report.targetQuantity > 0 
                    ? Math.min(Math.round((report.totalCompleted / report.targetQuantity) * 100), 100) 
                    : 0
                  const completedDiff = report.totalCompleted - (report.lastWeekCompleted || 0)
                  const hoursDiff = report.totalUsedHours - (report.lastWeekUsedHours || 0)
                  const lastWeekProgress = report.targetQuantity > 0 
                    ? Math.min(Math.round(((report.lastWeekCompleted || 0) / report.targetQuantity) * 100), 100) 
                    : 0
                  
                  return (
                    <div key={`${report.taskId}-${report.userId}`} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="outline" className="bg-slate-700/50 text-slate-400 text-[10px] px-1.5 py-0.5 h-auto shrink-0">
                            {report.taskType}
                          </Badge>
                          <h3 className="font-medium text-white text-sm truncate">{report.taskName}</h3>
                        </div>
                        <span className="text-white font-medium text-sm shrink-0">{progress}%</span>
                      </div>
                      
                      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500">完成</span>
                          <div className="flex items-center gap-1">
                            <p className="text-white font-medium">{report.totalCompleted}{report.unit || '个'}</p>
                            {report.lastWeekCompleted !== undefined && (
                              <span className={`text-[10px] font-medium ${completedDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {completedDiff >= 0 ? '↑' : '↓'}{Math.abs(completedDiff)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">工时</span>
                          <div className="flex items-center gap-1">
                            <p className="text-white font-medium">{report.totalUsedHours.toFixed(1)}h</p>
                            {report.lastWeekUsedHours !== undefined && (
                              <span className={`text-[10px] font-medium ${hoursDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {hoursDiff >= 0 ? '↑' : '↓'}{Math.abs(hoursDiff).toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">目标</span>
                          <p className="text-white font-medium">{report.targetQuantity || 0}{report.unit || '个'}</p>
                        </div>
                      </div>
                      
                      {(report.lastWeekCompleted !== undefined) && (
                        <div className="mt-2 pt-2 border-t border-slate-700/50">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-[10px] mb-0.5">
                                <span className="text-slate-500">上周 {report.lastWeekCompleted || 0}</span>
                                <span className="text-slate-500">{lastWeekProgress}%</span>
                              </div>
                              <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-slate-500 rounded-full"
                                  style={{ width: `${lastWeekProgress}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-slate-600 text-xs">→</div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-[10px] mb-0.5">
                                <span className="text-emerald-400">本周 {report.totalCompleted}</span>
                                <span className="text-emerald-400">{progress}%</span>
                              </div>
                              <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}