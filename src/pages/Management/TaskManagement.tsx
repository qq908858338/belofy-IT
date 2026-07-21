﻿import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popconfirm } from '@/components/ui/popconfirm'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useTaskStore } from '@/store/taskStore'
import { getTasks, deleteTask, createTask, updateTask } from '@/api/task'
import { getUsers } from '@/api/user'
import { getProjects } from '@/api/project'
import type { Task } from '@/types'

export default function TaskManagement() {
  const [loading, setLoading] = useState(true)
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  
  const { token } = useAuthStore()
  const { tasks, setTasks, deleteTask: removeTask, addTask } = useTaskStore()

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

  useEffect(() => {
    fetchTasks()
    fetchUsers()
    fetchProjects()
  }, [])

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

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      P1: 'bg-red-500/10 text-red-400 border-red-500/30',
      P2: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      P3: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    }
    return styles[priority] || 'bg-slate-500/10 text-slate-400'
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

  const filteredTasks = taskTypeFilter === 'all' 
    ? tasks 
    : tasks.filter(t => t.type === taskTypeFilter)

  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const key = task.user?.nickname || '未知用户'
    if (!acc[key]) acc[key] = {}
    const typeKey = task.type
    if (!acc[key][typeKey]) acc[key][typeKey] = []
    acc[key][typeKey].push(task)
    return acc
  }, {} as Record<string, Record<string, Task[]>>)

  const taskTypes = ['all', '项目任务', '日常任务', '临时任务']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">任务管理</h1>
          </div>
        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新建任务
        </Button>
      </div>

      <div className="flex gap-2">
        {taskTypes.map((type) => (
          <Button
            key={type}
            variant={taskTypeFilter === type ? 'secondary' : 'outline'}
            className={`${taskTypeFilter === type 
              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' 
              : 'bg-slate-900/50 text-slate-400 border-slate-700 hover:text-white'
            }`}
            onClick={() => setTaskTypeFilter(type)}
          >
            {type === 'all' ? '全部' : type}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : Object.keys(groupedTasks).length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <p className="text-slate-400">暂无任务数据</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedTasks).map(([userName, types]) => (
          <Card key={userName} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="font-medium text-white">{userName[0]}</span>
                </div>
                <h2 className="font-semibold text-white">{userName}</h2>
              </div>
              
              {Object.entries(types).map(([type, typeTasks]) => (
                <div key={type} className="mb-6">
                  <h3 className="text-sm font-medium text-slate-400 mb-3">{type}</h3>
                  <div className="space-y-3">
                    {typeTasks.map((task) => {
                      const progress = task.targetQuantity 
                        ? Math.round((task.completedQuantity / task.targetQuantity) * 100) 
                        : 0
                      return (
                        <div key={task.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getStatusBadge(task.status)}>
                                {task.status}
                              </Badge>
                              <Badge variant="outline" className={getPriorityBadge(task.priority)}>
                                {task.priority}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10" onClick={() => handleEdit(task)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Popconfirm title="确定删除此任务？" onConfirm={() => handleDelete(task.id)}>
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </Popconfirm>
                            </div>
                          </div>
                          
                          <h4 className="font-medium text-white mb-2">{task.name}</h4>
                          
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-500">进度</span>
                            <span className="text-sm text-white font-medium">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2 bg-slate-700" />
                          
                          <div className="flex items-center justify-between mt-3 text-sm">
                            <span className="text-slate-500">完成数/量化总数</span>
                            <span className="text-white">{task.completedQuantity} / {task.targetQuantity}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
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
                {users.map((user) => (
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
                {users.map((user) => (
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