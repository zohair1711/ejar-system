"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

// Configure NProgress
NProgress.configure({ 
  showSpinner: false, 
  trickleSpeed: 200,
  minimum: 0.08,
  template: '<div class="bar" role="bar" style="background: #10b981; height: 3px;"><div class="peg" style="box-shadow: 0 0 10px #10b981, 0 0 5px #10b981;"></div></div>'
});

export default function PageLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Start progress on route change
    NProgress.start();
    
    // Stop progress after a short delay to ensure hydration
    const timer = setTimeout(() => {
      NProgress.done();
    }, 500);

    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [pathname, searchParams]);

  return null;
}
