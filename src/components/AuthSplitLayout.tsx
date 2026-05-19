import type { ReactNode } from 'react'

const PLATFORM = '生物医药孵化运营平台'

export function AuthSplitLayout({
  children,
  footer,
}: {
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f3f7fd]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 lg:hidden opacity-[0.22]"
        style={{
          backgroundImage: 'url(/auth-login-left.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[minmax(0,1.15fr)_minmax(380px,480px)] xl:grid-cols-[minmax(0,1.25fr)_520px]">
        <aside className="relative hidden min-h-[320px] overflow-hidden lg:block">
          <img
            src="/auth-login-left.svg"
            alt=""
            className="absolute inset-0 size-full object-cover object-[center_42%]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#f7faff]/10 via-transparent to-[#e8f1ff]/35"
          />
        </aside>

        <div className="relative flex min-h-screen flex-col bg-page/80 backdrop-blur-[1px] lg:bg-transparent lg:backdrop-blur-0">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[55%] bg-gradient-to-b from-transparent to-page lg:from-page/40" />

          <div className="relative flex flex-1 flex-col justify-center px-4 py-10 sm:px-8 lg:py-12">
            <div className="mx-auto mb-8 w-full max-w-[440px] text-center">
              <div className="text-[13px] font-bold tracking-[0.24em] text-primary">LOGO</div>
              <h1 className="mt-3 text-[18px] font-semibold tracking-tight text-foreground sm:text-[20px]">{PLATFORM}</h1>
            </div>
            <div className="mx-auto w-full max-w-[440px]">{children}</div>
          </div>

          <div className="relative mt-auto h-[min(28vh,200px)] w-full shrink-0 overflow-hidden lg:h-[160px]">
            <img
              src="/auth-login-bottom.svg"
              alt=""
              className="absolute bottom-0 left-1/2 min-w-[120%] -translate-x-1/2 object-cover object-top opacity-[0.92]"
            />
          </div>

          {footer ? (
            <div className="relative z-[1] border-t border-divider/60 bg-surface/90 py-4 text-center text-[12px] text-muted backdrop-blur-sm lg:border-0 lg:bg-transparent">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export { PLATFORM as AUTH_PLATFORM_NAME }
