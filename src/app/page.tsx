import { ShaderBlob } from "@/components/three/shader-blob";
import { Particles } from "@/components/three/particles";
import { Reveal } from "@/components/motion/reveal";
import { GsapPin } from "@/components/motion/gsap-pin";

const stack = [
  "TypeScript",
  "Tailwind v4",
  "Three.js / R3F / Drei",
  "Framer Motion",
  "GSAP ScrollTrigger",
  "Custom GLSL shaders",
  "Lenis smooth scroll",
  "Storybook",
  "Playwright",
];

export default function Home() {
  return (
    <main className="flex flex-col">
      {/* HERO — WebGL shader blob behind type */}
      <section className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0">
          <ShaderBlob />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <h1 className="text-balance text-5xl font-bold tracking-tighter sm:text-7xl md:text-8xl">
            Elite Frontend Starter
          </h1>
          <p className="mt-6 max-w-xl text-balance text-lg text-foreground/70">
            Apple / Stripe / Awwwards-grade tooling. WebGL, motion, and
            production architecture — already wired up.
          </p>
        </div>
      </section>

      {/* STACK GRID — Framer Motion reveals */}
      <section className="mx-auto w-full max-w-5xl px-6 py-32">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            Everything included
          </h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-foreground/10 sm:grid-cols-3">
          {stack.map((item, i) => (
            <Reveal key={item} delay={i * 0.05}>
              <div className="flex h-32 items-center justify-center bg-background p-6 text-center text-lg font-medium">
                {item}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* GSAP horizontal pin */}
      <GsapPin />

      {/* Particle system */}
      <section className="relative h-screen w-full">
        <Particles />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <h2 className="text-balance text-center text-4xl font-bold tracking-tighter sm:text-6xl">
            4,000 GPU particles
          </h2>
        </div>
      </section>

      <footer className="border-t border-foreground/10 px-6 py-12 text-center text-sm text-foreground/50">
        Built with the Elite Frontend Starter — edit{" "}
        <code className="font-mono">src/app/page.tsx</code> to begin.
      </footer>
    </main>
  );
}
