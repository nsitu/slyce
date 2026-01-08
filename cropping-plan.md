# Cropping Feature Plan

## Overview

Add an optional cropping mechanism that allows users to define a sub-rectangle of the input video, similar to how `framesToSample` limits the temporal scope. This produces `effectiveWidth` and `effectiveHeight` values, plus offset coordinates (`cropX`, `cropY`).

---

## 1. Data Model (appStore.js)

Add these new state properties:

```javascript
// Cropping state
cropMode: 'entire',           // 'entire' | 'region within'
cropX: 0,                     // Left offset from original (pixels)
cropY: 0,                     // Top offset from original (pixels)
cropWidth: null,              // Cropped width (null = full width)
cropHeight: null,             // Cropped height (null = full height)
```

Add computed getters:

```javascript
getters: {
    effectiveWidth() {
        return this.cropMode === 'region within' && this.cropWidth ? this.cropWidth : this.fileInfo?.width ?? 0;
    },
    effectiveHeight() {
        return this.cropMode === 'region within' && this.cropHeight ? this.cropHeight : this.fileInfo?.height ?? 0;
    },
    isCropping() {
        return this.cropMode === 'region within';
    },
}
```

---

## 2. UI Design (SettingsArea.vue)

### Sentence-Based Input Pattern

Following the existing pattern of embedding inputs within sentences, use a Select dropdown to toggle between full frame and cropped region:

**Entire frame (default):**
```
Sample from [entire ▾] video frame
```

**Region within (reveals crop inputs):**
```
Sample from [region within ▾] video frame: [cropWidth] × [cropHeight] at [cropX], [cropY]
```

### Template Structure

```vue
<div class="flex gap-2 justify-start items-center flex-wrap">
    <span>Sample from</span>
    <Select
        v-model="app.cropMode"
        :options="['entire', 'region within']"
    />
    <span>video frame</span>
    
    <template v-if="app.cropMode === 'region within'">
        <span>:</span>
        <InputNumber
            v-model="app.cropWidth"
            :min="1"
            :max="app.fileInfo?.width"
            :disabled="!app.fileInfo?.width"
            class="crop-input"
        />
        <span>×</span>
        <InputNumber
            v-model="app.cropHeight"
            :min="1"
            :max="app.fileInfo?.height"
            :disabled="!app.fileInfo?.height"
            class="crop-input"
        />
        <span>at</span>
        <InputNumber
            v-model="app.cropX"
            :min="0"
            :max="app.fileInfo?.width - app.cropWidth"
            :disabled="!app.fileInfo?.width"
            class="crop-input"
        />
        <span>,</span>
        <InputNumber
            v-model="app.cropY"
            :min="0"
            :max="app.fileInfo?.height - app.cropHeight"
            :disabled="!app.fileInfo?.height"
            class="crop-input"
        />
    </template>
</div>
```

### Placement

Insert this control block after the existing sampling controls (after the "frames" span) and before the "Output" heading. This keeps all input-related constraints together.

---

## 3. Initialization & Reset Logic (SettingsArea.vue)

Add a watcher to initialize/reset crop values when a new video is loaded:

```javascript
// Reset crop to full frame when video changes
watch(() => app.fileInfo, (newFileInfo) => {
    if (newFileInfo?.width && newFileInfo?.height) {
        app.cropWidth = newFileInfo.width;
        app.cropHeight = newFileInfo.height;
        app.cropX = 0;
        app.cropY = 0;
    }
}, { immediate: true });
```

Update the `samplingMode` watcher to use effective dimensions:

```javascript
watchEffect(() => {
    const isCropping = app.cropMode === 'region within';
    const width = isCropping && app.cropWidth ? app.cropWidth : app.fileInfo?.width;
    const height = isCropping && app.cropHeight ? app.cropHeight : app.fileInfo?.height;
    
    if (height && width) {
        if (app.samplingMode === 'columns') {
            app.samplePixelCount = height;
        }
        if (app.samplingMode === 'rows') {
            app.samplePixelCount = width;
        }
    }
});
```

