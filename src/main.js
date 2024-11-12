import Vue from 'vue'

import Cookies from 'js-cookie'

import Element from 'element-ui'
import './assets/styles/element-variables.scss'

import '@/assets/styles/index.scss' // global css
import '@/assets/styles/ruoyi.scss' // ruoyi css
import App from './App'
import store from './store'
import router from './router'
import directive from './directive' // directive
import plugins from './plugins' // plugins
import { download } from '@/utils/request'

import './assets/icons' // icon
import './permission' // permission control
import { getDicts } from "@/api/system/dict/data";
import { getConfigKey } from "@/api/system/config";
import { parseTime, resetForm, addDateRange, selectDictLabel, selectDictLabels, handleTree } from "@/utils/ruoyi";
// 分页组件
import Pagination from "@/components/Pagination";
// 自定义表格工具组件
import RightToolbar from "@/components/RightToolbar"
// 富文本组件
import Editor from "@/components/Editor"
// 文件上传组件
import FileUpload from "@/components/FileUpload"
// 图片上传组件
import ImageUpload from "@/components/ImageUpload"
// 图片预览组件
import ImagePreview from "@/components/ImagePreview"
// 字典标签组件
import DictTag from '@/components/DictTag'
// 头部标签组件
import VueMeta from 'vue-meta'
// 字典数据组件
import DictData from '@/components/DictData'
// 供应商组件
import SelectSupplier from '@/components/SelectModel/SelectSupplier'
// 耗材组件
import SelectMaterial from '@/components/SelectModel/SelectMaterial'
// 仓库组件
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
// 科室组件
import SelectDepartment from '@/components/SelectModel/SelectDepartment'
// 操作人组件
import SelectUser from '@/components/SelectModel/SelectUser'
// 生产厂家组件
import SelectFactory from '@/components/SelectModel/SelectFactory'
// 财务分类组件
import SelectFinanceCategory from '@/components/SelectModel/SelectFinanceCategory'
// 库房分类组件
import SelectWarehouseCategory from '@/components/SelectModel/SelectWarehouseCategory'
// 单位分类组件
import SelectUnit from '@/components/SelectModel/SelectUnit'

// 仓库筛选组件
import WarehouseAutocomplete from '@/components/SelectModel/WarehouseAutocomplete'
import MaterialAutocomplete from '@/components/SelectModel/MaterialAutocomplete'
import SelectPdInventoryFilter from '@/components/SelectModel/SelectPdInventoryFilter'

// 库存对话框组件
import SelectInventory from '@/components/SelectModel/SelectInventory'
// 科室库存对话框组件
import SelectDepInventory from '@/components/SelectModel/SelectDepInventory'
// 打开耗材对话框组件
import SelectMaterialFilter from '@/components/SelectModel/SelectMaterialFilter'
// 打开高值耗材对话框组件
import SelectGZMaterialFilter from '@/components/SelectModel/SelectGZMaterialFilter'
// 高值库存对话框组件
import SelectGzDepotInventory from '@/components/SelectModel/SelectGzDepotInventory'
// 高值科室库存对话框组件
import SelectGzDepInventory from '@/components/SelectModel/SelectGzDepInventory'

// 金额格式化
import numberFormatter from './utils/format-currency'

Object.keys(numberFormatter).forEach((key) =>{
  Vue.prototype[key] = numberFormatter[key];
  Vue.filter(key,numberFormatter[key]);
})

//dataV:将自动注册所有组件为全局组件
import dataV from '@jiaminghi/data-view'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import geoJson from '@/utils/china.json'
import * as echarts from 'echarts'

import vuePlugsPrint from '@/utils/vuePlugsPrint'
import KrPrintDesigner from "kr-print-designer";


Vue.use(dataV)
Vue.use(ElementUI);
Vue.prototype.$echarts = echarts
echarts.registerMap('china', geoJson);
// 全局方法挂载
Vue.prototype.getDicts = getDicts
Vue.prototype.getConfigKey = getConfigKey
Vue.prototype.parseTime = parseTime
Vue.prototype.resetForm = resetForm
Vue.prototype.addDateRange = addDateRange
Vue.prototype.selectDictLabel = selectDictLabel
Vue.prototype.selectDictLabels = selectDictLabels
Vue.prototype.download = download
Vue.prototype.handleTree = handleTree

// 全局组件挂载
Vue.component('DictTag', DictTag)
Vue.component('Pagination', Pagination)
Vue.component('RightToolbar', RightToolbar)
Vue.component('Editor', Editor)
Vue.component('FileUpload', FileUpload)
Vue.component('ImageUpload', ImageUpload)
Vue.component('ImagePreview', ImagePreview)
//下拉组件
Vue.component('SelectSupplier', SelectSupplier)
Vue.component('SelectMaterial', SelectMaterial)
Vue.component('SelectWarehouse', SelectWarehouse)
Vue.component('SelectDepartment', SelectDepartment)
Vue.component('SelectUser', SelectUser)
Vue.component('SelectFactory', SelectFactory)
Vue.component('SelectFinanceCategory', SelectFinanceCategory)
Vue.component('SelectWarehouseCategory', SelectWarehouseCategory)
Vue.component('SelectUnit', SelectUnit)

//筛选组件
Vue.component('WarehouseAutocomplete', WarehouseAutocomplete)
Vue.component('MaterialAutocomplete', MaterialAutocomplete)
Vue.component('SelectPdInventoryFilter', SelectPdInventoryFilter)

//库存对话框组件
Vue.component('SelectInventory', SelectInventory)
//科室库存对话框组件
Vue.component('SelectDepInventory', SelectDepInventory)
//高值库存对话框组件
Vue.component('SelectGzDepotInventory', SelectGzDepotInventory)
//高值科室库存对话框组件
Vue.component('SelectGzDepInventory', SelectGzDepInventory)
//高值物料筛选
Vue.component('SelectGZMaterialFilter', SelectGZMaterialFilter)

Vue.use(KrPrintDesigner);
Vue.use(directive)
Vue.use(vuePlugsPrint);
Vue.use(plugins)
Vue.use(VueMeta)
DictData.install()

/**
 * If you don't want to use mock-server
 * you want to use MockJs for mock api
 * you can execute: mockXHR()
 *
 * Currently MockJs will be used in the production environment,
 * please remove it before going online! ! !
 */

Vue.use(Element, {
  size: Cookies.get('size') || 'medium' // set element-ui default size
})

Vue.config.productionTip = false

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
