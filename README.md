# ADD Drone Show Simulation

국방과학연구소(ADD) 창조관 야간 드론쇼 시뮬레이션 웹사이트

## Tech Stack

- **Next.js 16** + TypeScript
- **React Three Fiber** (Three.js)
- **@react-three/drei** (OrbitControls, Stars)
- **@react-three/postprocessing** (Bloom glow)
- **Tailwind CSS**

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Build & Deploy

```bash
npm run build
```

Static export is generated in the `out/` directory. Deploy to Vercel, Netlify, or any static hosting.

### Vercel Deploy

```bash
npx vercel
```

## Features

- 1000+ drone instances with LED glow effects (Bloom post-processing)
- 8 formation sequences: scatter, ADD logo, star, tank, missile, Korean flag, text, finale
- Night sky with stars and moon
- Low-poly building model (ADD 창조관)
- Interactive camera (orbit, zoom, pan)
- Auto-rotation during playback
- Mobile responsive (500 drones on mobile, 1000 on desktop)
- Formation transition animations with easing and staggering

## Project Structure

```
src/
  app/
    page.tsx              # Landing page
    show/page.tsx         # Drone show page
  components/
    DroneScene.tsx        # Main 3D canvas
    DroneSwarm.tsx        # InstancedMesh drone rendering
    NightSky.tsx          # Night sky environment
    Building.tsx          # Low-poly building
    UIOverlay.tsx         # Play/pause controls & HUD
  utils/
    formations.ts         # Formation generation (procedural)
  hooks/
    useFormationSequence.ts  # Sequence playback controller
```
