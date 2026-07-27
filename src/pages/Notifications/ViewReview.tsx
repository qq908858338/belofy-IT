import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useReportStore } from '@/store/reportStore'
import { getDailyReports } from '@/api/report'

export default function ViewReview() {
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  
  const { token, user } = useAuthStore()
  const { dailyReports, setDailyReports } = useReportStore()

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const reports = await getDailyReports(token!)
      setDailyReports(reports)
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const isMyTask = (report: any) => {
    if (!user) return false
    const task = report.task
    if (!task) return false
    if (task.userId === user.id) return true
    if (task.members?.some((m: any) => m.userId === user.id)) return true
    return false
  }

  const myReports = dailyReports.filter(r => 
    (r.reviews && r.reviews.length > 0) && isMyTask(r)
  )

  const groupedReports = myReports.reduce((acc: Record<string, any[]>, report) => {
    const taskType = report.task?.type || '其他任务'
    const date = new Date(report.reportDate).toLocaleDateString('zh-CN')
    const key = `${date}-${taskType}`
    if (!acc[key]) acc[key] = []
    acc[key].push(report)
    return acc
  }, {})

  const sortedGroups = Object.entries(groupedReports).sort((a, b) => {
    const dateA = new Date(a[0].split('-')[0])
    const dateB = new Date(b[0].split('-')[0])
    return dateB.getTime() - dateA.getTime()
  })

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const getReviewLevelColor = (level: string) => {
    const styles: Record<string, string> = {
      '优秀': 'bg-green-500/10 text-green-400',
      '良好': 'bg-blue-500/10 text-blue-400',
      '一般': 'bg-yellow-500/10 text-yellow-400',
      '合格': 'bg-orange-500/10 text-orange-400',
      '不合格': 'bg-red-500/10 text-red-400',
    }
    return styles[level] || 'bg-slate-500/10 text-slate-400'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">查看评审</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sortedGroups.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <Award className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">暂无评审内容</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedGroups.map(([key, reports]) => {
            const [date, taskType] = key.split('-')
            const isExpanded = expandedGroups[key] !== false
            
            return (
              <div key={key} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                <div 
                  className="flex items-center justify-between px-4 py-3 bg-slate-800/30 cursor-pointer hover:bg-slate-800/50 transition-colors"
                  onClick={() => toggleGroup(key)}
                >
                  <div className="flex items-center gap-3">
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">{taskType}</Badge>
                    <span className="text-slate-400 text-sm">{date}</span>
                    <span className="text-slate-500 text-xs">共 {reports.length} 条</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                </div>
                
                {isExpanded && (
                  <div className="divide-y divide-slate-800/50">
                    {reports.map((report) => (
                      <div key={report.id} className="px-4 py-4 hover:bg-slate-800/20 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white truncate">{report.task?.name || '无关联任务'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              {new Date(report.updatedAt).toLocaleString()}
                            </div>
                          </div>
                          <span className="text-xs text-green-400 ml-3">+{report.completedQuantity}</span>
                        </div>
                        
                        {report.reviews && report.reviews.length > 0 && (
                          <div className="space-y-2">
                            {report.reviews.map((review) => (
                              <div key={review.id} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-2xl font-bold text-white">{review.score}分</span>
                                  <Badge variant="outline" className={getReviewLevelColor(review.level)}>
                                    {review.level}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