---

## 4. Tile Plan Calculations (useTilePlan.js)

Update to use effective dimensions:

```javascript
// Near the top of the computed function
const isCropping = app.cropMode === 'region within';
const effectiveWidth = isCropping && app.cropWidth ? app.cropWidth : app.fileInfo.width;
const effectiveHeight = isCropping && app.cropHeight ? app.cropHeight : app.fileInfo.height;

// Update spatialSide calculation
if (app.samplingMode === 'rows') {
    spatialSide = effectiveWidth;
} else if (app.samplingMode === 'columns') {
    spatialSide = effectiveHeight;
}
```

Also update plan dimensions to reflect effective sizes.

---

## 5. Video Processing (videoProcessor.js)

Modify the frame processing loop to apply cropping before any scaling:

```javascript
let processedFrame = videoFrame;
let effectiveFileInfo = fileInfo;

// Step 1: Apply cropping if enabled
if (app.cropMode === 'region within' && app.cropWidth && app.cropHeight) {
    const cropCanvas = new OffscreenCanvas(app.cropWidth, app.cropHeight);
    const cropCtx = cropCanvas.getContext('2d');
    
    // Draw only the cropped region
    cropCtx.drawImage(videoFrame,
        app.cropX, app.cropY, app.cropWidth, app.cropHeight,  // Source rect
        0, 0, app.cropWidth, app.cropHeight                    // Dest rect
    );
    
    processedFrame = new VideoFrame(cropCanvas, {
        timestamp: videoFrame.timestamp
    });
    
    effectiveFileInfo = {
        ...fileInfo,
        width: app.cropWidth,
        height: app.cropHeight
    };
    
    videoFrame.close();
}

// Step 2: Apply scaling (existing code, now operates on cropped frame)
if (tilePlan.isScaled && app.downsampleStrategy === 'upfront') {
    // Use effectiveFileInfo dimensions for scale factor calculation
    const scaleFactor = tilePlan.scaleTo / tilePlan.scaleFrom;
    const scaledWidth = Math.floor(effectiveFileInfo.width * scaleFactor);
    const scaledHeight = Math.floor(effectiveFileInfo.height * scaleFactor);
    // ... rest of existing scaling logic
}
```

---

## 6. Processing Pipeline Order

```
Original VideoFrame
    ↓
Crop (if cropMode === 'region within') → effectiveWidth × effectiveHeight
    ↓
Scale (if POT/tile mode requires) → scaledWidth × scaledHeight
    ↓
Sample pixels (rows/columns)
    ↓
Encode to KTX2/WebM
```

---

## 7. Validation Rules

Add validation in the UI or tilePlan:

1. `cropX + cropWidth <= fileInfo.width`
2. `cropY + cropHeight <= fileInfo.height`
3. `cropWidth >= 1` and `cropHeight >= 1`
4. `cropX >= 0` and `cropY >= 0`
5. Warn if cropped region is too small for requested `crossSectionCount`

---

## 8. Visual Crop Selector (CropSelector.vue)

A visual overlay on the video preview for intuitive crop region selection:

### Features

- Display crop rectangle overlay on a video thumbnail/frame
- Draggable corners and edges to resize the region
- Draggable center to reposition the region
- Real-time bidirectional sync with numeric inputs
- Visual feedback showing crop region dimensions
- Constrain dragging to stay within video bounds

### Component Structure

