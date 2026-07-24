import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTaskTotalTarget(task: any, workDaysPerMonth?: number): number {
  if (task.type !== '日常任务' && task.type !== '临时任务') {
    return task.targetQuantity || 0
  }
  
  const frequency = task.frequency || '每日'
  const targetQuantity = task.targetQuantity || 0
  
  if (frequency === '每日') {
    const workingDays = workDaysPerMonth || 22
    return workingDays * targetQuantity
  } else if (frequency === '每周') {
    return 4 * targetQuantity
  } else if (frequency === '每月') {
    return targetQuantity
  }
  
  return targetQuantity
}

export function getTaskProgress(task: any, workDaysPerMonth?: number): number {
  const total = getTaskTotalTarget(task, workDaysPerMonth)
  if (total <= 0) return 0
  return Math.round(((task.completedQuantity || 0) / total) * 100)
}
