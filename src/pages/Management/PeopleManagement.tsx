import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Users, FolderKanban, ListTodo, Clock, TrendingUp, Award } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'
import { getUsers } from '@/api/user'
import { getTasks } from '@/api/task'
import { getProjects } from '@/api/project'
import { getReports } from '@/api/report'

export default function PeopleManagement() {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  
  const { token } = useAuthStore()
  const { users, setUsers } = useUserStore()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersData, tasksData, projectsData, reportsData] = await Promise.all([
        getUsers(token!),
        getTasks(token!),
        getProjects(token!),
        getReports(token!),
      ])
      
      setUsers(usersData)
      setTasks(tasksData)
      setProjects(projectsData)
      setReports(reportsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUserStats = (userId: number) => {
    const userTasks = tasks.filter(t => t.userId === userId)
    const userReports = reports.filter(r => r.userId === userId)
    
    const projectCount = projects.filter(p => 
      p.managerId === userId || (p.members && p.members.some((m: any) => m.userId === userId))
    ).length
    
    const taskCount = userTasks.length
    
    const totalHours = userTasks.reduce((sum, t) => 
      sum + (t.completedQuantity || 0) * (t.hoursPerUnit || 1), 0
    )
    
    const load = taskCount > 0 ? Math.min(Math.round((totalHours / 32) * 100), 150) : 0
    
    const reportCount = userReports.length
    
    const avgScore = userReports.length > 0 
      ? Math.round(userReports.reduce((sum, r) => sum + (r.score || 0), 0) / userReports.length)
      : 0
    
    const performanceScore = Math.round((reportCount * 10 + avgScore * 0.5 + (userTasks.filter(t => t.status === '已完成').length * 5)) / (reportCount > 0 ? 1 : 1))
    
    return {
      projectCount,
      taskCount,
      totalHours: `${totalHours}h`,
      load,
      reportCount,
      avgScore: avgScore || '--',
      performanceScore: Math.min(Math.max(performanceScore, 0), 100),
    }
  }

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { label: '优秀', color: 'text-green-400 bg-green-500/10' }
    if (score >= 80) return { label: '良好', color: 'text-blue-400 bg-blue-500/10' }
    if (score >= 70) return { label: '一般', color: 'text-yellow-400 bg-yellow-500/10' }
    if (score >= 60) return { label: '合格', color: 'text-orange-400 bg-orange-500/10' }
    return { label: '不合格', color: 'text-red-400 bg-red-500/10' }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">人员管理</h1>
        </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <p className="text-slate-400">暂无人员数据</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.filter(user => !['roman', 'zhijun'].includes(user.username)).map((user) => {
            const stats = getUserStats(user.id)
            const performance = getPerformanceLevel(stats.performanceScore)
            
            return (
              <Card key={user.id} className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <span className="font-medium text-white">{user.nickname[0]}</span>
                    </div>
                    <div>
                      <h2 className="font-semibold text-white">{user.nickname}</h2>
                      <Badge variant="outline" className="bg-slate-700/50 text-slate-400">
                        {user.department}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <FolderKanban className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">参与项目</p>
                        <p className="text-lg font-bold text-white">{stats.projectCount}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <ListTodo className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">负责任务</p>
                        <p className="text-lg font-bold text-white">{stats.taskCount}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">任务总工时 / 负荷</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-white">{stats.totalHours}</p>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${stats.load > 80 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                            {stats.load}%
                          </span>
                        </div>
                        <Progress value={stats.load} className="h-1.5 mt-1 bg-slate-700" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">提交日报数量</p>
                        <p className="text-lg font-bold text-white">{stats.reportCount}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">任务平均分</p>
                        <p className="text-lg font-bold text-white">{stats.avgScore}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Award className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">绩效评分</p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-white">{stats.performanceScore}</p>
                          <Badge variant="outline" className={performance.color}>
                            {performance.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}