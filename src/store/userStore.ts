import { create } from 'zustand'
import type { User, Department } from '@/types'

interface UserStore {
  users: User[]
  departments: Department[]
  setUsers: (users: User[]) => void
  addUser: (user: User) => void
  updateUser: (user: User) => void
  deleteUser: (userId: number) => void
  setDepartments: (departments: Department[]) => void
  addDepartment: (department: Department) => void
  updateDepartment: (department: Department) => void
  deleteDepartment: (departmentId: number) => void
}

export const useUserStore = create<UserStore>()((set) => ({
  users: [],
  departments: [],
  setUsers: (users) => set({ users }),
  addUser: (user) => set((state) => ({ users: [...state.users, user] })),
  updateUser: (user) => set((state) => ({
    users: state.users.map((u) => (u.id === user.id ? user : u))
  })),
  deleteUser: (userId) => set((state) => ({
    users: state.users.filter((u) => u.id !== userId)
  })),
  setDepartments: (departments) => set({ departments }),
  addDepartment: (department) => set((state) => ({
    departments: [...state.departments, department]
  })),
  updateDepartment: (department) => set((state) => ({
    departments: state.departments.map((d) => (d.id === department.id ? department : d))
  })),
  deleteDepartment: (departmentId) => set((state) => ({
    departments: state.departments.filter((d) => d.id !== departmentId)
  })),
}))