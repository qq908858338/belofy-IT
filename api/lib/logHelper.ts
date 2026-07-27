import prisma from './prisma.js'

export async function recordLog(userId: number | undefined, action: string, description: string) {
  try {
    await prisma.systemLog.create({
      data: {
        action,
        userId,
        description
      }
    })
  } catch (error) {
    console.error('Failed to record log:', error)
  }
}

export function generateLogDescription(action: string, entity: string, data?: any): string {
  const name = data?.name || data?.nickname || data?.title || '未命名'
  
  const templates: Record<string, string> = {
    'login': `登录系统`,
    'logout': `退出登录`,
    'create_project': `创建了项目"${name}"`,
    'update_project': `更新了项目"${name}"的信息`,
    'delete_project': `删除了项目"${name}"`,
    'create_task': `创建了任务"${name}"`,
    'update_task': `更新了任务"${name}"的信息`,
    'delete_task': `删除了任务"${name}"`,
    'create_user': `创建了用户"${name}"`,
    'update_user': `更新了用户"${name}"的信息`,
    'delete_user': `删除了用户"${name}"`,
    'create_department': `创建了部门"${name}"`,
    'update_department': `更新了部门"${name}"的信息`,
    'delete_department': `删除了部门"${name}"`,
    'submit_report': `提交了日报`,
    'update_report': `更新了日报`,
    'review_report': `评审了日报`,
    'update_setting': `更新了系统设置`,
    'upload_achievement': `上传了成果"${name}"`,
    'delete_achievement': `删除了成果"${name}"`,
  }
  
  return templates[action] || `${action}: ${name}`
}
