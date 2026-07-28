import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MessageSquare, Clock, Eye, CheckCircle, ChevronDown, ChevronUp, Quote, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useReportStore } from '@/store/reportStore'
import { getDailyReports } from '@/api/report'

export default function ViewComment() {
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  
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
    (r.status === '已查看' || r.status === '已批示') && isMyTask(r)
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

  const getStatusBadge = (status: string) => {
    if (status === '已批示') {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          已批示
        </Badge>
      )
    }
    return (
      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
        <Eye className="w-3 h-3 mr-1" />
        已查看
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">查看指示</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sortedGroups.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">暂无指示内容</p>
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
                          <div className="flex items-center gap-2 ml-3">
                            <span className="text-xs text-green-400">+{report.completedQuantity}</span>
                            {getStatusBadge(report.status)}
                          </div>
                        </div>
                        
                        {report.comments && report.comments.length > 0 && (
                          <div className="space-y-2 mt-3">
                            {report.comments.map((comment) => (
                              <div key={comment.id} className="relative p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 shadow-lg shadow-amber-500/5">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500 rounded-l-lg" />
                                <Quote className="w-5 h-5 text-amber-400/50 absolute top-3 right-3" />
                                <div className="flex items-start gap-3">
                                  <div 
                                    className="flex-1 pl-2 comment-content"
                                    onClick={(e) => {
                                      const target = e.target as HTMLElement
                                      if (target.tagName === 'IMG') {
                                        setPreviewImage((target as HTMLImageElement).src)
                                      }
                                    }}
                                  >
                                    <p 
                                      className="text-amber-100 font-medium text-sm leading-relaxed [&_img]:inline-block [&_img]:w-16 [&_img]:h-16 [&_img]:object-cover [&_img]:rounded-lg [&_img]:mx-1 [&_img]:my-1 [&_img]:border [&_img]:border-amber-500/30 [&_img]:cursor-pointer [&_img]:hover:opacity-80 [&_img]:transition-opacity [&_img]:align-middle" 
                                      dangerouslySetInnerHTML={{ __html: comment.content }} 
                                    />
                                  </div>
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

      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="sm:max-w-[800px] bg-slate-900 border-slate-700">
          <DialogHeader className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-white">图片预览</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setPreviewImage(null)} className="text-slate-400 hover:text-white absolute right-4 top-4">
              <X className="w-5 h-5" />
            </Button>
          </DialogHeader>
          
          <div className="flex items-center justify-center py-4 min-h-[400px]">
            {previewImage && (
              <img 
                src={previewImage} 
                alt="预览"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
