/** 源单被下游单据引用状态（与后端 StkIoBill.docRefStatus 一致） */
export const DOC_REF_STATUS = {
  NONE: 'NONE',
  PARTIAL: 'PARTIAL',
  FULL: 'FULL'
}

export const DOC_REF_STATUS_OPTIONS = [
  { value: 'NONE', label: '未引用' },
  { value: 'PARTIAL', label: '部分引用' },
  { value: 'FULL', label: '全部引用' }
]

export function docRefStatusLabel(status) {
  const o = DOC_REF_STATUS_OPTIONS.find(x => x.value === status)
  return o ? o.label : '—'
}

export function docRefStatusTagType(status) {
  if (status === 'NONE') return 'info'
  if (status === 'PARTIAL') return 'warning'
  if (status === 'FULL') return 'success'
  return ''
}
