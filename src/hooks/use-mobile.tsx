
import * as React from "react"

// More comprehensive mobile breakpoint detection
const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Function to check if device is mobile
    const checkIsMobile = () => {
      // Check screen width
      const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT
      
      // Check user agent for mobile devices
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      
      // Check touch capability
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // Consider mobile if any of these conditions are true
      const mobile = isSmallScreen || isMobileDevice || hasTouchScreen
      
      setIsMobile(mobile)
      console.log('📱 Mobile detection:', {
        screenWidth: window.innerWidth,
        isSmallScreen,
        isMobileDevice,
        hasTouchScreen,
        isMobile: mobile
      })
    }

    // Initial check
    checkIsMobile()

    // Set up media query listener
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const handleResize = () => {
      checkIsMobile()
    }
    
    mql.addEventListener("change", handleResize)
    window.addEventListener('resize', handleResize)
    
    return () => {
      mql.removeEventListener("change", handleResize)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return !!isMobile
}
