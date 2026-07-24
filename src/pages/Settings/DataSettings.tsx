﻿﻿﻿﻿﻿﻿﻿﻿import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, Calculator, Scale, Calendar } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useSettingStore } from '@/store/settingStore'
import { getSettings, updateSettings } from '@/api/setting'

export default function DataSettings() {
  const [loading, setLoading] = useState(true)
  const [workDays, setWorkDays] = useState('22')
  const [dailyWeight, setDailyWeight] = useState('30')
  const [taskOnTimeWeight, setTaskOnTimeWeight] = useState('30')
  const [taskReviewWeight, setTaskReviewWeight] = useState('40')
  const [loadBaseHours, setLoadBaseHours] = useState('40')
  
  const { token } = useAuthStore()
  const { settings, setSettings } = useSettingStore()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const data = await getSettings(token!)
      setSettings(data)
      setWorkDays(data.workDaysPerMonth || '22')
      setDailyWeight(data.dailyReportWeight || '30')
      setTaskOnTimeWeight(data.taskOnTimeWeight || '30')
      setTaskReviewWeight(data.taskReviewWeight || '40')
      setLoadBaseHours(data.loadBaseHours || '40')
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await updateSettings(token!, {
        workDaysPerMonth: workDays,
        dailyReportWeight: dailyWeight,
        taskOnTimeWeight: taskOnTimeWeight,
        taskReviewWeight: taskReviewWeight,
        loadBaseHours: loadBaseHours,
      })
      setSettings({
        workDaysPerMonth: workDays,
        dailyReportWeight: dailyWeight,
        taskOnTimeWeight: taskOnTimeWeight,
        taskReviewWeight: taskReviewWeight,
        loadBaseHours: loadBaseHours,
      })
      alert('设置已保存')
    } catch (error) {
      console.error('Failed to update settings:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">数据设置</h1>
          </div>
        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white">
          <Save className="w-4 h-4 mr-2" />
          保存设置
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calculator className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">负荷计算公式</h2>
                <p className="text-sm text-slate-500">人员负荷 = (任务量化数 × 工时单位 - 已完成任务量化数 × 工时单位) / 基准工时 × 100%</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  负荷基准工时（小时）
                </label>
                <Input
                  type="number"
                  value={loadBaseHours}
                  onChange={(e) => setLoadBaseHours(e.target.value)}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4 mt-8">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Scale className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">绩效评分权重</h2>
                <p className="text-sm text-slate-500">总分 = 日报得分 + 任务准时率得分 + 任务评审得分</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">日报权重（分）</label>
                <Input
                  type="number"
                  value={dailyWeight}
                  onChange={(e) => setDailyWeight(e.target.value)}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-500">缺一次扣2分</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">任务准时率权重（分）</label>
                <Input
                  type="number"
                  value={taskOnTimeWeight}
                  onChange={(e) => setTaskOnTimeWeight(e.target.value)}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-500">每延期1天扣2分</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">任务评审权重（分）</label>
                <Input
                  type="number"
                  value={taskReviewWeight}
                  onChange={(e) => setTaskReviewWeight(e.target.value)}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-500">一般扣3分，合格扣5分，不合格扣20分</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4 mt-8">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">考勤设置</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">本月上班天数</label>
                <Input
                  type="number"
                  value={workDays}
                  onChange={(e) => setWorkDays(e.target.value)}
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}