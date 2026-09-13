'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

export const PRESETS = [
  { id: 'default', label: 'Default',  color: '#1e3a5f' },
  { id: 'forest',  label: 'Forest',   color: '#166534' },
  { id: 'ocean',   label: 'Ocean',    color: '#0e6e8c' },
  { id: 'rose',    label: 'Rose',     color: '#9f1239' },
  { id: 'amber',   label: 'Amber',    color: '#92400e' },
  { id: 'custom',  label: 'Custom',   color: null },
] as const

export type PresetId = (typeof PRESETS)[number]['id']

const STORAGE_KEY_PRESET = 'dogear-theme-preset'
const STORAGE_KEY_CUSTOM  = 'dogear-theme-custom'

function hslFromHex(hex: string): string | null {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

function applyCustomAccent(hex: string, isDark: boolean) {
  const hsl = hslFromHex(hex)
  if (!hsl) return
  const [hStr, sStr, lStr] = hsl.split(' ')
  const h = hStr, s = sStr
  // Adjust lightness for dark mode so the accent stays readable
  const lNum = parseFloat(lStr)
  const l = isDark
    ? `${Math.max(55, Math.min(75, lNum + 30))}%`
    : `${Math.max(20, Math.min(45, lNum))}%`
  const lFg = isDark ? '10%' : '98%'
  const lAccentBg = isDark ? '18%' : '94%'

  const root = document.documentElement
  root.style.setProperty('--primary',            `${h} ${s} ${l}`)
  root.style.setProperty('--primary-foreground',  `${h} ${s} ${lFg}`)
  root.style.setProperty('--ring',               `${h} ${s} ${l}`)
  root.style.setProperty('--accent',             `${h} ${s} ${lAccentBg}`)
  root.style.setProperty('--accent-foreground',  `${h} ${s} ${l}`)
  root.style.setProperty('--secondary',          `${h} ${s} ${lAccentBg}`)
  root.style.setProperty('--secondary-foreground', `${h} ${s} ${l}`)
}

function clearCustomAccent() {
  const root = document.documentElement
  ;['--primary','--primary-foreground','--ring','--accent','--accent-foreground','--secondary','--secondary-foreground']
    .forEach(v => root.style.removeProperty(v))
}

export function useColorTheme() {
  const { resolvedTheme } = useTheme()
  const [preset, setPresetState] = useState<PresetId>('default')
  const [customColor, setCustomColorState] = useState('#6366f1')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedPreset = (localStorage.getItem(STORAGE_KEY_PRESET) as PresetId) ?? 'default'
    const savedCustom = localStorage.getItem(STORAGE_KEY_CUSTOM) ?? '#6366f1'
    setPresetState(savedPreset)
    setCustomColorState(savedCustom)
    setMounted(true)
  }, [])

  // Re-apply whenever preset, custom color, or dark/light changes
  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    // Remove all preset classes
    PRESETS.forEach(p => { if (p.id !== 'default' && p.id !== 'custom') root.classList.remove(`theme-${p.id}`) })

    if (preset === 'custom') {
      clearCustomAccent()
      applyCustomAccent(customColor, resolvedTheme === 'dark')
    } else if (preset === 'default') {
      clearCustomAccent()
    } else {
      clearCustomAccent()
      root.classList.add(`theme-${preset}`)
    }
  }, [preset, customColor, resolvedTheme, mounted])

  const setPreset = (id: PresetId) => {
    localStorage.setItem(STORAGE_KEY_PRESET, id)
    setPresetState(id)
  }

  const setCustomColor = (hex: string) => {
    localStorage.setItem(STORAGE_KEY_CUSTOM, hex)
    setCustomColorState(hex)
  }

  return { preset, setPreset, customColor, setCustomColor, mounted }
}

export function ThemeSelector() {
  const { preset, setPreset, customColor, setCustomColor, mounted } = useColorTheme()
  const [open, setOpen] = useState(false)

  if (!mounted) return <div className="h-9 w-9" />

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Choose theme"
        aria-expanded={open}
      >
        <Palette className="h-4 w-4" />
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 z-50 bg-popover border rounded-xl shadow-lg p-3 w-52">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Color theme</p>
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {PRESETS.filter(p => p.id !== 'custom').map(p => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id as PresetId)}
                  title={p.label}
                  aria-pressed={preset === p.id}
                  className={cn(
                    'h-7 w-7 rounded-full ring-offset-2 ring-offset-background transition-all',
                    preset === p.id ? 'ring-2 ring-primary scale-110' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: p.color! }}
                />
              ))}
            </div>

            {/* Custom accent */}
            <div className="border-t pt-2.5 mt-1">
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Custom accent</p>
              <div className="flex items-center gap-2 px-1">
                <div className="relative">
                  <input
                    type="color"
                    value={customColor}
                    onChange={e => { setCustomColor(e.target.value); setPreset('custom') }}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    aria-label="Pick custom accent color"
                  />
                  <div
                    className={cn(
                      'h-7 w-7 rounded-full ring-offset-2 ring-offset-background transition-all',
                      preset === 'custom' ? 'ring-2 ring-primary scale-110' : 'hover:scale-105'
                    )}
                    style={{ backgroundColor: customColor }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-mono">{customColor}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
