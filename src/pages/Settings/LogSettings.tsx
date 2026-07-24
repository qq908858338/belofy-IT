﻿﻿﻿﻿﻿﻿﻿import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, FileText, Search } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useSettingStore } from '@/store/settingStore'
import { getLogs, exportLogs } from '@/api/setting'
import type { SystemLog } from '@/types'

export default function LogSettings() {
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')
  
  const { token } = useAuthStore()
  const { logs, setLogs } = useSettingStore()

  useEffect(() => {
    fetchLogs()
  }, [actionFilter])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const logsData = await getLogs(token!, { action: actionFilter || undefined })
      setLogs(logsData)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      await exportLogs(token!)
    } catch (error) {
      console.error('Failed to export logs:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">日志管理</h1>
          </div>
        <Button onClick={handleExport} className="bg-indigo-600 hover:bg-indigo-500 text-white">
          <Download className="w-4 h-4 mr-2" />
          导出日志
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
              <SelectValue placeholder="筛选操作类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部操作</SelectItem>
              <SelectItem value="login">登录</SelectItem>
              <SelectItem value="create">创建</SelectItem>
              <SelectItem value="update">更新</SelectItem>
              <SelectItem value="delete">删除</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">暂无日志数据</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left p-4 text-sm font-medium text-slate-400">时间</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-400">用户</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-400">操作</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-400">描述</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="p-4 text-sm text-white">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-4 text-sm text-slate-400">{log.user?.nickname || '-'}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-500/10 text-indigo-400">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-300">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}