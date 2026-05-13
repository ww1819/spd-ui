import request from '@/utils/request'

export function getLicenseStatus() {
  return request({
    url: '/system/license/status',
    method: 'get'
  })
}

export function activateLicense(licenseCode, customerId) {
  const data = { licenseCode }
  if (customerId !== undefined && customerId !== null && customerId !== '') {
    data.customerId = customerId
  }
  return request({
    url: '/system/license/activate',
    method: 'post',
    data
  })
}