```vue
<template>
    <div class="crop-selector" ref="container">
        <!-- Video frame/thumbnail as background -->
        <canvas ref="previewCanvas" class="preview-canvas" />
        
        <!-- Crop overlay -->
        <div 
            class="crop-overlay"
            :style="{
                left: `${scaledCropX}px`,
                top: `${scaledCropY}px`,
                width: `${scaledCropWidth}px`,
                height: `${scaledCropHeight}px`
            }"
            @mousedown="startDrag('move', $event)"
        >
            <!-- Resize handles -->
            <div class="handle handle-nw" @mousedown.stop="startDrag('nw', $event)" />
            <div class="handle handle-ne" @mousedown.stop="startDrag('ne', $event)" />
            <div class="handle handle-sw" @mousedown.stop="startDrag('sw', $event)" />
            <div class="handle handle-se" @mousedown.stop="startDrag('se', $event)" />
            <div class="handle handle-n" @mousedown.stop="startDrag('n', $event)" />
            <div class="handle handle-s" @mousedown.stop="startDrag('s', $event)" />
            <div class="handle handle-e" @mousedown.stop="startDrag('e', $event)" />
            <div class="handle handle-w" @mousedown.stop="startDrag('w', $event)" />
            
            <!-- Dimension label -->
            <div class="crop-dimensions">
                {{ app.cropWidth }} × {{ app.cropHeight }}
            </div>
        </div>
        
        <!-- Darkened areas outside crop region -->
        <div class="crop-mask" />
    </div>
</template>
```

### Key Logic

```javascript
// Scale factors to map between actual video size and displayed preview size
const scaleX = computed(() => containerWidth.value / app.fileInfo.width);
const scaleY = computed(() => containerHeight.value / app.fileInfo.height);

// Scaled crop values for display
const scaledCropX = computed(() => app.cropX * scaleX.value);
const scaledCropY = computed(() => app.cropY * scaleY.value);
const scaledCropWidth = computed(() => app.cropWidth * scaleX.value);
const scaledCropHeight = computed(() => app.cropHeight * scaleY.value);

// Drag handler updates actual crop values
const onDrag = (deltaX, deltaY) => {
    // Convert screen delta to video pixel delta
    const videoDeltaX = Math.round(deltaX / scaleX.value);
    const videoDeltaY = Math.round(deltaY / scaleY.value);
    
    // Apply to appropriate properties based on drag mode
    // Clamp to video bounds
};
```

### Styling

```css
.crop-selector {
    position: relative;
    display: inline-block;
}

.crop-overlay {
    position: absolute;
    border: 2px dashed #fff;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
    cursor: move;
}

.handle {
    position: absolute;
    width: 10px;
    height: 10px;
    background: #fff;
    border: 1px solid #333;
}

.handle-nw { top: -5px; left: -5px; cursor: nw-resize; }
.handle-ne { top: -5px; right: -5px; cursor: ne-resize; }
.handle-sw { bottom: -5px; left: -5px; cursor: sw-resize; }
.handle-se { bottom: -5px; right: -5px; cursor: se-resize; }
.handle-n { top: -5px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
.handle-s { bottom: -5px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
.handle-e { top: 50%; right: -5px; transform: translateY(-50%); cursor: e-resize; }
.handle-w { top: 50%; left: -5px; transform: translateY(-50%); cursor: w-resize; }

.crop-dimensions {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    padding: 2px 6px;
    font-size: 12px;
    white-space: nowrap;
}
```

### Integration

The CropSelector should be shown conditionally when `cropMode === 'region within'`, positioned near or replacing the video preview area in SettingsArea.

---

## 9. Implementation Order

1. **appStore.js** - Add state properties and getters
2. **SettingsArea.vue** - Add UI controls with watchers
3. **CropSelector.vue** - Create visual crop selector component
4. **useTilePlan.js** - Update calculations to use effective dimensions
5. **videoProcessor.js** - Add cropping step before scaling
6. **Testing** - Verify with various crop configurations

---

## 10. Files to Modify

| File | Changes |
|------|---------|
| `src/stores/appStore.js` | Add crop state & getters |
| `src/components/SettingsArea.vue` | Add crop UI, update watchers |
| `src/components/CropSelector.vue` | **New file** - Visual crop selector |
| `src/composables/useTilePlan.js` | Use effective dimensions |
| `src/modules/videoProcessor.js` | Add crop step in processing |
| `src/modules/resourceMonitor.js` | (optional) Display crop info in status |