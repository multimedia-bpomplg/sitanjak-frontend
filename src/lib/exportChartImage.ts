function collectInlineSafeStyles(): string {
  if (typeof document === "undefined") return "";
  const cssTexts: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules;
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        const text = rule.cssText;
        if (!text) continue;
        // Skip @font-face and external non-data URLs so SVG foreignObject does not taint canvas
        if (/^@font-face/i.test(text)) continue;
        if (/url\(\s*['"]?(?!data:|#)/i.test(text)) continue;
        cssTexts.push(text);
      }
    } catch {
      // Cross-origin stylesheet cannot be read; ignore safely
    }
  }

  return cssTexts.join("\n");
}

function sanitizeFilename(raw: string): string {
  return (
    raw
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "grafik-sitanjak"
  );
}

/**
 * Exports a chart card DOM element as a high-DPI (2x) PNG image file.
 * Replaces live <canvas> elements with PNG snapshots and removes elements marked
 * with `data-export-ignore="true"` (such as the download button itself).
 */
export async function downloadElementAsPng(
  element: HTMLElement,
  fileNameBase: string,
): Promise<void> {
  if (typeof window === "undefined") return;

  const rect = element.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.margin = "0";
  clone.style.boxShadow = "none";

  // Remove interactive controls/buttons marked as excluded from exported image
  clone
    .querySelectorAll("[data-export-ignore='true']")
    .forEach((ignored) => ignored.remove());

  // Preserve current <select> displayed option in cloned markup
  const liveSelects = Array.from(element.querySelectorAll("select"));
  const clonedSelects = Array.from(clone.querySelectorAll("select"));
  liveSelects.forEach((liveSelect, idx) => {
    const clonedSelect = clonedSelects[idx];
    if (!clonedSelect) return;
    Array.from(clonedSelect.options).forEach((opt, optIdx) => {
      if (optIdx === liveSelect.selectedIndex) {
        opt.setAttribute("selected", "selected");
      } else {
        opt.removeAttribute("selected");
      }
    });
  });

  // Replace live <canvas> elements (e.g. Chart.js) with static PNG <img> snapshots
  const liveCanvases = Array.from(element.querySelectorAll("canvas"));
  const clonedCanvases = Array.from(clone.querySelectorAll("canvas"));
  liveCanvases.forEach((liveCanvas, idx) => {
    const clonedCanvas = clonedCanvases[idx];
    if (!clonedCanvas) return;
    const canvasRect = liveCanvas.getBoundingClientRect();
    const img = document.createElement("img");
    img.src = liveCanvas.toDataURL("image/png");
    img.alt = "Chart snapshot";
    img.style.width = `${Math.max(1, Math.round(canvasRect.width))}px`;
    img.style.height = `${Math.max(1, Math.round(canvasRect.height))}px`;
    img.style.display = "block";
    clonedCanvas.replaceWith(img);
  });

  const isDark = document.documentElement.classList.contains("dark");
  const computed = window.getComputedStyle(element);
  const bgColor =
    computed.backgroundColor &&
    computed.backgroundColor !== "rgba(0, 0, 0, 0)" &&
    computed.backgroundColor !== "transparent"
      ? computed.backgroundColor
      : isDark
        ? "#0f172a"
        : "#ffffff";

  const cssText = collectInlineSafeStyles();
  const rootClasses = document.documentElement.className || "";
  const bodyFont =
    window.getComputedStyle(document.body).fontFamily ||
    "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif";

  const nsSvg = "http://www.w3.org/2000/svg";
  const nsXhtml = "http://www.w3.org/1999/xhtml";

  const svgRoot = document.createElementNS(nsSvg, "svg");
  svgRoot.setAttribute("xmlns", nsSvg);
  svgRoot.setAttribute("width", String(width));
  svgRoot.setAttribute("height", String(height));
  svgRoot.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const foreignObject = document.createElementNS(nsSvg, "foreignObject");
  foreignObject.setAttribute("x", "0");
  foreignObject.setAttribute("y", "0");
  foreignObject.setAttribute("width", String(width));
  foreignObject.setAttribute("height", String(height));

  const xhtmlWrapper = document.createElementNS(nsXhtml, "div");
  xhtmlWrapper.setAttribute("xmlns", nsXhtml);
  if (rootClasses) {
    xhtmlWrapper.setAttribute("class", rootClasses);
  }
  xhtmlWrapper.setAttribute(
    "style",
    `width:${width}px;height:${height}px;margin:0;padding:0;font-family:${bodyFont};background:transparent;`,
  );

  const styleEl = document.createElementNS(nsXhtml, "style");
  styleEl.textContent = cssText;
  xhtmlWrapper.appendChild(styleEl);
  xhtmlWrapper.appendChild(clone);
  foreignObject.appendChild(xhtmlWrapper);
  svgRoot.appendChild(foreignObject);

  const serializedSvg = new XMLSerializer().serializeToString(svgRoot);
  const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    serializedSvg,
  )}`;

  const loadedImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("Gagal merender pratinjau grafik ke gambar"));
    img.src = svgDataUrl;
  });

  const scale = 2;
  const outCanvas = document.createElement("canvas");
  outCanvas.width = width * scale;
  outCanvas.height = height * scale;

  const ctx = outCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Konteks canvas tidak tersedia");
  }

  ctx.scale(scale, scale);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(loadedImg, 0, 0, width, height);

  const pngUrl = outCanvas.toDataURL("image/png");
  const dateStamp = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  });
  const link = document.createElement("a");
  link.href = pngUrl;
  link.download = `${sanitizeFilename(fileNameBase)}-${dateStamp}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
