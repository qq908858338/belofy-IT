import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CalendarDays, Send } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useTaskStore } from '@/store/taskStore'
import { getTasks } from '@/api/task'
import type { Task } from '@/types'
import { getTaskProgress as calcTaskProgress, getTaskTotalTarget } from '@/lib/utils'

export default function YesterdayReport() {
  const [loading, setLoading] = useState(true)
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
        initialData[t.id] = { completedQuantity: 0, usedHours: 0 }
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
    alert('昨日日报补登成功')
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const groupedTasks = tasks.reduce((acc, task) => {
    const key = task.type
    if (!acc[key]) acc[key] = []
    acc[key].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">补登昨日日报</h1>
          <p className="text-slate-400 mt-1">
            <CalendarDays className="w-4 h-4 inline mr-1" />
            {yesterday.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
        <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-500 text-white">
          <Send className="w-4 h-4 mr-2" />
          提交日报
        </Button>
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
        Object.entries(groupedTasks).map(([type, typeTasks]) => (
          <Card key={type} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <h2 className="font-semibold text-white mb-4">{type}</h2>
              
              <div className="space-y-4">
                {typeTasks.map((task) => {
                  const progress = calcTaskProgress(task)
                  
                  return (
                    <div key={task.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-white">{task.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="bg-slate-700/50 text-slate-400">
                              {task.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-500">任务进度</span>
                        <span className="text-sm text-white font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2 bg-slate-700 mb-4" />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm text-slate-500">完成量化数</label>
                          <Input
                            type="number"
                            value={reportData[task.id]?.completedQuantity || ''}
                            onChange={(e) => handleChange(task.id, 'completedQuantity', e.target.value)}
                            placeholder="0"
                            className="bg-slate-900/50 border-slate-700 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-slate-500">所用工时（小时）</label>
                          <Input
                            type="number"
                            step="0.5"
                            value={reportData[task.id]?.usedHours || ''}
                            onChange={(e) => handleChange(task.id, 'usedHours', e.target.value)}
                            placeholder="0"
                            className="bg-slate-900/50 border-slate-700 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}