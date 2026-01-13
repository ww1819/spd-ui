import request from '@/utils/request'

// 查询患者信息列表
export function listPatient(query) {
  return request({
    url: '/gz/patient/list',
    method: 'get',
    params: query
  })
}

// 根据病历号查询患者信息
export function getPatientByMedicalRecordNo(medicalRecordNo) {
  return request({
    url: '/gz/patient/getByMedicalRecordNo/' + medicalRecordNo,
    method: 'get'
  })
}

// 查询患者信息详细
export function getPatient(id) {
  return request({
    url: '/gz/patient/' + id,
    method: 'get'
  })
}

// 新增患者信息
export function addPatient(data) {
  return request({
    url: '/gz/patient',
    method: 'post',
    data: data
  })
}

// 修改患者信息
export function updatePatient(data) {
  return request({
    url: '/gz/patient',
    method: 'put',
    data: data
  })
}

// 删除患者信息
export function delPatient(id) {
  return request({
    url: '/gz/patient/' + id,
    method: 'delete'
  })
}

// 导出患者信息
export function exportPatient(query) {
  return request({
    url: '/gz/patient/export',
    method: 'post',
    params: query
  })
}
