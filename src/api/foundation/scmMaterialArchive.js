import request from '@/utils/request'

/**
 * 供应链产品档案（院内 ↔ 平台）
 * 菜单路径（需手工配置）：foundation/scmMaterialArchive
 * 组件：foundation/scmMaterialArchive/index
 * 权限：foundation:scmMaterial:list | push | sync | apply | config
 */

/** 可推送候选（院内已绑平台供应商编码的产品） */
export function listPushCandidates(params) {
  return request({
    url: '/foundation/scmMaterialArchive/listPushCandidates',
    method: 'get',
    params
  })
}

/** 批量推送到平台 */
export function pushMaterialArchive(data) {
  return request({
    url: '/foundation/scmMaterialArchive/push',
    method: 'post',
    data
  })
}

/** 从平台拉取并更新镜像 */
export function syncMaterialArchive(data) {
  return request({
    url: '/foundation/scmMaterialArchive/sync',
    method: 'post',
    data
  })
}

/** 镜像列表 */
export function listMaterialMirror(params) {
  return request({
    url: '/foundation/scmMaterialArchive/listMirror',
    method: 'get',
    params
  })
}

/** 将镜像字段应用到院内产品 */
export function applyMaterialMirror(data) {
  return request({
    url: '/foundation/scmMaterialArchive/apply',
    method: 'post',
    data
  })
}

/** 推送/应用字段配置 */
export function getMaterialFieldCfg() {
  return request({
    url: '/foundation/scmMaterialArchive/fieldCfg',
    method: 'get'
  })
}

export function saveMaterialFieldCfg(data) {
  return request({
    url: '/foundation/scmMaterialArchive/fieldCfg',
    method: 'put',
    data
  })
}
