﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Clock, Target, CheckCircle2, Minus, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useReportStore } from '@/store/reportStore'
import { getWeeklyReports } from '@/api/report'

export default function WeeklyReports() {
  const [loading, setLoading] = useState(true)
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({})
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

  const groupedReports = useMemo(() => {
    const groups = weeklyReports.reduce((acc: Record<string, any[]>, report: any) => {
      const key = report.userName || '未知用户'
      if (!acc[key]) acc[key] = []
      acc[key].push(report)
      return acc
    }, {})
    
    return Object.entries(groups).map(([userName, reports]) => {
      const totalActual = reports.reduce((sum: number, r: any) => sum + (r.actualCompleted || 0), 0)
      const totalTarget = reports.reduce((sum: number, r: any) => sum + (r.targetQuantity || 0), 0)
      const totalWeek = reports.reduce((sum: number, r: any) => sum + (r.weekCompleted || 0), 0)
      const totalHours = reports.reduce((sum: number, r: any) => sum + r.totalUsedHours, 0)
      const avgProgress = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0
      const lastWeekTotal = reports.reduce((sum: number, r: any) => sum + (r.lastWeekCompleted || 0), 0)
      const lastWeekHours = reports.reduce((sum: number, r: any) => sum + (r.lastWeekUsedHours || 0), 0)
      const weekDiff = totalWeek - lastWeekTotal
      const hoursDiff = totalHours - lastWeekHours
      
      return { userName, reports, totalActual, totalTarget, totalWeek, totalHours, avgProgress, weekDiff, hoursDiff }
    })
  }, [weeklyReports])

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'from-emerald-500 to-green-500'
    if (progress >= 50) return 'from-blue-500 to-indigo-500'
    if (progress >= 20) return 'from-amber-500 to-orange-500'
    return 'from-red-500 to-rose-500'
  }

  const getProgressTextColor = (progress: number) => {
    if (progress >= 80) return 'text-emerald-400'
    if (progress >= 50) return 'text-blue-400'
    if (progress >= 20) return 'text-amber-400'
    return 'text-red-400'
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">周报</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : groupedReports.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <p className="text-slate-400">暂无周报数据</p>
          </CardContent>
        </Card>
      ) : (
        groupedReports.map(({ userName, reports, totalActual, totalTarget, totalWeek, totalHours, avgProgress, weekDiff, hoursDiff }) => {
          const isExpanded = expandedUsers[userName] || false
          
          return (
          <Card key={userName} className="bg-slate-900/50 border-slate-800 overflow-hidden">
            <div 
              className="p-4 bg-slate-800/30 cursor-pointer hover:bg-slate-800/50 transition-colors"
              onClick={() => setExpandedUsers(prev => ({ ...prev, [userName]: !prev[userName] }))}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="font-semibold text-white">{userName[0]}</span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">{userName}</h2>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{reports.length} 个任务</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-5">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getProgressTextColor(avgProgress)}`}>{avgProgress}%</div>
                    <div className="text-[10px] text-slate-500">整体进度</div>
                  </div>
                  
                  <div className="h-10 w-px bg-slate-700/50 hidden sm:block" />
                  
                  <div className="text-center hidden sm:block">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-lg font-bold text-white">{totalActual}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">累计完成 / {totalTarget}</div>
                  </div>
                  
                  <div className="h-10 w-px bg-slate-700/50 hidden sm:block" />
                  
                  <div className="text-center hidden sm:block">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-lg font-bold text-white">{totalWeek}</span>
                      {weekDiff !== 0 && (
                        <span className={`flex items-center text-[10px] font-medium ${weekDiff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {weekDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(weekDiff)}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500">本周完成</div>
                  </div>
                  
                  <div className="h-10 w-px bg-slate-700/50 hidden sm:block" />
                  
                  <div className="text-center hidden sm:block">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-lg font-bold text-white">{totalHours.toFixed(1)}h</span>
                    </div>
                    <div className="text-[10px] text-slate-500">总工时</div>
                  </div>
                  
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-slate-700/30 ${isExpanded ? '' : 'text-slate-500'}`}>
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>
              
              <div className="mt-3 w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${getProgressColor(avgProgress)} rounded-full transition-all duration-500`}
                  style={{ width: `${avgProgress}%` }}
                />
              </div>
            </div>
            
            {isExpanded && (
            <CardContent className="p-3">
              <div className="space-y-2">
                {reports.map((report: any) => {
                  const actualProgress = report.targetQuantity > 0 
                    ? Math.min(Math.round((report.actualCompleted / report.targetQuantity) * 100), 100) 
                    : 0
                  const weekDiff = report.weekCompleted - (report.lastWeekCompleted || 0)
                  
                  const showCompare = report.lastWeekCompleted !== undefined && report.targetQuantity > 0
                  
                  return (
                    <div key={`${report.taskId}-${report.userId}`} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 bg-slate-700/30`}>
                          <span className={`text-lg font-bold ${getProgressTextColor(actualProgress)}`}>{actualProgress}</span>
                          <span className="text-[9px] text-slate-500">%</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="bg-slate-700/50 text-slate-400 text-[10px] px-1.5 py-0 h-auto">
                              {report.taskType}
                            </Badge>
                            <h3 className="font-medium text-white text-sm truncate">{report.taskName}</h3>
                          </div>
                          
                          <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden mb-1.5">
                            <div 
                              className={`h-full bg-gradient-to-r ${getProgressColor(actualProgress)} rounded-full transition-all duration-300`}
                              style={{ width: `${actualProgress}%` }}
                            />
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-slate-500" />
                              <span className="text-slate-400">{report.actualCompleted}</span>
                              <span className="text-slate-600">/</span>
                              <span className="text-slate-500">{report.targetQuantity || 0}{report.unit || '个'}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">本周</span>
                              <span className="text-white font-medium">{report.weekCompleted || 0}</span>
                              {report.lastWeekCompleted !== undefined && (
                                <span className={`flex items-center text-[10px] font-medium ${weekDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {weekDiff > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : weekDiff < 0 ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                                  {weekDiff !== 0 ? (weekDiff > 0 ? '+' : '') + weekDiff : ''}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span className="text-slate-400">{report.totalUsedHours.toFixed(1)}h</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {showCompare && (
                        <div className="mt-2 pt-2 border-t border-slate-700/30">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-[10px] mb-1">
                                <span className="text-slate-500">上周完成</span>
                                <span className="text-slate-400 font-medium">{report.lastWeekCompleted || 0}</span>
                              </div>
                              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-slate-500 rounded-full transition-all duration-300"
                                  style={{ width: `${report.targetQuantity > 0 ? Math.min(Math.round(((report.lastWeekCompleted || 0) / report.targetQuantity) * 100), 100) : 0}%` }}
                                />
                              </div>
                            </div>
                            
                            <div className={`flex flex-col items-center justify-center w-8 h-8 rounded-full ${weekDiff > 0 ? 'bg-emerald-500/20' : weekDiff < 0 ? 'bg-red-500/20' : 'bg-slate-700/50'}`}>
                              {weekDiff > 0 ? (
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                              ) : weekDiff < 0 ? (
                                <TrendingDown className="w-4 h-4 text-red-400" />
                              ) : (
                                <Minus className="w-4 h-4 text-slate-500" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-[10px] mb-1">
                                <span className="text-emerald-400">本周完成</span>
                                <span className="font-medium text-emerald-400">{report.weekCompleted || 0}</span>
                              </div>
                              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                  style={{ width: `${report.targetQuantity > 0 ? Math.min(Math.round(((report.weekCompleted || 0) / report.targetQuantity) * 100), 100) : 0}%` }}
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
            )}
          </Card>
          )
        })
      )}
    </div>
  )
}