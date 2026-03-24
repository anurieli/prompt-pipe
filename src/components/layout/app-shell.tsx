'use client'

import { Topbar } from '@/components/layout/topbar'
import { AppSidebar } from '@/components/layout/app-sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        {children}
      </div>
    </div>
  )
}
