# Elite Frontend Starter

A production-grade Next.js template wired with the full modern frontend stack — built to clone for every new project and deploy straight to Netlify.

## Stack

| Area              | Tooling                                                        |
| ----------------- | ------------------------------------------------------------- |
| Framework         | Next.js 16 (App Router) + React 19                            |
| Language          | TypeScript (strict)                                           |
| Styling           | Tailwind CSS v4                                                |
| UI components     | shadcn/ui (`npx shadcn@latest add <component>`)                |
| 2D motion         | Framer Motion (`motion`), GSAP + ScrollTrigger                |
| 3D / WebGL        | Three.js, React Three Fiber, Drei, custom GLSL shaders        |
| Smooth scroll     | Lenis                                                         |
| State             | Zustand                                                       |
| Theming           | next-themes (class-based dark mode)                           |
| Component dev     | Storybook                                                     |
| E2E testing       | Playwright (Chromium, WebKit, mobile)                         |
| Deploy            | Netlify (`@netlify/plugin-nextjs`)                            |

## Getting started

```bash
npm run dev          # http://localhost:3000
npm run build        # production build
npm run lint         # eslint
npm run test:e2e     # Playwright end-to-end tests
npm run storybook    # component workshop
```

## What's in the box

- `src/components/three/shader-blob.tsx` — custom vertex+fragment GLSL shader on an animated mesh (R3F + Drei).
- `src/components/three/particles.tsx` — 4,000-point GPU particle field.
- `src/components/motion/reveal.tsx` — scroll-reveal with `prefers-reduced-motion` support.
- `src/components/motion/gsap-pin.tsx` — pinned horizontal-scroll section via GSAP ScrollTrigger.
- `src/components/providers/` — theme + Lenis smooth-scroll providers.
- `src/lib/utils.ts` — the `cn()` helper for shadcn/ui.
- SEO metadata, Open Graph, security headers (`netlify.toml`), and CI (`.github/workflows/ci.yml`).

## Adding shadcn/ui components

```bash
npx shadcn@latest add button card dialog
```

## Deploying to Netlify

```bash
netlify init     # link/create the site (first time)
netlify deploy --build --prod
```

Set `NEXT_PUBLIC_SITE_URL` in the Netlify dashboard (Site settings → Environment variables).

## Reusing this template

Copy the folder for each new project, or push it to GitHub and use it as a template repo:

```bash
gh repo create my-new-site --private --source=. --remote=origin
```
