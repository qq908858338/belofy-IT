import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Send, Plus, ChevronDown, ChevronUp, Folder, Edit, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useTaskStore } from '@/store/taskStore'
import { getTasks } from '@/api/task'
import type { Task } from '@/types'

export default function TodayReport() {
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [reportData, setReportData] = useState<Record<number, { completedQuantity: number; usedHours: number }>>({})
  
  const { token, user } = useAuthStore()
  const { tasks, setTasks } = useTaskStore()

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const tasksData = await getTasks(token!, { userId: user?.id })
      setTasks(tasksData)
      const initialData: Record<number, { completedQuantity: number; usedHours: number }> = {}
      tasksData.forEach(t => {
        initialData[t.id] = { completedQuantity: t.completedQuantity || 0, usedHours: 0 }
      })
      setReportData(initialData)
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (taskId: number, field: 'completedQuantity' | 'usedHours', value: string) => {
    setReportData(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: parseFloat(value) || 0
      }
    }))
  }

  const handleSubmit = () => {
    alert('日报提交成功')
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

      <Button variant="outline" className="bg-slate-900/50 text-slate-400 border-slate-700 hover:text-white">
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
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-800/50 to-transparent">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-lg font-medium text-white">{currentUserName[0]}</span>
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-white text-lg">{currentUserName}</h2>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-slate-400 flex items-center gap-1">
                    <Folder className="w-3 h-3" />
                    分组 {Object.keys(groupByProjectAndType(tasks)).length}
                  </span>
                  <span className="text-sm text-slate-400 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    任务 {tasks.length}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="border-t border-slate-700/50">
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
                                
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={reportData[task.id]?.completedQuantity || ''}
                                    onChange={(e) => handleChange(task.id, 'completedQuantity', e.target.value)}
                                    placeholder="0"
                                    className="bg-slate-900/50 border-slate-700 text-white w-20 h-7 text-xs"
                                  />
                                  <Input
                                    type="number"
                                    step="0.5"
                                    value={reportData[task.id]?.usedHours || ''}
                                    onChange={(e) => handleChange(task.id, 'usedHours', e.target.value)}
                                    placeholder="0"
                                    className="bg-slate-900/50 border-slate-700 text-white w-20 h-7 text-xs"
                                  />
                                </div>
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className={`text-xs ${task.status === '待评审' || task.status === '待修改' ? 'text-orange-400 hover:bg-orange-500/10' : task.status === '已评审' ? 'text-green-400 hover:bg-green-500/10' : 'text-slate-500 hover:bg-slate-700'}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {task.status === '待评审' || task.status === '待修改' ? '批示' : '已批示'}
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-slate-500 hover:text-blue-400 hover:bg-blue-500/10"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="w-4 h-4" />
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
    </div>
  )
}