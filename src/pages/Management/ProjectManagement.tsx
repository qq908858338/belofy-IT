﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popconfirm } from '@/components/ui/popconfirm'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2, Rocket, Code, Target, Globe, Building2, Users, Star, BookOpen, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useProjectStore } from '@/store/projectStore'
import { getProjects, getProject, deleteProject, createProject, updateProject } from '@/api/project'
import { getUsers } from '@/api/user'
import { getTasks, createTask, updateTask, deleteTask } from '@/api/task'
import type { Project } from '@/types'
import { getTaskProgress as calcTaskProgress, getTaskTotalTarget } from '@/lib/utils'
import { useSettingStore } from '@/store/settingStore'

export default function ProjectManagement() {
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  
  const { token } = useAuthStore()
  const { projects, setProjects, deleteProject: removeProject, addProject } = useProjectStore()
  const { settings } = useSettingStore()
  const workDaysPerMonth = parseInt(settings.workDaysPerMonth) || 22

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Rocket',
    startTime: '',
    endTime: '',
    managerId: '',
    status: '',
  })

  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'tasks'>('basic')
  const [originalTaskIds, setOriginalTaskIds] = useState<number[]>([])
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [taskDialogMode, setTaskDialogMode] = useState<'add' | 'edit'>('add')
  const [taskDialogIndex, setTaskDialogIndex] = useState<number | null>(null)
  const [taskFormData, setTaskFormData] = useState<{
    id?: number
    name: string
    description: string
    type: string
    priority: string
    status: string
    userId: string
    targetQuantity: number
    unit: string
    completedQuantity: number
    hoursPerUnit: number
    startTime: string
    endTime: string
    members: number[]
    frequency?: string
    dailyDescription?: string
  }>({
    id: undefined,
    name: '',
    description: '',
    type: '项目任务',
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
    frequency: '每日',
    dailyDescription: '',
  })
  const [tasks, setTasks] = useState<{
    id?: number
    name: string
    description: string
    type: string
    priority: string
    status: string
    userId: string
    targetQuantity: number
    unit: string
    completedQuantity: number
    hoursPerUnit: number
    startTime: string
    endTime: string
    members: number[]
    frequency?: string
    dailyDescription?: string
  }[]>([])

  const iconOptions = [
    { value: 'Rocket', icon: Rocket },
    { value: 'Code', icon: Code },
    { value: 'Target', icon: Target },
    { value: 'Globe', icon: Globe },
    { value: 'Building2', icon: Building2 },
    { value: 'Users', icon: Users },
    { value: 'Star', icon: Star },
    { value: 'BookOpen', icon: BookOpen },
  ]

  const toggleMember = (userId: number) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    )
  }

  useEffect(() => {
    fetchProjects()
    fetchUsers()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const projectsData = await getProjects(token!, { isArchived: false })
      setProjects(projectsData)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
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

  const handleCreate = async () => {
    if (!formData.name || !formData.managerId) {
      alert('请填写项目名称和总负责人')
      return
    }

    try {
      const projectData = await createProject(token!, {
        ...formData,
        managerId: parseInt(formData.managerId),
        status: formData.status || '待立项',
        members: [...selectedMembers, parseInt(formData.managerId)],
      })

      if (tasks.length > 0) {
        for (const task of tasks) {
          if (task.name && task.userId) {
            await createTask(token!, {
              name: task.name,
              description: task.description,
              type: task.type,
              priority: task.priority,
              status: task.status,
              userId: parseInt(task.userId),
              targetQuantity: task.targetQuantity,
              unit: task.unit,
              completedQuantity: task.completedQuantity,
              hoursPerUnit: task.hoursPerUnit,
              startTime: task.startTime || undefined,
              endTime: task.endTime || undefined,
              projectId: projectData.id,
              members: task.members,
              frequency: task.frequency,
              dailyDescription: task.dailyDescription,
            })
          }
        }
      }

      addProject(projectData)
      setShowCreateDialog(false)
      setFormData({
        name: '',
        description: '',
        icon: 'Rocket',
        startTime: '',
        endTime: '',
        managerId: '',
        status: '',
      })
      setSelectedMembers([])
      setTasks([])
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const handleEdit = async (project: Project) => {
    setEditingProjectId(project.id)
    setFormData({
      name: project.name,
      description: project.description || '',
      icon: project.icon || 'Rocket',
      startTime: project.startTime || '',
      endTime: project.endTime || '',
      managerId: project.managerId?.toString() || '',
      status: project.status || '',
    })
    
    const memberIds = (project as any).members?.map((m: any) => m.userId).filter((id: number) => id !== project.managerId) || []
    setSelectedMembers(memberIds)

    try {
      const projectTasks = await getTasks(token!, { projectId: project.id })
      const mappedTasks = projectTasks.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description || '',
        type: t.type || '项目任务',
        priority: t.priority || 'P2',
        status: t.status || '进行中',
        userId: t.userId?.toString() || '',
        targetQuantity: t.targetQuantity || 100,
        unit: t.unit || '个',
        completedQuantity: t.completedQuantity || 0,
        hoursPerUnit: t.hoursPerUnit || 1,
        startTime: t.startTime ? new Date(t.startTime).toISOString().split('T')[0] : '',
        endTime: t.endTime ? new Date(t.endTime).toISOString().split('T')[0] : '',
        members: (t as any).members?.map((m: any) => m.userId) || [],
      }))
      setTasks(mappedTasks)
      setOriginalTaskIds(projectTasks.map(t => t.id))
    } catch (error) {
      console.error('Failed to fetch project tasks:', error)
      setTasks([])
      setOriginalTaskIds([])
    }

    setShowEditDialog(true)
    setActiveTab('basic')
  }

  const handleUpdate = async () => {
    if (!formData.name || !formData.managerId) {
      alert('请填写项目名称和总负责人')
      return
    }

    try {
      const projectData = await updateProject(token!, editingProjectId!, {
        ...formData,
        managerId: parseInt(formData.managerId),
        status: formData.status || '待立项',
        members: [...selectedMembers, parseInt(formData.managerId)],
      })

      const currentTaskIds = tasks.filter(t => t.id).map(t => t.id!)

      for (const task of tasks) {
        if (!task.name || !task.userId) continue
        if (task.id) {
          await updateTask(token!, task.id, {
            name: task.name,
            description: task.description,
            type: task.type,
            priority: task.priority,
            status: task.status,
            userId: parseInt(task.userId),
            targetQuantity: task.targetQuantity,
            unit: task.unit,
            completedQuantity: task.completedQuantity,
            hoursPerUnit: task.hoursPerUnit,
            startTime: task.startTime || undefined,
            endTime: task.endTime || undefined,
            projectId: editingProjectId!,
            members: task.members,
          } as any)
        } else {
          await createTask(token!, {
            name: task.name,
            description: task.description,
            type: task.type,
            priority: task.priority,
            status: task.status,
            userId: parseInt(task.userId),
            targetQuantity: task.targetQuantity,
            unit: task.unit,
            completedQuantity: task.completedQuantity,
            hoursPerUnit: task.hoursPerUnit,
            startTime: task.startTime || undefined,
            endTime: task.endTime || undefined,
            projectId: editingProjectId!,
            members: task.members,
            frequency: task.frequency,
            dailyDescription: task.dailyDescription,
          })
        }
      }

      for (const originalId of originalTaskIds) {
        if (!currentTaskIds.includes(originalId)) {
          try {
            await deleteTask(token!, originalId)
          } catch (error) {
            console.error('Failed to delete removed task:', error)
          }
        }
      }

      setProjects(projects.map(p => p.id === editingProjectId ? projectData : p))
      setShowEditDialog(false)
      setEditingProjectId(null)
      setTasks([])
    } catch (error: any) {
      console.error('Failed to update project:', error)
      alert('保存失败：' + (error?.response?.data?.message || error?.response?.data?.detail || error?.message || '未知错误'))
    }
  }

  const handleDelete = async (projectId: number) => {
    try {
      await deleteProject(token!, projectId)
      removeProject(projectId)
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const addTask = () => {
    setTaskFormData({
      id: undefined,
      name: '',
      description: '',
      type: '项目任务',
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
    })
    setTaskDialogMode('add')
    setTaskDialogIndex(null)
    setShowTaskDialog(true)
  }

  const openEditTask = (index: number) => {
    const task = tasks[index]
    setTaskFormData({
      id: task.id,
      name: task.name,
      description: task.description,
      type: task.type,
      priority: task.priority,
      status: task.status,
      userId: task.userId,
      targetQuantity: task.targetQuantity,
      unit: task.unit,
      completedQuantity: task.completedQuantity,
      hoursPerUnit: task.hoursPerUnit,
      startTime: task.startTime,
      endTime: task.endTime,
      members: task.members || [],
    })
    setTaskDialogMode('edit')
    setTaskDialogIndex(index)
    setShowTaskDialog(true)
  }

  const saveTaskDialog = async () => {
    if (!taskFormData.name || !taskFormData.userId) {
      alert('请填写任务名称和负责人')
      return
    }
    
    try {
      if (taskDialogMode === 'add') {
        const createdTask = await createTask(token!, {
          name: taskFormData.name,
          description: taskFormData.description,
          type: taskFormData.type,
          priority: taskFormData.priority,
          status: taskFormData.status,
          userId: parseInt(taskFormData.userId),
          targetQuantity: taskFormData.targetQuantity,
          unit: taskFormData.unit,
          completedQuantity: taskFormData.completedQuantity,
          hoursPerUnit: taskFormData.hoursPerUnit,
          startTime: taskFormData.startTime || undefined,
          endTime: taskFormData.endTime || undefined,
          projectId: editingProjectId!,
          frequency: taskFormData.frequency,
          dailyDescription: taskFormData.dailyDescription,
        })
        
        const newTask = {
          ...taskFormData,
          id: createdTask.id,
        }
        setTasks(prev => [...prev, newTask])
        setOriginalTaskIds(prev => [...prev, createdTask.id])
      } else if (taskDialogIndex !== null && taskFormData.id) {
        await updateTask(token!, taskFormData.id, {
          name: taskFormData.name,
          description: taskFormData.description,
          type: taskFormData.type,
          priority: taskFormData.priority,
          status: taskFormData.status,
          userId: parseInt(taskFormData.userId),
          targetQuantity: taskFormData.targetQuantity,
          unit: taskFormData.unit,
          completedQuantity: taskFormData.completedQuantity,
          hoursPerUnit: taskFormData.hoursPerUnit,
          startTime: taskFormData.startTime || undefined,
          endTime: taskFormData.endTime || undefined,
          projectId: editingProjectId!,
        } as any)
        
        const updatedTask = {
          ...taskFormData,
        }
        setTasks(prev => prev.map((t, i) => i === taskDialogIndex ? updatedTask : t))
      }
      
      setShowTaskDialog(false)
      
      if (token) {
        const updatedProjects = await getProjects(token)
        setProjects(updatedProjects)
      }
    } catch (error: any) {
      console.error('Failed to save task:', error)
      alert('保存任务失败：' + (error?.response?.data?.message || error?.message || '未知错误'))
    }
  }

  const updateTaskField = (index: number, field: string, value: any) => {
    setTasks(prev => prev.map((t, i) => 
      i === index ? { ...t, [field]: value } : t
    ))
  }

  const removeTask = async (index: number) => {
    const task = tasks[index]
    if (task.id && token) {
      try {
        await deleteTask(token, task.id)
      } catch (error) {
        console.error('Failed to delete task:', error)
      }
    }
    setTasks(prev => prev.filter((_, i) => i !== index))
    
    if (token) {
      try {
        const updatedProjects = await getProjects(token)
        setProjects(updatedProjects)
      } catch (error) {
        console.error('Failed to update projects:', error)
      }
    }
  }

  const getIcon = (iconName: string) => {
    const icon = iconOptions.find(o => o.value === iconName)
    return icon ? icon.icon : Rocket
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case '进行中': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case '已完成': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case '已暂停': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case '已归档': return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
      default: return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
    }
  }

  const getManagerName = (managerId: number | undefined) => {
    if (!managerId) return '未分配'
    const user = users.find(u => u.id === managerId)
    return user ? user.nickname : '未知用户'
  }

  const getProjectProgress = (project: any) => {
    const tasks = project.tasks || []
    if (tasks.length === 0) return 0
    const total = tasks.reduce((sum: number, t: any) => {
      return sum + calcTaskProgress(t, workDaysPerMonth)
    }, 0)
    return Math.round(total / tasks.length)
  }

  const getUserName = (userId: number | string) => {
    const user = users.find(u => u.id === parseInt(userId.toString()))
    return user ? user.nickname : '未分配'
  }

  const getTaskProgress = (task: any) => {
    return calcTaskProgress(task, workDaysPerMonth)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">项目管理</h2>
        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white" onClick={() => { setShowCreateDialog(true); setActiveTab('basic'); }}>
          <Plus className="w-4 h-4 mr-2" />
          新建项目
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Rocket className="w-16 h-16 mb-4 opacity-50" />
          <p>暂无项目，点击上方按钮创建</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const IconComponent = getIcon(project.icon || 'Rocket')
            return (
              <Card key={project.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{project.name}</h3>
                        <p className="text-xs text-slate-400">{getManagerName(project.managerId)}</p>
                      </div>
                    </div>
                    <Badge className={`text-xs ${getStatusColor(project.status || '')}`}>
                      {project.status || '待立项'}
                    </Badge>
                  </div>

                  {project.description && (
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{project.description}</p>
                  )}

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{project.startTime}</span>
                      <span>{project.endTime}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>任务数：{project.tasks?.length || 0}</span>
                      <span>{getProjectProgress(project)}%</span>
                    </div>
                    <Progress
                      value={getProjectProgress(project)}
                      className="h-2 bg-slate-700"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-indigo-400" onClick={() => handleEdit(project)}>
                        <Edit className="w-4 h-4 mr-1" />
                        编辑
                      </Button>
                      <Popconfirm
                        title="确认删除项目？删除后无法恢复。"
                        onConfirm={() => handleDelete(project.id)}
                      >
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-400">
                          <Trash2 className="w-4 h-4 mr-1" />
                          删除
                        </Button>
                      </Popconfirm>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-900 border-none max-w-2xl p-0 flex flex-col top-8 translate-y-0">
          <div className="flex">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'basic' 
                  ? 'text-white bg-indigo-600/10' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              新建项目
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'tasks' 
                  ? 'text-white bg-indigo-600/10' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              细分任务
            </button>
          </div>
          
          <div className="flex-1 min-h-[400px]">
            {activeTab === 'basic' && (<div className="px-4 space-y-3 pb-2">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">项目名称</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入项目名称"
                  className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">项目描述</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入项目描述"
                  className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">项目图标</label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((option) => {
                    const IconComponent = option.icon
                    return (
                      <button
                        key={option.value}
                        onClick={() => setFormData({ ...formData, icon: option.value })}
                        className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
                          formData.icon === option.value
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">开始时间</label>
                  <input
                    type="date"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">结束时间</label>
                  <input
                    type="date"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">总负责人</label>
                <select
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">请选择总负责人</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.nickname}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">成员选择</label>
                <div className="flex flex-wrap gap-2">
                  {users.filter(u => u.id.toString() !== formData.managerId).map((user) => (
                    <button
                      key={user.id}
                      onClick={() => toggleMember(user.id)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        selectedMembers.includes(user.id)
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {user.nickname}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="待立项">待立项</option>
                  <option value="进行中">进行中</option>
                  <option value="已完成">已完成</option>
                  <option value="已暂停">已暂停</option>
                  <option value="已归档">已归档</option>
                </select>
              </div>
            </div>)}
            
            {activeTab === 'tasks' && (<div className="px-4 pb-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">共 {tasks.length} 个任务</span>
                <Button variant="outline" size="sm" className="bg-slate-800 text-slate-300 hover:bg-slate-700" onClick={addTask}>
                  <Plus className="w-4 h-4 mr-1" />
                  添加任务
                </Button>
              </div>
              
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">暂无细分任务</p>
                ) : (
                  tasks.map((task, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white truncate">{task.name || '未命名任务'}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            task.priority === 'P1' ? 'bg-red-500/10 text-red-400' :
                            task.priority === 'P2' ? 'bg-orange-500/10 text-orange-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>{task.priority}</span>
                          <span className="px-1.5 py-0.5 rounded text-xs bg-green-500/10 text-green-400">{task.status}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>负责人：{task.userId ? getUserName(task.userId) : '未分配'}</span>
                          <span>进度：{task.completedQuantity}/{getTaskTotalTarget(task, workDaysPerMonth)}{task.unit} ({getTaskProgress(task)}%)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 h-7 w-7" onClick={() => openEditTask(index)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Popconfirm title="确定删除此任务？" onConfirm={() => removeTask(index)}>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-7 w-7">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </Popconfirm>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>)}
          </div>
          
          <DialogFooter className="px-4 py-3 mx-0 mb-0">
            <Button variant="outline" className="bg-slate-800 text-slate-300 hover:bg-slate-700" onClick={() => { setShowCreateDialog(false); setTasks([]); }}>取消</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white" onClick={handleCreate}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-900 border-none max-w-2xl p-0 flex flex-col top-8 translate-y-0">
          <div className="flex">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'basic' 
                  ? 'text-white bg-indigo-600/10' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              编辑项目
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'tasks' 
                  ? 'text-white bg-indigo-600/10' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              细分任务
            </button>
          </div>
          
          <div className="flex-1 min-h-[400px]">
            {activeTab === 'basic' && (<div className="px-4 space-y-3 pb-2">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">项目名称</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入项目名称"
                  className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">项目描述</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入项目描述"
                  className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">项目图标</label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((option) => {
                    const IconComponent = option.icon
                    return (
                      <button
                        key={option.value}
                        onClick={() => setFormData({ ...formData, icon: option.value })}
                        className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
                          formData.icon === option.value
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">开始时间</label>
                  <input
                    type="date"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">结束时间</label>
                  <input
                    type="date"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">总负责人</label>
                <select
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">请选择总负责人</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.nickname}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">成员选择</label>
                <div className="flex flex-wrap gap-2">
                  {users.filter(u => u.id.toString() !== formData.managerId).map((user) => (
                    <button
                      key={user.id}
                      onClick={() => toggleMember(user.id)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        selectedMembers.includes(user.id)
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {user.nickname}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="待立项">待立项</option>
                  <option value="进行中">进行中</option>
                  <option value="已完成">已完成</option>
                  <option value="已暂停">已暂停</option>
                  <option value="已归档">已归档</option>
                </select>
              </div>
            </div>)}
            
            {activeTab === 'tasks' && (<div className="px-4 pb-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">共 {tasks.length} 个任务</span>
                <Button variant="outline" size="sm" className="bg-slate-800 text-slate-300 hover:bg-slate-700" onClick={addTask}>
                  <Plus className="w-4 h-4 mr-1" />
                  添加任务
                </Button>
              </div>
              
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">暂无细分任务</p>
                ) : (
                  tasks.map((task, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white truncate">{task.name || '未命名任务'}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            task.priority === 'P1' ? 'bg-red-500/10 text-red-400' :
                            task.priority === 'P2' ? 'bg-orange-500/10 text-orange-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>{task.priority}</span>
                          <span className="px-1.5 py-0.5 rounded text-xs bg-green-500/10 text-green-400">{task.status}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>负责人：{task.userId ? getUserName(task.userId) : '未分配'}</span>
                          <span>进度：{task.completedQuantity}/{getTaskTotalTarget(task, workDaysPerMonth)}{task.unit} ({getTaskProgress(task)}%)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 h-7 w-7" onClick={() => openEditTask(index)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Popconfirm title="确定删除此任务？" onConfirm={() => removeTask(index)}>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-7 w-7">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </Popconfirm>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>)}
          </div>
          
          <DialogFooter className="px-4 py-3 mx-0 mb-0">
            <Button variant="outline" className="bg-slate-800 text-slate-300 hover:bg-slate-700" onClick={() => { setShowEditDialog(false); setEditingProjectId(null); setTasks([]); setOriginalTaskIds([]); }}>取消</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white" onClick={handleUpdate}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md top-8 translate-y-0">
          <DialogHeader>
            <DialogTitle className="text-white">{taskDialogMode === 'add' ? '添加任务' : '编辑任务'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-xs text-slate-500 mb-1">任务名称</label>
              <Input
                value={taskFormData.name}
                onChange={(e) => setTaskFormData({ ...taskFormData, name: e.target.value })}
                placeholder="请输入任务名称"
                className="bg-slate-700 border-slate-600 text-white text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs text-slate-500 mb-1">任务描述</label>
              <Input
                value={taskFormData.description}
                onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                placeholder="请输入任务描述"
                className="bg-slate-700 border-slate-600 text-white text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">优先级</label>
                <select
                  value={taskFormData.priority}
                  onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                  className="w-full h-9 px-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="P1">P1 - 紧急</option>
                  <option value="P2">P2 - 重要</option>
                  <option value="P3">P3 - 一般</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">状态</label>
                <select
                  value={taskFormData.status}
                  onChange={(e) => setTaskFormData({ ...taskFormData, status: e.target.value })}
                  className="w-full h-9 px-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
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
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">负责人</label>
                <select
                  value={taskFormData.userId}
                  onChange={(e) => setTaskFormData({ ...taskFormData, userId: e.target.value })}
                  className="w-full h-9 px-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">请选择负责人</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.nickname}</option>
                  ))}
                </select>
              </div>
              <div></div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">开始时间</label>
                <input
                  type="date"
                  value={taskFormData.startTime}
                  onChange={(e) => setTaskFormData({ ...taskFormData, startTime: e.target.value })}
                  className="w-full h-9 px-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">结束时间</label>
                <input
                  type="date"
                  value={taskFormData.endTime}
                  onChange={(e) => setTaskFormData({ ...taskFormData, endTime: e.target.value })}
                  className="w-full h-9 px-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-slate-500 mb-1">参与成员</label>
              <div className="flex flex-wrap gap-2">
                {users.filter(u => u.id.toString() !== taskFormData.userId).map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      const members = taskFormData.members || []
                      if (members.includes(user.id)) {
                        setTaskFormData({ ...taskFormData, members: members.filter((id: number) => id !== user.id) })
                      } else {
                        setTaskFormData({ ...taskFormData, members: [...members, user.id] })
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      (taskFormData.members || []).includes(user.id)
                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50'
                        : 'bg-slate-700 text-slate-400 border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    {user.nickname}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-slate-500 mb-1">量化</label>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className="text-xs text-slate-500">目标数量</span>
                  <Input
                    type="number"
                    value={taskFormData.targetQuantity}
                    onChange={(e) => setTaskFormData({ ...taskFormData, targetQuantity: parseInt(e.target.value) || 0 })}
                    className="mt-1 bg-slate-700 border-slate-600 text-white text-sm text-center"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-500">单位</span>
                  <Input
                    value={taskFormData.unit}
                    onChange={(e) => setTaskFormData({ ...taskFormData, unit: e.target.value })}
                    className="mt-1 bg-slate-700 border-slate-600 text-white text-sm text-center"
                    placeholder="个"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-500">已完成</span>
                  <Input
                    type="number"
                    value={taskFormData.completedQuantity}
                    onChange={(e) => setTaskFormData({ ...taskFormData, completedQuantity: parseInt(e.target.value) || 0 })}
                    className="mt-1 bg-slate-700 border-slate-600 text-white text-sm text-center"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-500">工时/单位</span>
                  <Input
                    type="number"
                    value={taskFormData.hoursPerUnit}
                    onChange={(e) => setTaskFormData({ ...taskFormData, hoursPerUnit: parseFloat(e.target.value) || 0 })}
                    className="mt-1 bg-slate-700 border-slate-600 text-white text-sm text-center"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="px-0 py-0 mx-0 mb-0">
            <Button variant="outline" className="bg-slate-800 text-slate-300 hover:bg-slate-700" onClick={() => setShowTaskDialog(false)}>取消</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white" onClick={saveTaskDialog}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}