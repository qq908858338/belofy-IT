import axios from 'axios'
import type { User } from '@/types'

const API_BASE_URL = '/api'

export interface LoginResponse {
  token: string
  user: User
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, { username, password })
  return response.data
}

export async function getMe(token: string): Promise<User> {
  const response = await axios.get(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}