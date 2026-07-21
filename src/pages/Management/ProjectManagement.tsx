import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popconfirm } from '@/components/ui/popconfirm'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Plus, Edit, Trash2, CheckCircle2, Rocket, Code, Target, Globe, Building2, Users, Star, BookOpen, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useProjectStore } from '@/store/projectStore'
import { getProjects, deleteProject, createProject, updateProject } from '@/api/project'
import { getUsers } from '@/api/user'
import { getTasks } from '@/api/task'
import type { Project } from '@/types'

export default function ProjectManagement() {
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  
  const { token } = useAuthStore()
  const { projects, setProjects, deleteProject: removeProject, addProject } = useProjectStore()

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
      })

      if (selectedMembers.length > 0) {
        for (const memberId of selectedMembers) {
          if (memberId !== parseInt(formData.managerId)) {
          }
        }
      }

      if (tasks.length > 0) {
        for (const task of tasks) {
          if (task.name && task.userId) {
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
    setSelectedMembers([])

    try {
      const projectTasks = await getTasks(token!, { projectId: project.id })
      setTasks(projectTasks.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description || '',
        type: t.type || '',
        priority: t.priority || '',
        status: t.status || '',
        userId: t.userId?.toString() || '',
        targetQuantity: t.targetQuantity || 0,
        unit: t.unit || '',
        completedQuantity: t.completedQuantity || 0,
        hoursPerUnit: t.hoursPerUnit || 0,
        startTime: t.startTime || '',
        endTime: t.endTime || '',
      })))
    } catch (error) {
      console.error('Failed to fetch project tasks:', error)
      setTasks([])
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
      })

      setProjects(projects.map(p => p.id === editingProjectId ? projectData : p))
      setShowEditDialog(false)
      setEditingProjectId(null)
      setTasks([])
    } catch (error) {
      console.error('Failed to update project:', error)
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
    setTasks(prev => [...prev, {
      name: '',
      description: '',
      type: '',
      priority: '',
      status: '',
      userId: '',
      targetQuantity: 0,
      unit: '',
      completedQuantity: 0,
      hoursPerUnit: 0,
      startTime: '',
      endTime: '',
    }])
  }

  const updateTask = (index: number, field: string, value: any) => {
    setTasks(prev => prev.map((t, i) => 
      i === index ? { ...t, [field]: value } : t
    ))
  }

  const removeTask = (index: number) => {
    setTasks(prev => prev.filter((_, i) => i !== index))
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

                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span>{project.startTime}</span>
                    <span>{project.endTime}</span>
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
        <DialogContent className="bg-slate-900 border-none max-w-2xl p-0 h-[520px] flex flex-col">
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
          
          <div className="flex-1 overflow-y-auto">
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
                  {users.map((user) => (
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
            
            {activeTab === 'tasks' && (<div className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-400">细分任务</label>
                <Button variant="outline" size="sm" className="bg-slate-800 text-slate-300 hover:bg-slate-700" onClick={addTask}>
                  <Plus className="w-4 h-4 mr-1" />
                  添加任务
                </Button>
              </div>
              
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">暂无细分任务</p>
                ) : (
                  tasks.map((task, index) => (
                    <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-indigo-400">任务 {index + 1}</span>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-6 w-6" onClick={() => removeTask(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">任务名称</label>
                          <Input
                            value={task.name}
                            onChange={(e) => updateTask(index, 'name', e.target.value)}
                            placeholder="请输入任务名称"
                            className="bg-slate-700 border-slate-600 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">负责人</label>
                          <select
                            value={task.userId}
                            onChange={(e) => updateTask(index, 'userId', e.target.value)}
                            className="w-full h-8 px-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                          >
                            <option value="">请选择负责人</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>{user.nickname}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">类型</label>
                          <select
                            value={task.type}
                            onChange={(e) => updateTask(index, 'type', e.target.value)}
                            className="w-full h-8 px-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                          >
                            <option value="项目任务">项目任务</option>
                            <option value="日常任务">日常任务</option>
                            <option value="临时任务">临时任务</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">优先级</label>
                          <select
                            value={task.priority}
                            onChange={(e) => updateTask(index, 'priority', e.target.value)}
                            className="w-full h-8 px-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                          >
                            <option value="P1">P1 - 紧急</option>
                            <option value="P2">P2 - 重要</option>
                            <option value="P3">P3 - 一般</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">目标数量</label>
                          <Input
                            type="number"
                            value={task.targetQuantity}
                            onChange={(e) => updateTask(index, 'targetQuantity', parseInt(e.target.value) || 0)}
                            className="bg-slate-700 border-slate-600 text-white text-sm text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">单位</label>
                          <Input
                            value={task.unit}
                            onChange={(e) => updateTask(index, 'unit', e.target.value)}
                            className="bg-slate-700 border-slate-600 text-white text-sm text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">已完成</label>
                          <Input
                            type="number"
                            value={task.completedQuantity}
                            onChange={(e) => updateTask(index, 'completedQuantity', parseInt(e.target.value) || 0)}
                            className="bg-slate-700 border-slate-600 text-white text-sm text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">工时/单位</label>
                          <Input
                            type="number"
                            value={task.hoursPerUnit}
                            onChange={(e) => updateTask(index, 'hoursPerUnit', parseFloat(e.target.value) || 0)}
                            className="bg-slate-700 border-slate-600 text-white text-sm text-center"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">开始时间</label>
                          <input
                            type="date"
                            value={task.startTime}
                            onChange={(e) => updateTask(index, 'startTime', e.target.value)}
                            className="w-full h-8 px-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">结束时间</label>
                          <input
                            type="date"
                            value={task.endTime}
                            onChange={(e) => updateTask(index, 'endTime', e.target.value)}
                            className="w-full h-8 px-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>)}
          </div>
          
          <DialogFooter>
            <Button variant="outline" className="bg-slate-800 text-slate-300 hover:bg-slate-700" onClick={() => { setShowCreateDialog(false); setTasks([]); }}>取消</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white" onClick={handleCreate}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-900 border-none max-w-2xl p-0 h-[520px] flex flex-col">
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
          
          <div className="flex-1 overflow-y-auto">
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
                  {users.map((user) => (
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
            
            {activeTab === 'tasks' && (<div className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-400">细分任务</label>
                <Button variant="outline" size="sm" className="bg-slate-800 text-slate-300 hover:bg-slate-700" onClick={addTask}>
                  <Plus className="w-4 h-4 mr-1" />
                  添加任务
                </Button>
              </div>
              
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">暂无细分任务</p>
                ) : (
                  tasks.map((task, index) => (
                    <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-indigo-400">任务 {index + 1}</span>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-6 w-6" onClick={() => removeTask(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">任务名称</label>
                          <Input
                            value={task.name}
                            onChange={(e) => updateTask(index, 'name', e.target.value)}
                            placeholder="请输入任务名称"
                            className="bg-slate-700 border-slate-600 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">负责人</label>
                          <select
                            value={task.userId}
                            onChange={(e) => updateTask(index, 'userId', e.target.value)}
                            className="w-full h-8 px-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                          >
                            <option value="">请选择负责人</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>{user.nickname}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">类型</label>
                          <select
                            value={task.type}
                            onChange={(e) => updateTask(index, 'type', e.target.value)}
                            className="w-full h-8 px-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                          >
                            <option value="项目任务">项目任务</option>
                            <option value="日常任务">日常任务</option>
                            <option value="临时任务">临时任务</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">优先级</label>
                          <select
                            value={task.priority}
                            onChange={(e) => updateTask(index, 'priority', e.target.value)}
                            className="w-full h-8 px-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                          >
                            <option value="P1">P1 - 紧急</option>
                            <option value="P2">P2 - 重要</option>
                            <option value="P3">P3 - 一般</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">目标数量</label>
                          <Input
                            type="number"
                            value={task.targetQuantity}
                            onChange={(e) => updateTask(index, 'targetQuantity', parseInt(e.target.value) || 0)}
                            className="bg-slate-700 border-slate-600 text-white text-sm text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">单位</label>
                          <Input
                            value={task.unit}
                            onChange={(e) => updateTask(index, 'unit', e.target.value)}
                            className="bg-slate-700 border-slate-600 text-white text-sm text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">已完成</label>
                          <Input
                            type="number"
                            value={task.completedQuantity}
                            onChange={(e) => updateTask(index, 'completedQuantity', parseInt(e.target.value) || 0)}
                            className="bg-slate-700 border-slate-600 text-white text-sm text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">工时/单位</label>
                          <Input
                            type="number"
                            value={task.hoursPerUnit}
                            onChange={(e) => updateTask(index, 'hoursPerUnit', parseFloat(e.target.value) || 0)}
                            className="bg-slate-700 border-slate-600 text-white text-sm text-center"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">开始时间</label>
                          <input
                            type="date"
                            value={task.startTime}
                            onChange={(e) => updateTask(index, 'startTime', e.target.value)}
                            className="w-full h-8 px-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">结束时间</label>
                          <input
                            type="date"
                            value={task.endTime}
                            onChange={(e) => updateTask(index, 'endTime', e.target.value)}
                            className="w-full h-8 px-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>)}
          </div>
          
          <DialogFooter>
            <Button variant="outline" className="bg-slate-800 text-slate-300 hover:bg-slate-700" onClick={() => { setShowEditDialog(false); setEditingProjectId(null); setTasks([]); }}>取消</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white" onClick={handleUpdate}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}