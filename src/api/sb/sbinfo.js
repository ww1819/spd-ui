import request from '@/utils/request'

export function getSbinfo() {
  return request({
    url: '/sbinfo',
    method: 'get'
  })
}

export function getSbLabelInfo(data) { //获取打印机信息
  return request({
    url: '/sb/sbInfo/getSbLabelInfo',
    method: 'post',
    data: data
  })
}


