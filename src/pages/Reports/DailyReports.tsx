﻿import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popconfirm } from '@/components/ui/popconfirm'
import { FileText, MessageSquare, GitCompare, Trash2, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useReportStore } from '@/store/reportStore'
import { getDailyReports, deleteReport } from '@/api/report'
import type { Report } from '@/types'

export default function DailyReports() {
  const [loading, setLoading] = useState(true)
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
    <div className="space-y-6">
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
          <Card key={userName} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="font-medium text-white">{userName[0]}</span>
                </div>
                <div>
                  <h2 className="font-semibold text-white">{userName}</h2>
                  <p className="text-sm text-slate-500">{reports.length} 条日报</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={getStatusBadge(report.status)}>
                            {report.status}
                          </Badge>
                          <Badge variant="outline" className="bg-slate-700/50 text-slate-400">
                            {report.task?.type}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-white mb-2">{report.task?.name}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">完成量化数</span>
                            <p className="text-white font-medium">{report.completedQuantity}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">单位工时</span>
                            <p className="text-white font-medium">{report.task?.hoursPerUnit}h</p>
                          </div>
                          <div>
                            <span className="text-slate-500">所用工时</span>
                            <p className="text-white font-medium">{report.usedHours}h</p>
                          </div>
                          <div>
                            <span className="text-slate-500">任务进度</span>
                            <p className="text-white font-medium">
                              {report.task?.targetQuantity ? 
                                Math.round((report.task.completedQuantity / report.task.targetQuantity) * 100) : 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-green-400 hover:bg-green-500/10">
                          <GitCompare className="w-4 h-4" />
                        </Button>
                        {report.status === '待评审' && (
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-purple-400 hover:bg-purple-500/10">
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Popconfirm title="确定删除此日报？" onConfirm={() => handleDelete(report.id)}>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Popconfirm>
                      </div>
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