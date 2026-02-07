# My Candle 🕯️

A relaxing candle timer app built with Next.js. Set a duration, light the candle, and watch it burn down with ambient fireplace sounds.

## Features

- **Visual candle** — Realistic burning candle that melts smoothly as time passes (bottom stays fixed).
- **Timer** — Set duration in minutes (1–120). Start, pause, or reset anytime.
- **Sounds**
  - **Lighting** — `firestart.mp3` plays when you tap "Light Candle".
  - **Ambient** — `Fireplacesound.mp3` starts after the lighting sound and loops while the candle burns.
- **Volume controls** — Top-right: mute/unmute and volume slider for both sounds.
- **Responsive** — Works on mobile and desktop; timer panel and candle sit side-by-side on larger screens.

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **Tailwind CSS**
- **Framer Motion** — Smooth timer digit and UI animations
- **Inter** — Google font

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
mycandle/
├── app/
│   ├── globals.css    # Styles, candle & timer UI
│   ├── layout.tsx     # Root layout, Inter font
│   └── page.tsx       # Candle timer, audio, controls
├── public/
│   ├── firestart.mp3       # Candle lighting sound
│   └── Fireplacesound.mp3 # Looping fireplace ambience
└── README.md
```

## Audio Files

Place your own files in `public/`:

- `firestart.mp3` — Short sound when the candle is lit.
- `Fireplacesound.mp3` — Looping background (fireplace/ambient).

## Build & Deploy

```bash
npm run build
npm start
```

You can deploy to [Vercel](https://vercel.com) or any platform that supports Next.js.
