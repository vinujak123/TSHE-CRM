'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TrashBin } from '@/components/campaigns/trash-bin'

export default function TrashPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Trash Bin</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View and restore deleted campaigns. Items can be recovered but cannot be permanently deleted.
          </p>
        </div>
        <TrashBin />
      </div>
    </DashboardLayout>
  )
}
