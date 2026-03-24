'use client'

import { useState } from 'react'

const QUOTES = [
  { text: 'An idea that is not dangerous is unworthy of being called an idea at all.', author: 'Oscar Wilde' },
  { text: 'The best way to have a good idea is to have a lot of ideas.', author: 'Linus Pauling' },
  { text: 'Ideas are like rabbits. You get a couple and learn how to handle them, and pretty soon you have a dozen.', author: 'John Steinbeck' },
  { text: 'Everything begins with an idea.', author: 'Earl Nightingale' },
  { text: "You can have brilliant ideas, but if you can't get them across, your ideas won't get you anywhere.", author: 'Lee Iacocca' },
  { text: 'No idea is so outlandish that it should not be considered.', author: 'Winston Churchill' },
  { text: 'An idea is salvation by imagination.', author: 'Frank Lloyd Wright' },
  { text: "Ideas won't keep. Something must be done about them.", author: 'Alfred North Whitehead' },
  { text: 'The way to get good ideas is to get lots of ideas and throw the bad ones away.', author: 'Linus Pauling' },
  { text: "New ideas pass through three periods: 1) It can't be done. 2) It probably can be done, but it's not worth doing. 3) I knew it was a good idea all along!", author: 'Arthur C. Clarke' },
]

export function EmptyStateQuote() {
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-10 max-w-[600px] mx-auto">
      <blockquote
        suppressHydrationWarning
        className="font-[family-name:var(--font-display)] text-2xl text-[var(--text-muted)] italic text-center leading-relaxed"
      >
        &ldquo;{quote.text}&rdquo;
      </blockquote>
      <p suppressHydrationWarning className="font-[family-name:var(--font-body)] text-sm text-[var(--text-muted)] opacity-50">
        &mdash; {quote.author}
      </p>
      <p className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] opacity-30 mt-4">
        Select an idea from the sidebar, or create a new one.
      </p>
    </div>
  )
}
