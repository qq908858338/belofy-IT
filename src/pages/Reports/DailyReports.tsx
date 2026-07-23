﻿﻿﻿﻿﻿﻿﻿﻿﻿import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popconfirm } from '@/components/ui/popconfirm'
import { FileText, MessageSquare, GitCompare, Trash2, CheckCircle2, ChevronDown, ChevronUp, Folder } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useReportStore } from '@/store/reportStore'
import { getDailyReports, deleteReport } from '@/api/report'
import type { Report } from '@/types'
import { getTaskProgress as calcTaskProgress, getTaskTotalTarget } from '@/lib/utils'

export default function DailyReports() {
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const { token } = useAuthStore()
  const { dailyReports, setDailyReports, deleteReport: removeReport } = useReportStore()

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const reports = await getDailyReports(token!)
      setDailyReports(reports)
    } catch (error) {
      console.error('Failed to fetch daily reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (reportId: number) => {
    try {
      await deleteReport(token!, reportId)
      removeReport(reportId)
    } catch (error) {
      console.error('Failed to delete report:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      '进行中': 'bg-blue-500/10 text-blue-400',
      '已完成': 'bg-green-500/10 text-green-400',
      '待修改': 'bg-yellow-500/10 text-yellow-400',
      '已延期': 'bg-red-500/10 text-red-400',
      '待评审': 'bg-purple-500/10 text-purple-400',
      '已评审': 'bg-emerald-500/10 text-emerald-400',
    }
    return styles[status] || 'bg-slate-500/10 text-slate-400'
  }

  const groupedReports = dailyReports.reduce((acc, report) => {
    const key = report.user?.nickname || '未知用户'
    if (!acc[key]) acc[key] = []
    acc[key].push(report)
    return acc
  }, {} as Record<string, Report[]>)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">日报</h1>
          </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : Object.keys(groupedReports).length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">暂无日报数据</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedReports).map(([userName, reports]) => (
          <Card key={userName} className="bg-slate-900/50 border-slate-800 overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-800/50 to-transparent">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-lg font-medium text-white">{userName[0]}</span>
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-white text-lg">{userName}</h2>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-slate-400 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      日报 {reports.length}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-slate-700/50">
                <div 
                  className="flex items-center justify-between px-4 py-2 bg-slate-800/30 cursor-pointer"
                  onClick={() => setExpandedGroups(prev => ({ ...prev, [userName]: !prev[userName] }))}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-400">日报列表</span>
                    <span className="text-xs text-slate-500">({reports.length})</span>
                  </div>
                  <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white">
                    {expandedGroups[userName] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
                
                {expandedGroups[userName] && (
                  <div className="divide-y divide-slate-700/30">
                    {reports.map((report) => {
                      const progress = report.task ? calcTaskProgress(report.task) : 0
                      
                      return (
                        <div key={report.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/20 transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Badge variant="outline" className={`${getStatusBadge(report.status)} w-auto`}>
                              {report.status}
                            </Badge>
                            <span className="font-medium text-white truncate">{report.task?.name || '无关联任务'}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <span className="text-xs text-slate-500">{progress}%</span>
                              <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`} 
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                            
                            <span className="text-xs text-slate-500 min-w-[80px]">{report.completedQuantity}/{report.task ? getTaskTotalTarget(report.task) : 0}</span>
                            <span className="text-xs text-slate-500 min-w-[60px]">{report.usedHours}h</span>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`text-xs ${report.status === '待评审' ? 'text-purple-400 hover:bg-purple-500/10' : 'text-slate-500 hover:bg-slate-700'}`}
                              onClick={(e) => { e.stopPropagation(); }}
                            >
                              {report.status === '待评审' ? '评审' : '已评审'}
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-slate-500 hover:text-blue-400 hover:bg-blue-500/10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-slate-500 hover:text-green-400 hover:bg-green-500/10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GitCompare className="w-4 h-4" />
                            </Button>
                            
                            <Popconfirm title="确定删除此日报？" onConfirm={() => handleDelete(report.id)}>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </Popconfirm>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}