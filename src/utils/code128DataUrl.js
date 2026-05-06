import JsBarcode from "jsbarcode";

/**
 * 在浏览器内生成 Code128 的 PNG Data URL，不访问外网（内网可正常打印/预览）。
 * @param {string} text 条码内容
 * @returns {string} data:image/png;base64,... 或生成失败时返回空串
 */
export function buildCode128DataUrl(text) {
  if (text == null) {
    return "";
  }
  const s = String(text).trim();
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
      format: "CODE128",
      width: 2,
      height: 100,
      displayValue: false,
      margin: 2,
      background: "#ffffff",
      lineColor: "#000000",
    });
    return canvas.toDataURL("image/png");
  } catch (e) {
    console.warn("[code128] 生成失败:", s, e);
    return "";
  }
}
