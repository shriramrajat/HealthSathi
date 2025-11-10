# SEO and PWA Assets

This directory contains placeholder assets for SEO and PWA functionality.

## Current Assets (SVG Placeholders)

The following SVG files have been created as placeholders:

- `og-image.svg` - Open Graph image for social sharing (1200x630)
- `icon-192.svg` - PWA icon (192x192)
- `icon-512.svg` - PWA icon (512x512)
- `apple-icon.svg` - Apple touch icon (180x180)

## Converting to PNG (Required for Production)

These SVG files should be converted to PNG format for production use. You can:

1. **Use an online converter** like CloudConvert or similar
2. **Use ImageMagick** (if installed):
   ```bash
   magick og-image.svg -resize 1200x630 og-image.png
   magick icon-192.svg -resize 192x192 icon-192.png
   magick icon-512.svg -resize 512x512 icon-512.png
   magick apple-icon.svg -resize 180x180 apple-icon.png
   ```
3. **Use a design tool** like Figma, Photoshop, or GIMP to export as PNG

## Customization

Replace these placeholder assets with your actual branding:

- Update colors to match your brand palette
- Add your logo or custom graphics
- Ensure proper contrast for readability
- Test on various devices and platforms

## PWA Manifest

The `manifest.json` file has been configured with:
- App name and description
- Theme colors (blue gradient)
- Display mode (standalone)
- Icon references (currently pointing to SVG, update to PNG after conversion)

Update the manifest.json icon references from `.svg` to `.png` after conversion.
