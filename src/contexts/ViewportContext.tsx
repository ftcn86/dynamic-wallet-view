"use client"

import React from "react"

export type ViewportInfo = {
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

const DEFAULT_VIEWPORT: ViewportInfo = {
  width: 0,
  height: 0,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
}

const MOBILE_MAX = 767
const TABLET_MAX = 1023

function computeViewportInfo(width: number, height: number): ViewportInfo {
  const isMobile = width <= MOBILE_MAX
  const isTablet = width > MOBILE_MAX && width <= TABLET_MAX
  const isDesktop = width > TABLET_MAX
  return { width, height, isMobile, isTablet, isDesktop }
}

const ViewportContext = React.createContext<ViewportInfo>(DEFAULT_VIEWPORT)

export function ViewportProvider({ children }: { children: React.ReactNode }) {
  const [info, setInfo] = React.useState<ViewportInfo>(() => {
    if (typeof window === "undefined") return DEFAULT_VIEWPORT
    return computeViewportInfo(window.innerWidth, window.innerHeight)
  })

  React.useEffect(() => {
    if (typeof window === "undefined") return

    let frame = 0
    const onResize = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        setInfo(computeViewportInfo(window.innerWidth, window.innerHeight))
      })
    }

    window.addEventListener("resize", onResize)
    // Initialize once in case of SSR hydration differences
    onResize()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  return (
    <ViewportContext.Provider value={info}>{children}</ViewportContext.Provider>
  )
}

export function useViewport(): ViewportInfo {
  return React.useContext(ViewportContext)
}


