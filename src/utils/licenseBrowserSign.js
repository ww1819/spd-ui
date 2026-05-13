/**
 * 与后端 LicensePayload / LicenseCrypto 一致：v2 医院名绑定，SHA256withRSA，注册码 Base64Url(payload).Base64(sig)
 */

export function normalizeHospitalName(name) {
  if (name == null) return ''
  let t = String(name).trim().normalize('NFKC')
  return t.replace(/\s+/g, ' ')
}

/** 签名字节用的 JSON（键序：expireAt, hospitalName, version，与 Java TreeMap 一致） */
export function buildCanonicalJsonV2(expireAtIso, hospitalNameRaw) {
  const hospitalName = normalizeHospitalName(hospitalNameRaw)
  const obj = { expireAt: expireAtIso, hospitalName, version: 2 }
  return JSON.stringify(obj)
}

/** 注册码第一段 JSON（键序：version, hospitalName, expireAt，与 Java LinkedHashMap 一致） */
export function buildPayloadJsonV2(expireAtIso, hospitalNameRaw) {
  const hospitalName = normalizeHospitalName(hospitalNameRaw)
  const obj = { version: 2, hospitalName, expireAt: expireAtIso }
  return JSON.stringify(obj)
}

function base64UrlEncodeUtf8(str) {
  const utf8 = new TextEncoder().encode(str)
  let bin = ''
  utf8.forEach(b => { bin += String.fromCharCode(b) })
  const b64 = btoa(bin)
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function pemPkcs8ToArrayBuffer(pem) {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/gi, '')
    .replace(/-----END PRIVATE KEY-----/gi, '')
    .replace(/\s/g, '')
  const binary = atob(body)
  const buf = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    buf[i] = binary.charCodeAt(i)
  }
  return buf.buffer
}

function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    bin += String.fromCharCode(bytes[i])
  }
  return btoa(bin)
}

/**
 * @param {string} pem PKCS#8 PEM（BEGIN PRIVATE KEY）
 * @param {string} hospitalNameRaw
 * @param {string} expireAtIso ISO-8601 如 2030-12-31T23:59:59Z
 */
export async function signLicenseV2InBrowser(pem, hospitalNameRaw, expireAtIso) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('当前浏览器不支持 Web Crypto，请使用 Chrome / Edge 等')
  }
  const pkcs8 = pemPkcs8ToArrayBuffer(pem)
  const key = await window.crypto.subtle.importKey(
    'pkcs8',
    pkcs8,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const canonical = buildCanonicalJsonV2(expireAtIso, hospitalNameRaw)
  const data = new TextEncoder().encode(canonical)
  const sigBuf = await window.crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, data)
  const partA = base64UrlEncodeUtf8(buildPayloadJsonV2(expireAtIso, hospitalNameRaw))
  const partB = arrayBufferToBase64(sigBuf)
  return `${partA}.${partB}`
}
