import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

/**
 * Note: 路由配置项
 *
 * hidden: true                     // 当设置 true 的时候该路由不会再侧边栏出现 如401，login等页面，或者如一些编辑页面/edit/1
 * alwaysShow: true                 // 当你一个路由下面的 children 声明的路由大于1个时，自动会变成嵌套的模式--如组件页面
 *                                  // 只有一个时，会将那个子路由当做根路由显示在侧边栏--如引导页面
 *                                  // 若你想不管路由下面的 children 声明的个数都显示你的根路由
 *                                  // 你可以设置 alwaysShow: true，这样它就会忽略之前定义的规则，一直显示根路由
 * redirect: noRedirect             // 当设置 noRedirect 的时候该路由在面包屑导航中不可被点击
 * name:'router-name'               // 设定路由的名字，一定要填写不然使用<keep-alive>时会出现各种问题
 * query: '{"id": 1, "name": "ry"}' // 访问路由的默认传递参数
 * roles: ['admin', 'common']       // 访问路由的角色权限
 * permissions: ['a:a:a', 'b:b:b']  // 访问路由的菜单权限
 * meta : {
    noCache: true                   // 如果设置为true，则不会被 <keep-alive> 缓存(默认 false)
    title: 'title'                  // 设置该路由在侧边栏和面包屑中展示的名字
    icon: 'svg-name'                // 设置该路由的图标，对应路径src/assets/icons/svg
    breadcrumb: false               // 如果设置为false，则不会在breadcrumb面包屑中显示
    activeMenu: '/system/user'      // 当路由设置了该属性，则会高亮相对应的侧边栏。
  }
 */

// 公共路由
export const constantRoutes = [
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect')
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login'),
    hidden: true
  },
  {
    path: '/register',
    component: () => import('@/views/register'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/error/404'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error/401'),
    hidden: true
  },
  {
    path: '',
    component: Layout,
    redirect: 'index',
    children: [
      {
        path: 'index',
        component: () => import('@/views/index'),
        name: 'Index',
        meta: { title: '首页', icon: 'dashboard', affix: true }
      }
    ]
  },
  {
    path: '/user',
    component: Layout,
    hidden: true,
    redirect: 'noredirect',
    children: [
      {
        path: 'profile',
        component: () => import('@/views/system/user/profile/index'),
        name: 'Profile',
        meta: { title: '个人中心', icon: 'user' }
      }
    ]
  },
  {
    path: '/test',
    component: Layout,
    hidden: true,
    children: [
      {
        path: 'departmentInventory',
        component: () => import('@/views/test/departmentInventoryTest'),
        name: 'DepartmentInventoryTest',
        meta: { title: '科室库存查询测试' }
      }
    ]
  }
]

