# Generate PWA Icons

The app needs PNG icons at various sizes. You can generate them from the SVG:

## Using ImageMagick (command line)

```bash
# Install ImageMagick if needed
# brew install imagemagick (macOS)
# apt install imagemagick (Ubuntu)

# Generate icons
convert -background none -resize 192x192 public/icon.svg public/icon-192.png
convert -background none -resize 512x512 public/icon.svg public/icon-512.png
convert -background none -resize 180x180 public/icon.svg public/apple-touch-icon.png

# Generate favicon
convert -background none -resize 32x32 public/icon.svg public/favicon.ico
```

## Using online tools

1. Go to https://realfavicongenerator.net/
2. Upload the SVG file
3. Download the generated icons

## Required files

- `/public/icon-192.png` - 192x192 PWA icon
- `/public/icon-512.png` - 512x512 PWA icon
- `/public/apple-touch-icon.png` - 180x180 iOS icon
- `/public/favicon.ico` - Browser favicon
