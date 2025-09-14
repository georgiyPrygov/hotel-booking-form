# Hotel Booking Widget - Webflow Integration Guide

## Quick Start

### Method 1: Simple Embed (Recommended)

1. **Add a Code Embed element** to your Webflow page
2. **Paste this code**:

```html
<script src="https://hotel-booking-form-topaz.vercel.app/widget.js"></script>
<div data-hotel-booking-widget style="width: 100%; min-height: 600px;"></div>
```

3. **Publish your site** - the widget will automatically load!

### Method 2: Custom Configuration

```html
<script src="https://hotel-booking-form-topaz.vercel.app/widget.js"></script>
<div
  data-hotel-booking-widget
  data-width="800px"
  data-min-height="800px"
  data-theme="light"
  data-locale="uk"
  style="width: 100%; min-height: 600px;"
></div>
```

## Configuration Options

| Attribute         | Description    | Default | Options                          |
| ----------------- | -------------- | ------- | -------------------------------- |
| `data-width`      | Widget width   | `100%`  | `100%`, `800px`, `600px`, etc.   |
| `data-min-height` | Minimum height | `600px` | `600px`, `800px`, `1000px`, etc. |
| `data-theme`      | Color theme    | `light` | `light`, `dark`                  |
| `data-locale`     | Language       | `uk`    | `uk`, `en`                       |

## Advanced Usage

### JavaScript API

```html
<script src="https://hotel-booking-form-topaz.vercel.app/widget.js"></script>
<div id="my-widget" style="width: 100%; min-height: 600px;"></div>

<script>
  // Initialize widget
  const container = document.getElementById("my-widget");
  const widget = window.HotelBookingWidget.create(container, {
    width: "100%",
    minHeight: "600px",
    theme: "light",
    locale: "uk",
    onLoad: function () {},
    onError: function (error) {
      console.error("Widget error:", error);
    },
  });

  // Widget methods
  widget.destroy(); // Remove widget
  widget.refresh(); // Reload widget
  widget.updateOptions({ width: "800px" }); // Update options
</script>
```

## Webflow Setup Instructions

### Step 1: Add Code Embed

1. Drag a **Code Embed** element to your page
2. Place it where you want the booking form to appear

### Step 2: Insert Widget Code

1. Double-click the Code Embed element
2. Paste the widget code (see Quick Start above)
3. Click **Save**

### Step 3: Style the Container (Optional)

1. Select the Code Embed element
2. In the Style panel, set:
   - **Width**: 100% (or your preferred width)
   - **Height**: Auto (or minimum height)
   - **Margin**: As needed for spacing

### Step 4: Test and Publish

1. Preview your page to test the widget
2. Publish your site when ready

## Responsive Design

The widget automatically adapts to different screen sizes:

- **Desktop**: Full width with optimal height
- **Tablet**: Responsive width with adjusted layout
- **Mobile**: Mobile-optimized interface

## Troubleshooting

### Widget Not Loading

- Check that the script URL is correct
- Ensure your site allows external scripts
- Check browser console for errors

### Height Issues

- The widget uses dynamic height adjustment
- If content is cut off, increase `data-min-height`
- The widget will automatically resize based on content

### Styling Conflicts

- The widget has isolated styles to prevent conflicts
- If you see styling issues, check for conflicting CSS

## Features

✅ **Dynamic Height** - Automatically adjusts to content  
✅ **Responsive Design** - Works on all devices  
✅ **Easy Integration** - Single script tag  
✅ **Customizable** - Multiple configuration options  
✅ **Cross-Browser** - Works in all modern browsers  
✅ **Fast Loading** - Optimized for performance

## Support

For technical support or questions:

- Check the demo page: `https://hotel-booking-form-topaz.vercel.app/demo.html`
- Review browser console for error messages
- Ensure your Webflow site is published and accessible

## Example Implementations

### Basic Booking Form

```html
<script src="https://hotel-booking-form-topaz.vercel.app/widget.js"></script>
<div data-hotel-booking-widget></div>
```

### Centered Widget

```html
<script src="https://hotel-booking-form-topaz.vercel.app/widget.js"></script>
<div style="max-width: 800px; margin: 0 auto;">
  <div data-hotel-booking-widget></div>
</div>
```

### Full-Width Widget

```html
<script src="https://hotel-booking-form-topaz.vercel.app/widget.js"></script>
<div data-hotel-booking-widget data-width="100%" data-min-height="800px"></div>
```