// 动态路由，基于用户权限动态去加载
export const dynamicRoutes = [
  {
    path: '/system/user-auth',
    component: Layout,
    hidden: true,
    permissions: ['system:user:edit'],
    children: [
      {
        path: 'role/:userId(\\d+)',
        component: () => import('@/views/system/user/authRole'),
        name: 'AuthRole',
        meta: { title: '分配角色', activeMenu: '/system/user' }
      }
    ]
  },
  {
    path: '/system/role-auth',
    component: Layout,
    hidden: true,
    permissions: ['system:role:edit'],
    children: [
      {
        path: 'user/:roleId(\\d+)',
        component: () => import('@/views/system/role/authUser'),
        name: 'AuthUser',
        meta: { title: '分配用户', activeMenu: '/system/role' }
      }
    ]
  },
  {
    path: '/system/dict-data',
    component: Layout,
    hidden: true,
    permissions: ['system:dict:list'],
    children: [
      {
        path: 'index/:dictId(\\d+)',
        component: () => import('@/views/system/dict/data'),
        name: 'Data',
        meta: { title: '字典数据', activeMenu: '/system/dict' }
      }
    ]
  },
  {
    path: '/monitor/job-log',
    component: Layout,
    hidden: true,
    permissions: ['monitor:job:list'],
    children: [
      {
        path: 'index/:jobId(\\d+)',
        component: () => import('@/views/monitor/job/log'),
        name: 'JobLog',
        meta: { title: '调度日志', activeMenu: '/monitor/job' }
      }
    ]
  },
  {
    path: '/tool/gen-edit',
    component: Layout,
    hidden: true,
    permissions: ['tool:gen:edit'],
    children: [
      {
        path: 'index/:tableId(\\d+)',
        component: () => import('@/views/tool/gen/editTable'),
        name: 'GenEdit',
        meta: { title: '修改生成配置', activeMenu: '/tool/gen' }
      }
    ]
  },
  {
    path: '/caigou',
    component: Layout,
    redirect: 'noRedirect',
    name: 'Caigou',
    meta: { title: '采购管理', icon: 'shopping' },
    children: [
      {
        path: 'jihua',
        component: () => import('@/views/caigou/jihua/index'),
        name: 'CaigouJihua',
        meta: { title: '采购计划', icon: 'list' }
      },
      {
        path: 'jihuaAudit',
        component: () => import('@/views/caigou/jihua/audit/index'),
        name: 'CaigouJihuaAudit',
        meta: { title: '采购计划审核', icon: 'audit' }
      },
      {
        path: 'dingdan',
        component: () => import('@/views/caigou/dingdan/index'),
        name: 'CaigouDingdan',
        meta: { title: '采购订单', icon: 'list' }
      },
      {
        path: 'shenhe',
        component: () => import('@/views/caigou/shenhe/index'),
        name: 'CaigouShenhe',
        meta: { title: '订单审核', icon: 'audit' }
      },
      {
        path: 'publish',
        component: () => import('@/views/caigou/publish/index'),
        name: 'CaigouPublish',
        meta: { title: '订单发布', icon: 'list' }
      }
    ]
  },
  {
    path: '/gz',
    component: Layout,
    redirect: 'noRedirect',
    name: 'Gz',
    meta: { title: '高值管理', icon: 'shopping' },
    children: [
      {
        path: 'apply',
        component: () => import('@/views/gzOrder/apply/index'),
        name: 'GzOrderApply',
        meta: { title: '入库申请', icon: 'list' }
      },
      {
        path: 'audit',
        component: () => import('@/views/gzOrder/audit/index'),
        name: 'GzOrderAudit',
        meta: { title: '入库审核', icon: 'audit' }
      },
      {
        path: 'goodsApply',
        component: () => import('@/views/gzOrder/goodsApply/index'),
        name: 'GzOrderGoodsApply',
        meta: { title: '退货申请', icon: 'list' }
      },
      {
        path: 'goodsAudit',
        component: () => import('@/views/gzOrder/goodsAudit/index'),
        name: 'GzOrderGoodsAudit',
        meta: { title: '退货审核', icon: 'audit' }
      },
      {
        path: 'refund',
        component: () => import('@/views/gzOrder/refund/index'),
        name: 'GzOrderRefund',
        meta: { title: '备货退货', icon: 'international' }
      },
      {
        path: 'follow',
        component: () => import('@/views/gzOrder/follow/index'),
        name: 'GzOrderFollow',
        meta: { title: '跟台管理', icon: 'list' }
      }
    ]
  },
  {
    path: '/equipment',
    component: Layout,
    redirect: 'noRedirect',
    name: 'Equipment',
    meta: { title: '设备管理', icon: 'equipment' },
    children: [
      {
        path: 'equipmentInfo',
        component: () => import('@/views/equipment/equipmentInfo/index'),
        name: 'EquipmentInfo',
        meta: { title: '设备信息', icon: 'list' }
      },
      {
        path: 'equipmentCategory',
        component: () => import('@/views/equipment/equipmentCategory/index'),
        name: 'EquipmentCategory',
        meta: { title: '设备分类', icon: 'tree' }
      },
      {
        path: 'equipmentFile',
        component: () => import('@/views/equipment/equipmentFile/index'),
        name: 'EquipmentFile',
        meta: { title: '设备档案', icon: 'file' }
      },
      {
        path: 'equipmentInspect',
        component: () => import('@/views/equipment/equipmentInspect/index'),
        name: 'EquipmentInspect',
        meta: { title: '设备巡检', icon: 'eye' }
      },
      {
        path: 'equipmentRepair',
        component: () => import('@/views/equipment/equipmentRepair/index'),
        name: 'EquipmentRepair',
        meta: { title: '设备维修', icon: 'tool' }
      },
      {
        path: 'equipmentMaintain',
        component: () => import('@/views/equipment/equipmentMaintain/index'),
        name: 'EquipmentMaintain',
        meta: { title: '设备保养', icon: 'maintain' }
      },
      {
        path: 'equipmentBorrow',
        component: () => import('@/views/equipment/equipmentBorrow/index'),
        name: 'EquipmentBorrow',
        meta: { title: '设备借用', icon: 'borrow' }
      },
      {
        path: 'equipmentReturn',
        component: () => import('@/views/equipment/equipmentReturn/index'),
        name: 'EquipmentReturn',
        meta: { title: '设备归还', icon: 'return' }
      },
      {
        path: 'equipmentReceive',
        component: () => import('@/views/equipment/equipmentReceive/index'),
        name: 'EquipmentReceive',
        meta: { title: '设备领用', icon: 'receive' }
      },
      {
        path: 'equipmentStorage',
        component: () => import('@/views/equipment/equipmentStorage/index'),
        name: 'EquipmentStorage',
        meta: { title: '设备入库', icon: 'storage' }
      },
      {
        path: 'equipmentScrap',
        component: () => import('@/views/equipment/equipmentScrap/index'),
        name: 'EquipmentScrap',
        meta: { title: '设备报废', icon: 'scrap' }
      },
      {
        path: 'equipmentTransfer',
        component: () => import('@/views/equipment/equipmentTransfer/index'),
        name: 'EquipmentTransfer',
        meta: { title: '设备调拨', icon: 'transfer' }
      },
      {
        path: 'equipmentAllocate',
        component: () => import('@/views/equipment/equipmentAllocate/index'),
        name: 'EquipmentAllocate',
        meta: { title: '设备分配', icon: 'allocate' }
      },
      {
        path: 'equipmentCheck',
        component: () => import('@/views/equipment/equipmentCheck/index'),
        name: 'EquipmentCheck',
        meta: { title: '设备盘点', icon: 'check' }
      },
      {
        path: 'purchaseApplication',
        component: () => import('@/views/equipment/purchaseApplication/index'),
        name: 'EquipmentPurchaseApplication',
        meta: { title: '设备采购申请', icon: 'list' }
      }
    ]
  }
]

// 防止连续点击多次路由报错
let routerPush = Router.prototype.push;
let routerReplace = Router.prototype.replace;
// push
Router.prototype.push = function push(location) {
  return routerPush.call(this, location).catch(err => err)
}
// replace
Router.prototype.replace = function push(location) {
  return routerReplace.call(this, location).catch(err => err)
}

export default new Router({
  mode: 'history', // 去掉url中的#
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})
