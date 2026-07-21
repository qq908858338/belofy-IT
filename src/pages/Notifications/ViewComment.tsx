import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Clock } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useReportStore } from '@/store/reportStore'
import { getDailyReports } from '@/api/report'

export default function ViewComment() {
  const [loading, setLoading] = useState(true)
  
  const { token } = useAuthStore()
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

  const reportsWithComments = dailyReports.filter(r => r.comments && r.comments.length > 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">查看指示</h1>
        </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reportsWithComments.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">暂无指示内容</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reportsWithComments.map((report) => (
            <Card key={report.id} className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="font-medium text-white">{report.user?.nickname[0]}</span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">{report.user?.nickname}</h2>
                    <p className="text-sm text-slate-500">{report.task?.name}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {(report.comments || []).map((comment) => (
                    <div key={comment.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <span className="text-xs font-medium text-white">{comment.user?.nickname[0]}</span>
                          </div>
                          <span className="text-sm font-medium text-white">{comment.user?.nickname}</span>
                        </div>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-300">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}