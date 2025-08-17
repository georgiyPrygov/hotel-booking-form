// Hotel Booking Widget - Iframe Embed Script
(function () {
  "use strict";

  // Configuration
  const WIDGET_URL = "https://hotel-booking-form-topaz.vercel.app/";
  const WIDGET_ID = "hotel-booking-widget";

  // Default options
  const defaultOptions = {
    width: "100%",
    minHeight: "600px",
    theme: "light",
    locale: "uk",
    onLoad: null,
    onError: null,
  };

  // Create widget function
  function createWidget(container, options = {}) {
    const config = { ...defaultOptions, ...options };

    // Create iframe
    const iframe = document.createElement("iframe");
    iframe.src = WIDGET_URL;
    iframe.id = WIDGET_ID;
    iframe.title = "Hotel Booking Form";
    iframe.style.cssText = `
      width: ${config.width};
      min-height: ${config.minHeight};
      border: none;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      background: white;
      display: block;
    `;
    iframe.allow = "fullscreen";
    iframe.scrolling = "no";

    // Clear container and add iframe
    container.innerHTML = "";
    container.appendChild(iframe);

    // Handle iframe load
    iframe.onload = function () {
      console.log("Hotel Booking Widget loaded successfully");

      // Start height adjustment
      adjustHeight();

      // Call onLoad callback
      if (config.onLoad) {
        config.onLoad();
      }
    };

    // Handle iframe errors
    iframe.onerror = function () {
      console.error("Failed to load Hotel Booking Widget");
      if (config.onError) {
        config.onError(new Error("Failed to load booking form"));
      }
    };

    // Dynamic height adjustment
    function adjustHeight() {
      try {
        // Try to get iframe content height
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const height = iframeDoc.body.scrollHeight || iframeDoc.documentElement.scrollHeight;

        if (height > 0) {
          iframe.style.height = height + 20 + "px"; // Add some padding
        }
      } catch (e) {
        // Cross-origin restriction - use ResizeObserver as fallback
        console.log("Using ResizeObserver for height adjustment");
      }
    }

    // Use ResizeObserver for dynamic height (works with cross-origin iframes)
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(function (entries) {
        for (let entry of entries) {
          if (entry.target === iframe) {
            adjustHeight();
          }
        }
      });

      // Observe iframe for size changes
      resizeObserver.observe(iframe);
    }

    // Periodic height check (fallback)
    const heightInterval = setInterval(function () {
      if (iframe.contentWindow) {
        try {
          const height = iframe.contentWindow.document.body.scrollHeight;
          if (height > 0) {
            iframe.style.height = height + 20 + "px";
          }
        } catch (e) {
          // Cross-origin - can't access iframe content
        }
      }
    }, 1000);

    // Listen for postMessage from iframe for height updates
    window.addEventListener("message", function (event) {
      if (event.origin === new URL(WIDGET_URL).origin) {
        if (event.data && event.data.type === "WIDGET_HEIGHT") {
          iframe.style.height = event.data.height + 20 + "px";
        }
      }
    });

    // Return widget instance
    return {
      destroy: function () {
        clearInterval(heightInterval);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        container.innerHTML = "";
      },
      refresh: function () {
        iframe.src = iframe.src;
      },
      updateOptions: function (newOptions) {
        Object.assign(config, newOptions);
        if (newOptions.width) {
          iframe.style.width = newOptions.width;
        }
        if (newOptions.minHeight) {
          iframe.style.minHeight = newOptions.minHeight;
        }
      },
    };
  }

  // Auto-initialize if data attributes are present
  function autoInitialize() {
    const containers = document.querySelectorAll("[data-hotel-booking-widget]");

    containers.forEach(function (container) {
      const options = {
        width: container.getAttribute("data-width") || defaultOptions.width,
        minHeight: container.getAttribute("data-min-height") || defaultOptions.minHeight,
        theme: container.getAttribute("data-theme") || defaultOptions.theme,
        locale: container.getAttribute("data-locale") || defaultOptions.locale,
      };

      try {
        createWidget(container, options);
      } catch (error) {
        console.error("Failed to initialize hotel booking widget:", error);
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInitialize);
  } else {
    autoInitialize();
  }

  // Expose globally
  window.HotelBookingWidget = {
    create: createWidget,
    createWidget: createWidget, // Alias for backward compatibility
  };
})();
