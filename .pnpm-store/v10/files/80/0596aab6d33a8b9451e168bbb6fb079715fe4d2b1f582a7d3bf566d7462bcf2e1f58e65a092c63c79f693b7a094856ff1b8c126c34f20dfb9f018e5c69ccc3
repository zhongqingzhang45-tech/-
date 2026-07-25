# Crop empty pixels
This package is **ONLY** for browsers

## Usage
```ts
import cropImg from '@lemonneko/crop-empty-pixels'

// load a image
const img = document.createElement('img')
img.src = '/path/to/an/image/to/crop/empty/pixels'
img.addEventListener('load', () => {
  // draw it on canvas once load
  const canvas = document.createElement('canvas')
  const canvasCtx = canvas.getContext('2d')!
  canvasCtx.drawImage(img)
  // pass the canvas to function then get new canvas
  const cropped = cropImg(canvas)
  // set cropped image data to origin
  img.src = cropped.toDataURL()
}, { once: true })
```
