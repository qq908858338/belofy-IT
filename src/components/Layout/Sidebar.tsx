import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  FileText, 
  LayoutDashboard, 
  Settings, 
  CalendarDays, 
  Bell, 
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { MENU_ITEMS, NAVIGATION_PERMISSIONS } from '@/types/permission'

const iconMap: Record<string, React.ReactNode> = {
  FileText: <FileText className="w-5 h-5" />,
  LayoutDashboard: <LayoutDashboard className="w-5 h-5" />,
  Settings: <Settings className="w-5 h-5" />,
  CalendarDays: <CalendarDays className="w-5 h-5" />,
  Bell: <Bell className="w-5 h-5" />,
}

export default function Sidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})
  
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const visibleMenus = user ? NAVIGATION_PERMISSIONS[user.username] || [] : []
  const filteredMenuItems = MENU_ITEMS.filter((item) => visibleMenus.includes(item.id))

  const isActive = (path: string) => location.pathname.startsWith(path)

  const hasActiveChild = (menu: typeof MENU_ITEMS[0]) => {
    if (!menu.children) return false
    return menu.children.some(child => location.pathname.startsWith(child.path))
  }

  // 仅在菜单首次加载时根据激活状态初始化展开
  useEffect(() => {
    setExpandedMenus((prev) => {
      const next = { ...prev }
      let changed = false
      filteredMenuItems.forEach((menu) => {
        if (menu.children && next[menu.id] === undefined) {
          next[menu.id] = hasActiveChild(menu) || isActive(menu.path)
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [filteredMenuItems])

  // 手风琴效果：切换某菜单时，其他未选中的菜单自动收起
  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) => {
      const willExpand = !prev[menuId]
      const next: Record<string, boolean> = {}
      // 点击的菜单按其当前状态取反；其他有子菜单的菜单统一收起
      filteredMenuItems.forEach((menu) => {
        if (!menu.children) return
        if (menu.id === menuId) {
          next[menu.id] = willExpand
        } else {
          next[menu.id] = false
        }
      })
      return next
    })
  }

  // 展开指定菜单并收起其他菜单
  const expandMenuOnly = (menuId: string) => {
    setExpandedMenus((prev) => {
      // 已是展开状态则不重置
      if (prev[menuId]) return prev
      const next: Record<string, boolean> = {}
      filteredMenuItems.forEach((menu) => {
        if (!menu.children) return
        next[menu.id] = menu.id === menuId
      })
      return next
    })
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden text-white"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 transition-all duration-300 md:relative ${
          mobileMenuOpen ? 'w-64' : 'w-0 md:w-64'
        } bg-slate-900 border-r border-slate-800 overflow-hidden`}
      >
        <div className={`h-full flex flex-col ${mobileMenuOpen ? 'opacity-100' : 'md:opacity-100 opacity-0'}`}>
          <div className="p-4 border-b border-slate-800 flex items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-lg font-bold text-white">B</span>
              </div>
              <span className="font-bold text-white">贝洛菲科技</span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {filteredMenuItems.map((menu) => (
              <div key={menu.id} className="relative">
                <div className="flex items-center gap-1">
                  <Link
                    to={menu.path}
                    onClick={() => {
                      if (menu.children) {
                        expandMenuOnly(menu.id)
                      }
                    }}
                    className={cn(
                      "flex-1 inline-flex items-center justify-start gap-3 h-11 px-3 rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-all",
                      isActive(menu.path) 
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    )}
                  >
                    {iconMap[menu.icon]}
                    <span className="font-medium">{menu.name}</span>
                  </Link>
                  {menu.children && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="w-9 h-9 flex-shrink-0 text-slate-400 hover:text-white"
                      onClick={() => toggleMenu(menu.id)}
                    >
                      <ChevronRight
                        className={`w-4 h-4 transition-transform duration-200 ${
                          expandedMenus[menu.id] ? 'rotate-90' : ''
                        }`}
                      />
                    </Button>
                  )}
                </div>

                {menu.children && (
                  <div className={`ml-4 mt-1 space-y-1 border-l border-slate-800 pl-4 ${expandedMenus[menu.id] ? '' : 'hidden'}`}>
                    {menu.children.map((child) => (
                      <Link
                        key={child.id}
                        to={child.path}
                        className={cn(
                          "w-full inline-flex items-center justify-start gap-2 h-9 px-3 rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-all",
                          isActive(child.path)
                            ? 'bg-indigo-500/5 text-indigo-400'
                            : 'text-slate-500 hover:text-white hover:bg-slate-800'
                        )}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">{user?.nickname?.[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.nickname}</p>
                <p className="text-xs text-slate-500 truncate">{user?.department}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  )
}