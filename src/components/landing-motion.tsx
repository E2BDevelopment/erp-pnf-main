"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function LandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const opening = gsap.timeline({ defaults: { ease: "expo.out" } });
        opening
          .from(".landing-hero-line > span", {
            yPercent: 110,
            rotation: 1.5,
            duration: 0.8,
            stagger: 0.13,
          })
          .from(
            ".landing-hero-description",
            { clipPath: "inset(0 100% 0 0)", duration: 0.62 },
            "-=0.32",
          )
          .from(".landing-hero-actions", { y: 16, autoAlpha: 0, duration: 0.4 }, "-=0.22")
          .from(
            ".landing-preview",
            {
              clipPath: "inset(0 0 100% 0)",
              y: 28,
              rotationX: 2,
              transformPerspective: 1000,
              duration: 0.78,
            },
            "-=0.48",
          )
          .from(
            ".landing-preview-row",
            { clipPath: "inset(0 100% 0 0)", stagger: 0.12, duration: 0.42 },
            "-=0.42",
          );

        const flowSteps = gsap.utils.toArray<HTMLElement>(".landing-flow-step", root.current);
        gsap.fromTo(
          ".landing-flow-progress",
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ".landing-flow",
              start: "top 75%",
              end: "bottom 55%",
              scrub: 0.6,
              onUpdate: ({ progress }) => {
                const activeIndex = Math.min(
                  flowSteps.length - 1,
                  Math.floor(progress * flowSteps.length),
                );
                flowSteps.forEach((step, index) => {
                  step.classList.toggle("is-current", index === activeIndex);
                  step.classList.toggle("is-passed", index < activeIndex);
                });
              },
            },
          },
        );

        return () => {
          flowSteps.forEach((step) => {
            step.classList.remove("is-current", "is-passed");
          });
        };
      });
      return () => media.revert();
    },
    { scope: root },
  );

  return <div ref={root}>{children}</div>;
}
