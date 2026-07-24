import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { CalendarDays, Send, Plus, ChevronDown, ChevronUp, Folder, Image, Video, FileText, Camera, Link, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useTaskStore } from '@/store/taskStore'
import { getTasks, createTask, updateTask } from '@/api/task'
import { getUsers } from '@/api/user'
import type { Task } from '@/types'
import { getTaskProgress as calcTaskProgress, getTaskTotalTarget } from '@/lib/utils'
import { useSettingStore } from '@/store/settingStore'

export default function TodayReport() {
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [reportData, setReportData] = useState<Record<number, { completedQuantity: number; usedHours: number }>>({})
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [updatedTaskIds, setUpdatedTaskIds] = useState<number[]>([])
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [submittedData, setSubmittedData] = useState<Record<number, {
    todayCompleted: number
    todayHours: number
    blocker: string
    helpers: number[]
    attachments: { id: string; type: string; name: string; url?: string }[]
    resultDesc: string
  }>>({})
  
  const { settings } = useSettingStore()
  const workDaysPerMonth = parseInt(settings.workDaysPerMonth) || 22
  
  const [progressForm, setProgressForm] = useState({
    todayCompleted: 0,
    todayHours: 0,
    blocker: '',
    helpers: [] as number[],
    resultDesc: '',
  })
  
  const [attachments, setAttachments] = useState<{ id: string; type: string; name: string; url?: string }[]>([])
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [previewContent, setPreviewContent] = useState<{ url: string; name: string; type: string } | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{ file: string; progress: number; status: string } | null>(null)
  const [docDownloadMsg, setDocDownloadMsg] = useState<string | null>(null)
  const [showScreenshotDialog, setShowScreenshotDialog] = useState(false)
  const [screenshotImage, setScreenshotImage] = useState<string | null>(null)
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(hover: none)').matches || window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [imageInputRef] = useState(() => {
    const ref = document.createElement('input')
    ref.type = 'file'
    ref.accept = 'image/*'
    ref.multiple = true
    return ref
  })
  const [videoInputRef] = useState(() => {
    const ref = document.createElement('input')
    ref.type = 'file'
    ref.accept = 'video/*'
    ref.multiple = true
    return ref
  })
  const [docInputRef] = useState(() => {
    const ref = document.createElement('input')
    ref.type = 'file'
    ref.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md'
    ref.multiple = true
    return ref
  })
  
  const { token, user } = useAuthStore()
  const { tasks, setTasks, addTask } = useTaskStore()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'P2',
    status: '进行中',
    userId: '',
    targetQuantity: 100,
    unit: '个',
    completedQuantity: 0,
    hoursPerUnit: 1,
    startTime: '',
    endTime: '',
    members: [] as number[],
    frequency: '每日' as '每日' | '每周' | '每月',
    dailyDescription: '',
  })

  useEffect(() => {
    fetchTasks()
    fetchUsers()
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const allTasks = await getTasks(token!, { isArchived: false })
      const currentUserTasks = allTasks.filter((t: any) => 
        t.userId === user?.id || (t.members && t.members.some((m: any) => m.userId === user?.id))
      )
      setTasks(currentUserTasks)
      const initialData: Record<number, { completedQuantity: number; usedHours: number }> = {}
      currentUserTasks.forEach((t: Task) => {
        initialData[t.id] = { completedQuantity: t.completedQuantity || 0, usedHours: 0 }
      })
      setReportData(initialData)
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const usersData = await getUsers(token!)
      setUsers(usersData)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleCreateTask = async () => {
    if (!formData.name || !formData.userId) {
      alert('请填写任务名称和负责人')
      return
    }
    
    try {
      const newTask = await createTask(token!, {
        name: formData.name,
        description: formData.description,
        type: '临时任务',
        priority: formData.priority,
        status: formData.status,
        userId: parseInt(formData.userId),
        targetQuantity: formData.targetQuantity,
        unit: formData.unit,
        completedQuantity: formData.completedQuantity,
        hoursPerUnit: formData.hoursPerUnit,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        members: formData.members,
        frequency: formData.frequency,
        dailyDescription: formData.dailyDescription,
      })
      
      addTask(newTask)
      setShowCreateDialog(false)
      setFormData({
        name: '',
        description: '',
        priority: 'P2',
        status: '进行中',
        userId: '',
        targetQuantity: 100,
        unit: '个',
        completedQuantity: 0,
        hoursPerUnit: 1,
        startTime: '',
        endTime: '',
        members: [],
        frequency: '每日',
        dailyDescription: '',
      })
      
      fetchTasks()
    } catch (error) {
      console.error('Failed to create task:', error)
      alert('创建任务失败')
    }
  }

  const handleSubmit = () => {
    if (updatedTaskIds.length === 0) {
      alert('暂无已更新的任务，请先更新任务进度')
      return
    }
    setShowSubmitDialog(true)
  }

  const confirmSubmitReport = () => {
    setShowSubmitDialog(false)
    setUpdatedTaskIds([])
    setSubmittedData({})
    setShowSuccessDialog(true)
    setTimeout(() => setShowSuccessDialog(false), 2000)
  }

  const openProgressDialog = (task: Task) => {
    setEditingTask(task)
    setProgressForm({
      todayCompleted: 0,
      todayHours: 0,
      blocker: '',
      helpers: [],
      resultDesc: '',
    })
    setAttachments([])
    setShowLinkInput(false)
    setLinkUrl('')
    setUploadProgress(null)
    setDocDownloadMsg(null)
    setShowProgressDialog(true)
  }

  const handleUpdateProgress = async () => {
    if (!editingTask) return
    
    try {
      const newCompleted = (editingTask.completedQuantity || 0) + progressForm.todayCompleted
      const updatedTask = await updateTask(token!, editingTask.id, {
        completedQuantity: newCompleted,
      })
      
      setUpdatedTaskIds(prev => prev.includes(editingTask.id) ? prev : [...prev, editingTask.id])
      setSubmittedData(prev => ({
        ...prev,
        [editingTask.id]: {
          todayCompleted: progressForm.todayCompleted,
          todayHours: progressForm.todayHours,
          blocker: progressForm.blocker,
          helpers: progressForm.helpers,
          attachments: [...attachments],
          resultDesc: progressForm.resultDesc,
        }
      }))
      setShowProgressDialog(false)
      setEditingTask(null)
      fetchTasks()
    } catch (error) {
      console.error('Failed to update progress:', error)
      alert('更新进度失败')
    }
  }

  const convertToWebP = (file: File, quality = 0.8): Promise<{ url: string; name: string; size: number }> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img')
      const reader = new FileReader()
      
      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Canvas not supported'))
            return
          }
          ctx.drawImage(img, 0, 0)
          
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              const originalName = file.name.replace(/\.[^/.]+$/, '')
              resolve({
                url,
                name: `${originalName}.webp`,
                size: blob.size,
              })
            } else {
              reject(new Error('Failed to convert image'))
            }
          }, 'image/webp', quality)
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const transcodeVideoToMP4 = (file: File, onProgress?: (progress: number, status: string) => void): Promise<{ url: string; name: string; size: number }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.src = URL.createObjectURL(file)
      video.crossOrigin = 'anonymous'
      video.preload = 'auto'
      
      video.onloadedmetadata = () => {
        const originalWidth = video.videoWidth
        const originalHeight = video.videoHeight
        const aspectRatio = originalWidth / originalHeight
        const duration = video.duration || 10
        
        let targetWidth = 1280
        let targetHeight = 720
        
        if (aspectRatio > 1) {
          targetWidth = 1280
          targetHeight = Math.round(1280 / aspectRatio)
          if (targetHeight > 720) {
            targetHeight = 720
            targetWidth = Math.round(720 * aspectRatio)
          }
        } else {
          targetHeight = 720
          targetWidth = Math.round(720 * aspectRatio)
          if (targetWidth > 1280) {
            targetWidth = 1280
            targetHeight = Math.round(1280 / aspectRatio)
          }
        }
        
        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas not supported'))
          return
        }
        
        const stream = canvas.captureStream(30)
        
        const mimeTypes = [
          'video/mp4;codecs=h264,aac',
          'video/mp4',
          'video/webm;codecs=vp9,opus',
          'video/webm',
        ]
        let mimeType = ''
        for (const type of mimeTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            mimeType = type
            break
          }
        }
        
        if (!mimeType) {
          reject(new Error('Browser does not support video recording'))
          return
        }
        
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: mimeType,
          videoBitsPerSecond: 3000000,
          audioBitsPerSecond: 192000,
        })
        
        const chunks: Blob[] = []
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data)
          }
        }
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/mp4' })
          const url = URL.createObjectURL(blob)
          const originalName = file.name.replace(/\.[^/.]+$/, '')
          onProgress?.(100, '转码完成')
          resolve({
            url,
            name: `${originalName}_720p.mp4`,
            size: blob.size,
          })
        }
        
        video.onplay = () => {
          mediaRecorder.start(100)
          onProgress?.(0, '开始转码...')
          
          let lastProgress = -1
          const renderFrame = () => {
            if (!video.paused && !video.ended) {
              ctx.drawImage(video, 0, 0, targetWidth, targetHeight)
              const progress = Math.min(99, Math.round((video.currentTime / duration) * 100))
              if (progress !== lastProgress) {
                lastProgress = progress
                if (progress === 0) {
                  onProgress?.(progress, '转码中...')
                } else if (progress < 30) {
                  onProgress?.(progress, '正在加载视频帧...')
                } else if (progress < 60) {
                  onProgress?.(progress, '正在处理画面...')
                } else if (progress < 90) {
                  onProgress?.(progress, '即将完成...')
                } else {
                  onProgress?.(progress, '几乎完成...')
                }
              }
              requestAnimationFrame(renderFrame)
            }
          }
          renderFrame()
        }
        
        video.onended = () => {
          if (mediaRecorder.state !== 'inactive') {
            onProgress?.(99, '正在封装视频...')
            mediaRecorder.stop()
          }
        }
        
        video.onerror = () => {
          reject(new Error('Failed to load video'))
        }
        
        video.play().catch(reject)
      }
      
      video.onerror = () => {
        reject(new Error('Failed to load video file'))
      }
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = e.target.files
    if (!files) return
    
    if (type === 'image') {
      const newAttachments = await Promise.all(
        Array.from(files).map(async (file) => {
          try {
            const { url, name } = await convertToWebP(file, 0.8)
            return {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: type,
              name: name,
              url: url,
            }
          } catch (err) {
            console.error('Failed to convert image:', err)
            return {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: type,
              name: file.name,
              url: URL.createObjectURL(file),
            }
          }
        })
      )
      setAttachments(prev => [...prev, ...newAttachments])
    } else if (type === 'video') {
      const fileArray = Array.from(files)
      const newAttachments: { id: string; type: string; name: string; url?: string }[] = []
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i]
        setUploadProgress({ file: `${file.name} (${i + 1}/${fileArray.length})`, progress: 0, status: '准备中...' })
        
        try {
          const { url, name } = await transcodeVideoToMP4(file, (progress, status) => {
            setUploadProgress({ file: `${file.name} (${i + 1}/${fileArray.length})`, progress, status })
          })
          newAttachments.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            name: name,
            url: url,
          })
        } catch (err) {
          console.error('Failed to transcode video:', err)
          newAttachments.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            name: file.name,
            url: URL.createObjectURL(file),
          })
        }
      }
      
      setAttachments(prev => [...prev, ...newAttachments])
      setUploadProgress(null)
    } else {
      const newAttachments = Array.from(files).map(file => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: type,
        name: file.name,
        url: URL.createObjectURL(file),
      }))
      setAttachments(prev => [...prev, ...newAttachments])
    }
    
    e.target.value = ''
  }

  const handleScreenshot = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const video = document.createElement('video')
      video.srcObject = stream
      await video.play()
      
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const dataUrl = canvas.toDataURL('image/png')
        setScreenshotImage(dataUrl)
        setSelectionRect(null)
        setShowScreenshotDialog(true)
      }
      
      stream.getTracks().forEach(track => track.stop())
    } catch (err) {
      console.error('Screenshot failed:', err)
      alert('截图功能需要屏幕录制权限')
    }
  }

  const handleScreenshotMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!screenshotImage) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setDrawStart({ x, y })
    setIsDrawing(true)
    setSelectionRect({ x, y, w: 0, h: 0 })
  }

  const handleScreenshotMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height))
    setSelectionRect({
      x: Math.min(drawStart.x, x),
      y: Math.min(drawStart.y, y),
      w: Math.abs(x - drawStart.x),
      h: Math.abs(y - drawStart.y),
    })
  }

  const handleScreenshotMouseUp = () => {
    setIsDrawing(false)
    setDrawStart(null)
  }

  const applyScreenshotSelection = () => {
    if (!screenshotImage || !selectionRect) return
    
    const img = document.createElement('img')
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = img.width
      tempCanvas.height = img.height
      
      const scaleX = img.width / (img.clientWidth || img.width)
      const scaleY = img.height / (img.clientHeight || img.height)
      
      const w = Math.round(selectionRect.w * scaleX)
      const h = Math.round(selectionRect.h * scaleY)
      const x = Math.round(selectionRect.x * scaleX)
      const y = Math.round(selectionRect.y * scaleY)
      
      if (w <= 0 || h <= 0) {
        alert('选区太小，请重新框选')
        return
      }
      
      const cropCanvas = document.createElement('canvas')
      cropCanvas.width = w
      cropCanvas.height = h
      const ctx = cropCanvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, x, y, w, h, 0, 0, w, h)
        cropCanvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            setAttachments(prev => [...prev, {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'screenshot',
              name: `截图_${new Date().toLocaleString('zh-CN')}.webp`,
              url: url,
            }])
          }
          setShowScreenshotDialog(false)
          setScreenshotImage(null)
          setSelectionRect(null)
        }, 'image/webp', 0.8)
      } else {
        setShowScreenshotDialog(false)
        setScreenshotImage(null)
        setSelectionRect(null)
      }
    }
    img.onerror = () => {
      alert('图片加载失败，请重试')
      setShowScreenshotDialog(false)
      setScreenshotImage(null)
      setSelectionRect(null)
    }
    img.src = screenshotImage
  }

  const applyFullScreenshot = () => {
    if (!screenshotImage) return
    const img = document.createElement('img')
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            setAttachments(prev => [...prev, {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'screenshot',
              name: `截图_${new Date().toLocaleString('zh-CN')}.webp`,
              url: url,
            }])
          }
          setShowScreenshotDialog(false)
          setScreenshotImage(null)
          setSelectionRect(null)
        }, 'image/webp', 0.8)
      } else {
        setShowScreenshotDialog(false)
        setScreenshotImage(null)
        setSelectionRect(null)
      }
    }
    img.onerror = () => {
      alert('图片加载失败，请重试')
      setShowScreenshotDialog(false)
      setScreenshotImage(null)
      setSelectionRect(null)
    }
    img.src = screenshotImage
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
    } else {
      fetch(url)
        .then(response => response.blob())
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
        .catch(err => {
          console.error('Download failed:', err)
          setDocDownloadMsg('下载失败')
          setTimeout(() => setDocDownloadMsg(null), 2000)
        })
    }
  }

  const handleAddLink = () => {
    if (!linkUrl.trim()) return
    
    setAttachments(prev => [...prev, {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'link',
      name: linkUrl,
      url: linkUrl,
    }])
    setLinkUrl('')
    setShowLinkInput(false)
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === id)
      if (attachment?.url && attachment.type !== 'link') {
        URL.revokeObjectURL(attachment.url)
      }
      return prev.filter(a => a.id !== id)
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />
      case 'video': return <Video className="w-4 h-4" />
      case 'document': return <FileText className="w-4 h-4" />
      case 'screenshot': return <Camera className="w-4 h-4" />
      case 'link': return <Link className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'image': return 'text-blue-400 bg-blue-500/10'
      case 'video': return 'text-purple-400 bg-purple-500/10'
      case 'document': return 'text-orange-400 bg-orange-500/10'
      case 'screenshot': return 'text-green-400 bg-green-500/10'
      case 'link': return 'text-cyan-400 bg-cyan-500/10'
      default: return 'text-slate-400 bg-slate-500/10'
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

  const groupByProjectAndType = (taskList: Task[]) => {
    return taskList.reduce((acc, task) => {
      let groupKey: string
      let groupType: string
      
      if (task.type === '日常任务') {
        groupKey = '日常任务'
        groupType = 'daily'
      } else if (task.type === '临时任务') {
        groupKey = '临时任务'
        groupType = 'temp'
      } else {
        groupKey = task.project?.name || '未分配项目'
        groupType = 'project'
      }
      
      if (!acc[groupKey]) acc[groupKey] = { tasks: [], type: groupType }
      acc[groupKey].tasks.push(task)
      return acc
    }, {} as Record<string, { tasks: Task[], type: string }>)
  }

  const currentUserName = user?.nickname || '未知用户'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">今日日报</h1>
          <p className="text-slate-400 mt-1">
            <CalendarDays className="w-4 h-4 inline mr-1" />
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
        <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-500 text-white">
          <Send className="w-4 h-4 mr-2" />
          提交日报
        </Button>
      </div>

      <Button 
        variant="outline" 
        className="bg-slate-900/50 text-slate-400 border-slate-700 hover:text-white"
        onClick={() => setShowCreateDialog(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        新建临时任务
      </Button>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : Object.keys(groupByProjectAndType(tasks)).length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <p className="text-slate-400">暂无任务数据</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
          <CardContent className="p-0">
            <div className="border-b border-slate-700/50">
              {Object.entries(groupByProjectAndType(tasks)).map(([groupName, groupData]) => {
                const groupKey = groupName
                const isExpanded = expandedGroups[groupKey] || false
                const groupType = groupData.type
                
                const getGroupStyle = () => {
                  switch (groupType) {
                    case 'daily':
                      return 'bg-green-500/5'
                    case 'temp':
                      return 'bg-orange-500/5'
                    default:
                      return 'bg-slate-800/30'
                  }
                }
                
                const getGroupIconColor = () => {
                  switch (groupType) {
                    case 'daily':
                      return 'text-green-400'
                    case 'temp':
                      return 'text-orange-400'
                    default:
                      return 'text-slate-500'
                  }
                }
                
                const getGroupTextColor = () => {
                  switch (groupType) {
                    case 'daily':
                      return 'text-green-400'
                    case 'temp':
                      return 'text-orange-400'
                    default:
                      return 'text-slate-400'
                  }
                }
                
                return (
                  <div key={groupName} className="border-t border-slate-700/50">
                    <div 
                      className={`flex items-center justify-between px-4 py-2 ${getGroupStyle()} cursor-pointer`}
                      onClick={() => setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))}
                    >
                      <div className="flex items-center gap-2">
                        <Folder className={`w-4 h-4 ${getGroupIconColor()}`} />
                        <span className={`text-sm font-medium ${getGroupTextColor()}`}>{groupName}</span>
                        <span className="text-xs text-slate-500">({groupData.tasks.length})</span>
                      </div>
                      <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                    
                    {isExpanded && (
                      <div className="divide-y divide-slate-700/30">
                        {groupData.tasks.map((task) => {
                          const progress = calcTaskProgress(task, workDaysPerMonth)
                          
                          return (
                            <div key={task.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/20 transition-colors">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Badge variant="outline" className={`${getStatusBadge(task.status)} w-auto`}>
                                  {task.status}
                                </Badge>
                                <span className="font-medium text-white truncate">{task.name}</span>
                                {(task.user?.nickname === currentUserName) && (
                                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 w-auto text-xs">
                                    负责人
                                  </Badge>
                                )}
                                {(task.members?.some(m => m.user?.nickname === currentUserName) || false) && (task.user?.nickname !== currentUserName) && (
                                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 w-auto text-xs">
                                    组员
                                  </Badge>
                                )}
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
                                
                                <span className="text-xs text-slate-500 min-w-[60px]">{task.completedQuantity}/{getTaskTotalTarget(task, workDaysPerMonth)}</span>
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className={updatedTaskIds.includes(task.id) 
                                    ? 'bg-green-500/10 text-green-400 cursor-default' 
                                    : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                                  }
                                  onClick={(e) => { 
                                    e.stopPropagation()
                                    if (!updatedTaskIds.includes(task.id)) {
                                      openProgressDialog(task)
                                    }
                                  }}
                                >
                                  {updatedTaskIds.includes(task.id) ? '已更新' : '更新进度'}
                                </Button>
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
          </CardContent>
        </Card>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">新建临时任务</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">任务名称</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入任务名称"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">任务描述</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入任务描述（可选）"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">优先级</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="P1">P1 - 紧急</option>
                  <option value="P2">P2 - 重要</option>
                  <option value="P3">P3 - 一般</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="进行中">进行中</option>
                  <option value="已完成">已完成</option>
                  <option value="待修改">待修改</option>
                  <option value="已延期">已延期</option>
                  <option value="待评审">待评审</option>
                  <option value="已评审">已评审</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">负责人</label>
              <select
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">请选择负责人</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.nickname}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">开始时间</label>
                <Input
                  type="date"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white h-10 px-3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">结束时间</label>
                <Input
                  type="date"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white h-10 px-3"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">参与成员</label>
              <div className="flex flex-wrap gap-2">
                {users.filter(u => u.id.toString() !== formData.userId).map((user) => (
                  <Button
                    key={user.id}
                    variant={formData.members.includes(user.id) ? 'secondary' : 'outline'}
                    size="sm"
                    className={`${formData.members.includes(user.id) 
                      ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' 
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                    onClick={() => {
                      if (formData.members.includes(user.id)) {
                        setFormData({ ...formData, members: formData.members.filter(id => id !== user.id) })
                      } else {
                        setFormData({ ...formData, members: [...formData.members, user.id] })
                      }
                    }}
                  >
                    {user.nickname}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-400">量化</label>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-slate-400">每</span>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as '每日' | '每周' | '每月' })}
                  className="h-9 px-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                >
                  <option value="每日">日</option>
                  <option value="每周">周</option>
                  <option value="每月">月</option>
                </select>
                <span className="text-sm text-slate-400">完成</span>
                <Input
                  value={formData.dailyDescription}
                  onChange={(e) => setFormData({ ...formData, dailyDescription: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white flex-1 min-w-[150px]"
                  placeholder="文字描述"
                />
                <Input
                  type="number"
                  value={formData.targetQuantity}
                  onChange={(e) => setFormData({ ...formData, targetQuantity: parseInt(e.target.value) || 0 })}
                  className="bg-slate-800 border-slate-700 text-white w-20 text-center"
                />
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white w-16 text-center"
                  placeholder="单位"
                />
                <span className="text-sm text-slate-400">，预计</span>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.hoursPerUnit}
                  onChange={(e) => setFormData({ ...formData, hoursPerUnit: parseFloat(e.target.value) || 1 })}
                  className="bg-slate-800 border-slate-700 text-white w-16 text-center"
                />
                <span className="text-sm text-slate-400">工时/单位</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700">
              取消
            </Button>
            <Button onClick={handleCreateTask} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              {editingTask?.name}
              <span className="text-sm font-normal text-slate-400 ml-2">
                进度：{editingTask?.completedQuantity || 0}/{editingTask ? getTaskTotalTarget(editingTask, workDaysPerMonth) : 0} {editingTask?.unit}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400 whitespace-nowrap">今日完成：</span>
              <Input
                type="number"
                value={progressForm.todayCompleted}
                onChange={(e) => setProgressForm({ ...progressForm, todayCompleted: parseInt(e.target.value) || 0 })}
                className="bg-slate-800 border-slate-700 text-white w-24 text-center"
              />
              <span className="text-sm text-slate-400">{editingTask?.unit}</span>
              <span className="text-slate-600 mx-2">|</span>
              <span className="text-sm text-slate-400 whitespace-nowrap">用时：</span>
              <Input
                type="number"
                step="0.5"
                value={progressForm.todayHours}
                onChange={(e) => setProgressForm({ ...progressForm, todayHours: parseFloat(e.target.value) || 0 })}
                className="bg-slate-800 border-slate-700 text-white w-24 text-center"
              />
              <span className="text-sm text-slate-400">小时</span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">阻塞/协作需求</label>
              <textarea
                value={progressForm.blocker}
                onChange={(e) => setProgressForm({ ...progressForm, blocker: e.target.value })}
                placeholder="请描述遇到的阻塞或需要的协作"
                className="w-full h-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">获得某人协助</label>
              <div className="flex flex-wrap gap-2">
                {users
                  .filter(u => 
                    u.id !== editingTask?.userId && 
                    !(editingTask?.members?.some(m => m.userId === u.id))
                  )
                  .map((u) => (
                    <Button
                      key={u.id}
                      variant={progressForm.helpers.includes(u.id) ? 'secondary' : 'outline'}
                      size="sm"
                      className={`h-7 px-3 text-xs ${progressForm.helpers.includes(u.id) 
                        ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                      onClick={() => {
                        if (progressForm.helpers.includes(u.id)) {
                          setProgressForm({ ...progressForm, helpers: progressForm.helpers.filter(id => id !== u.id) })
                        } else {
                          setProgressForm({ ...progressForm, helpers: [...progressForm.helpers, u.id] })
                        }
                      }}
                    >
                      {u.nickname}
                    </Button>
                  ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">成果上传</label>
              <div className="flex flex-wrap gap-2">
                {isMobile ? (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'image')}
                      id="mobile-image-upload"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-3 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      onClick={() => document.getElementById('mobile-image-upload')?.click()}
                    >
                      <Image className="w-4 h-4 mr-1" /> 图片
                    </Button>
                    
                    <input
                      type="file"
                      accept="video/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'video')}
                      id="mobile-video-upload"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-3 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      onClick={() => document.getElementById('mobile-video-upload')?.click()}
                    >
                      <Video className="w-4 h-4 mr-1" /> 视频
                    </Button>
                  </>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'image')}
                      id="image-upload"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-3 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      <Image className="w-4 h-4 mr-1" /> 图片
                    </Button>
                    
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'video')}
                      id="video-upload"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-3 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      onClick={() => document.getElementById('video-upload')?.click()}
                    >
                      <Video className="w-4 h-4 mr-1" /> 视频
                    </Button>
                  </>
                )}
                
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'document')}
                  id="doc-upload"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-3 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  onClick={() => document.getElementById('doc-upload')?.click()}
                >
                  <FileText className="w-4 h-4 mr-1" /> 文档
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-3 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  onClick={handleScreenshot}
                >
                  <Camera className="w-4 h-4 mr-1" /> 截图
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-3 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  onClick={() => setShowLinkInput(true)}
                >
                  + 链接
                </Button>
              </div>
              
              {showLinkInput && (
                <div className="flex gap-2 mt-2">
                  <Input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="请输入链接地址"
                    className="flex-1 bg-slate-800 border-slate-700 text-white h-8"
                  />
                  <Button 
                    size="sm"
                    className="h-8 px-3 bg-cyan-600 hover:bg-cyan-500 text-white"
                    onClick={handleAddLink}
                  >
                    添加
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                    onClick={() => { setShowLinkInput(false); setLinkUrl('') }}
                  >
                    取消
                  </Button>
                </div>
              )}
              
              {uploadProgress && (
                <div className="mt-3 p-3 bg-slate-800/80 rounded-lg border border-blue-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-300 truncate mr-2">
                      正在处理: {uploadProgress.file}
                    </span>
                    <span className="text-xs text-blue-400 whitespace-nowrap">{uploadProgress.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${uploadProgress.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{uploadProgress.status}</p>
                </div>
              )}
              
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((att) => (
                    <div 
                      key={att.id}
                      className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`p-1.5 rounded ${getTypeColor(att.type)}`}>
                          {getTypeIcon(att.type)}
                        </span>
                        {att.type === 'image' || att.type === 'screenshot' ? (
                          <img 
                            src={att.url} 
                            alt={att.name}
                            className="w-8 h-8 rounded object-cover cursor-pointer"
                            onClick={() => att.url && setPreviewContent({ url: att.url, name: att.name, type: att.type })}
                          />
                        ) : att.type === 'video' ? (
                          <Video className="w-5 h-5 text-purple-400 cursor-pointer flex-shrink-0" onClick={() => att.url && setPreviewContent({ url: att.url, name: att.name, type: att.type })} />
                        ) : att.type === 'document' ? (
                          <FileText className="w-5 h-5 text-orange-400 cursor-pointer flex-shrink-0" onClick={() => { if (att.url) handleDocumentDownload(att.url, att.name) }} />
                        ) : null}
                        <span 
                          className={`text-xs text-slate-300 truncate cursor-pointer hover:text-white ${(att.type === 'video' || att.type === 'image' || att.type === 'screenshot' || att.type === 'document') ? 'text-blue-400 hover:text-blue-300 underline' : ''}`}
                          onClick={() => {
                            if (att.url) {
                              if (att.type === 'link') {
                                window.open(att.url, '_blank')
                              } else if (att.type === 'document') {
                                handleDocumentDownload(att.url, att.name)
                              } else {
                                setPreviewContent({ url: att.url, name: att.name, type: att.type })
                              }
                            }
                          }}
                          title={att.name}
                        >
                          {att.type === 'link' ? att.name.replace(/^https?:\/\//, '') : att.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-500 hover:text-red-400"
                        onClick={() => removeAttachment(att.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">其他成果说明</label>
              <textarea
                value={progressForm.resultDesc}
                onChange={(e) => setProgressForm({ ...progressForm, resultDesc: e.target.value })}
                placeholder="请补充说明其他成果"
                className="w-full h-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowProgressDialog(false)} 
              className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            >
              取消
            </Button>
            <Button 
              onClick={handleUpdateProgress} 
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showScreenshotDialog} onOpenChange={(open) => !open && setShowScreenshotDialog(false)}>
        <DialogContent className="sm:max-w-[90vw] sm:max-h-[90vh] bg-slate-900 border-slate-700 p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="text-white text-sm">框选截图区域</DialogTitle>
            <p className="text-xs text-slate-400 mt-1">在图片上拖拽鼠标框选要截取的区域</p>
          </DialogHeader>
          <div className="p-4 pt-0">
            {screenshotImage && (
              <div 
                className="relative inline-block max-h-[60vh] overflow-hidden cursor-crosshair select-none"
                onMouseDown={handleScreenshotMouseDown}
                onMouseMove={handleScreenshotMouseMove}
                onMouseUp={handleScreenshotMouseUp}
                onMouseLeave={handleScreenshotMouseUp}
              >
                <img 
                  src={screenshotImage} 
                  alt="Screenshot"
                  className="max-w-full max-h-[60vh] block"
                  draggable={false}
                />
                {selectionRect && (
                  <div 
                    className="absolute border-2 border-blue-500 bg-blue-500/20"
                    style={{
                      left: selectionRect.x,
                      top: selectionRect.y,
                      width: selectionRect.w,
                      height: selectionRect.h,
                    }}
                  />
                )}
                {isDrawing && (
                  <div className="absolute inset-0 bg-black/30 pointer-events-none" />
                )}
              </div>
            )}
          </div>
          <DialogFooter className="px-4 py-3">
            <Button 
              variant="outline" 
              onClick={() => { setShowScreenshotDialog(false); setScreenshotImage(null); setSelectionRect(null) }} 
              className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            >
              取消
            </Button>
            <Button 
              variant="outline"
              onClick={applyFullScreenshot}
              className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            >
              全图截取
            </Button>
            <Button 
              onClick={applyScreenshotSelection}
              disabled={!selectionRect || selectionRect.w < 5 || selectionRect.h < 5}
              className="bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
            >
              {selectionRect ? `截取选中区域 (${Math.round(selectionRect.w)}×${Math.round(selectionRect.h)})` : '框选后截取'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewContent} onOpenChange={(open) => !open && setPreviewContent(null)}>
        <DialogContent className="sm:max-w-[80vw] sm:max-h-[80vh] bg-slate-900 border-slate-700 p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="text-white text-sm truncate">{previewContent?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4 pt-0 max-h-[65vh] overflow-auto">
            {previewContent ? (
              previewContent.type === 'video' ? (
                <video 
                  src={previewContent.url} 
                  controls
                  className="max-w-full max-h-[60vh] rounded"
                />
              ) : (
                <img 
                  src={previewContent.url} 
                  alt={previewContent.name}
                  className="max-w-full max-h-[60vh] object-contain rounded"
                />
              )
            ) : null}
          </div>
          <DialogFooter className="px-4 py-3">
            <Button 
              variant="outline" 
              onClick={() => setPreviewContent(null)} 
              className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            >
              关闭
            </Button>
            {previewContent && (
              <Button 
                onClick={() => previewContent.url && window.open(previewContent.url, '_blank')}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                在新窗口打开
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {docDownloadMsg && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] animate-fade-in pointer-events-none">
          <div className="px-8 py-4 bg-slate-800/95 border border-slate-600 rounded-lg shadow-2xl flex items-center justify-center gap-3 min-w-[220px]">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span className="text-sm text-slate-200 text-center">{docDownloadMsg}</span>
          </div>
        </div>
      )}

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-700 max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex items-center">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-bold text-white">日报</DialogTitle>
              <span className="text-sm text-slate-400">{new Date().toLocaleDateString('zh-CN')}</span>
            </div>
          </DialogHeader>

          <div className="bg-slate-800/50 rounded-lg px-4 py-3 flex items-center gap-4 text-sm flex-shrink-0">
            <span className="text-slate-400">任务数 <span className="text-green-400 font-semibold">{updatedTaskIds.length}</span></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">总完成量 <span className="text-green-400 font-semibold">{updatedTaskIds.reduce((sum, id) => {
              const task = tasks.find(t => t.id === id)
              const data = submittedData[id]
              return sum + (data?.todayCompleted || 0)
            }, 0)}</span></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">总用时 <span className="text-green-400 font-semibold">{updatedTaskIds.reduce((sum, id) => {
              const data = submittedData[id]
              return sum + (data?.todayHours || 0)
            }, 0)}h</span></span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
            {updatedTaskIds.map((taskId) => {
              const task = tasks.find(t => t.id === taskId)
              const data = submittedData[taskId]
              if (!task || !data) return null

              const progress = calcTaskProgress(task, workDaysPerMonth)
              const totalTarget = getTaskTotalTarget(task, workDaysPerMonth)
              const completedAfter = (task.completedQuantity || 0)
              const progressPercent = totalTarget > 0 ? Math.round((completedAfter / totalTarget) * 100) : 0

              const imageCount = data.attachments.filter(a => a.type === 'image').length
              const videoCount = data.attachments.filter(a => a.type === 'video').length
              const docCount = data.attachments.filter(a => a.type === 'document').length
              const hasAttachments = imageCount > 0 || videoCount > 0 || docCount > 0
              
              return (
                <div key={taskId} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`w-2 h-2 rounded-full ${progress >= 80 ? 'bg-green-500' : progress >= 50 ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                    <span className="font-semibold text-white">{task.name}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm mb-4">
                    <span className="text-slate-400">今日完成 <span className="text-green-400 font-semibold">{data.todayCompleted}</span> {task.unit}，用时 <span className="text-green-400 font-semibold">{data.todayHours}h</span></span>
                    <span className="text-slate-400">进度</span>
                    <div className="flex-1 max-w-[120px] h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${progress >= 80 ? 'bg-green-500' : progress >= 50 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      />
                    </div>
                    <span className="text-slate-400"><span className="text-white font-semibold">{completedAfter}</span> / {totalTarget}</span>
                  </div>

                  {data.blocker && (
                    <div className="flex items-start gap-2 py-2 border-t border-slate-700/30">
                      <span className="text-slate-500 text-sm whitespace-nowrap">协作需求</span>
                      <span className="text-red-500 text-sm font-bold">{data.blocker || '无'}</span>
                    </div>
                  )}

                  {data.helpers.length > 0 && (
                    <div className="flex items-start gap-2 py-2 border-t border-slate-700/30">
                      <span className="text-slate-500 text-sm whitespace-nowrap">获得协助</span>
                      <div className="flex flex-wrap items-center">
                        {data.helpers.map((hId, idx) => {
                          const helper = users.find(u => u.id === hId)
                          if (!helper) return null
                          return (
                            <span key={hId} className="flex items-center">
                              {idx > 0 && <span className="text-slate-600 mx-1">、</span>}
                              <span className="text-slate-200 text-sm">{helper.nickname}</span>
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {hasAttachments && (
                    <div className="flex items-start gap-2 py-2 border-t border-slate-700/30">
                      <span className="text-slate-500 text-sm whitespace-nowrap">成果栏</span>
                      <div className="flex gap-2">
                        {imageCount > 0 && (
                          <div className="relative">
                            <div className="w-12 h-10 bg-slate-700/50 border border-slate-600 rounded flex items-center justify-center">
                              <Image className="w-4 h-4 text-slate-400" />
                            </div>
                            <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{imageCount}</span>
                            <span className="text-xs text-slate-500 block text-center mt-1">图片</span>
                          </div>
                        )}
                        {videoCount > 0 && (
                          <div className="relative">
                            <div className="w-12 h-10 bg-slate-700/50 border border-slate-600 rounded flex items-center justify-center">
                              <Video className="w-4 h-4 text-slate-400" />
                            </div>
                            <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{videoCount}</span>
                            <span className="text-xs text-slate-500 block text-center mt-1">视频</span>
                          </div>
                        )}
                        {docCount > 0 && (
                          <div className="relative">
                            <div className="w-12 h-10 bg-slate-700/50 border border-slate-600 rounded flex items-center justify-center">
                              <FileText className="w-4 h-4 text-slate-400" />
                            </div>
                            <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{docCount}</span>
                            <span className="text-xs text-slate-500 block text-center mt-1">文档</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {data.resultDesc && (
                    <div className="flex items-start gap-2 py-2 border-t border-slate-700/30">
                      <span className="text-slate-500 text-sm whitespace-nowrap">补充说明</span>
                      <span className="text-slate-200 text-sm">{data.resultDesc}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-700 flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={() => setShowSubmitDialog(false)}
              className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            >
              取消
            </Button>
            <Button 
              onClick={confirmSubmitReport} 
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              提交日报
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showSuccessDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl px-8 py-6 flex flex-col items-center gap-4 min-w-[200px]">
            <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-medium text-center">日报提交成功</p>
          </div>
        </div>
      )}
    </div>
  )
}