﻿﻿﻿﻿﻿import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Download } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAchievementStore } from '@/store/achievementStore'
import { getAchievements } from '@/api/achievement'

export default function AchievementManagement() {
  const [loading, setLoading] = useState(true)
  
  const { token } = useAuthStore()
  const { achievements, setAchievements } = useAchievementStore()

  useEffect(() => {
    fetchAchievements()
  }, [])

  const fetchAchievements = async () => {
    setLoading(true)
    try {
      const data = await getAchievements(token!)
      setAchievements(data)
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    const styles: Record<string, string> = {
      '项目成果': 'bg-blue-500/10 text-blue-400',
      '任务成果': 'bg-green-500/10 text-green-400',
      '个人成果': 'bg-purple-500/10 text-purple-400',
      '团队成果': 'bg-orange-500/10 text-orange-400',
    }
    return styles[type] || 'bg-slate-500/10 text-slate-400'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">成果管理</h1>
          </div>
        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          上传成果
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : achievements.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <p className="text-slate-400">暂无成果数据</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <Card key={achievement.id} className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{achievement.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={getTypeColor(achievement.type)}>
                        {achievement.type}
                      </Badge>
                      <Badge variant="outline" className="bg-slate-700/50 text-slate-400">
                        {achievement.user?.department}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 h-8 w-8">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">{achievement.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <span className="text-xs font-medium text-white">{achievement.user?.nickname[0]}</span>
                    </div>
                    <span className="text-sm text-slate-500">{achievement.user?.nickname}</span>
                  </div>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(achievement.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}