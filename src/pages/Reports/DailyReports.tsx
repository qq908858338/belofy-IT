﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Popconfirm } from '@/components/ui/popconfirm'
import { Textarea } from '@/components/ui/textarea'
import { FileText, ChevronDown, ChevronUp, Calendar, Image, Video, FileText as FileTextIcon, Link, AlertTriangle, Trash2, User, Users, X, Play, Download, ExternalLink, MessageSquare } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useReportStore } from '@/store/reportStore'
import { useUserStore } from '@/store/userStore'
import { getDailyReports, deleteReport, updateReport, addComment } from '@/api/report'
import { getUsers } from '@/api/user'
import type { Report } from '@/types'
import { getTaskProgress as calcTaskProgress, getTaskTotalTarget } from '@/lib/utils'
import { useSettingStore } from '@/store/settingStore'

interface Attachment {
  id: number
  type: string
  name: string
  url: string
}

export default function DailyReports() {
  const [loading, setLoading] = useState(true)
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({})
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({})
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [showCommentSuccess, setShowCommentSuccess] = useState(false)
  const [selectedPresets, setSelectedPresets] = useState<string[]>([])
  const [commentText, setCommentText] = useState('')
  const [commentImages, setCommentImages] = useState<string[]>([])
  const commentEditorRef = useRef<HTMLDivElement>(null)
  const [previewContent, setPreviewContent] = useState<{ type: string; url: string; name: string } | null>(null)
  const [docDownloadMsg, setDocDownloadMsg] = useState<string | null>(null)
  const { token, user: currentUser } = useAuthStore()
  const { dailyReports, setDailyReports, deleteReport: removeReport, updateReport: updateReportInStore } = useReportStore()
  const { users, setUsers } = useUserStore()
  const { settings } = useSettingStore()
  const workDaysPerMonth = parseInt(settings.workDaysPerMonth) || 22

  useEffect(() => {
    fetchReports()
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const usersData = await getUsers(token!)
      setUsers(usersData)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

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

  const parseAttachments = (attachmentsStr?: string): Attachment[] => {
    if (!attachmentsStr) return []
    try {
      return JSON.parse(attachmentsStr)
    } catch {
      return []
    }
  }

  const parseHelpers = (helpersStr?: string): number[] => {
    if (!helpersStr) return []
    try {
      return JSON.parse(helpersStr)
    } catch {
      return []
    }
  }

  const hasAttachmentType = (report: Report, type: string) => {
    const attachments = parseAttachments(report.attachments)
    return attachments.some(a => a.type === type || (type === 'image' && (a.type === 'image' || a.type === 'screenshot')))
  }

  const getRoleBadge = (report: Report) => {
    const task = report.task
    if (!task) return null
    if (task.userId === report.userId) {
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">负责人</Badge>
    }
    const isMember = task.members?.some(m => m.userId === report.userId)
    if (isMember) {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">组员</Badge>
    }
    return null
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN')
  }

  const sortedReports = [...dailyReports].sort((a, b) => {
    const dateA = new Date(a.reportDate || a.createdAt).getTime()
    const dateB = new Date(b.reportDate || b.createdAt).getTime()
    return dateB - dateA
  })

  const groupedByUser = sortedReports.reduce((acc, report) => {
    const userName = report.user?.nickname || '未知用户'
    if (!acc[userName]) acc[userName] = []
    acc[userName].push(report)
    return acc
  }, {} as Record<string, Report[]>)

  const openReportDetail = async (report: Report) => {
    setSelectedReport(report)
    setShowDetailDialog(true)
    
    if (report.status === '待评审') {
      try {
        await updateReport(token!, report.id, { status: '已查看' })
        const updatedReport = { ...report, status: '已查看' }
        updateReportInStore(updatedReport)
        setSelectedReport(updatedReport)
      } catch (error) {
        console.error('Failed to update report status:', error)
      }
    }
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

  const openCommentDialog = () => {
    setCommentText('')
    setCommentImages([])
    setSelectedPresets([])
    setShowCommentDialog(true)
    setTimeout(() => {
      if (commentEditorRef.current) {
        commentEditorRef.current.innerHTML = ''
      }
    }, 0)
  }

  const handlePresetComment = (text: string) => {
    setSelectedPresets(prev => {
      const isSelected = prev.includes(text)
      const newPresets = isSelected ? prev.filter(p => p !== text) : [...prev, text]
      if (commentEditorRef.current) {
        commentEditorRef.current.innerText = newPresets.length > 0 ? newPresets.join('；') : ''
      }
      setCommentText(newPresets.length > 0 ? newPresets.join('；') : '')
      return newPresets
    })
  }

  const handleEditorInput = () => {
    if (commentEditorRef.current) {
      const text = commentEditorRef.current.innerText || ''
      setCommentText(text)
    }
  }

  const handleEditorPaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const base64 = event.target?.result as string
            if (commentEditorRef.current) {
              const img = document.createElement('img')
              img.src = base64
              img.className = 'inline-block w-16 h-16 object-cover rounded-lg mx-1 my-1 border border-slate-600 align-middle cursor-pointer hover:opacity-80 transition-opacity'
              img.style.maxHeight = ''
              
              const selection = window.getSelection()
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0)
                if (commentEditorRef.current.contains(range.commonAncestorContainer)) {
                  range.deleteContents()
                  range.insertNode(img)
                  range.setStartAfter(img)
                  range.setEndAfter(img)
                  selection.removeAllRanges()
                  selection.addRange(range)
                } else {
                  commentEditorRef.current.appendChild(img)
                }
              } else {
                commentEditorRef.current.appendChild(img)
              }
              
              setCommentImages(prev => [...prev, base64])
              handleEditorInput()
            }
          }
          reader.readAsDataURL(file)
        }
        break
      }
    }
  }

  const submitComment = async () => {
    if (!selectedReport || !currentUser) return
    try {
      const editorContent = commentEditorRef.current?.innerHTML || ''
      const hasContent = commentText.trim() || commentImages.length > 0
      
      if (hasContent) {
        await addComment(token!, selectedReport.id, {
          userId: currentUser.id,
          content: editorContent || commentText.trim()
        })
      }
      await updateReport(token!, selectedReport.id, { status: '已批示' })
      const updatedReport = { ...selectedReport, status: '已批示' }
      updateReportInStore(updatedReport)
      setSelectedReport(updatedReport)
      setShowCommentDialog(false)
      setShowDetailDialog(false)
      setCommentText('')
      setCommentImages([])
      setSelectedPresets([])
      setShowCommentSuccess(true)
      setTimeout(() => setShowCommentSuccess(false), 2000)
    } catch (error) {
      console.error('Failed to submit comment:', error)
      alert('批示提交失败')
    }
  }

  const renderDetailContent = (report: Report) => {
    const task = report.task
    const attachments = parseAttachments(report.attachments)
    const helpers = parseHelpers(report.helpers)
    const progress = task ? calcTaskProgress(task, workDaysPerMonth) : 0
    const totalTarget = task ? getTaskTotalTarget(task, workDaysPerMonth) : 0

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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-400">今日完成 <span className="text-green-400 font-semibold">{report.completedQuantity}</span> {task?.unit || ''}，用时 <span className="text-green-400 font-semibold">{report.usedHours}h</span></span>
              <span className="text-slate-600">进度</span>
              <div className="flex items-center gap-2 flex-1">
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden max-w-[100px]">
                  <div className={`h-full rounded-full ${progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`} style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs text-slate-500">{report.completedQuantity}/{totalTarget}</span>
              </div>
            </div>
            <Button 
              onClick={openCommentDialog}
              disabled={report.status === '已批示'}
              className={`font-semibold px-4 py-2 rounded-lg shadow-lg transition-all ${
                report.status === '已批示' 
                  ? 'bg-green-500/20 text-green-400 cursor-not-allowed shadow-none' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/20 hover:shadow-amber-500/40'
              }`}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {report.status === '已批示' ? '已批示' : '批示'}
            </Button>
          </div>

          {report.blocker && (
            <div className="flex items-start gap-2 py-2 border-t border-slate-700/30">
              <span className="text-slate-500 text-sm whitespace-nowrap">协作需求</span>
              <span className="text-red-500 font-bold text-sm">{report.blocker}</span>
            </div>
          )}

          {helpers.length > 0 && (
            <div className="flex items-start gap-2 py-2 border-t border-slate-700/30">
              <span className="text-slate-500 text-sm whitespace-nowrap">获得协助</span>
              <span className="text-slate-300 text-sm">
                {helpers.map((h, i) => {
                  const helperUser = users.find(u => u.id === h)
                  return (
                    <span key={h} className="inline-flex items-center px-2 py-0.5 rounded bg-slate-700/50 text-xs text-slate-300 mr-1">
                      {helperUser ? helperUser.nickname || helperUser.username : `协助人员 ${i + 1}`}
                    </span>
                  )
                })}
              </span>
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
      ) : Object.keys(groupedByUser).length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">暂无日报数据</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedByUser).map(([userName, reports]) => {
          const groupedByDate = reports.reduce((acc, report) => {
            const date = formatDate(report.reportDate || report.createdAt)
            if (!acc[date]) acc[date] = []
            acc[date].push(report)
            return acc
          }, {} as Record<string, Report[]>)

          const isUserExpanded = expandedUsers[userName] !== false

          return (
            <Card key={userName} className="bg-slate-900/50 border-slate-800 overflow-hidden">
              <CardContent className="p-0">
                <div 
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-800/50 to-transparent cursor-pointer"
                  onClick={() => setExpandedUsers(prev => ({ ...prev, [userName]: !prev[userName] }))}
                >
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
                      <span className="text-sm text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {Object.keys(groupedByDate).length} 天
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white">
                    {isUserExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </Button>
                </div>
                
                {isUserExpanded && (
                  <div className="border-t border-slate-700/50">
                    {Object.entries(groupedByDate).map(([date, dateReports]) => {
                      const dateKey = `${userName}-${date}`
                      const isDateExpanded = expandedDates[dateKey] !== false

                      return (
                        <div key={date} className="border-b border-slate-700/30 last:border-b-0">
                          <div 
                            className="flex items-center justify-between px-4 py-2 bg-slate-800/20 cursor-pointer hover:bg-slate-800/40 transition-colors"
                            onClick={() => setExpandedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }))}
                          >
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-500" />
                              <span className="text-sm font-medium text-slate-300">{date}</span>
                              <span className="text-xs text-slate-500">({dateReports.length}条)</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-white">
                              {isDateExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </div>
                          
                          {isDateExpanded && (
                            <div className="divide-y divide-slate-700/30">
                              {dateReports.map((report) => {
                                const task = report.task
                                const roleBadge = getRoleBadge(report)
                                const hasBlocker = !!report.blocker
                                const hasImage = hasAttachmentType(report, 'image')
                                const hasVideo = hasAttachmentType(report, 'video')
                                const hasDoc = hasAttachmentType(report, 'document')
                                const hasLink = hasAttachmentType(report, 'link')
                                const progress = task ? calcTaskProgress(task, workDaysPerMonth) : 0
                                
                                return (
                                  <div 
                                    key={report.id} 
                                    className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/20 transition-colors cursor-pointer"
                                    onClick={() => openReportDetail(report)}
                                  >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <Badge variant="outline" className={`w-auto ${
                                        report.status === '待评审' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                                        report.status === '已查看' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                                        report.status === '已批示' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                                        'bg-slate-500/10 text-slate-400 border-slate-500/30'
                                      }`}>
                                        {report.status === '待评审' ? '待查看' : report.status}
                                      </Badge>
                                      {roleBadge}
                                      <span className="font-medium text-white truncate">{task?.name || '无关联任务'}</span>
                                      <div className="flex items-center gap-1">
                                        {hasImage && <Image className="w-4 h-4 text-green-400" />}
                                        {hasVideo && <Video className="w-4 h-4 text-purple-400" />}
                                        {hasDoc && <FileTextIcon className="w-4 h-4 text-orange-400" />}
                                        {hasLink && <Link className="w-4 h-4 text-blue-400" />}
                                      </div>
                                      {hasBlocker && (
                                        <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-medium">
                                          需要协助
                                        </span>
                                      )}
                                      <div className="flex items-center gap-2 ml-auto">
                                        <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full ${progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`} style={{ width: `${progress}%` }} />
                                        </div>
                                        <span className="text-xs text-slate-500 w-8">{progress}%</span>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs text-slate-400">更新量 <span className="text-green-400 font-semibold">+{report.completedQuantity}</span></span>
                                      
                                      <Popconfirm title="确定删除此日报？" onConfirm={() => handleDelete(report.id)}>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="text-slate-500 hover:text-red-400 hover:bg-red-500/10"
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
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })
      )}

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-700 max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex items-center">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-bold text-white">日报</DialogTitle>
              <span className="text-sm text-slate-400">{selectedReport ? formatDate(selectedReport.reportDate || selectedReport.createdAt) : ''}</span>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4 pr-2">
            {selectedReport && renderDetailContent(selectedReport)}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent className="sm:max-w-[480px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">批示</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="text-sm text-slate-400">快速选择：</div>
            <div className="flex flex-wrap gap-2">
              {['很棒', '加油', '请保持', '请抓紧时间！', '请提高质量！'].map((text) => (
                <Button
                  key={text}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetComment(text)}
                  className={`border-slate-600 text-slate-300 hover:bg-slate-800 ${selectedPresets.includes(text) ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : ''}`}
                >
                  {selectedPresets.includes(text) && <span className="mr-1">✓</span>}
                  {text}
                </Button>
              ))}
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-slate-400">批示意见：</div>
              <div
                ref={commentEditorRef}
                contentEditable
                onInput={handleEditorInput}
                onPaste={handleEditorPaste}
                className="min-h-[120px] bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 resize-none rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                data-placeholder="请输入批示意见，可直接粘贴图片..."
                suppressContentEditableWarning
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCommentDialog(false)} className="text-slate-400 hover:text-white">
              取消
            </Button>
            <Button 
              onClick={submitComment}
              disabled={!commentText.trim() && commentImages.length === 0}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white disabled:opacity-50"
            >
              提交批示
            </Button>
          </DialogFooter>
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

      {docDownloadMsg && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
          <div className="bg-slate-800/95 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-xl border border-slate-700">
            {docDownloadMsg}
          </div>
        </div>
      )}
    </div>
  )
}
