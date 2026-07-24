export interface NavigationPermission {
  userId: number
  visibleMenus: string[]
}

export interface MenuItem {
  id: string
  name: string
  icon?: string
  path: string
  children?: MenuItem[]
}

export const NAVIGATION_PERMISSIONS: Record<string, string[]> = {
  roman: ['reports', 'management', 'settings'],
  laochen: ['reports', 'management', 'settings', 'daily-report', 'notifications'],
  golden: ['daily-report', 'notifications'],
  shilong: ['daily-report', 'notifications'],
  zhijun: ['reports'],
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'reports',
    name: '查看汇报',
    icon: 'FileText',
    path: '/dashboard/reports/daily',
    children: [
      { id: 'daily', name: '日报', path: '/dashboard/reports/daily' },
      { id: 'weekly', name: '周报', path: '/dashboard/reports/weekly' },
      { id: 'monthly', name: '月报', path: '/dashboard/reports/monthly' },
      { id: 'archived', name: '已归档', path: '/dashboard/reports/archived' },
    ],
  },
  {
    id: 'management',
    name: '全局管理',
    icon: 'LayoutDashboard',
    path: '/dashboard/management/tasks',
    children: [
      { id: 'tasks', name: '任务管理', path: '/dashboard/management/tasks' },
      { id: 'projects', name: '项目管理', path: '/dashboard/management/projects' },
      { id: 'people', name: '人员管理', path: '/dashboard/management/people' },
      { id: 'archived', name: '已归档', path: '/dashboard/management/archived' },
    ],
  },
  {
    id: 'settings',
    name: '系统设置',
    icon: 'Settings',
    path: '/dashboard/settings/users',
    children: [
      { id: 'users', name: '用户设置', path: '/dashboard/settings/users' },
      { id: 'permissions', name: '权限设置', path: '/dashboard/settings/permissions' },
      { id: 'data', name: '数据设置', path: '/dashboard/settings/data' },
      { id: 'logs', name: '日志管理', path: '/dashboard/settings/logs' },
    ],
  },
  {
    id: 'daily-report',
    name: '每日汇报',
    icon: 'CalendarDays',
    path: '/dashboard/daily-report/today',
    children: [
      { id: 'today', name: '今日日报', path: '/dashboard/daily-report/today' },
      { id: 'yesterday', name: '补登昨日', path: '/dashboard/daily-report/yesterday' },
    ],
  },
  {
    id: 'notifications',
    name: '最新指示',
    icon: 'Bell',
    path: '/dashboard/notifications/comments',
    children: [
      { id: 'comment', name: '查看指示', path: '/dashboard/notifications/comments' },
      { id: 'review', name: '查看评审', path: '/dashboard/notifications/reviews' },
    ],
  },
]