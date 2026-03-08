import { useEffect } from "react";
  import { useAuth } from "./use-auth";

  export function useUserPreferences() {
    const { user } = useAuth();

    useEffect(() => {
      if (!user) return;

      // Apply theme
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      if (user.theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
        root.classList.add(systemTheme);
      } else {
        root.classList.add(user.theme || "light");
      }

      // Apply font size
      root.style.fontSize = ""; // Reset
      if (user.fontSize === "small") {
        root.style.fontSize = "14px";
      } else if (user.fontSize === "large") {
        root.style.fontSize = "18px";
      } else {
        root.style.fontSize = "16px";
      }

      // Apply accent color
      if (user.accentColor) {
        // Helper to convert hex to HSL for Tailwind variables
        const hexToHSL = (hex: string) => {
          let r = 0, g = 0, b = 0;
          if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
          } else if (hex.length === 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
          }
          r /= 255; g /= 255; b /= 255;
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          let h = 0, s = 0, l = (max + min) / 2;
          if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
              case r: h = (g - b) / d + (g < b ? 6 : 0); break;
              case g: h = (b - r) / d + 2; break;
              case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
          }
          return (h * 360).toFixed(1) + " " + (s * 100).toFixed(1) + "% " + (l * 100).toFixed(1) + "%";
        };
        
        const hsl = hexToHSL(user.accentColor);
        root.style.setProperty("--primary", hsl);
        root.style.setProperty("--ring", hsl);
      }
    }, [user?.theme, user?.fontSize, user?.accentColor]);
  }
  