import { atom } from 'jotai'

const SCROLL_STORAGE_PREFIX = 'gyoza-scroll:'

export function getStoredPageScroll() {
  if (typeof window === 'undefined') return 0
  try {
    const value = sessionStorage.getItem(`${SCROLL_STORAGE_PREFIX}${window.location.pathname}`)
    const scrollY = Number(value)
    return Number.isFinite(scrollY) && scrollY > 0 ? scrollY : 0
  } catch {
    return 0
  }
}

export function storePageScroll(scrollY: number) {
  try {
    sessionStorage.setItem(`${SCROLL_STORAGE_PREFIX}${window.location.pathname}`, String(scrollY))
  } catch {
    // Storage can be unavailable in privacy modes; scrolling still works normally.
  }
}

export const pageScrollLocationAtom = atom(0)
export const pageScrollDirectionAtom = atom<'up' | 'down' | null>(null)
