﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popconfirm } from '@/components/ui/popconfirm'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2, Folder, User, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useTaskStore } from '@/store/taskStore'
import { useSettingStore } from '@/store/settingStore'
import { getTasks, deleteTask, createTask, updateTask } from '@/api/task'
import { getUsers } from '@/api/user'
import { getProjects } from '@/api/project'
import { getSettings } from '@/api/setting'
import type { Task } from '@/types'

export default function TaskManagement() {
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  
  const { token } = useAuthStore()
  const { tasks, setTasks, deleteTask: removeTask, addTask } = useTaskStore()
  const { settings, setSettings } = useSettingStore()

  const [formData, setFormData] = useState({
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
    projectId: '',
    members: [] as number[],
  })
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchTasks()
    fetchUsers()
    fetchProjects()
    fetchSettingsData()
  }, [])

  const fetchSettingsData = async () => {
    try {
      const data = await getSettings(token!)
      setSettings(data)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const tasksData = await getTasks(token!, { isArchived: false })
      setTasks(tasksData)
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

  const fetchProjects = async () => {
    try {
      const projectsData = await getProjects(token!)
      setProjects(projectsData)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const handleDelete = async (taskId: number) => {
    try {
      await deleteTask(token!, taskId)
      removeTask(taskId)
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const handleCreate = async () => {
    try {
      const newTask = await createTask(token!, {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        status: formData.status,
        userId: parseInt(formData.userId),
        targetQuantity: formData.targetQuantity,
        unit: formData.unit,
        completedQuantity: formData.completedQuantity,
        hoursPerUnit: formData.hoursPerUnit,
        startTime: formData.startTime,
        endTime: formData.endTime,
        projectId: formData.projectId ? parseInt(formData.projectId) : undefined,
        members: formData.members,
      })
      addTask(newTask)
      setShowCreateDialog(false)
      setFormData({ name: '', description: '', type: '项目任务', priority: 'P2', status: '进行中', userId: '', targetQuantity: 100, unit: '个', completedQuantity: 0, hoursPerUnit: 1, startTime: '', endTime: '', projectId: '', members: [] })
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const handleEdit = (task: Task) => {
    const memberIds = task.members?.map(m => m.userId) || []
    setFormData({
      name: task.name,
      description: task.description || '',
      type: task.type,
      priority: task.priority,
      status: task.status,
      userId: task.userId.toString(),
      targetQuantity: task.targetQuantity,
      unit: task.unit,
      completedQuantity: task.completedQuantity,
      hoursPerUnit: task.hoursPerUnit,
      startTime: task.startTime ? new Date(task.startTime).toISOString().split('T')[0] : '',
      endTime: task.endTime ? new Date(task.endTime).toISOString().split('T')[0] : '',
      projectId: task.projectId?.toString() || '',
      members: memberIds,
    })
    setEditingTaskId(task.id)
    setShowEditDialog(true)
  }

  const handleUpdate = async () => {
    try {
      const updatedTask = await updateTask(token!, editingTaskId!, {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        status: formData.status,
        userId: parseInt(formData.userId),
        targetQuantity: formData.targetQuantity,
        unit: formData.unit,
        completedQuantity: formData.completedQuantity,
        hoursPerUnit: formData.hoursPerUnit,
        startTime: formData.startTime,
        endTime: formData.endTime,
        projectId: formData.projectId ? parseInt(formData.projectId) : undefined,
        members: formData.members,
      })
      setTasks(tasks.map(t => t.id === editingTaskId ? updatedTask : t))
      setShowEditDialog(false)
      setEditingTaskId(null)
    } catch (error) {
      console.error('Failed to update task:', error)
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

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      '项目任务': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      '日常任务': 'bg-green-500/20 text-green-300 border-green-500/30',
      '临时任务': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    }
    return styles[type] || 'bg-slate-500/20 text-slate-300'
  }

  const getUserStats = (userName: string) => {
    const userTasks = tasks.filter(t => 
      (t.user?.nickname || '未知用户') === userName ||
      (t.members?.some(m => m.user?.nickname === userName) || false)
    )
    const userProjects = [...new Set(userTasks.filter(t => t.projectId).map(t => t.projectId))]
    
    let totalCompleted = 0
    let totalTarget = 0
    let totalRemainingHours = 0
    
    userTasks.forEach(task => {
      totalCompleted += task.completedQuantity
      totalTarget += task.targetQuantity
      totalRemainingHours += (task.targetQuantity - task.completedQuantity) * task.hoursPerUnit
    })
    
    const progress = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0
    const baseHours = parseInt(settings.loadBaseHours || '40') || 40
    const load = baseHours > 0 ? Math.round((totalRemainingHours / baseHours) * 100) : 0
    
    return {
      projectCount: userProjects.length,
      taskCount: userTasks.length,
      completed: totalCompleted,
      target: totalTarget,
      progress,
      load,
    }
  }

  const groupedByUser = tasks.reduce((acc, task) => {
    const ownerName = task.user?.nickname || '未知用户'
    
    if (!acc[ownerName]) acc[ownerName] = []
    acc[ownerName].push(task)
    
    if (task.members && task.members.length > 0) {
      task.members.forEach(member => {
        const memberName = member.user?.nickname
        if (memberName && memberName !== ownerName) {
          if (!acc[memberName]) acc[memberName] = []
          acc[memberName].push(task)
        }
      })
    }
    
    return acc
  }, {} as Record<string, Task[]>)

  const groupByProjectAndType = (userTasks: Task[]) => {
    return userTasks.reduce((acc, task) => {
      let groupKey: string
      
      if (task.type === '日常任务') {
        groupKey = '日常任务'
      } else if (task.type === '临时任务') {
        groupKey = '临时任务'
      } else {
        groupKey = task.project?.name || '未分配项目'
      }
      
      if (!acc[groupKey]) acc[groupKey] = { tasks: [], type: task.type }
      acc[groupKey].tasks.push(task)
      return acc
    }, {} as Record<string, { tasks: Task[], type: string }>)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">任务管理</h1>
          </div>
        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新建任务
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : Object.keys(groupedByUser).length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <p className="text-slate-400">暂无任务数据</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedByUser).map(([userName, userTasks]) => {
          const stats = getUserStats(userName)
          const projectsMap = groupByProjectAndType(userTasks)
          
          return (
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
                        <Folder className="w-3 h-3" />
                        项目 {stats.projectCount}
                      </span>
                      <span className="text-sm text-slate-400 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        任务 {stats.taskCount}
                      </span>
                      <span className="text-sm text-slate-400">
                        完成 {stats.completed}/{stats.target}
                      </span>
                      <Badge variant="outline" className={`${stats.load > 80 ? 'bg-red-500/10 text-red-400' : stats.load > 50 ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
                        负荷 {stats.load}%
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {Object.entries(projectsMap).map(([groupName, groupData]) => {
                  const groupKey = `${userName}-${groupName}`
                  const isExpanded = expandedGroups[groupKey] || false
                  
                  return (
                    <div key={groupName} className="border-t border-slate-700/50">
                      <div 
                        className={`flex items-center justify-between px-4 py-2 cursor-pointer ${groupName === '日常任务' ? 'bg-green-500/5' : groupName === '临时任务' ? 'bg-orange-500/5' : 'bg-slate-800/30'}`}
                        onClick={() => setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))}
                      >
                        <div className="flex items-center gap-2">
                          <Folder className={`w-4 h-4 ${groupName === '日常任务' ? 'text-green-500' : groupName === '临时任务' ? 'text-orange-500' : 'text-slate-500'}`} />
                          <span className={`text-sm font-medium ${groupName === '日常任务' ? 'text-green-400' : groupName === '临时任务' ? 'text-orange-400' : 'text-slate-400'}`}>{groupName}</span>
                          <span className="text-xs text-slate-500">({groupData.tasks.length})</span>
                        </div>
                        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                      
                      {isExpanded && (
                        <div className="divide-y divide-slate-700/30">
                          {groupData.tasks.map((task) => {
                            const progress = task.targetQuantity 
                              ? Math.round((task.completedQuantity / task.targetQuantity) * 100) 
                              : 0
                            
                            return (
                              <div key={task.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/20 transition-colors">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <Badge variant="outline" className={`${getStatusBadge(task.status)} w-auto`}>
                                    {task.status}
                                  </Badge>
                                  <span className="font-medium text-white truncate">{task.name}</span>
                                  {(task.user?.nickname === userName) && (
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 w-auto text-xs">
                                      负责人
                                    </Badge>
                                  )}
                                  {(task.members?.some(m => m.user?.nickname === userName) || false) && (task.user?.nickname !== userName) && (
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
                                  
                                  <span className="text-xs text-slate-500 min-w-[60px]">{task.completedQuantity}/{task.targetQuantity}</span>
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={`text-xs ${task.status === '待评审' || task.status === '待修改' ? 'text-orange-400 hover:bg-orange-500/10' : task.status === '已评审' ? 'text-green-400 hover:bg-green-500/10' : 'text-slate-500 hover:bg-slate-700'}`}
                                  >
                                    {task.status === '待评审' || task.status === '待修改' ? '批示' : '已批示'}
                                  </Button>
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-slate-500 hover:text-blue-400 hover:bg-blue-500/10"
                                    onClick={(e) => { e.stopPropagation(); handleEdit(task); }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  
                                  <Popconfirm title="确定删除此任务？" onConfirm={() => handleDelete(task.id)}>
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
              </CardContent>
            </Card>
          )
        })
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">新建任务</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">任务名称</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入任务名称"
                className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">任务描述</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入任务描述"
                className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">任务类型</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="项目任务">项目任务</option>
                  <option value="日常任务">日常任务</option>
                  <option value="临时任务">临时任务</option>
                </select>
              </div>
              
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
            </div>
            
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            
            {formData.type === '项目任务' && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">所属项目</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">请选择项目（可选）</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
            )}
            
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
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">目标数量</span>
                  <Input
                    type="number"
                    value={formData.targetQuantity}
                    onChange={(e) => setFormData({ ...formData, targetQuantity: parseInt(e.target.value) || 0 })}
                    className="bg-slate-800 border-slate-700 text-white text-center"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">单位</span>
                  <Input
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white text-center"
                    placeholder="个"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">已完成</span>
                  <Input
                    type="number"
                    value={formData.completedQuantity}
                    onChange={(e) => setFormData({ ...formData, completedQuantity: parseInt(e.target.value) || 0 })}
                    className="bg-slate-800 border-slate-700 text-white text-center"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">工时/单位</span>
                  <Input
                    type="number"
                    value={formData.hoursPerUnit}
                    onChange={(e) => setFormData({ ...formData, hoursPerUnit: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-800 border-slate-700 text-white text-center"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" className="bg-slate-800 text-slate-300 hover:bg-slate-700" onClick={() => setShowCreateDialog(false)}>取消</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white" onClick={handleCreate}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">编辑任务</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">任务名称</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入任务名称"
                className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">任务描述</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入任务描述"
                className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">任务类型</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="项目任务">项目任务</option>
                  <option value="日常任务">日常任务</option>
                  <option value="临时任务">临时任务</option>
                </select>
              </div>
              
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
            </div>
            
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            
            {formData.type === '项目任务' && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">所属项目</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">请选择项目（可选）</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
            )}
            
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
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">目标数量</span>
                  <Input
                    type="number"
                    value={formData.targetQuantity}
                    onChange={(e) => setFormData({ ...formData, targetQuantity: parseInt(e.target.value) || 0 })}
                    className="bg-slate-800 border-slate-700 text-white text-center"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">单位</span>
                  <Input
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white text-center"
                    placeholder="个"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">已完成</span>
                  <Input
                    type="number"
                    value={formData.completedQuantity}
                    onChange={(e) => setFormData({ ...formData, completedQuantity: parseInt(e.target.value) || 0 })}
                    className="bg-slate-800 border-slate-700 text-white text-center"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">工时/单位</span>
                  <Input
                    type="number"
                    value={formData.hoursPerUnit}
                    onChange={(e) => setFormData({ ...formData, hoursPerUnit: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-800 border-slate-700 text-white text-center"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" className="bg-slate-800 text-slate-300 hover:bg-slate-700" onClick={() => { setShowEditDialog(false); setEditingTaskId(null); }}>取消</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white" onClick={handleUpdate}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}