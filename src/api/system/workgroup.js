import request from '@/utils/request'

// 查询工作组下拉树结构
export function workgroupTreeSelect() {
  return request({
    url: '/system/workgroup/treeselect',
    method: 'get'
  })
}

// 查询工作组列表
export function listWorkgroup(query) {
  return request({
    url: '/system/workgroup/list',
    method: 'get',
    params: query
  })
}

// 查询所有工作组列表
export function listWorkgroupAll() {
  return request({
    url: '/system/workgroup/listAll',
    method: 'get'
  })
}

