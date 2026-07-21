﻿import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popconfirm } from '@/components/ui/popconfirm'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2, Users, Building2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'
import { getUsers, deleteUser, getDepartments, createUser, createDepartment, deleteDepartment } from '@/api/user'

export default function UserSettings() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users')
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false)
  const [showCreateDeptDialog, setShowCreateDeptDialog] = useState(false)
  
  const { token } = useAuthStore()
  const { users, setUsers, departments, setDepartments, deleteUser: removeUser, addUser, addDepartment, deleteDepartment: removeDepartment } = useUserStore()

  const [userFormData, setUserFormData] = useState({
    username: '',
    nickname: '',
    password: '',
    departmentId: '',
  })

  const [deptFormData, setDeptFormData] = useState({
    name: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersData, deptsData] = await Promise.all([
        getUsers(token!),
        getDepartments(token!)
      ])
      setUsers(usersData)
      setDepartments(deptsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    try {
      await deleteUser(token!, userId)
      removeUser(userId)
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const handleDeleteDepartment = async (deptId: number) => {
    try {
      await deleteDepartment(token!, deptId)
      removeDepartment(deptId)
    } catch (error) {
      console.error('Failed to delete department:', error)
    }
  }

  const handleCreateUser = async () => {
    try {
      const newUser = await createUser(token!, {
        username: userFormData.username,
        nickname: userFormData.nickname,
        password: userFormData.password,
        departmentId: parseInt(userFormData.departmentId),
      })
      addUser(newUser)
      setShowCreateUserDialog(false)
      setUserFormData({ username: '', nickname: '', password: '', departmentId: '' })
    } catch (error) {
      console.error('Failed to create user:', error)
    }
  }

  const handleCreateDepartment = async () => {
    try {
      const newDept = await createDepartment(token!, deptFormData.name)
      addDepartment(newDept)
      setShowCreateDeptDialog(false)
      setDeptFormData({ name: '' })
    } catch (error) {
      console.error('Failed to create department:', error)
    }
  }

  const tabs = [
    { id: 'users', name: '用户管理', icon: Users },
    { id: 'departments', name: '部门设置', icon: Building2 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">用户设置</h1>
          </div>
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

      {activeTab === 'users' && (
        <>
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white" onClick={() => setShowCreateUserDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建用户
          </Button>

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
              {users.map((user) => (
                <Card key={user.id} className="bg-slate-900/50 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <span className="font-medium text-white">{user.nickname[0]}</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{user.nickname}</h3>
                          <p className="text-sm text-slate-500">@{user.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 h-8 w-8">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Popconfirm title="确定删除此用户？" onConfirm={() => handleDeleteUser(user.id)}>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-8 w-8">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Popconfirm>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Badge variant="outline" className="bg-slate-700/50 text-slate-400">
                        {user.department}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'departments' && (
        <>
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white" onClick={() => setShowCreateDeptDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建部门
          </Button>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : departments.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-12 text-center">
                <p className="text-slate-400">暂无部门数据</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {departments.map((dept) => (
                <Card key={dept.id} className="bg-slate-900/50 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white">{dept.name}</h3>
                        <p className="text-sm text-slate-500">{users.filter(u => u.departmentId === dept.id).length} 名成员</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 h-8 w-8">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Popconfirm title="确定删除此部门？" onConfirm={() => handleDeleteDepartment(dept.id)}>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-8 w-8">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Popconfirm>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">新建用户</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">用户名</label>
              <Input
                value={userFormData.username}
                onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                placeholder="请输入用户名"
                className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">昵称</label>
              <Input
                value={userFormData.nickname}
                onChange={(e) => setUserFormData({ ...userFormData, nickname: e.target.value })}
                placeholder="请输入昵称"
                className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">密码</label>
              <Input
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                placeholder="请输入密码"
                className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">部门</label>
              <select
                value={userFormData.departmentId}
                onChange={(e) => setUserFormData({ ...userFormData, departmentId: e.target.value })}
                className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">请选择部门</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" className="bg-slate-800 text-slate-300 hover:bg-slate-700" onClick={() => setShowCreateUserDialog(false)}>取消</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white" onClick={handleCreateUser}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDeptDialog} onOpenChange={setShowCreateDeptDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">新建部门</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">部门名称</label>
              <Input
                value={deptFormData.name}
                onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                placeholder="请输入部门名称"
                className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" className="bg-slate-800 text-slate-300 hover:bg-slate-700" onClick={() => setShowCreateDeptDialog(false)}>取消</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white" onClick={handleCreateDepartment}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}