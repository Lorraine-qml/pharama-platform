import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SMART_OPS_MENU } from './cockpitData'
import { CockpitCenterColumn } from './CockpitCenterColumn'
import { CockpitLeftColumn } from './CockpitLeftColumn'
import { CockpitRightColumn } from './CockpitRightColumn'
import './strategy-cockpit.css'
const DESIGN_W = 1920
const DESIGN_H = 1080

function useViewportScale() {
  const [layout, setLayout] = useState({ scale: 1, marginLeft: 0, marginTop: 0 })
  useEffect(() => {
    function update() {
      const scale = Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H)
      setLayout({
        scale,
        marginLeft: (window.innerWidth - DESIGN_W * scale) / 2,
        marginTop: (window.innerHeight - DESIGN_H * scale) / 2,
      })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return layout
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const date = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日`
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  return { date, time }
}

function HeaderWing({ flip }: { flip?: boolean }) {  const gid = flip ? 'R' : 'L'
  return (
    <svg className={`cockpit-header__wing ${flip ? 'cockpit-header__wing--right' : 'cockpit-header__wing--left'}`} viewBox="0 0 420 72" aria-hidden>
      <defs>
        <linearGradient id={`wingGrad${gid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(0,180,255,0)" />
          <stop offset="50%" stopColor="rgba(0,180,255,0.35)" />
          <stop offset="100%" stopColor="rgba(0,180,255,0.6)" />
        </linearGradient>
      </defs>
      <path d="M0 36 L80 8 L200 20 L420 36 L200 52 L80 64 Z" fill={`url(#wingGrad${gid})`} opacity={0.7} />
      <path d="M0 36 L120 24 L420 36" fill="none" stroke="rgba(0,212,255,0.5)" strokeWidth={1.5} />
      <path d="M80 8 L80 64" stroke="rgba(0,212,255,0.25)" strokeWidth={1} />
    </svg>
  )
}

function SmartOpsDropdown() {  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div className="cockpit-nav-wrap" ref={ref}>
      <button type="button" className={`cockpit-nav-btn ${open ? 'is-open' : ''}`} onClick={() => setOpen((v) => !v)}>
        智慧运营
      </button>
      {open ? (
        <div className="cockpit-dropdown">
          {SMART_OPS_MENU.map((item) =>
            'to' in item && item.to ? (
              <Link key={item.label} to={item.to} className="cockpit-dropdown__item" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ) : (
              <button key={item.label} type="button" className="cockpit-dropdown__item" onClick={() => setOpen(false)}>
                {item.label}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  )
}

export default function StrategySourceCockpitPage() {
  const { scale, marginLeft, marginTop } = useViewportScale()
  const { date, time } = useClock()

  return (
    <div className="strategy-cockpit">
      <div
        className="strategy-cockpit__viewport"
        style={{
          transform: `scale(${scale})`,
          marginLeft: `${marginLeft}px`,
          marginTop: `${marginTop}px`,
        }}
      >
        <div className="strategy-cockpit__inner">
          <header className="cockpit-header">
            <div className="cockpit-header__bg">
              <HeaderWing />
              <HeaderWing flip />
            </div>
            <div className="cockpit-header__grid">
              <div className="cockpit-header__nav cockpit-header__nav--left">
                <button type="button" className="cockpit-nav-btn">
                  生物样本库
                </button>
                <button type="button" className="cockpit-nav-btn">
                  学科建设与数据
                </button>
              </div>
              <div className="cockpit-title-wrap">
                <h1 className="cockpit-title">数智化策源平台驾驶舱</h1>
                <p className="cockpit-datetime">
                  {date} &nbsp; {time}
                </p>
              </div>
              <div className="cockpit-header__nav cockpit-header__nav--right">
                <button type="button" className="cockpit-nav-btn">
                  转化研究
                </button>
                <SmartOpsDropdown />
              </div>
            </div>
            <button type="button" className="cockpit-exit" aria-label="退出" title="退出">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </header>

          <div className="cockpit-body">
            <CockpitLeftColumn />

            {/* 中栏 */}
            <div className="cockpit-col cockpit-col--center">
              <CockpitCenterColumn />
            </div>

            <CockpitRightColumn />
          </div>
        </div>
      </div>
    </div>
  )
}
