<template>
  <div class="table-container">
    <el-table ref="table" v-loading="loading" :data="tableList" @selection-change="handleSelectionChange" border height="58vh" style="width: 100%">
      <el-table-column type="selection" width="55" align="center" fixed="left" />
      <!-- 1. 序号 -->
      <el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <!-- 2. 单号 -->
      <el-table-column label="单号" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.orderNo || '--' }}</span>
        </template>
      </el-table-column>
      <!-- 3. 仓库 -->
      <el-table-column label="仓库" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.warehouse && scope.row.warehouse.name) || '--' }}</span>
        </template>
      </el-table-column>
      <!-- 4. 供应商 -->
      <el-table-column label="供应商" align="center" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.supplier && scope.row.supplier.name) || '--' }}</span>
        </template>
      </el-table-column>
      <!-- 5. 院内码 -->
      <el-table-column label="院内码" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.inHospitalCode && String(scope.row.inHospitalCode).trim() !== '' && scope.row.inHospitalCode !== scope.row.qty">{{ String(scope.row.inHospitalCode) }}</span>
          <span v-else-if="scope.row.inHospitalCode && scope.row.inHospitalCode === scope.row.qty">--</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <!-- 6. 耗材编码 -->
      <el-table-column label="耗材编码" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || '--' }}</span>
        </template>
      </el-table-column>
      <!-- 7. 耗材名称 -->
      <el-table-column label="耗材名称" align="center" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.materialName || (scope.row.material && scope.row.material.name) || '--' }}</span>
        </template>
      </el-table-column>
      <!-- 8. 规格 -->
      <el-table-column label="规格" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.speci) || scope.row.specification || '--' }}</span>
        </template>
      </el-table-column>
      <!-- 9. 型号 -->
      <el-table-column label="型号" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.model) || scope.row.model || '--' }}</span>
        </template>
      </el-table-column>
      <!-- 10. 单位 -->
      <el-table-column label="单位" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.unitName">{{ scope.row.unitName }}</span>
          <span v-else-if="scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName">{{ scope.row.material.fdUnit.unitName }}</span>
          <span v-else-if="scope.row.material && scope.row.material.unitName">{{ scope.row.material.unitName }}</span>
          <span v-else-if="scope.row.material && scope.row.material.unit">
            <span v-if="typeof scope.row.material.unit === 'string'">{{ scope.row.material.unit }}</span>
            <span v-else-if="scope.row.material.unit.unitName">{{ scope.row.material.unit.unitName }}</span>
            <span v-else-if="scope.row.material.unit.name">{{ scope.row.material.unit.name }}</span>
            <span v-else>--</span>
          </span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <!-- 11. 单价 -->
      <el-table-column label="单价" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.price != null && scope.row.price !== undefined">{{ parseFloat(scope.row.price).toFixed(2) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <!-- 12. 数量 -->
      <el-table-column label="数量" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.qty != null && scope.row.qty !== undefined">{{ scope.row.qty }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <!-- 13. 金额 -->
      <el-table-column label="金额" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.amt != null && scope.row.amt !== undefined">{{ parseFloat(scope.row.amt).toFixed(2) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <!-- 14. 生产日期 -->
      <el-table-column label="生产日期" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.beginTime">{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <!-- 15. 有效期 -->
      <el-table-column label="有效期" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <!-- 16. 批号 -->
      <el-table-column label="批号" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.batchNo || '--' }}</span>
        </template>
      </el-table-column>
      <!-- 17. 批次 -->
      <el-table-column label="批次" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.batchNumber || '--' }}</span>
        </template>
      </el-table-column>
      <!-- 18. 生产厂家 -->
      <el-table-column label="生产厂家" align="center" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || scope.row.factoryName || '--' }}</span>
        </template>
      </el-table-column>
      <!-- 19. 注册证号 -->
      <el-table-column label="注册证号" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
        </template>
      </el-table-column>
      <!-- 20. 注册证有效期 -->
      <el-table-column label="注册证有效期" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.material && scope.row.material.periodDate">{{ parseTime(scope.row.material.periodDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <!-- 21. UDI码 -->
      <el-table-column label="UDI码" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.udiNo && scope.row.udiNo !== scope.row.materialCode">{{ scope.row.udiNo }}</span>
          <span v-else-if="scope.row.material && scope.row.material.udiNo && scope.row.material.udiNo !== scope.row.materialCode">{{ scope.row.material.udiNo }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <!-- 22. 单据状态 -->
      <el-table-column label="单据状态" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.orderStatus"/>
        </template>
      </el-table-column>
      <!-- 23. 制单人 -->
      <el-table-column label="制单人" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.createBy || '--' }}</span>
        </template>
      </el-table-column>
      <!-- 24. 制单日期 -->
      <el-table-column label="制单日期" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.orderDate">{{ parseTime(scope.row.orderDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <!-- 25. 审核人 -->
      <el-table-column label="审核人" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.updateBy || '--' }}</span>
        </template>
      </el-table-column>
      <!-- 26. 审核日期 -->
      <el-table-column label="审核日期" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
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
    // 同步表头和表体的滚动
    this.$nextTick(() => {
      this.syncTableScroll();
    });
  },
  methods: {
    syncTableScroll() {
      const headerWrapper = this.$el?.querySelector('.el-table__header-wrapper');
      const bodyWrapper = this.$el?.querySelector('.el-table__body-wrapper');
      
      if (!headerWrapper || !bodyWrapper) {
        return;
      }
      
      // 双向同步滚动：表体滚动时同步表头，表头滚动时同步表体
      const syncScroll = (source, target) => {
        if (source.scrollLeft !== target.scrollLeft) {
          target.scrollLeft = source.scrollLeft;
        }
      };
      
      // 表体滚动时同步表头
      const syncBodyToHeader = () => {
        syncScroll(bodyWrapper, headerWrapper);
      };
      
      // 表头滚动时同步表体
      const syncHeaderToBody = () => {
        syncScroll(headerWrapper, bodyWrapper);
      };
      
      // 移除旧的事件监听器
      if (this._syncBodyToHeader) {
        bodyWrapper.removeEventListener('scroll', this._syncBodyToHeader);
      }
      if (this._syncHeaderToBody) {
        headerWrapper.removeEventListener('scroll', this._syncHeaderToBody);
      }
      
      // 添加新的事件监听器
      this._syncBodyToHeader = syncBodyToHeader;
      this._syncHeaderToBody = syncHeaderToBody;
      bodyWrapper.addEventListener('scroll', syncBodyToHeader, { passive: true });
      headerWrapper.addEventListener('scroll', syncHeaderToBody, { passive: true });
      
      // 保存清理函数
      this._headerScrollbarCleanup = () => {
        if (this._syncBodyToHeader) {
          bodyWrapper?.removeEventListener('scroll', this._syncBodyToHeader);
        }
        if (this._syncHeaderToBody) {
          headerWrapper?.removeEventListener('scroll', this._syncHeaderToBody);
        }
      };
    },
    updated() {
      // 数据更新后重新同步滚动
      this.$nextTick(() => {
        this.syncTableScroll();
      });
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
          // 数据清空后，重新同步滚动
          this.$nextTick(() => {
            this.syncTableScroll();
          });
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
                        qty: entry.qty,
                        unitInfo: {
                          materialFdUnit: material && material.fdUnit,
                          materialUnitName: material && material.unitName,
                          materialUnit: material && material.unit,
                          entryUnitName: entry.unitName,
                          entryUnit: entry.unit
                        }
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
                      updateBy: detail.updateBy || order.updateBy || null,  // 审核人
                      orderDate: detail.orderDate || order.orderDate || null,  // 入库日期列
                      warehouse: detail.warehouse || order.warehouse || null,
                      supplier: detail.supplier || order.supplier || null,
                      order: order || null,  // 保存完整的 order 对象以便访问审核人
                      // 物料相关字段 - 确保正确映射，避免字段错位
                      material: material || null,
                      materialName: materialName,
                      factoryName: factoryName,
                      // 耗材编码列 - 使用 material.code
                      materialCode: materialCode,
                      // 规格、型号、单位
                      specification: (material && material.speci) || entry.specification || null,
                      model: (material && material.model) || entry.model || null,
                      unitName: (material && material.fdUnit && material.fdUnit.unitName) || (material && material.unitName) || (material && material.unit && (material.unit.unitName || material.unit.name)) || entry.unitName || entry.unit || null,
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
            // 数据加载完成后，重新同步滚动以确保列对齐
            this.$nextTick(() => {
              this.syncTableScroll();
              // 强制表格重新布局
              if (this.$refs.table) {
                this.$refs.table.doLayout();
              }
            });
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
  margin-top: 0px;
  overflow: visible;
  width: 100%;
  position: relative;
  
  ::v-deep .el-table {
    width: 100%;
    border-radius: 8px;
    overflow: visible;
  }
  
  /* 表头不显示滚动条，但可以同步滚动 */
  ::v-deep .el-table__header-wrapper {
    overflow-x: hidden !important;
    overflow-y: hidden !important;
  }
  
  /* 表体可以滚动（水平和垂直），显示滚动条 */
  ::v-deep .el-table__body-wrapper {
    overflow-x: auto !important;
    overflow-y: auto !important;
    max-height: none !important;
  }
  
  /* 垂直滚动条样式 */
  ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }
  
  ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
    border-radius: 6px;
    background-color: #c0c4cc;
  }
  
  ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
    background-color: #f5f7fa;
  }
  
  /* 隐藏表头滚动条 */
  ::v-deep .el-table__header-wrapper::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }
  
  ::v-deep .el-table__header-wrapper {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  
  
  /* 表格头部样式优化 */
  ::v-deep .el-table th {
    background-color: #F5F7FA !important;
    color: #606266;
    font-weight: 500;
    height: 50px;
    padding: 8px 0;
    border-bottom: 1px solid #EBEEF5;
  }
  
  /* 表格行样式优化 */
  ::v-deep .el-table td {
    padding: 12px 0;
    color: #606266;
    border-bottom: 1px solid #EBEEF5;
  }
  
  ::v-deep .el-table tr:hover > td {
    background-color: #F5F7FA !important;
    transition: all 0.3s;
  }
  
  /* 分页样式优化 */
  ::v-deep .pagination-container {
    margin-top: 16px;
    padding: 16px 0;
    background: #fff;
  }
  
  /* 确保表头和表体列宽一致，对齐 */
  ::v-deep .el-table__header,
  ::v-deep .el-table__body {
    width: 100% !important;
  }
  
  ::v-deep .el-table__header table,
  ::v-deep .el-table__body table {
    width: 100% !important;
  }
  
  /* 确保表头和表体的列宽完全一致 */
  ::v-deep .el-table__header th,
  ::v-deep .el-table__body td {
    box-sizing: border-box;
  }
  
  /* 固定列样式优化 - 只保留左侧固定列（选择框） */
  ::v-deep .el-table__fixed-right {
    display: none !important;
  }
  
  ::v-deep .el-table__fixed-left {
    box-shadow: 2px 0 6px rgba(0, 0, 0, 0.1);
  }
}
</style>

