﻿﻿﻿import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, CalendarDays, Users, TrendingUp } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { getTasks } from '@/api/task'
import { getUsers } from '@/api/user'
import { getReports } from '@/api/report'

export default function Dashboard() {
  const { user, token } = useAuthStore()
  const [stats, setStats] = useState({
    todayReports: 0,
    inProgressTasks: 0,
    teamMembers: 0,
    weeklyCompletion: 0,
  })
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [tasksData, usersData, reportsData] = await Promise.all([
        getTasks(token!),
        getUsers(token!),
        getReports(token!),
      ])

      const today = new Date().toISOString().split('T')[0]
      const todayReports = reportsData.filter(r => 
        r.reportDate.startsWith(today)
      ).length

      const inProgressTasks = tasksData.filter(t => 
        t.status === '进行中' || t.status === '待评审'
      ).length

      const completedTasks = tasksData.filter(t => t.status === '已完成').length
      const weeklyCompletion = tasksData.length > 0 
        ? Math.round((completedTasks / tasksData.length) * 100)
        : 0

      setStats({
        todayReports,
        inProgressTasks,
        teamMembers: usersData.length,
        weeklyCompletion,
      })

      setTasks(tasksData.slice(0, 3))
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statItems = [
    {
      title: '今日日报',
      value: stats.todayReports,
      icon: FileText,
      color: 'bg-blue-500/10 text-blue-400',
    },
    {
      title: '进行中任务',
      value: stats.inProgressTasks,
      icon: CalendarDays,
      color: 'bg-green-500/10 text-green-400',
    },
    {
      title: '团队成员',
      value: stats.teamMembers,
      icon: Users,
      color: 'bg-purple-500/10 text-purple-400',
    },
    {
      title: '本周完成',
      value: `${stats.weeklyCompletion}%`,
      icon: TrendingUp,
      color: 'bg-orange-500/10 text-orange-400',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">欢迎回来，{user?.nickname}</h1>
        </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((stat) => (
          <Card key={stat.title} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-sm text-slate-400">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">近期任务</h2>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-slate-400 text-center py-8">暂无任务数据</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
                    <div>
                      <p className="font-medium text-white">{task.name}</p>
                      <p className="text-sm text-slate-500">{task.status}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      task.priority === 'P1' ? 'bg-red-500/10 text-red-400' :
                      task.priority === 'P2' ? 'bg-orange-500/10 text-orange-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">团队动态</h2>
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <p className="text-slate-400 text-center py-8">暂无动态</p>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">暂无动态数据</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}