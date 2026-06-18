"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * GSAP ScrollTrigger demo: a horizontal-scroll pinned section.
 * Uses gsap.context for automatic cleanup (React-safe).
 */
export function GsapPin() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>(".panel");
      gsap.to(panels, {
        xPercent: -100 * (panels.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          pin: true,
          scrub: 1,
          end: () => "+=" + (root.current?.offsetWidth ?? 0) * panels.length,
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="overflow-hidden">
      <div className="flex h-screen w-[300vw]">
        {["Design", "Motion", "Ship"].map((label, i) => (
          <section
            key={label}
            className="panel flex h-screen w-screen items-center justify-center"
          >
            <span className="text-[12vw] font-bold tracking-tighter opacity-80">
              {String(i + 1).padStart(2, "0")} {label}
            </span>
          </section>
        ))}
      </div>
    </div>
  );
}
