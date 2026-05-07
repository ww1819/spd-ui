import JsBarcode from "jsbarcode";

/**
 * 院内码等用于 Code128B 的载荷：去空白、全角转半角、去掉不可编码字符，避免扫出与展示不一致。
 */
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
  // Code128 可打印 ASCII（与 JsBarcode CODE128B 一致）
  s = s.replace(/[^\x20-\x7E]/g, "");
  return s.trim();
}

/**
 * 在浏览器内生成 Code128 的 PNG Data URL，不访问外网（内网可正常打印/预览）。
 * 使用 CODE128B：避免 AUTO 在数字段切换码集，部分扫码枪会解成乱码或与 HRI 不一致。
 * @param {string} text 条码内容
 * @returns {string} data:image/png;base64,... 或生成失败时返回空串
 */
export function buildCode128DataUrl(text) {
  const s = normalizeBarcodePayload(text);
  if (!s) {
    return "";
  }
  let canvas;
  try {
    canvas = document.createElement("canvas");
  } catch (e) {
    return "";
  }
  try {
    JsBarcode(canvas, s, {
      format: "CODE128B",
      width: 2,
      height: 52,
      displayValue: false,
      margin: 1,
      background: "#ffffff",
      lineColor: "#000000",
    });
    return canvas.toDataURL("image/png");
  } catch (e) {
    console.warn("[code128] 生成失败:", s, e);
    return "";
  }
}
