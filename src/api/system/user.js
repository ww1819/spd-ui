import request from '@/utils/request'
import { parseStrEmpty } from "@/utils/ruoyi";

// 查询用户列表
export function listUser(query) {
  return request({
    url: '/system/user/list',
    method: 'get',
    params: query
  })
}
// 查询所有用户列表
export function listUserAll(query) {
  return request({
    url: '/system/user/listAll',
    method: 'get',
    params: query
  })
}

// 查询用户详细（systemType=hc：耗材端读 sys_user_menu / sys_user_department / sys_user_warehouse）
export function getUser(userId) {
  return request({
    url: '/system/user/' + parseStrEmpty(userId),
    method: 'get',
    params: { systemType: 'hc' },
    timeout: 60000
  })
}

/** 耗材租户用户授权：菜单树=客户已开通功能，checkedKeys=sys_user_menu */
export function roleMenuTreeselectUser(userId) {
  return request({
    url: '/system/user/roleMenuTreeselect/' + parseStrEmpty(userId),
    method: 'get',
    timeout: 60000
  })
}

// 新增用户
export function addUser(data) {
  return request({
    url: '/system/user',
    method: 'post',
    data: data
  })
}

// 修改用户
export function updateUser(data) {
  return request({
    url: '/system/user',
    method: 'put',
    data: data
  })
}

// 删除用户
export function delUser(userId) {
  return request({
    url: '/system/user/' + userId,
    method: 'delete'
  })
}

// 批量更新用户名称简码
export function updateUserReferred(ids) {
  return request({
    url: '/system/user/updateReferred',
    method: 'post',
    data: { ids }
  })
}

/** 批量设置耗材工作组（sys_user_post） */
export function batchSetUserWorkgroup(data) {
  return request({
    url: '/system/user/batchWorkgroup',
    method: 'post',
    data
  })
}

/** 机构管理员批量修改本租户用户密码（排除 admin 与 super 账号） */
export function batchResetUserPassword(password) {
  return request({
    url: '/system/user/batchResetPwd',
    method: 'post',
    data: { password }
  })
}

// 用户密码重置
export function resetUserPwd(userId, password) {
  const data = {
    userId,
    password
  }
  return request({
    url: '/system/user/resetPwd',
    method: 'put',
    data: data
  })
}

// 用户状态修改
export function changeUserStatus(userId, status) {
  const data = {
    userId,
    status
  }
  return request({
    url: '/system/user/changeStatus',
    method: 'put',
    data: data
  })
}

/** 解除密码错误锁定 */
export function unlockUser(userName) {
  return request({
    url: '/system/user/unlock/' + encodeURIComponent(userName),
    method: 'put'
  })
}

// 查询用户个人信息
export function getUserProfile() {
  return request({
    url: '/system/user/profile',
    method: 'get'
  })
}

// 修改用户个人信息
export function updateUserProfile(data) {
  return request({
    url: '/system/user/profile',
    method: 'put',
    data: data
  })
}

// 用户密码重置
export function updateUserPwd(oldPassword, newPassword) {
  const data = {
    oldPassword,
    newPassword
  }
  return request({
    url: '/system/user/profile/updatePwd',
    method: 'put',
    params: data
  })
}

// 用户头像上传
export function uploadAvatar(data) {
  return request({
    url: '/system/user/profile/avatar',
    method: 'post',
    data: data
  })
}

// 查询授权角色
export function getAuthRole(userId) {
  return request({
    url: '/system/user/authRole/' + userId,
    method: 'get'
  })
}

// 保存授权角色
export function updateAuthRole(data) {
  return request({
    url: '/system/user/authRole',
    method: 'put',
    params: data
  })
}

/** 仅更新用户菜单权限（不触碰用户主表/密码） */
export function updateUserMenus(userId, menuIds) {
  return request({
    url: '/system/user/' + parseStrEmpty(userId) + '/menus',
    method: 'put',
    data: { menuIds: menuIds || [] },
    timeout: 60000
  })
}

/** 仅更新用户科室权限 */
export function updateUserDepartments(userId, departmentIds) {
  return request({
    url: '/system/user/' + parseStrEmpty(userId) + '/departments',
    method: 'put',
    data: { departmentIds: departmentIds || [] },
    timeout: 60000
  })
}

/** 仅更新用户仓库权限 */
export function updateUserWarehouses(userId, warehouseIds) {
  return request({
    url: '/system/user/' + parseStrEmpty(userId) + '/warehouses',
    method: 'put',
    data: { warehouseIds: warehouseIds || [] },
    timeout: 60000
  })
}

// 查询部门下拉树结构
export function deptTreeSelect() {
  return request({
    url: '/system/user/deptTree',
    method: 'get'
  })
}


export function importUserAddData(formData){return request({url:'/system/user/importAddData',method:'post',data:formData,headers:{'Content-Type':'multipart/form-data',repeatSubmit:false}})}
export function importUserUpdateData(formData){return request({url:'/system/user/importUpdateData',method:'post',data:formData,headers:{'Content-Type':'multipart/form-data',repeatSubmit:false}})}
