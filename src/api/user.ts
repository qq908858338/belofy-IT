import axios from 'axios'
import type { User, Department } from '@/types'

const API_BASE_URL = '/api'

export async function getUsers(token: string): Promise<User[]> {
  const response = await axios.get(`${API_BASE_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export async function createUser(token: string, data: {
  username: string
  nickname: string
  departmentId: number
  password: string
}): Promise<User> {
  const response = await axios.post(`${API_BASE_URL}/users`, data, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export async function updateUser(token: string, id: number, data: Partial<User> & { password?: string }): Promise<User> {
  const response = await axios.put(`${API_BASE_URL}/users/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export async function deleteUser(token: string, id: number): Promise<void> {
  await axios.delete(`${API_BASE_URL}/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export async function getDepartments(token: string): Promise<Department[]> {
  const response = await axios.get(`${API_BASE_URL}/departments`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export async function createDepartment(token: string, name: string): Promise<Department> {
  const response = await axios.post(`${API_BASE_URL}/departments`, { name }, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export async function updateDepartment(token: string, id: number, name: string): Promise<Department> {
  const response = await axios.put(`${API_BASE_URL}/departments/${id}`, { name }, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export async function deleteDepartment(token: string, id: number): Promise<void> {
  await axios.delete(`${API_BASE_URL}/departments/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}