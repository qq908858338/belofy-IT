import axios from 'axios'
import type { SystemSetting, SystemLog } from '@/types'

const API_BASE_URL = '/api'

export async function getSettings(token: string): Promise<Record<string, string>> {
  const response = await axios.get(`${API_BASE_URL}/settings/data`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export async function updateSettings(token: string, data: Record<string, string>): Promise<void> {
  await axios.put(`${API_BASE_URL}/settings/data`, data, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export async function getLogs(token: string, params?: { action?: string; limit?: number; offset?: number }): Promise<SystemLog[]> {
  const response = await axios.get(`${API_BASE_URL}/logs`, {
    headers: { Authorization: `Bearer ${token}` },
    params
  })
  return response.data
}

export async function exportLogs(token: string): Promise<void> {
  const response = await axios.post(`${API_BASE_URL}/logs/export`, {}, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob'
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.download = 'logs.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}