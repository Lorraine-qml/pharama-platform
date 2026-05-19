import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'

type ToastTone = 'success' | 'error' | 'warning' | 'info'

export type ToastItem = {
  id: number
  message: string
  tone: ToastTone
}

type ToastContextValue = {
  show: (message: string, tone?: ToastTone) => void
}

const ToastCtx = createContext<ToastContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components -- hook provided next to Provider
export function useToast() {
  const v = useContext(ToastCtx)
  if (!v) throw new Error('useToast must be used within ToastProvider')
  return v
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const idRef = useRef(0)
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setItems((t) => t.filter((x) => x.id !== id))
  }, [])

  const show = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = ++idRef.current
      setItems((t) => [...t, { id, message, tone }])
      window.setTimeout(() => dismiss(id), 3800)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ show }), [show])

  const toneCls: Record<ToastTone, string> = {
    success: 'border-success bg-surface text-foreground shadow-card',
    error: 'border-danger bg-surface text-foreground shadow-card',
    warning: 'border-warning bg-surface text-foreground shadow-card',
    info: 'border-primary bg-primary-light text-foreground shadow-card',
  }

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed left-1/2 top-4 z-[100] flex w-[min(90vw,560px)] -translate-x-1/2 flex-col gap-2"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-[var(--radius-card)] border px-4 py-2.5 text-center text-[14px] ${toneCls[t.tone]}`}
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
