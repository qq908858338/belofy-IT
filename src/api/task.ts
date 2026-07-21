import axios from 'axios'
import type { Task } from '@/types'

const API_BASE_URL = '/api'

export async function getTasks(token: string, params?: { userId?: number; type?: string; isArchived?: boolean; projectId?: number }): Promise<Task[]> {
  const response = await axios.get(`${API_BASE_URL}/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
    params
  })
  return response.data
}

export async function createTask(token: string, data: { name: string; userId: number; targetQuantity: number; projectId?: number; members?: number[] } & Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isArchived' | 'members' | 'name' | 'userId' | 'targetQuantity' | 'projectId'>>): Promise<Task> {
  const response = await axios.post(`${API_BASE_URL}/tasks`, data, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export async function updateTask(token: string, id: number, data: { members?: number[] } & Partial<Omit<Task, 'id' | 'members'>>): Promise<Task> {
  const response = await axios.put(`${API_BASE_URL}/tasks/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export async function deleteTask(token: string, id: number): Promise<void> {
  await axios.delete(`${API_BASE_URL}/tasks/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}