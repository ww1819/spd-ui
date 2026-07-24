/**
 * 高拍仪厂家 / 型号目录（可扩展）
 * adapter: 适配器标识，见 utils/gaopayi/index.js
 */
export const GAOPAYI_VENDORS = [
  {
    code: 'liangTian',
    name: '良田(Eloam)',
    models: [
      {
        code: 'eloam-ws-9000',
        name: '通用本地服务(WebSocket:9000)',
        adapter: 'liangTianWs',
        wsUrl: 'ws://127.0.0.1:9000'
      },
      {
        code: 'S1000',
        name: 'S1000 系列',
        adapter: 'liangTianWs',
        wsUrl: 'ws://127.0.0.1:9000'
      },
      {
        code: 'S2000',
        name: 'S2000 系列',
        adapter: 'liangTianWs',
        wsUrl: 'ws://127.0.0.1:9000'
      }
    ]
  },
  {
    code: 'other',
    name: '其他厂家(预留)',
    models: [
      {
        code: 'placeholder',
        name: '暂未接入',
        adapter: null,
        disabled: true
      }
    ]
  }
]

export function findVendor(vendorCode) {
  return GAOPAYI_VENDORS.find(v => v.code === vendorCode) || null
}

export function findModel(vendorCode, modelCode) {
  const vendor = findVendor(vendorCode)
  if (!vendor) return null
  return vendor.models.find(m => m.code === modelCode) || null
}

export function getDefaultVendorModel() {
  const vendor = GAOPAYI_VENDORS.find(v => v.models.some(m => m.adapter))
  const model = vendor ? vendor.models.find(m => m.adapter) : null
  return {
    vendorCode: vendor ? vendor.code : '',
    modelCode: model ? model.code : ''
  }
}

/** 本地记忆上次选择（厂家/型号/纠偏偏好） */
const STORAGE_KEY = 'spd.gaopayi.lastSelection'

export function loadLastSelection() {
  const defaults = { ...getDefaultVendorModel(), deskew: false }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw)
    if (findModel(parsed.vendorCode, parsed.modelCode)) {
      return {
        vendorCode: parsed.vendorCode,
        modelCode: parsed.modelCode,
        deskew: !!parsed.deskew
      }
    }
  } catch (e) { /* ignore */ }
  return defaults
}

export function saveLastSelection(vendorCode, modelCode, deskew) {
  try {
    const prev = loadLastSelection()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      vendorCode: vendorCode || prev.vendorCode,
      modelCode: modelCode || prev.modelCode,
      deskew: deskew == null ? !!prev.deskew : !!deskew
    }))
  } catch (e) { /* ignore */ }
}
