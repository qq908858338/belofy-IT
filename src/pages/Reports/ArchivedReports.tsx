import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { FileText, CalendarDays, Calendar, CheckCircle2, Clock, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Calendar as CalendarIcon, Target, Image, Video, FileText as FileTextIcon, Link, ExternalLink, Play, Download, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useReportStore } from '@/store/reportStore'
import { getArchivedDailyReports, getArchivedWeeklyReports, updateReport, addComment, addReview } from '@/api/report'
import type { Report } from '@/types'
import { getTaskProgress as calcTaskProgress, getTaskTotalTarget } from '@/lib/utils'

const tabs = [
  { id: 'daily', name: '日报', icon: FileText },
  { id: 'weekly', name: '周报', icon: CalendarDays },
]

export default function ArchivedReports() {
  const [activeTab, setActiveTab] = useState('daily')
  const [loading, setLoading] = useState(true)
  const [archivedDaily, setArchivedDaily] = useState<any[]>([])
  const [archivedWeekly, setArchivedWeekly] = useState<any[]>([])
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({})
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [reviewScore, setReviewScore] = useState(80)
  const [commentText, setCommentText] = useState('')
  const [showCommentSuccess, setShowCommentSuccess] = useState(false)
  const [showReviewSuccess, setShowReviewSuccess] = useState(false)
  const [previewContent, setPreviewContent] = useState<{ type: string; url: string; name: string } | null>(null)
  const [docDownloadMsg, setDocDownloadMsg] = useState<string | null>(null)
  const { token, user: currentUser } = useAuthStore()
  const { updateReport: updateReportInStore } = useReportStore()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [daily, weekly] = await Promise.all([
        getArchivedDailyReports(token!),
        getArchivedWeeklyReports(token!)
      ])
      setArchivedDaily(daily)
      setArchivedWeekly(weekly)
    } catch (error) {
      console.error('Failed to fetch archived reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'from-emerald-500 to-green-500'
    if (progress >= 50) return 'from-blue-500 to-indigo-500'
    if (progress >= 20) return 'from-orange-500 to-amber-500'
    return 'from-red-500 to-rose-500'
  }

  const getProgressTextColor = (progress: number) => {
    if (progress >= 80) return 'text-emerald-400'
    if (progress >= 50) return 'text-blue-400'
    if (progress >= 20) return 'text-orange-400'
    return 'text-red-400'
  }

  const openReportDetail = (report: Report) => {
    setSelectedReport(report)
    setShowDetailDialog(true)
  }

  const handleImagePreview = (url: string, name: string) => {
    setPreviewContent({ type: 'image', url, name })
  }

  const handleVideoPreview = (url: string, name: string) => {
    setPreviewContent({ type: 'video', url, name })
  }

  const handleDocumentDownload = (url: string, name: string) => {
    if (!url) return
    setDocDownloadMsg(`正在下载: ${name}`)
    
    const downloadFile = () => {
      const a = document.createElement('a')
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setDocDownloadMsg(`下载完成: ${name}`)
      setTimeout(() => setDocDownloadMsg(null), 2000)
    }

    if (url.startsWith('blob:')) {
      downloadFile()
    } else if (url.startsWith('http')) {
      fetch(url)
        .then(res => res.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = blobUrl
          a.download = name
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(blobUrl)
          setDocDownloadMsg(`下载完成: ${name}`)
          setTimeout(() => setDocDownloadMsg(null), 2000)
        })
        .catch(() => {
          downloadFile()
        })
    } else {
      downloadFile()
    }
  }

  const handleLinkOpen = (url: string) => {
    if (url) {
      window.open(url, '_blank')
    }
  }

  const isTaskCompleted = (report: Report) => {
    const task = report.task
    if (!task) return false
    const target = task.targetQuantity || 0
    const completed = task.completedQuantity || 0
    return target > 0 && completed >= target
  }

  const getEffectiveStatus = (report: Report) => {
    if (report.status === '已评审' || report.status === '已批示') return report.status
    if (isTaskCompleted(report)) return '待评审'
    return report.status
  }

  const submitComment = async () => {
    if (!selectedReport || !currentUser) return
    try {
      if (commentText.trim()) {
        await addComment(token!, selectedReport.id, {
          userId: currentUser.id,
          content: commentText.trim()
        })
      }
      await updateReport(token!, selectedReport.id, { status: '已批示' })
      const updatedReport = { ...selectedReport, status: '已批示' }
      updateReportInStore(updatedReport)
      setSelectedReport(updatedReport)
      setShowCommentDialog(false)
      setShowDetailDialog(false)
      setCommentText('')
      setShowCommentSuccess(true)
      setTimeout(() => setShowCommentSuccess(false), 2000)
    } catch (error) {
      console.error('Failed to submit comment:', error)
      alert('批示提交失败')
    }
  }

  const submitReview = async () => {
    if (!selectedReport || !currentUser) return
    try {
      await addReview(token!, selectedReport.id, {
        reviewerId: currentUser.id,
        score: reviewScore
      })
      await updateReport(token!, selectedReport.id, { status: '已评审' })
      const updatedReport = { ...selectedReport, status: '已评审' }
      updateReportInStore(updatedReport)
      setSelectedReport(updatedReport)
      setShowReviewDialog(false)
      setShowDetailDialog(false)
      setShowReviewSuccess(true)
      setTimeout(() => setShowReviewSuccess(false), 2000)
    } catch (error) {
      console.error('Failed to submit review:', error)
      alert('评审提交失败')
    }
  }

  const parseAttachments = (attachmentsStr?: string): any[] => {
    if (!attachmentsStr) return []
    try {
      return JSON.parse(attachmentsStr)
    } catch {
      return []
    }
  }

  const renderDetailContent = (report: Report) => {
    const task = report.task
    const attachments = parseAttachments(report.attachments)

    const imageAttachments = attachments.filter(a => a.type === 'image' || a.type === 'screenshot')
    const videoAttachments = attachments.filter(a => a.type === 'video')
    const docAttachments = attachments.filter(a => a.type === 'document')
    const linkAttachments = attachments.filter(a => a.type === 'link')

    return (
      <div className="space-y-4">
        <div className="bg-slate-800/50 rounded-lg px-4 py-3 flex items-center gap-4 text-sm">
          <span className="text-slate-400">任务数 <span className="text-green-400 font-semibold">1</span></span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">总完成量 <span className="text-green-400 font-semibold">{report.completedQuantity}</span></span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">总用时 <span className="text-green-400 font-semibold">{report.usedHours}h</span></span>
        </div>

        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4 text-sm">
            <span className="text-slate-400">今日完成 <span className="text-green-400 font-semibold">{report.completedQuantity}</span> {task?.unit || ''}，用时 <span className="text-green-400 font-semibold">{report.usedHours}h</span></span>
          </div>

          <div className="flex items-start gap-2 py-2 border-t border-slate-700/30">
            <span className="text-slate-500 text-sm whitespace-nowrap">任务名称</span>
            <span className="text-white text-sm font-medium">{task?.name || '无关联任务'}</span>
          </div>

          {task?.type && (
            <div className="flex items-start gap-2 py-2 border-t border-slate-700/30">
              <span className="text-slate-500 text-sm whitespace-nowrap">任务类型</span>
              <Badge variant="outline" className="bg-slate-700/50 text-slate-400 text-xs">{task.type}</Badge>
            </div>
          )}

          {task && (
            <div className="flex items-start gap-2 py-2 border-t border-slate-700/30">
              <span className="text-slate-500 text-sm whitespace-nowrap">任务进度</span>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${(task.completedQuantity || 0) >= (task.targetQuantity || 0) ? 'bg-green-500' : (task.completedQuantity || 0) >= (task.targetQuantity || 0) / 2 ? 'bg-blue-500' : 'bg-yellow-500'}`} style={{ width: `${task.targetQuantity ? Math.min(100, ((task.completedQuantity || 0) / task.targetQuantity) * 100) : 0}%` }} />
                  </div>
                  <span className="text-xs text-slate-500">{task.completedQuantity || 0}/{task.targetQuantity || 0}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 py-2 border-t border-slate-700/30">
            {isTaskCompleted(report) ? (
              <Button 
                onClick={() => { setReviewScore(80); setShowReviewDialog(true) }}
                disabled={report.status === '已评审'}
                className={`font-semibold px-4 py-2 rounded-lg shadow-lg transition-all ${
                  report.status === '已评审' 
                    ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed shadow-none' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-purple-500/20 hover:shadow-purple-500/40'
                }`}
              >
                {report.status === '已评审' ? '已评审' : '评审'}
              </Button>
            ) : (
              <Button 
                onClick={() => setShowCommentDialog(true)}
                disabled={report.status === '已批示'}
                className={`font-semibold px-4 py-2 rounded-lg shadow-lg transition-all ${
                  report.status === '已批示' 
                    ? 'bg-green-500/20 text-green-400 cursor-not-allowed shadow-none' 
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/20 hover:shadow-amber-500/40'
                }`}
              >
                {report.status === '已批示' ? '已批示' : '批示'}
              </Button>
            )}
          </div>

          {report.blocker && (
            <div className="flex items-start gap-2 py-2 border-t border-slate-700/30">
              <span className="text-slate-500 text-sm whitespace-nowrap">协作需求</span>
              <span className="text-red-500 font-bold text-sm">{report.blocker}</span>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="flex items-start gap-2 py-2 border-t border-slate-700/30">
              <span className="text-slate-500 text-sm whitespace-nowrap">成果栏</span>
              <div className="flex-1 space-y-2">
                {(imageAttachments.length > 0 || videoAttachments.length > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {imageAttachments.map((att) => (
                      <img 
                        key={att.id} 
                        src={att.url} 
                        alt={att.name} 
                        className="w-12 h-12 rounded-lg object-cover border border-slate-700 cursor-pointer hover:border-green-500 transition-colors" 
                        title={`点击查看: ${att.name}`} 
                        onClick={() => handleImagePreview(att.url, att.name)}
                      />
                    ))}
                    {videoAttachments.map((att) => (
                      <div 
                        key={att.id} 
                        className="w-12 h-12 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center cursor-pointer hover:border-purple-500 transition-colors relative group" 
                        title={`点击播放: ${att.name}`}
                        onClick={() => handleVideoPreview(att.url, att.name)}
                      >
                        <Video className="w-5 h-5 text-purple-400" />
                        <Play className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                )}
                {docAttachments.map((att) => (
                  <div 
                    key={att.id} 
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-700/30 px-2 py-1 rounded -mx-2 transition-colors"
                    onClick={() => handleDocumentDownload(att.url, att.name)}
                  >
                    <FileTextIcon className="w-5 h-5 text-orange-400 flex-shrink-0" />
                    <span className="text-xs text-blue-400 underline truncate" title={`点击下载: ${att.name}`}>{att.name}</span>
                    <Download className="w-3 h-3 text-slate-500" />
                  </div>
                ))}
                {linkAttachments.map((att) => (
                  <div 
                    key={att.id} 
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-700/30 px-2 py-1 rounded -mx-2 transition-colors"
                    onClick={() => handleLinkOpen(att.url)}
                  >
                    <Link className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <span className="text-xs text-slate-300 truncate" title={`点击打开: ${att.name}`}>{att.name}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.resultDesc && (
            <div className="flex items-start gap-2 py-2 border-t border-slate-700/30">
              <span className="text-slate-500 text-sm whitespace-nowrap">补充说明</span>
              <span className="text-slate-300 text-sm">{report.resultDesc}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">已归档</h1>
      </div>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'secondary' : 'outline'}
            className={`${activeTab === tab.id 
              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' 
              : 'bg-slate-900/50 text-slate-400 border-slate-700 hover:text-white'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.name}
          </Button>
        ))}
      </div>

      {loading ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <p className="text-slate-400">加载中...</p>
          </CardContent>
        </Card>
      ) : activeTab === 'daily' ? (
        <ArchivedDailyList 
          reports={archivedDaily} 
          expandedUsers={expandedUsers} 
          setExpandedUsers={setExpandedUsers} 
          onOpenDetail={openReportDetail}
        />
      ) : (
        <ArchivedWeeklyList 
          reports={archivedWeekly} 
          expandedUsers={expandedUsers} 
          setExpandedUsers={setExpandedUsers} 
          getProgressColor={getProgressColor} 
          getProgressTextColor={getProgressTextColor} 
        />
      )}

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-700 max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex items-center">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-bold text-white">日报详情</DialogTitle>
              <span className="text-sm text-slate-400">
                {selectedReport ? new Date(selectedReport.reportDate || selectedReport.createdAt).toLocaleDateString('zh-CN') : ''}
              </span>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4 pr-2">
            {selectedReport && renderDetailContent(selectedReport)}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewContent} onOpenChange={(open) => !open && setPreviewContent(null)}>
        <DialogContent className="sm:max-w-[800px] bg-slate-900 border-slate-700">
          <DialogHeader className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-white truncate pr-4">{previewContent?.name || '预览'}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setPreviewContent(null)} className="text-slate-400 hover:text-white absolute right-4 top-4">
              <X className="w-5 h-5" />
            </Button>
          </DialogHeader>
          
          <div className="flex items-center justify-center py-4 min-h-[400px]">
            {previewContent ? (
              previewContent.type === 'video' ? (
                <video 
                  src={previewContent.url} 
                  controls 
                  autoPlay
                  className="max-w-full max-h-[60vh] rounded-lg"
                />
              ) : (
                <img 
                  src={previewContent.url} 
                  alt={previewContent.name}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              )
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {docDownloadMsg && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
          <div className="bg-slate-800/95 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-xl border border-slate-700">
            {docDownloadMsg}
          </div>
        </div>
      )}

      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent className="sm:max-w-[480px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">批示</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <div className="text-sm text-slate-400">批示意见：</div>
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="请输入批示意见..."
                className="min-h-[120px] bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCommentDialog(false)} className="text-slate-400 hover:text-white">
              取消
            </Button>
            <Button 
              onClick={submitComment}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              提交批示
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-[420px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">评审</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <div className="text-sm text-slate-400">评分</div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={reviewScore}
                  onChange={(e) => setReviewScore(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <span className={`text-2xl font-bold w-16 text-center ${
                  reviewScore >= 90 ? 'text-green-400' :
                  reviewScore >= 80 ? 'text-blue-400' :
                  reviewScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                }`}>{reviewScore}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>

            <div className="flex justify-center">
              <div className={`px-6 py-2 rounded-full text-sm font-semibold ${
                reviewScore >= 90 ? 'bg-green-500/20 text-green-400' :
                reviewScore >= 80 ? 'bg-blue-500/20 text-blue-400' :
                reviewScore >= 60 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {reviewScore >= 90 ? '优秀' :
                 reviewScore >= 80 ? '良好' :
                 reviewScore >= 60 ? '合格' : '待改进'}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowReviewDialog(false)} className="text-slate-400 hover:text-white">
              取消
            </Button>
            <Button 
              onClick={submitReview}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              提交评审
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showCommentSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl px-8 py-6 flex flex-col items-center gap-4 min-w-[200px]">
            <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-medium text-center">批示已提交</p>
          </div>
        </div>
      )}

      {showReviewSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl px-8 py-6 flex flex-col items-center gap-4 min-w-[200px]">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-medium text-center">评审已提交</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ArchivedDailyList({ reports, expandedUsers, setExpandedUsers, onOpenDetail }: any) {
  const isTaskCompleted = (report: any) => {
    const task = report.task
    if (!task) return false
    const target = task.targetQuantity || 0
    const completed = task.completedQuantity || 0
    return target > 0 && completed >= target
  }

  const getEffectiveStatus = (report: any) => {
    if (report.status === '已评审' || report.status === '已批示') return report.status
    if (isTaskCompleted(report)) return '待评审'
    return report.status
  }

  const getRoleBadge = (report: any) => {
    const task = report.task
    if (!task) return null
    if (task.userId === report.userId) {
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">负责人</Badge>
    }
    const isMember = task.members?.some((m: any) => m.userId === report.userId)
    if (isMember) {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">组员</Badge>
    }
    return null
  }

  const parseAttachments = (attachmentsStr?: string): any[] => {
    if (!attachmentsStr) return []
    try {
      return JSON.parse(attachmentsStr)
    } catch {
      return []
    }
  }

  const hasAttachmentType = (report: any, type: string) => {
    const attachments = parseAttachments(report.attachments)
    return attachments.some((a: any) => a.type === type || (type === 'image' && (a.type === 'image' || a.type === 'screenshot')))
  }

  const sortedReports = [...reports].sort((a, b) => {
    const dateA = new Date(a.reportDate || a.createdAt).getTime()
    const dateB = new Date(b.reportDate || b.createdAt).getTime()
    return dateB - dateA
  })

  const groupedByUser = sortedReports.reduce((acc, report) => {
    const userName = report.user?.nickname || '未知用户'
    if (!acc[userName]) acc[userName] = []
    acc[userName].push(report)
    return acc
  }, {} as Record<string, any[]>)

  if (reports.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400">暂无日报归档数据</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedByUser).map(([userName, userReports]) => {
        const isExpanded = expandedUsers[userName] || false
        const avatarLetter = userName[0]
        
        const reportsByDate = userReports.reduce((acc, report) => {
          const dateKey = new Date(report.reportDate).toLocaleDateString('zh-CN')
          if (!acc[dateKey]) acc[dateKey] = []
          acc[dateKey].push(report)
          return acc
        }, {} as Record<string, any[]>)

        return (
          <Card key={userName} className="bg-slate-900/50 border-slate-800 overflow-hidden">
            <div 
              className="p-4 bg-slate-800/30 cursor-pointer hover:bg-slate-800/50 transition-colors"
              onClick={() => setExpandedUsers((prev: any) => ({ ...prev, [userName]: !prev[userName] }))}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="font-semibold text-white">{avatarLetter}</span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">{userName}</h2>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{userReports.length} 条汇报</span>
                      <span>{Object.keys(reportsByDate).length} 天</span>
                    </div>
                  </div>
                </div>

                <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-slate-700/30 ${isExpanded ? '' : 'text-slate-500'}`}>
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </div>

            {isExpanded && (
              <CardContent className="p-3">
                {Object.entries(reportsByDate).sort((a, b) => 
                  new Date(b[0]).getTime() - new Date(a[0]).getTime()
                ).map(([dateKey, dateReports]) => (
                  <div key={dateKey} className="mb-3 last:mb-0">
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-sm text-slate-400">{dateKey}</span>
                      <span className="text-xs text-slate-600">· {dateReports.length} 条</span>
                    </div>
                    <div className="space-y-2 ml-5">
                      {dateReports.map((report: any) => {
                        const hasImage = hasAttachmentType(report, 'image')
                        const hasVideo = hasAttachmentType(report, 'video')
                        const hasDoc = hasAttachmentType(report, 'document')
                        const hasLink = hasAttachmentType(report, 'link')
                        
                        return (
                          <Card 
                            key={report.id} 
                            className="bg-slate-800/30 border-slate-700/30 overflow-hidden hover:bg-slate-800/50 cursor-pointer transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenDetail(report)
                            }}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="bg-slate-700/50 text-slate-400 text-[10px] px-1.5 py-0 h-auto">
                                      {report.task?.type}
                                    </Badge>
                                    <span className="font-medium text-white text-sm truncate">{report.task?.name}</span>
                                    {getRoleBadge(report)}
                                    <div className="flex items-center gap-1 ml-auto">
                                      {hasImage && <Image className="w-4 h-4 text-green-400" />}
                                      {hasVideo && <Video className="w-4 h-4 text-purple-400" />}
                                      {hasDoc && <FileTextIcon className="w-4 h-4 text-orange-400" />}
                                      {hasLink && <Link className="w-4 h-4 text-blue-400" />}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-slate-400">
                                    <span className="flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      +{report.completedQuantity} {report.task?.unit || '个'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {report.usedHours}h
                                    </span>
                                    {report.status && (
                                      <Badge className={`text-[10px] px-1.5 py-0 h-auto ${
                                        getEffectiveStatus(report) === '待评审' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                                        getEffectiveStatus(report) === '已评审' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                        getEffectiveStatus(report) === '已批示' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                                        getEffectiveStatus(report) === '已查看' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                                        'bg-slate-700/50 text-slate-400 border-slate-600/50'
                                      }`}>
                                        {getEffectiveStatus(report)}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {report.resultDesc && (
                                <div className="mt-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700/30">
                                  <p className="text-xs text-slate-400 whitespace-pre-wrap">{report.resultDesc}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}

function ArchivedWeeklyList({ reports, expandedUsers, setExpandedUsers, getProgressColor, getProgressTextColor }: any) {
  const groupedByWeek = useMemo(() => {
    const groups: Record<string, any[]> = {}
    for (const r of reports) {
      const weekKey = r.weekKey
      if (!groups[weekKey]) groups[weekKey] = []
      groups[weekKey].push(r)
    }
    return groups
  }, [reports])

  const groupedReports = useMemo(() => {
    return Object.entries(groupedByWeek).map(([weekKey, weekReports]) => {
      const userGroups: Record<string, any[]> = {}
      for (const r of weekReports) {
        const un = r.userName || '未知用户'
        if (!userGroups[un]) userGroups[un] = []
        userGroups[un].push(r)
      }
      
      return {
        weekKey,
        weekStart: weekReports[0]?.weekStart,
        userGroups
      }
    })
  }, [groupedByWeek])

  if (reports.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400">暂无周报归档数据</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {groupedReports.map(({ weekKey, weekStart, userGroups }) => {
        const weekDate = new Date(weekStart)
        const weekEnd = new Date(weekDate)
        weekEnd.setDate(weekDate.getDate() + 6)
        const weekLabel = `${weekDate.toLocaleDateString('zh-CN')} - ${weekEnd.toLocaleDateString('zh-CN')}`
        
        return (
          <div key={weekKey}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <CalendarDays className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-300">{weekLabel}</span>
            </div>
            
            <div className="space-y-3 ml-5">
              {Object.entries(userGroups).map(([userName, userReports]) => {
                const isExpanded = expandedUsers[`${weekKey}-${userName}`] || false
                const avatarLetter = userName[0]
                const totalActual = userReports.reduce((s: number, r: any) => s + (r.actualCompleted || 0), 0)
                const totalTarget = userReports.reduce((s: number, r: any) => s + (r.targetQuantity || 0), 0)
                const totalWeek = userReports.reduce((s: number, r: any) => s + (r.weekCompleted || 0), 0)
                const totalHours = userReports.reduce((s: number, r: any) => s + (r.totalUsedHours || 0), 0)
                const avgProgress = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0

                return (
                  <Card key={`${weekKey}-${userName}`} className="bg-slate-900/50 border-slate-800 overflow-hidden">
                    <div 
                      className="p-4 bg-slate-800/30 cursor-pointer hover:bg-slate-800/50 transition-colors"
                      onClick={() => setExpandedUsers((prev: any) => ({ ...prev, [`${weekKey}-${userName}`]: !prev[`${weekKey}-${userName}`] }))}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <span className="font-semibold text-white">{avatarLetter}</span>
                          </div>
                          <div>
                            <h2 className="font-semibold text-white">{userName}</h2>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span>{userReports.length} 个任务</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-center hidden sm:block">
                            <div className={`text-xl font-bold ${getProgressTextColor(avgProgress)}`}>{avgProgress}%</div>
                            <div className="text-[10px] text-slate-500">进度</div>
                          </div>
                          
                          <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-slate-700/30 ${isExpanded ? '' : 'text-slate-500'}`}>
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          {userReports.map((report: any) => {
                            const progress = report.targetQuantity > 0 
                              ? Math.min(Math.round((report.actualCompleted / report.targetQuantity) * 100), 100) 
                              : 0
                            
                            return (
                              <div key={`${report.taskId}-${report.userId}`} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 bg-slate-700/30">
                                    <span className={`text-lg font-bold ${getProgressTextColor(progress)}`}>{progress}</span>
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
                                        className={`h-full bg-gradient-to-r ${getProgressColor(progress)} rounded-full transition-all duration-300`}
                                        style={{ width: `${progress}%` }}
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
                                      </div>
                                      
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-slate-500" />
                                        <span className="text-slate-400">{(report.totalUsedHours || 0).toFixed(1)}h</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
