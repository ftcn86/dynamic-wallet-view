import { useCallback } from 'react';
import { useIsMobile } from './use-mobile';

export function useMobileFocus() {
  const isMobile = useIsMobile();

  const clearFocus = useCallback(() => {
    if (isMobile) {
      // Remove focus from any active element to prevent accessibility issues
      setTimeout(() => {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
          activeElement.blur();
        }
        // Move focus to body to ensure no element retains focus
        document.body.focus();
      }, 100);
    }
  }, [isMobile]);

  const handleMobileAction = useCallback((action: () => void) => {
    action();
    clearFocus();
  }, [clearFocus]);

  return {
    clearFocus,
    handleMobileAction,
    isMobile
  };
} 