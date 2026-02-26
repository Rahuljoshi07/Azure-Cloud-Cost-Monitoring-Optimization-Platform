import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useSidebarStore } from '../store/useStore'

export default function Layout() {
  const { isCollapsed } = useSidebarStore()

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f7] dark:bg-[#0a0a1a]">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[250px]'}`}>
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="bg-pattern min-h-full p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
