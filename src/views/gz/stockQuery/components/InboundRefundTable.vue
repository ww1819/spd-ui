<template>
  <div class="table-container">
    <el-table v-loading="loading" :data="tableList" @selection-change="handleSelectionChange" border style="width: 100%">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="单号" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.orderNo || '--' }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.warehouse && scope.row.warehouse.name) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.supplier && scope.row.supplier.name) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单价" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.price != null && scope.row.price !== undefined">{{ parseFloat(scope.row.price).toFixed(2) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="数量" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.qty != null && scope.row.qty !== undefined">{{ scope.row.qty }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="耗材名称" align="center" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.materialName || (scope.row.material && scope.row.material.name) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="生产厂家" align="center" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || scope.row.factoryName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="院内码" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <!-- 确保显示的是 inHospitalCode，而不是 qty -->
          <span v-if="scope.row.inHospitalCode && String(scope.row.inHospitalCode).trim() !== '' && scope.row.inHospitalCode !== scope.row.qty">{{ String(scope.row.inHospitalCode) }}</span>
          <span v-else-if="scope.row.inHospitalCode && scope.row.inHospitalCode === scope.row.qty">--</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="UDI码" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <!-- 确保显示的是 UDI码，而不是耗材编码 -->
          <span v-if="scope.row.udiNo && scope.row.udiNo !== scope.row.materialCode">{{ scope.row.udiNo }}</span>
          <span v-else-if="scope.row.material && scope.row.material.udiNo && scope.row.material.udiNo !== scope.row.materialCode">{{ scope.row.material.udiNo }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="有效期" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="生产日期" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.beginTime">{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证号" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证有效期" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.material && scope.row.material.periodDate">{{ parseTime(scope.row.material.periodDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.amt != null && scope.row.amt !== undefined">{{ parseFloat(scope.row.amt).toFixed(2) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.orderStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="操作人" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.createBy || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="入库日期" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.orderDate">{{ parseTime(scope.row.orderDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.remark || '--' }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script>
import { listOrder, getOrder } from "@/api/gz/order";
import { listDepotInventory } from "@/api/gz/depotInventory";

export default {
  name: "InboundRefundTable",
  dicts: ['biz_status'],
  props: {
    queryParams: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      tableList: [],
      total: 0,
      ids: []
    };
  },
  watch: {
    // 监听查询参数变化，参照库存查询页面的简洁方式
    queryParams: {
      handler() {
        this.getList();
      },
      deep: true,
      immediate: false
    }
  },
  created() {
    // 直接调用，参照库存查询页面
    this.getList();
  },
  beforeDestroy() {
    // 清理资源
    if (this._headerScrollbarCleanup) {
      this._headerScrollbarCleanup();
    }
  },
  mounted() {
    // 延迟执行，避免阻塞初始渲染
    setTimeout(() => {
      this.hideHeaderScrollbar();
    }, 300);
  },
  methods: {
    hideHeaderScrollbar() {
      // 使用防抖，避免频繁调用
      if (this._hideScrollbarTimer) {
        clearTimeout(this._hideScrollbarTimer);
      }
      this._hideScrollbarTimer = setTimeout(() => {
        this.$nextTick(() => {
          const table = this.$el?.querySelector('.el-table');
          const headerWrapper = this.$el?.querySelector('.el-table__header-wrapper');
          const bodyWrapper = this.$el?.querySelector('.el-table__body-wrapper');
          
          if (!headerWrapper || !bodyWrapper) {
            return;
          }
          
          // 简化：只设置必要的样式，避免昂贵的DOM操作
          headerWrapper.style.setProperty('overflow-x', 'hidden', 'important');
          headerWrapper.style.setProperty('overflow-y', 'hidden', 'important');
          headerWrapper.style.setProperty('overflow', 'hidden', 'important');
          
          // 添加全局样式（只执行一次）
          const styleId = 'hide-header-scrollbar-' + this._uid;
          if (!document.getElementById(styleId)) {
            const styleEl = document.createElement('style');
            styleEl.id = styleId;
            const tableId = table?.id || `table-${this._uid}`;
            if (table && !table.id) {
              table.id = tableId;
            }
            styleEl.textContent = `
              #${tableId} .el-table__header-wrapper {
                overflow-x: hidden !important;
                overflow-y: hidden !important;
                overflow: hidden !important;
              }
              #${tableId} .el-table__header-wrapper::-webkit-scrollbar {
                display: none !important;
                width: 0 !important;
                height: 0 !important;
              }
              #${tableId} .el-table__header-wrapper * {
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
              }
            `;
            document.head.appendChild(styleEl);
          }
          
          // 监听表体滚动，同步表头（使用节流优化性能）
          let scrollTimer = null;
          const syncHeaderScroll = () => {
            if (scrollTimer) return;
            scrollTimer = requestAnimationFrame(() => {
              if (headerWrapper && bodyWrapper && headerWrapper.scrollLeft !== bodyWrapper.scrollLeft) {
                headerWrapper.scrollLeft = bodyWrapper.scrollLeft;
              }
              scrollTimer = null;
            });
          };
          
          // 移除旧的事件监听器
          if (this._syncHeaderScroll) {
            bodyWrapper.removeEventListener('scroll', this._syncHeaderScroll);
          }
          this._syncHeaderScroll = syncHeaderScroll;
          bodyWrapper.addEventListener('scroll', syncHeaderScroll, { passive: true });
          
          // 阻止表头直接滚动
          const preventHeaderScroll = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (bodyWrapper) {
              bodyWrapper.scrollLeft += e.deltaX || (e.deltaY > 0 ? 30 : -30);
            }
          };
          
          if (this._preventHeaderScroll) {
            headerWrapper.removeEventListener('wheel', this._preventHeaderScroll);
          }
          this._preventHeaderScroll = preventHeaderScroll;
          headerWrapper.addEventListener('wheel', preventHeaderScroll, { passive: false });
          
          // 保存清理函数
          this._headerScrollbarCleanup = () => {
            if (this._syncHeaderScroll) {
              bodyWrapper?.removeEventListener('scroll', this._syncHeaderScroll);
            }
            if (this._preventHeaderScroll) {
              headerWrapper?.removeEventListener('wheel', this._preventHeaderScroll);
            }
            const styleEl = document.getElementById(styleId);
            if (styleEl) {
              styleEl.remove();
            }
            if (this._hideScrollbarTimer) {
              clearTimeout(this._hideScrollbarTimer);
            }
          };
        });
      }, 100);
    },
    getList() {
      this.loading = true;
      const params = {
        ...this.queryParams,
        orderType: 101 // 入库类型
      };
      
      // 参照库存查询页面，使用 Promise 链式调用
      listOrder(params).then(response => {
        // 获取订单列表后，为每个订单获取明细数据
        const detailList = [];
        if (!response || !response.rows || response.rows.length === 0) {
          this.tableList = [];
          this.total = 0;
          this.loading = false;
          return;
        }
        
        // 限制并发数量，避免过多请求导致超时
        const batchSize = 10; // 每批处理10个订单，提高效率
        const batches = [];
        for (let i = 0; i < response.rows.length; i += batchSize) {
          batches.push(response.rows.slice(i, i + batchSize));
        }
        
        // 使用 Promise.all 处理所有批次
        const batchPromises = batches.map(batch => {
          const orderDetailPromises = batch.map(order => 
            getOrder(order.id, 101).then(detailResponse => ({
              order: order,
              detail: detailResponse.data
            })).catch(() => ({
              order: order,
              detail: null
            }))
          );
          return Promise.all(orderDetailPromises);
        });
        
        // 等待所有批次完成
        Promise.all(batchPromises).then(allOrderDetails => {
          // 收集所有需要查询院内码的订单信息
          const warehouseIds = new Set();
          
          allOrderDetails.forEach(orderDetails => {
            orderDetails.forEach(({ order, detail }) => {
              if (detail && detail.warehouseId) {
                warehouseIds.add(detail.warehouseId);
              }
            });
          });
          
          // 如果有需要查询的库存信息，批量查询院内码
          const inventoryQueryPromises = warehouseIds.size > 0 ? Array.from(warehouseIds).map(warehouseId => 
            listDepotInventory({
              warehouseId: warehouseId,
              pageNum: 1,
              pageSize: 10000
            }).then(response => ({
              warehouseId: warehouseId,
              inventoryList: response.rows || []
            })).catch(() => ({
              warehouseId: warehouseId,
              inventoryList: []
            }))
          ) : [Promise.resolve({ warehouseId: null, inventoryList: [] })];
          
          // 等待所有库存查询完成
          return Promise.all(inventoryQueryPromises).then(inventoryResults => {
            // 构建库存映射：warehouseId_materialId_batchNo -> inHospitalCode
            const inventoryMap = {};
            inventoryResults.forEach(({ warehouseId, inventoryList }) => {
              if (warehouseId && inventoryList) {
                inventoryList.forEach(inv => {
                  if (inv.materialId && inv.batchNo && inv.inHospitalCode) {
                    const key = `${warehouseId}_${inv.materialId}_${inv.batchNo}`;
                    if (!inventoryMap[key]) {
                      inventoryMap[key] = [];
                    }
                    inventoryMap[key].push(String(inv.inHospitalCode));
                  }
                });
              }
            });
            
            // 扁平化所有批次的结果
            allOrderDetails.forEach(orderDetails => {
              orderDetails.forEach(({ order, detail }) => {
                if (detail && detail.gzOrderEntryList && detail.gzOrderEntryList.length > 0) {
                  detail.gzOrderEntryList.forEach(entry => {
                    // 从 materialList 中查找对应的 material
                    const material = detail.materialList && detail.materialList.find(m => m && m.id === entry.materialId) || null;
                    
                    // 从库存中查找院内码
                    const warehouseId = detail.warehouseId || order.warehouseId;
                    let inHospitalCode = '';
                    if (warehouseId && entry.materialId && entry.batchNo) {
                      const key = `${warehouseId}_${entry.materialId}_${entry.batchNo}`;
                      if (inventoryMap[key] && inventoryMap[key].length > 0) {
                        // 取第一个院内码
                        inHospitalCode = String(inventoryMap[key][0]);
                      }
                    }
                    // 如果库存中没有，尝试从entry中获取（可能来自数据库）
                    if (!inHospitalCode && entry.inHospitalCode) {
                      inHospitalCode = String(entry.inHospitalCode);
                    }
                    
                    // 确保物料相关字段正确获取
                    const materialCode = material && material.code ? String(material.code) : '';
                    const materialUdiNo = material && material.udiNo ? String(material.udiNo) : (entry.udiNo ? String(entry.udiNo) : '');
                    const materialName = entry.materialName || (material && material.name) || '';
                    const factoryName = entry.factoryName || (material && material.fdFactory && material.fdFactory.factoryName) || '';
                    
                    // 调试：检查数据映射
                    if (detailList.length < 3) {
                      console.log('数据映射调试:', {
                        entry: entry,
                        material: material,
                        materialCode: materialCode,
                        materialUdiNo: materialUdiNo,
                        inHospitalCode: inHospitalCode,
                        qty: entry.qty
                      });
                    }
                    
                    // 构建完整的数据对象，确保字段名与表格列一一对应
                    const rowData = {
                      // 明细基础字段 - 确保字段名正确，与表格列一一对应
                      id: entry.id || null,
                      parenId: entry.parenId || null,
                      materialId: entry.materialId || null,
                      price: entry.price || null,
                      qty: entry.qty || null,  // 数量列 - 确保是 qty
                      amt: entry.amt || null,  // 金额列
                      batchNo: entry.batchNo || null,
                      batchNumber: entry.batchNumber || null,
                      beginTime: entry.beginTime || null,  // 生产日期列
                      endTime: entry.endTime || null,  // 有效期列
                      remark: entry.remark || detail.remark || '',
                      // 订单级别字段 - 优先使用 detail 中的数据
                      orderNo: detail.orderNo || order.orderNo || '',
                      orderStatus: detail.orderStatus !== undefined && detail.orderStatus !== null ? detail.orderStatus : (order.orderStatus !== undefined ? order.orderStatus : null),
                      auditDate: detail.auditDate || order.auditDate || null,
                      createBy: detail.createBy || order.createBy || '',
                      orderDate: detail.orderDate || order.orderDate || null,  // 入库日期列
                      warehouse: detail.warehouse || order.warehouse || null,
                      supplier: detail.supplier || order.supplier || null,
                      // 物料相关字段 - 确保正确映射，避免字段错位
                      material: material || null,
                      materialName: materialName,
                      factoryName: factoryName,
                      // 耗材编码列 - 使用 material.code
                      materialCode: materialCode,
                      // UDI码列 - 使用 material.udiNo 或 entry.udiNo
                      udiNo: materialUdiNo,
                      // 院内码列 - 从库存查询或entry中获取，确保是字符串，不是 qty
                      inHospitalCode: inHospitalCode
                    };
                    
                    detailList.push(rowData);
                  });
                } else {
                  // 如果没有明细，至少显示订单基本信息
                  detailList.push({
                    orderNo: order.orderNo,
                    orderStatus: order.orderStatus,
                    auditDate: order.auditDate,
                    createBy: order.createBy,
                    orderDate: order.orderDate,
                    remark: order.remark,
                    warehouse: order.warehouse,
                    supplier: order.supplier,
                    material: null,
                    materialName: '',
                    price: null,
                    qty: null,
                    amt: null,
                    inHospitalCode: null,
                    beginTime: null,
                    endTime: null
                  });
                }
              });
            });
            
            this.tableList = detailList;
            this.total = detailList.length;
            this.loading = false;
          }).catch(error => {
            this.$message.error('获取库存信息失败: ' + (error.message || '未知错误'));
            this.tableList = [];
            this.total = 0;
            this.loading = false;
          });
        }).catch(error => {
          this.$message.error('获取订单明细失败: ' + (error.message || '未知错误'));
          this.tableList = [];
          this.total = 0;
          this.loading = false;
        });
      }).catch(error => {
        this.$message.error('获取数据失败: ' + (error.message || '未知错误'));
        this.tableList = [];
        this.total = 0;
        this.loading = false;
      });
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.$emit('selection-change', selection);
    },
    handleView(row) {
      // 查看详情逻辑
      this.$message.info('查看功能待实现');
    }
  }
};
</script>

<style lang="scss" scoped>
.table-container {
  width: 100%;
  overflow: visible;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  
  ::v-deep .el-table {
    width: 100%;
    border-radius: 8px;
    overflow: visible;
  }
  
  ::v-deep .el-table__body-wrapper {
    overflow-x: auto !important;
    overflow-y: hidden !important;
    max-height: none !important;
  }
  
  /* 隐藏表格体垂直滚动条 */
  ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
    width: 0 !important;
    display: none !important;
  }
  
  ::v-deep .el-table__body-wrapper {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  
  /* 表格头部样式优化 */
  ::v-deep .el-table th {
    background-color: #F5F7FA !important;
    color: #606266;
    font-weight: 500;
    height: 48px;
    padding: 12px 0;
  }
  
  /* 表格行样式优化 */
  ::v-deep .el-table td {
    padding: 12px 0;
    color: #606266;
  }
  
  ::v-deep .el-table tr:hover > td {
    background-color: #F5F7FA !important;
  }
  
  /* 分页样式优化 */
  ::v-deep .pagination-container {
    margin-top: 16px;
    padding: 16px 0;
    background: #fff;
  }
  
  /* 完全隐藏表头滚动条，但允许内容滚动（通过JavaScript同步） */
  /* 使用更高优先级的选择器确保覆盖其他样式 */
  .table-container ::v-deep .el-table__header-wrapper,
  .table-container ::v-deep .el-table .el-table__header-wrapper,
  ::v-deep .table-container .el-table__header-wrapper {
    overflow-x: hidden !important;
    overflow-y: hidden !important;
    overflow: hidden !important;
    width: 100% !important;
    position: relative !important;
  }
  
  /* 隐藏表头滚动条（Webkit浏览器 - 所有可能的滚动条元素） */
  ::v-deep .el-table__header-wrapper::-webkit-scrollbar,
  ::v-deep .el-table__header-wrapper *::-webkit-scrollbar,
  ::v-deep .el-table__header-wrapper * *::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
    background: transparent !important;
    -webkit-appearance: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
  }
  
  /* 隐藏表头滚动条轨道和滑块 */
  ::v-deep .el-table__header-wrapper::-webkit-scrollbar-track,
  ::v-deep .el-table__header-wrapper::-webkit-scrollbar-thumb,
  ::v-deep .el-table__header-wrapper *::-webkit-scrollbar-track,
  ::v-deep .el-table__header-wrapper *::-webkit-scrollbar-thumb,
  ::v-deep .el-table__header-wrapper * *::-webkit-scrollbar-track,
  ::v-deep .el-table__header-wrapper * *::-webkit-scrollbar-thumb {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
    background: transparent !important;
    opacity: 0 !important;
    visibility: hidden !important;
  }
  
  /* 隐藏Element UI的滚动条组件 */
  ::v-deep .el-table__header-wrapper .el-scrollbar__wrap {
    overflow-x: hidden !important;
    overflow-y: hidden !important;
  }
  
  ::v-deep .el-table__header-wrapper .el-scrollbar__bar {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
  }
  
  /* 隐藏表头滚动条（Firefox和IE/Edge） */
  ::v-deep .el-table__header-wrapper {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  
  /* 隐藏表头内部所有元素的滚动条 */
  ::v-deep .el-table__header-wrapper * {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  
  /* 确保表头内容可以超出容器（用于同步滚动） */
  ::v-deep .el-table__header {
    width: auto !important;
    min-width: 100% !important;
    overflow: visible !important;
  }
  
  /* 确保表头表格宽度与表体一致 */
  ::v-deep .el-table__header table {
    width: auto !important;
    min-width: 100% !important;
  }
  
  ::v-deep .el-table__fixed,
  ::v-deep .el-table__fixed-right {
    height: auto !important;
  }
}
</style>

