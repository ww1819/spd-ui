import { findModel } from './catalog'
import LiangTianWsAdapter from './adapters/liangTianWs'

/**
 * 按厂家/型号创建高拍仪适配器
 * @param {string} vendorCode
 * @param {string} modelCode
 * @returns {LiangTianWsAdapter}
 */
export function createGaopayiAdapter(vendorCode, modelCode) {
  const model = findModel(vendorCode, modelCode)
  if (!model || !model.adapter) {
    throw new Error('该厂家/型号暂未接入，请选择良田系列型号')
  }
  if (model.adapter === 'liangTianWs') {
    return new LiangTianWsAdapter({ wsUrl: model.wsUrl || 'ws://127.0.0.1:9000' })
  }
  throw new Error('未知高拍仪适配器: ' + model.adapter)
}

/**
 * base64（可带 dataURL 前缀）转 File
 */
export function base64ToFile(base64, filename = 'gaopayi.jpg', mime = 'image/jpeg') {
  let b64 = base64 || ''
  let type = mime
  const m = /^data:([^;]+);base64,(.+)$/i.exec(b64)
  if (m) {
    type = m[1] || mime
    b64 = m[2]
  }
  const binary = window.atob(b64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new File([bytes], filename, { type })
}

export { findModel, findVendor, GAOPAYI_VENDORS, loadLastSelection, saveLastSelection, getDefaultVendorModel } from './catalog'
