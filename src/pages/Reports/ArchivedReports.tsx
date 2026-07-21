import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, CalendarDays, Calendar } from 'lucide-react'

const tabs = [
  { id: 'daily', name: '日报', icon: FileText },
  { id: 'weekly', name: '周报', icon: CalendarDays },
  { id: 'monthly', name: '月报', icon: Calendar },
]

export default function ArchivedReports() {
  const [activeTab, setActiveTab] = useState('daily')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">已归档</h1>
        </div>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'secondary' : 'outline'}
            className={`${activeTab === tab.id 
              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' 
              : 'bg-slate-900/50 text-slate-400 border-slate-700 hover:text-white'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.name}
          </Button>
        ))}
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
            {(() => {
              const TabIcon = tabs.find(t => t.id === activeTab)?.icon
              return TabIcon ? <TabIcon className="w-8 h-8 text-slate-600" /> : null
            })()}
          </div>
          <p className="text-slate-400">暂无{tabs.find(t => t.id === activeTab)?.name}归档数据</p>
        </CardContent>
      </Card>
    </div>
  )
}