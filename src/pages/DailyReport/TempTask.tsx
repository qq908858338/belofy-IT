﻿﻿﻿﻿﻿﻿﻿import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Send } from 'lucide-react'

export default function TempTask() {
  const [formData, setFormData] = useState({
    name: '',
    priority: 'P2',
    status: '进行中',
    targetQuantity: '',
    unit: '',
    completedQuantity: '',
    hoursPerUnit: '',
    startTime: '',
    endTime: '',
    description: '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    alert('临时任务创建成功')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">新建临时任务</h1>
          </div>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">任务名称</label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="请输入任务名称"
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">优先级</label>
              <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P1" className="text-red-400">P1 - 紧急</SelectItem>
                  <SelectItem value="P2" className="text-orange-400">P2 - 一般</SelectItem>
                  <SelectItem value="P3" className="text-blue-400">P3 - 普通</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">状态</label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="进行中">进行中</SelectItem>
                  <SelectItem value="已完成">已完成</SelectItem>
                  <SelectItem value="待修改">待修改</SelectItem>
                  <SelectItem value="已延期">已延期</SelectItem>
                  <SelectItem value="待评审">待评审</SelectItem>
                  <SelectItem value="已评审">已评审</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">目标数量</label>
              <Input
                type="number"
                value={formData.targetQuantity}
                onChange={(e) => handleChange('targetQuantity', e.target.value)}
                placeholder="请输入目标数量"
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">单位</label>
              <Input
                value={formData.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                placeholder="如：个、小时、件"
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">已完成数量</label>
              <Input
                type="number"
                value={formData.completedQuantity}
                onChange={(e) => handleChange('completedQuantity', e.target.value)}
                placeholder="请输入已完成数量"
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">工时/单位</label>
              <Input
                type="number"
                step="0.5"
                value={formData.hoursPerUnit}
                onChange={(e) => handleChange('hoursPerUnit', e.target.value)}
                placeholder="请输入工时/单位"
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">开始时间</label>
              <Input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">结束时间</label>
              <Input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">描述</label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="请输入任务描述"
              className="bg-slate-900/50 border-slate-700 text-white"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" className="bg-slate-900/50 text-slate-400 border-slate-700 hover:text-white">
              取消
            </Button>
            <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              <Send className="w-4 h-4 mr-2" />
              提交
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}