import axios from 'axios'
import type { Achievement } from '@/types'

const API_BASE = '/api/achievements'

export const getAchievements = async (token: string): Promise<Achievement[]> => {
  const response = await axios.get(API_BASE, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export const getAchievementById = async (token: string, id: number): Promise<Achievement> => {
  const response = await axios.get(`${API_BASE}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export const createAchievement = async (token: string, data: Partial<Achievement>): Promise<Achievement> => {
  const response = await axios.post(API_BASE, data, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export const updateAchievement = async (token: string, id: number, data: Partial<Achievement>): Promise<Achievement> => {
  const response = await axios.put(`${API_BASE}/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export const deleteAchievement = async (token: string, id: number): Promise<void> => {
  await axios.delete(`${API_BASE}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}