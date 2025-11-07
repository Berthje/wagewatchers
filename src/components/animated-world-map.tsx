"use client";

import { useEffect, useState } from "react";

export function AnimatedWorldMap() {
  const [svgContent, setSvgContent] = useState<string>("");

  useEffect(() => {
    // Fetch the SVG content
    fetch("/world.svg")
      .then((response) => response.text())
      .then((svgText) => {
        // Extract just the paths from the SVG
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
        const paths = svgDoc.querySelectorAll("path");

        // Create a new SVG with just the paths
        const newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        newSvg.setAttribute("viewBox", "0 0 2000 857");
        newSvg.setAttribute("class", "w-full h-full");

        // Add paths with animation classes
        let index = 0;
        for (const path of paths) {
          const newPath = path.cloneNode(true) as SVGPathElement;
          newPath.setAttribute("class", `world-path path-${index}`);
          newPath.style.stroke = "currentColor";
          newPath.style.strokeWidth = "0.3";
          newPath.style.fill = "none";
          newPath.style.strokeDasharray = "1000";
          newPath.style.strokeDashoffset = "1000";
          newPath.style.animationDelay = `${index * 0.85}s`;
          newPath.style.animation = "drawPath 2.5s ease-in-out forwards";
          newSvg.appendChild(newPath);
          index++;
        }

        // Add CSS animation
        const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
        style.textContent = `
                    @keyframes drawPath {
                        0% { stroke-dashoffset: 1000; }
                        100% { stroke-dashoffset: 0; }
                    }
                `;
        newSvg.appendChild(style);

        setSvgContent(newSvg.outerHTML);
      })
      .catch((error) => {
        console.error("Error loading world map:", error);
      });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="w-full h-full text-stone-600">
        {svgContent ? (
          <div dangerouslySetInnerHTML={{ __html: svgContent }} className="w-full h-full" />
        ) : (
          <div className="w-full h-full bg-stone-800 animate-pulse" />
        )}
      </div>
    </div>
  );
}
