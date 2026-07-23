export interface User {
  id: number
  username: string
  nickname: string
  departmentId: number
  department: string
  createdAt: string
  updatedAt: string
}

export interface Department {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: number
  name: string
  type: string
  status: string
  priority: string
  targetQuantity: number
  unit: string
  completedQuantity: number
  hoursPerUnit: number
  startTime: string
  endTime: string
  description?: string
  projectId?: number
  userId: number
  isArchived: boolean
  createdAt: string
  updatedAt: string
  user?: User
  project?: Project
  members?: TaskMember[]
  frequency?: string
  dailyDescription?: string
}

export interface TaskMember {
  id: number
  taskId: number
  userId: number
  user?: User
}

export interface Project {
  id: number
  name: string
  description?: string
  icon?: string
  startTime?: string
  endTime?: string
  status: string
  managerId: number
  isArchived: boolean
  createdAt: string
  updatedAt: string
  manager?: User
  tasks?: Task[]
  members?: ProjectMember[]
}

export interface ProjectMember {
  id: number
  projectId: number
  userId: number
  isManager: boolean
  user?: User
}

export interface Report {
  id: number
  type: string
  userId: number
  taskId: number
  completedQuantity: number
  usedHours: number
  status: string
  reportDate: string
  createdAt: string
  updatedAt: string
  user?: User
  task?: Task
  comments?: Comment[]
  reviews?: Review[]
}

export interface Comment {
  id: number
  reportId: number
  userId: number
  content: string
  createdAt: string
  user?: User
}

export interface Review {
  id: number
  type: string
  targetId: number
  reviewerId: number
  score: number
  level: string
  createdAt: string
  reviewer?: User
}

export interface Achievement {
  id: number
  taskId: number
  projectId?: number
  userId?: number
  type: string
  url: string
  fileName?: string
  title?: string
  description?: string
  createdAt: string
  user?: User
}

export interface SystemSetting {
  key: string
  value: string
}

export interface SystemLog {
  id: number
  action: string
  userId?: number
  description: string
  createdAt: string
  user?: User
}

export type TaskType = '项目任务' | '日常任务' | '临时任务'
export type TaskStatus = '进行中' | '已完成' | '待修改' | '已延期' | '待评审' | '已评审'
export type ProjectStatus = '待立项' | '进行中' | '待评审' | '已评审' | '已延期'
export type Priority = 'P1' | 'P2' | 'P3'