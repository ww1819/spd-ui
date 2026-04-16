import request from '@/utils/request'

export function getDataBackup() {
  return request({
    url: '/system/dataBackup',
    method: 'get'
  })
}

export function saveDataBackup(data) {
  return request({
    url: '/system/dataBackup',
    method: 'put',
    data
  })
}

export function changeDataBackupStatus(enabled) {
  return request({
    url: '/system/dataBackup/changeStatus',
    method: 'put',
    data: { enabled }
  })
}

export function runDataBackupNow() {
  return request({
    url: '/system/dataBackup/runNow',
    method: 'post'
  })
}
