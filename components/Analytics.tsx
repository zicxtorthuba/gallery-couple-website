"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page views
    if (typeof window !== 'undefined') {
      // Simple analytics tracking
      console.log('Page view:', pathname);
      
      // You can integrate with Google Analytics, Plausible, or other analytics services here
      // Example for Google Analytics:
      // gtag('config', 'GA_MEASUREMENT_ID', {
      //   page_path: pathname,
      // });
    }
  }, [pathname]);

  return null;
}