import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { CalendarDays, Send, Plus, ChevronDown, ChevronUp, Folder, Image, Video, FileText, Camera } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useTaskStore } from '@/store/taskStore'
import { getTasks, createTask, updateTask } from '@/api/task'
import { getUsers } from '@/api/user'
import type { Task } from '@/types'

export default function TodayReport() {
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [reportData, setReportData] = useState<Record<number, { completedQuantity: number; usedHours: number }>>({})
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [users, setUsers] = useState<any[]>([])
  
  const [progressForm, setProgressForm] = useState({
    todayCompleted: 0,
    todayHours: 0,
    blocker: '',
    helpers: [] as number[],
    resultDesc: '',
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
      })
      
      fetchTasks()
    } catch (error) {
      console.error('Failed to create task:', error)
      alert('创建任务失败')
    }
  }

  const handleSubmit = () => {
    alert('日报提交成功')
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
    setShowProgressDialog(true)
  }

  const handleUpdateProgress = async () => {
    if (!editingTask) return
    
    try {
      const newCompleted = (editingTask.completedQuantity || 0) + progressForm.todayCompleted
      const updatedTask = await updateTask(token!, editingTask.id, {
        completedQuantity: newCompleted,
      })
      
      setShowProgressDialog(false)
      setEditingTask(null)
      fetchTasks()
    } catch (error) {
      console.error('Failed to update progress:', error)
      alert('更新进度失败')
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
                                
                                <span className="text-xs text-slate-500 min-w-[60px]">{task.completedQuantity}/{task.targetQuantity}</span>
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                                  onClick={(e) => { e.stopPropagation(); openProgressDialog(task); }}
                                >
                                  更新进度
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className={`text-xs ${task.status === '待评审' || task.status === '待修改' ? 'text-orange-400 hover:bg-orange-500/10' : task.status === '已评审' ? 'text-green-400 hover:bg-green-500/10' : 'text-slate-500 hover:bg-slate-700'}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {task.status === '待评审' || task.status === '待修改' ? '批示' : '已批示'}
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
                    step="0.5"
                    value={formData.hoursPerUnit}
                    onChange={(e) => setFormData({ ...formData, hoursPerUnit: parseFloat(e.target.value) || 1 })}
                    className="bg-slate-800 border-slate-700 text-white text-center"
                  />
                </div>
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
                进度：{editingTask?.completedQuantity || 0}/{editingTask?.targetQuantity} {editingTask?.unit}
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
                {users.map((u) => (
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
                <Button variant="outline" size="sm" className="h-8 px-3 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
                  <Image className="w-4 h-4 mr-1" /> 图片
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-3 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
                  <Video className="w-4 h-4 mr-1" /> 视频
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-3 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
                  <FileText className="w-4 h-4 mr-1" /> 文档
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-3 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
                  <Camera className="w-4 h-4 mr-1" /> 截图
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-3 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
                  +
                </Button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">其他成果说明</label>
              <textarea
                value={progressForm.resultDesc}
                onChange={(e) => setProgressForm({ ...progressForm, resultDesc: e.target.value })}
                placeholder="请补充说明其他成果（可粘贴图片）"
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
    </div>
  )
}