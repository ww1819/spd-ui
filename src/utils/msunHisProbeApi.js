/**
 * 众阳 HIS 联调/同步入参定义（SPD 前端 → /foundation/msunHis/probe|sync）
 */

export const MSUN_PROBE_API_LIST = [
  {
    key: 'depts',
    title: '2.1.9 科室基本信息',
    hint: '落镜像并 upsert fd_department',
    fields: [
      { key: 'invalidFlag', label: 'invalidFlag', hint: '0启用 1作废 -1全量', options: [
        { label: '（不填，默认全量）', value: '' }, { label: '-1', value: '-1' }, { label: '0', value: '0' }, { label: '1', value: '1' }
      ]},
      { key: 'deptId', label: 'deptId' },
      { key: 'deptName', label: 'deptName' }
    ]
  },
  {
    key: 'identities',
    title: '2.1.12 用户身份',
    hint: 'roleType/deptId/identityId/userId 至少一项',
    fields: [
      { key: 'roleType', label: 'roleType', options: ['0', '1', '2', '3', '4', '5', '6', '7', '8'].map(v => ({ label: v, value: v })) },
      { key: 'deptId', label: 'deptId' },
      { key: 'identityId', label: 'identityId' },
      { key: 'userId', label: 'userId' }
    ]
  },
  {
    key: 'identitiesSample',
    title: '2.1.12 快速探针',
    hint: '取首个科室再查人员',
    fields: [
      { key: 'roleType', label: 'roleType', defaultValue: '0', options: ['0', '1', '2', '3', '4', '5', '6', '7', '8'].map(v => ({ label: v, value: v })) }
    ]
  },
  {
    key: 'identitiesAll',
    title: '2.1.12 全部用户',
    hint: '服务端遍历 roleType 0~8',
    fields: []
  },
  {
    key: 'drugDict',
    title: '2.5.44 耗材字典',
    hint: 'materialOrDrug 固定 1；invalidFlag 未填时 0+1；不传 limitCount',
    fields: [
      { key: 'drugCode', label: 'drugCode' },
      { key: 'drugId', label: 'drugId' },
      { key: 'drugName', label: 'drugName' },
      { key: 'invalidFlag', label: 'invalidFlag', hint: '未填则 0+1', options: [
        { label: '（不填，0+1）', value: '' }, { label: '0', value: '0' }, { label: '1', value: '1' }
      ]},
      { key: 'startTime', label: 'startTime' },
      { key: 'endTime', label: 'endTime' }
    ]
  },
  {
    key: 'dictCategory',
    title: '2.5.58 分类字典',
    hint: '仅白名单分类写入 SPD',
    fields: [{ key: 'keyWord', label: 'keyWord', hint: '留空拉全量' }]
  },
  {
    key: 'suppliers',
    title: '2.5.62 供应商',
    hint: 'materialOrDrug 固定 1',
    fields: [
      { key: 'keyWord', label: 'keyWord' },
      { key: 'supplierId', label: 'supplierId' }
    ]
  },
  {
    key: 'producers',
    title: '2.5.63 生产厂商',
    hint: 'materialOrDrug 固定 1',
    fields: [
      { key: 'keyWord', label: 'keyWord' },
      { key: 'producerId', label: 'producerId' }
    ]
  },
  {
    key: 'mergeStocks',
    title: '2.5.82 合并库存',
    hint: 'deptId 必填',
    fields: [
      { key: 'deptId', label: 'deptId', required: true },
      { key: 'drugId', label: 'drugId' },
      { key: 'drugSpecPackingId', label: 'drugSpecPackingId' },
      { key: 'cascadeBatch', label: 'cascadeBatch', defaultValue: 'true', options: [
        { label: 'true', value: 'true' }, { label: 'false', value: 'false' }
      ]}
    ]
  },
  {
    key: 'batchStocks',
    title: '2.5.43 批次库存',
    hint: '三要素必填',
    fields: [
      { key: 'deptId', label: 'deptId', required: true },
      { key: 'drugId', label: 'drugId', required: true },
      { key: 'drugSpecPackingId', label: 'drugSpecPackingId', required: true }
    ]
  },
  {
    key: 'ykInstock',
    title: '2.5.102 入退库记录',
    hint: 'POST JSON',
    fields: [
      { key: 'startTime', label: 'startTime', type: 'datetime', required: true },
      { key: 'endTime', label: 'endTime', type: 'datetime', required: true },
      { key: 'deptId', label: 'deptId' },
      { key: 'type', label: 'type', options: [
        { label: '（不填）', value: '' }, { label: '0 入库', value: '0' }, { label: '1 退库', value: '1' }
      ]},
      { key: 'instockCode', label: 'instockCode' }
    ]
  }
]

/** 主数据同步按钮 → 可选探针入参 */
export const MSUN_SYNC_PROBE_FIELDS = {
  depts: MSUN_PROBE_API_LIST.find(a => a.key === 'depts').fields,
  identities: [],
  suppliers: MSUN_PROBE_API_LIST.find(a => a.key === 'suppliers').fields,
  producers: MSUN_PROBE_API_LIST.find(a => a.key === 'producers').fields,
  categories: MSUN_PROBE_API_LIST.find(a => a.key === 'dictCategory').fields,
  materials: MSUN_PROBE_API_LIST.find(a => a.key === 'drugDict').fields.filter(f => f.key !== 'startTime' && f.key !== 'endTime')
}

export function getProbeApiByKey(key) {
  return MSUN_PROBE_API_LIST.find(a => a.key === key)
}
