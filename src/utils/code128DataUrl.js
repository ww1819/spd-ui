import JsBarcode from "jsbarcode";

const LABEL_PRINT_DPI = 300;
const MIN_X_MM = 0.25;
const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * 60×40mm 高值备货码
 * - CODE128 自动码集：G + 数字段走 Code C，比纯 Code128B 短约 35%，条更宽更好扫
 * - SVG 矢量输出：打印无锯齿、条空不糊
 */
export const CODE128_LABEL = {
  totalWidthMm: 54,
  /** 6mm 条高：60×40 标签上宽高比约 9:1，符合仓储一维码常规视觉 */
  barHeightMm: 6,
  quietMm: 3,
};

export const CODE128_LABEL_COMPACT = {
  totalWidthMm: 46,
  barHeightMm: 8,
  quietMm: 2.5,
};

function mmToPx(mm, dpi = LABEL_PRINT_DPI) {
  return (mm * dpi) / 25.4;
}

function pxToMm(px, dpi = LABEL_PRINT_DPI) {
  return Math.round(((px * 25.4) / dpi) * 100) / 100;
}

export function normalizeBarcodePayload(text) {
  if (text == null) {
    return "";
  }
  let s = String(text).trim();
  try {
    if (typeof s.normalize === "function") {
      s = s.normalize("NFKC");
    }
  } catch (e) {
    /* ignore */
  }
  s = s.replace(/[^\x20-\x7E]/g, "");
  return s.trim();
}

function measureCode128Modules(text, format) {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, text, {
    format,
    width: 1,
    height: 10,
    margin: 0,
    displayValue: false,
  });
  return canvas.width;
}

/** 选模块数最少的码集（通常 CODE128 自动码对 G+数字 院内码更短） */
function pickCode128Format(text) {
  const candidates = ["CODE128", "CODE128B"];
  let bestFormat = "CODE128";
  let bestModules = Infinity;
  for (const format of candidates) {
    try {
      const modules = measureCode128Modules(text, format);
      if (modules > 0 && modules < bestModules) {
        bestModules = modules;
        bestFormat = format;
      }
    } catch (e) {
      /* try next */
    }
  }
  return { format: bestFormat, modules: bestModules };
}

function resolveModulePx(modules, cfg) {
  const minModulePx = Math.max(2, Math.round(mmToPx(MIN_X_MM)));
  const maxTotalPx = Math.round(mmToPx(cfg.totalWidthMm));
  const quietPx = Math.round(mmToPx(cfg.quietMm));
  const maxModulePx = Math.floor((maxTotalPx - 2 * quietPx) / modules);
  return Math.max(minModulePx, maxModulePx);
}

function buildJsBarcodeOptions(text, cfg, format, modulePx) {
  const quietPx = Math.round(mmToPx(cfg.quietMm));
  const barHeightPx = Math.round(mmToPx(cfg.barHeightMm));
  return {
    format,
    width: modulePx,
    height: barHeightPx,
    displayValue: false,
    marginLeft: quietPx,
    marginRight: quietPx,
    marginTop: 0,
    marginBottom: 0,
    background: "#ffffff",
    lineColor: "#000000",
    valid: () => true,
  };
}

function renderCode128Svg(text, options) {
  const svg = document.createElementNS(SVG_NS, "svg");
  JsBarcode(svg, text, options);
  const widthPx = parseFloat(svg.getAttribute("width")) || 0;
  const heightPx = parseFloat(svg.getAttribute("height")) || 0;
  svg.setAttribute("viewBox", `0 0 ${widthPx} ${heightPx}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("shape-rendering", "crispEdges");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.removeAttribute("style");
  const rects = svg.querySelectorAll("rect");
  rects.forEach((rect) => {
    rect.setAttribute("fill", "#000000");
  });
  const bg = svg.querySelector("rect:first-child");
  if (bg) {
    bg.setAttribute("fill", "#ffffff");
  }
  return {
    svgHtml: svg.outerHTML,
    widthPx: Math.round(widthPx),
    heightPx: Math.round(heightPx),
  };
}

/**
 * @returns {{
 *   dataUrl: string,
 *   svgHtml: string,
 *   widthMm: number,
 *   heightMm: number,
 *   widthPx: number,
 *   heightPx: number,
 *   format: string
 * }}
 */
export function buildCode128Label(text, options = {}) {
  const cfg = { ...CODE128_LABEL, ...options };
  const empty = {
    dataUrl: "",
    svgHtml: "",
    widthMm: 0,
    heightMm: 0,
    widthPx: 0,
    heightPx: 0,
    format: "",
  };
  const s = normalizeBarcodePayload(text);
  if (!s) {
    return empty;
  }
  try {
    const { format, modules } = pickCode128Format(s);
    if (!modules) {
      return empty;
    }
    const modulePx = resolveModulePx(modules, cfg);
    const jsOptions = buildJsBarcodeOptions(s, cfg, format, modulePx);
    const { svgHtml, widthPx, heightPx } = renderCode128Svg(s, jsOptions);
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgHtml)}`;
    return {
      dataUrl,
      svgHtml,
      widthMm: pxToMm(widthPx),
      heightMm: pxToMm(heightPx),
      widthPx,
      heightPx,
      format,
    };
  } catch (e) {
    console.warn("[code128] 生成失败:", s, e);
    return empty;
  }
}

export function buildCode128DataUrl(text, options = {}) {
  return buildCode128Label(text, options).dataUrl;
}
