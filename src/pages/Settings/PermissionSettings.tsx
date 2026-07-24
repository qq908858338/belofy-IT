﻿﻿﻿﻿﻿﻿﻿import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, User, Eye } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'
import { NAVIGATION_PERMISSIONS, MENU_ITEMS } from '@/types/permission'
import { getUsers } from '@/api/user'

export default function PermissionSettings() {
  const [loading, setLoading] = useState(true)
  
  const { token } = useAuthStore()
  const { users, setUsers } = useUserStore()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const usersData = await getUsers(token!)
      setUsers(usersData)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMenuName = (menuId: string) => {
    const menu = MENU_ITEMS.find(m => m.id === menuId)
    return menu?.name || menuId
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">权限设置</h1>
        </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <p className="text-slate-400">暂无用户数据</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => {
            const visibleMenus = NAVIGATION_PERMISSIONS[user.username] || []
            
            return (
              <Card key={user.id} className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <span className="font-medium text-white">{user.nickname[0]}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{user.nickname}</h3>
                      <p className="text-sm text-slate-500">{user.department}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-400">可见导航：</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {visibleMenus.length > 0 ? (
                        visibleMenus.map((menuId) => (
                          <Badge key={menuId} variant="secondary" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
                            {getMenuName(menuId)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">无可见导航</span>
                      )}
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