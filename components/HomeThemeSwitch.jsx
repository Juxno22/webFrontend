"use client";

import { useEffect } from "react";

export default function HomeThemeSwitch() {
  useEffect(() => {
    const body = document.body;
    const trigger = document.getElementById("home-theme-trigger");

    if (!trigger) return;

    let wipeTimer = null;

    function clearWipeClasses() {
      body.classList.remove("theme-home-wipe-light");
      body.classList.remove("theme-home-wipe-dark");
    }

    function playWipe(direction) {
      window.clearTimeout(wipeTimer);

      clearWipeClasses();

      body.classList.add(
        direction === "light" ? "theme-home-wipe-light" : "theme-home-wipe-dark"
      );

      wipeTimer = window.setTimeout(() => {
        clearWipeClasses();
      }, 200);
    }

    function applyTheme(theme, animate = true) {
      const isAlreadyLight = body.classList.contains("theme-home-light");
      const isAlreadyDark = body.classList.contains("theme-home-dark");

      if (theme === "light" && isAlreadyLight) return;
      if (theme === "dark" && isAlreadyDark) return;

      if (animate) {
        playWipe(theme);
      }

      if (theme === "light") {
        body.classList.add("theme-home-light");
        body.classList.remove("theme-home-dark");
      } else {
        body.classList.add("theme-home-dark");
        body.classList.remove("theme-home-light");
      }
    }

    function setInitialTheme() {
      const triggerTop = trigger.getBoundingClientRect().top;
      const activationPoint = window.innerHeight * 0.5;

      if (triggerTop <= activationPoint) {
        applyTheme("light", false);
      } else {
        applyTheme("dark", false);
      }
    }

    setInitialTheme();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            applyTheme("light", true);
            return;
          }

          if (entry.boundingClientRect.top > 0) {
            applyTheme("dark", true);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -40% 0px",
        threshold: 0,
      }
    );

    observer.observe(trigger);

    window.addEventListener("resize", setInitialTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", setInitialTheme);
      window.clearTimeout(wipeTimer);

      body.classList.remove("theme-home-dark");
      body.classList.remove("theme-home-light");
      body.classList.remove("theme-home-wipe-light");
      body.classList.remove("theme-home-wipe-dark");
    };
  }, []);

  return <div className="home-theme-wipe" aria-hidden="true" />;
}