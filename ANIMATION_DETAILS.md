# Login Page Animations

## 🎨 Visual Effects Overview

The login page features three layered animations that create a stunning medical-themed interface:

### 1. 🩸 Blood Cell Animation (Foreground)
**File**: `src/components/animations/BloodCellAnimation.jsx`

**Description**: Realistic red blood cells flowing across the screen, simulating blood flow through vessels.

**Features**:
- **Biconcave Disc Shape**: Authentic red blood cell morphology with center depression
- **Elliptical Form**: Cells are slightly squished (0.85-1.15 ratio) for realism
- **Rotation**: Each cell slowly rotates as it flows
- **Transparency**: Semi-transparent (15-40% opacity) for subtle effect
- **Flow Pattern**: Horizontal movement with slight vertical drift
- **Count**: 30 cells with varying sizes (3-9px radius)

**Technical Details**:
- Uses canvas 2D context with `ellipse()` for biconcave shape
- Gradient fills for depth (dark center, bright edges)
- Subtle edge highlighting for 3D effect
- Continuous flow from left to right edge

---

### 2. 💚 ECG (Electrocardiogram) Wave
**File**: `src/components/animations/SineWaveAnimation.jsx`

**Description**: A medical-grade ECG heartbeat pattern that scrolls across the bottom of the screen.

**Features**:
- **Realistic Pattern**: Authentic PQRST wave complex
  - **P wave**: Small atrial depolarization bump
  - **QRS complex**: Sharp ventricular spike (main heartbeat)
  - **T wave**: Rounded ventricular repolarization
- **Timing**: Heartbeat every ~1.3 seconds with natural variation
- **Grid Background**: Subtle medical grid lines (20px spacing)
- **Color**: Medical green (#22c55e) with glow effect
- **Position**: Bottom 15% of screen

**Wave Components**:
```
P wave → PR segment → QRS complex → ST segment → T wave
  ↑          ↑            ↑             ↑          ↑
Small     Flat      Main spike      Flat      Rounded
bump      line      (80px high)     line      bump
```

**Technical Details**:
- Dynamic point generation for smooth animation
- Scrolls at 3 pixels per frame
- Random interval variation (±10 frames) for natural rhythm
- Shadow blur for depth

---

### 3. 🌌 Aurora Effect (Background)
**File**: `src/components/animations/SineWaveAnimation.jsx`

**Description**: Gentle, flowing aurora waves at the bottom of the screen in cyan, teal, blue, and purple.

**Features**:
- **4 Layered Waves**: Stacked with 15px vertical spacing
- **Spectrum Colors**:
  - Cyan: `rgba(6, 182, 212, 0.15)`
  - Teal: `rgba(20, 184, 166, 0.12)`
  - Blue: `rgba(59, 130, 246, 0.1)`
  - Purple: `rgba(139, 92, 246, 0.08)`
- **Motion**: Slow, lazy sine wave movement
- **Glow**: 20px shadow blur for ethereal effect
- **Amplitude**: 40-70px wave height
- **Position**: Bottom 15% of screen, behind ECG

**Technical Details**:
- Each wave has unique frequency and speed
- Phase-shifted for natural variation
- Continuous horizontal scrolling
- Subtle transparency for depth layering

---

## 🎭 Layer Stack (Z-Index)

```
┌─────────────────────────────────────┐
│  Background Image (stethoscope)     │ z-index: 0 (darkened)
├─────────────────────────────────────┤
│  Aurora Waves (bottom)              │ z-index: 2 (drawn first)
├─────────────────────────────────────┤
│  ECG Wave (bottom)                  │ z-index: 2 (drawn second)
├─────────────────────────────────────┤
│  Blood Cells (full screen)          │ z-index: 1
├─────────────────────────────────────┤
│  Login Form (center)                │ z-index: 10
└─────────────────────────────────────┘
```

---

## ⚙️ Customization Options

### Adjust ECG Heartbeat Rate
**File**: `SineWaveAnimation.jsx` - Line 16
```javascript
const heartbeatInterval = 80 // Change this (60fps = 1.3s per beat)
// Lower = faster heartbeat
// Higher = slower heartbeat
```

### Change Blood Cell Count
**File**: `BloodCellAnimation.jsx` - Line 16
```javascript
const particleCount = 30 // Increase for more cells
```

### Modify Aurora Colors
**File**: `SineWaveAnimation.jsx` - Lines 20-25
```javascript
const auroraColors = [
  { r: 6, g: 182, b: 212, a: 0.15 },    // Cyan
  { r: 20, g: 184, b: 166, a: 0.12 },   // Teal
  { r: 59, g: 130, b: 246, a: 0.1 },    // Blue
  { r: 139, g: 92, b: 246, a: 0.08 },   // Purple
]
// Adjust RGB values and alpha (a) for transparency
```

### Change ECG Position
**File**: `SineWaveAnimation.jsx` - Line 17
```javascript
const baselineY = canvas.height * 0.85 // 0.85 = 85% down screen
// Lower value = higher position
// Higher value = lower position
```

---

## 🎯 Performance

- **Canvas-based**: Hardware-accelerated rendering
- **Efficient**: Only redraws changed areas
- **Responsive**: Automatically adjusts to window resize
- **Smooth**: 60 FPS animation on modern devices
- **Lightweight**: No external animation libraries

---

## 🔧 Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Opera
- ⚠️ IE11 (requires polyfills for canvas ellipse)

---

## 💡 Design Philosophy

The animations create a **medical atmosphere** while maintaining **professional aesthetics**:

1. **Blood Cells**: Represent the life-saving nature of healthcare
2. **ECG Wave**: Symbolizes monitoring and vital signs
3. **Aurora Effect**: Adds calm, soothing ambiance
4. **Grid Pattern**: Evokes medical equipment and precision

All animations are **subtle and non-distracting**, ensuring the login form remains the focal point while creating an immersive medical environment.
