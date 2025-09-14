// Hotel Booking Widget - Iframe Embed Script
(function () {
  "use strict";

  // Configuration
  const WIDGET_URL = "https://hotel-booking-form-topaz.vercel.app/";
  const WIDGET_ID = "hotel-booking-widget";

  // Default options
  const defaultOptions = {
    width: "100%",
    minHeight: "300px",
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
      display: block;
    `;
    iframe.allow = "fullscreen";
    iframe.scrolling = "no";

    // Clear container and add iframe
    container.innerHTML = "";
    container.appendChild(iframe);

    // Handle iframe load
    iframe.onload = function () {
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
        // Cross-origin restriction - can't access iframe content directly
        console.log("Cross-origin iframe - using postMessage for height adjustment");
      }
    }

    // Enhanced height adjustment with multiple strategies
    let resizeObserver = null;
    let heightInterval = null;

    // Strategy 1: ResizeObserver for iframe element changes
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(function (entries) {
        for (let entry of entries) {
          if (entry.target === iframe) {
            adjustHeight();
          }
        }
      });

      // Observe iframe for size changes
      resizeObserver.observe(iframe);
    }

    // Strategy 2: Periodic height check (more frequent for better responsiveness)
    heightInterval = setInterval(function () {
      if (iframe.contentWindow) {
        try {
          const height = iframe.contentWindow.document.body.scrollHeight;
          if (height > 0) {
            iframe.style.height = height + 20 + "px";
          }
        } catch (e) {
          // Cross-origin - can't access iframe content directly
        }
      }
    }, 500); // Check every 500ms for better responsiveness

    // Strategy 3: Listen for postMessage from iframe for height updates
    window.addEventListener("message", function (event) {
      if (event.origin === new URL(WIDGET_URL).origin) {
        if (event.data && event.data.type === "WIDGET_HEIGHT") {
          iframe.style.height = event.data.height + 20 + "px";
        }
      }
    });

    // Strategy 4: MutationObserver to watch for DOM changes in the iframe
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDoc && window.MutationObserver) {
        const mutationObserver = new MutationObserver(function (mutations) {
          // Debounce height adjustments
          clearTimeout(mutationObserver.timeout);
          mutationObserver.timeout = setTimeout(function () {
            adjustHeight();
          }, 100);
        });

        mutationObserver.observe(iframeDoc.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["style", "class"],
        });
      }
    } catch (e) {
      // Cross-origin restriction
    }

    // Strategy 5: Listen for window resize events
    const resizeHandler = function () {
      setTimeout(adjustHeight, 100);
    };
    window.addEventListener("resize", resizeHandler);

    // Strategy 6: Listen for orientation change (mobile)
    const orientationHandler = function () {
      setTimeout(adjustHeight, 500);
    };
    window.addEventListener("orientationchange", orientationHandler);

    // Return widget instance
    return {
      destroy: function () {
        // Clean up all intervals and observers
        if (heightInterval) {
          clearInterval(heightInterval);
        }
        if (resizeObserver) {
          resizeObserver.disconnect();
        }

        // Remove event listeners
        window.removeEventListener("resize", resizeHandler);
        window.removeEventListener("orientationchange", orientationHandler);

        // Clear container
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
