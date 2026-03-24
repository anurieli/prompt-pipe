'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { QueueList } from '@/components/queue/queue-list'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  disabled?: boolean
}

function NavIcon({ d }: { d: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/analytics',
    label: 'Analytics',
    icon: <NavIcon d="M4 13V8M8 13V3M12 13V6" />,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path
          d="M6.5 1.5h3l.4 1.7.6.3 1.6-.7 2.1 2.1-.7 1.6.3.6 1.7.4v3l-1.7.4-.3.6.7 1.6-2.1 2.1-1.6-.7-.6.3-.4 1.7h-3l-.4-1.7-.6-.3-1.6.7-2.1-2.1.7-1.6-.3-.6L.5 9.5v-3l1.7-.4.3-.6-.7-1.6 2.1-2.1 1.6.7.6-.3L6.5 1.5z"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
        />
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'Profile',
    disabled: true,
    icon: <NavIcon d="M8 7a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" />,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside
      aria-label="Navigation sidebar"
      className="w-[280px] border-r border-[var(--border)] bg-[var(--bg-warm)] flex flex-col shrink-0"
    >
      {/* Queue — always visible */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <QueueList />
      </div>

      {/* Navigation footer */}
      <div className="border-t border-[var(--border)] px-3 py-3">
        {/* Quote */}
        <p className="font-[family-name:var(--font-display)] text-[11px] text-[var(--text-muted)] italic leading-relaxed mb-3">
          Every idea is a prompt. Every prompt gets a pipeline.
        </p>

        {/* Nav links */}
        <nav aria-label="Main navigation" className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href)

            if (item.disabled) {
              return (
                <span
                  key={item.label}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-[var(--r)] text-[var(--text-faint)] cursor-not-allowed"
                >
                  {item.icon}
                  <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em]">
                    {item.label}
                  </span>
                </span>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center gap-2.5 px-2 py-1.5 rounded-[var(--r)] transition-all duration-150',
                  isActive
                    ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface)]',
                ].join(' ')}
              >
                {item.icon}
                <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em]">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
