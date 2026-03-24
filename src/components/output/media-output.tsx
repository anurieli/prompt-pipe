'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { OutputMedia } from '@/types/output-media'

type MediaOutputProps = {
  media: OutputMedia
  className?: string
}

export function MediaOutput({ media, className = '' }: MediaOutputProps) {
  switch (media.type) {
    case 'text':
      return <TextOutput content={media.content} className={className} />
    case 'image':
      return <ImageOutput url={media.url} alt={media.alt} className={className} />
    case 'images':
      return <ImageGridOutput items={media.items} className={className} />
    case 'mixed':
      return (
        <div className={`flex flex-col gap-4 ${className}`}>
          {media.items.map((item, i) => (
            <MediaOutput key={i} media={item} />
          ))}
        </div>
      )
  }
}

function TextOutput({ content, className = '' }: { content: string; className?: string }) {
  return (
    <div className={`prose-output ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-[family-name:var(--font-display)] text-lg text-[var(--text)] mt-4 mb-2 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-[family-name:var(--font-display)] text-base text-[var(--text)] mt-3 mb-1.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-[family-name:var(--font-body)] text-sm font-semibold text-[var(--text)] mt-2.5 mb-1">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="font-[family-name:var(--font-body)] text-[13px] text-[var(--text-secondary)] leading-[1.7] mb-2.5 last:mb-0">
              {children}
            </p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] underline underline-offset-2 decoration-[var(--accent-muted)] hover:decoration-[var(--accent)]"
            >
              {children}
            </a>
          ),
          code: ({ className: codeClassName, children }) => {
            const isInline = !codeClassName
            if (isInline) {
              return (
                <code className="font-[family-name:var(--font-mono)] text-[11.5px] bg-[var(--surface-2)] text-[var(--accent)] px-1.5 py-0.5 rounded-[3px] border border-[var(--border)]">
                  {children}
                </code>
              )
            }
            return (
              <code className={`font-[family-name:var(--font-mono)] text-[11.5px] text-[var(--text-secondary)] ${codeClassName ?? ''}`}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--r)] px-3.5 py-3 my-2.5 overflow-x-auto">
              {children}
            </pre>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-[13px] text-[var(--text-secondary)] mb-2.5 space-y-1 pl-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-[13px] text-[var(--text-secondary)] mb-2.5 space-y-1 pl-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="font-[family-name:var(--font-body)] leading-[1.6]">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[var(--accent-muted)] pl-3.5 my-2.5 text-[var(--text-muted)] italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2.5">
              <table className="w-full text-[12px] border-collapse">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="text-left font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)] border-b border-[var(--border-strong)] px-2.5 py-1.5">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="text-[var(--text-secondary)] border-b border-[var(--border)] px-2.5 py-1.5">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="border-[var(--border)] my-4" />
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-[var(--text)]">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-[var(--text-secondary)]">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function ImageOutput({
  url,
  alt,
  className = '',
}: {
  url: string
  alt?: string
  className?: string
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label="Expand image"
        className={`block cursor-pointer bg-transparent border-0 p-0 ${className}`}
      >
        <img
          src={url}
          alt={alt ?? 'Generated image'}
          className="max-w-full rounded-[var(--r)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
        />
      </button>

      {expanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Expanded image view"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-pointer"
          onClick={() => setExpanded(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setExpanded(false)
          }}
        >
          <img
            src={url}
            alt={alt ?? 'Generated image'}
            className="max-w-[90vw] max-h-[90vh] rounded-[var(--r-lg)]"
          />
        </div>
      )}
    </>
  )
}

function ImageGridOutput({
  items,
  className = '',
}: {
  items: Array<{ url: string; alt?: string; format: 'png' | 'jpg' | 'webp' }>
  className?: string
}) {
  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {items.map((item, i) => (
        <ImageOutput key={i} url={item.url} alt={item.alt} />
      ))}
    </div>
  )
}
