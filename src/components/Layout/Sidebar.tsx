import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  LayoutDashboard, 
  Settings, 
  CalendarDays, 
  Bell, 
  LogOut,
  ChevronRight,
  Menu,
  X
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
  const [expanded, setExpanded] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const visibleMenus = user ? NAVIGATION_PERMISSIONS[user.username] || [] : []
  const filteredMenuItems = MENU_ITEMS.filter((item) => visibleMenus.includes(item.id))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname.startsWith(path)

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
          <div className={`p-4 border-b border-slate-800 flex items-center justify-between ${expanded ? '' : 'justify-center'}`}>
            {expanded && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">B</span>
                </div>
                <span className="font-bold text-white">贝洛菲科技</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white"
              onClick={() => setExpanded(!expanded)}
            >
              <ChevronRight className={`w-5 h-5 transition-transform ${expanded ? '' : 'rotate-180'}`} />
            </Button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {filteredMenuItems.map((menu) => (
              <div key={menu.id} className="relative">
                <Button
                  variant={isActive(menu.path) ? 'secondary' : 'ghost'}
                  className={`w-full justify-start gap-3 h-11 ${
                    isActive(menu.path) 
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  onClick={() => navigate(menu.path)}
                >
                  {iconMap[menu.icon]}
                  {expanded && <span className="font-medium">{menu.name}</span>}
                </Button>

                {expanded && menu.children && (
                  <div className={`ml-4 mt-1 space-y-1 border-l border-slate-800 pl-4 ${isActive(menu.path) ? '' : 'hidden'}`}>
                    {menu.children.map((child) => (
                      <Button
                        key={child.id}
                        variant={isActive(child.path) ? 'secondary' : 'ghost'}
                        className={`w-full justify-start gap-2 h-9 text-sm ${
                          isActive(child.path)
                            ? 'bg-indigo-500/5 text-indigo-400'
                            : 'text-slate-500 hover:text-white hover:bg-slate-800'
                        }`}
                        onClick={() => navigate(child.path)}
                      >
                        {child.name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className={`flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 ${expanded ? '' : 'justify-center'}`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">{user?.nickname?.[0]}</span>
              </div>
              {expanded && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.nickname}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.department}</p>
                </div>
              )}
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