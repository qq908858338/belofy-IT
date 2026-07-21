import axios from 'axios'
import type { Project } from '@/types'

const API_BASE_URL = '/api'

export async function getProjects(token: string, params?: { userId?: number; isArchived?: boolean }): Promise<Project[]> {
  const response = await axios.get(`${API_BASE_URL}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
    params
  })
  return response.data
}

export async function createProject(token: string, data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'isArchived' | 'members'> & { members?: number[] }): Promise<Project> {
  const response = await axios.post(`${API_BASE_URL}/projects`, data, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export async function updateProject(token: string, id: number, data: Omit<Partial<Project>, 'members'> & { members?: number[] }): Promise<Project> {
  const response = await axios.put(`${API_BASE_URL}/projects/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export async function deleteProject(token: string, id: number): Promise<void> {
  await axios.delete(`${API_BASE_URL}/projects/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export async function reviewProject(token: string, id: number, data: { reviewerId: number; score: number }): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/projects/${id}/review`, data, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}