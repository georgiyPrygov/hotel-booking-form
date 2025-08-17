"use client";

import { useEffect, useRef } from "react";

interface HeightReporterProps {
  children: React.ReactNode;
}

export const HeightReporter: React.FC<HeightReporterProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reportHeight = () => {
      if (containerRef.current && window.parent !== window) {
        const height = containerRef.current.scrollHeight;
        window.parent.postMessage(
          {
            type: "WIDGET_HEIGHT",
            height: height,
          },
          "*" // In production, specify the exact parent origin
        );
      }
    };

    // Report initial height
    reportHeight();

    // Set up ResizeObserver to watch for height changes
    if (window.ResizeObserver && containerRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        reportHeight();
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }

    // Fallback: periodic height check
    const interval = setInterval(reportHeight, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      {children}
    </div>
  );
};
