'use client'

import { OnboardingCard } from '@/components/settings/onboarding-card'
import { ApiKeyForm } from '@/components/settings/api-key-form'
import { DefaultModels } from '@/components/settings/default-models'
import { ExecutionPreferences } from '@/components/settings/execution-preferences'
import { UsageOverview } from '@/components/settings/usage-overview'
import { DataManagement } from '@/components/settings/data-management'
import { SettingsToc } from '@/components/settings/settings-toc'

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg)]">
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 h-[52px] flex items-center border-b border-[var(--border)] bg-[var(--surface)] backdrop-blur-sm">
        <h1 className="font-[family-name:var(--font-display)] text-lg text-[var(--text)]">
          Settings
        </h1>
      </div>

      {/* Content with TOC */}
      <div className="flex gap-8 px-6 py-8 max-w-4xl mx-auto">
        <SettingsToc />

        <div className="flex-1 max-w-2xl flex flex-col gap-6">
          <section id="onboarding">
            <OnboardingCard />
          </section>
          <section id="api-keys">
            <ApiKeyForm />
          </section>
          <section id="default-models">
            <DefaultModels />
          </section>
          <section id="execution">
            <ExecutionPreferences />
          </section>
          <section id="usage">
            <UsageOverview />
          </section>
          <section id="data-management">
            <DataManagement />
          </section>
          <div className="h-8" />
        </div>
      </div>
    </div>
  )
}
