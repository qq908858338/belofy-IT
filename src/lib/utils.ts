import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function countWorkingDaysInMonth(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  let count = 0
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, month, day)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) count++
  }
  return count
}

export function getTaskTotalTarget(task: any): number {
  if (task.type !== '日常任务' && task.type !== '临时任务') {
    return task.targetQuantity || 0
  }
  
  const frequency = task.frequency || '每日'
  const targetQuantity = task.targetQuantity || 0
  
  if (frequency === '每日') {
    const workingDays = countWorkingDaysInMonth()
    return workingDays * targetQuantity
  } else if (frequency === '每周') {
    return 4 * targetQuantity
  } else if (frequency === '每月') {
    return targetQuantity
  }
  
  return targetQuantity
}

export function getTaskProgress(task: any): number {
  const total = getTaskTotalTarget(task)
  if (total <= 0) return 0
  return Math.round(((task.completedQuantity || 0) / total) * 100)
}
