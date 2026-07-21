import axios from 'axios'
import type { Report, Comment, Review } from '@/types'

const API_BASE_URL = '/api'

export async function getReports(token: string): Promise<Report[]> {
  const response = await axios.get(`${API_BASE_URL}/reports`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export async function getDailyReports(token: string, params?: { userId?: number; reportDate?: string }): Promise<Report[]> {
  const response = await axios.get(`${API_BASE_URL}/reports/daily`, {
    headers: { Authorization: `Bearer ${token}` },
    params
  })
  return response.data
}

export async function getWeeklyReports(token: string, params?: { userId?: number }): Promise<any[]> {
  const response = await axios.get(`${API_BASE_URL}/reports/weekly`, {
    headers: { Authorization: `Bearer ${token}` },
    params
  })
  return response.data
}

export async function getMonthlyReports(token: string, params?: { userId?: number }): Promise<any[]> {
  const response = await axios.get(`${API_BASE_URL}/reports/monthly`, {
    headers: { Authorization: `Bearer ${token}` },
    params
  })
  return response.data
}

export async function createReport(token: string, data: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report> {
  const response = await axios.post(`${API_BASE_URL}/reports`, data, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export async function updateReport(token: string, id: number, data: Partial<Report>): Promise<Report> {
  const response = await axios.put(`${API_BASE_URL}/reports/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export async function deleteReport(token: string, id: number): Promise<void> {
  await axios.delete(`${API_BASE_URL}/reports/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export async function addComment(token: string, reportId: number, data: { userId: number; content: string }): Promise<Comment> {
  const response = await axios.post(`${API_BASE_URL}/reports/${reportId}/comment`, data, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export async function addReview(token: string, reportId: number, data: { reviewerId: number; score: number }): Promise<Review> {
  const response = await axios.post(`${API_BASE_URL}/reports/${reportId}/review`, data, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}