<template>
  <div class="table-container">
    <el-table ref="table" v-loading="loading" :data="tableList" @selection-change="handleSelectionChange" border height="54vh">
      <el-table-column type="selection" width="55" align="center" fixed="left" />
      <!-- 1. 序号 -->
      <el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <!-- 2. 单据类型 -->
      <el-table-column label="单据类型" align="center" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.billTypeName || '--' }}</span>
        </template>
      </el-table-column>
      <!-- 3. 单号 -->
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
          <span>{{ scope.row.inHospitalCode || '--' }}</span>
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

    <div class="pagination-wrapper">
      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>
  </div>
</template>

<script>
import { listOrder, getOrder, listOrderInhospitalcode } from "@/api/gz/order";
import { listGoods as listRefundGoods, getGoods as getRefundGoods } from "@/api/gz/goods";
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
      const codeKeyword = this.queryParams.inHospitalCode != null ? String(this.queryParams.inHospitalCode).trim().toLowerCase() : '';
      const acceptanceParams = this.buildAcceptanceParams();
      const refundGoodsParams = this.buildRefundGoodsParams();

      Promise.all([
        acceptanceParams
          ? listOrder(acceptanceParams).catch(() => ({ rows: [], total: 0 }))
          : Promise.resolve({ rows: [], total: 0 }),
        refundGoodsParams
          ? listRefundGoods(refundGoodsParams).then(response => {
              const rows = (response && response.rows) || [];
              return {
                rows: rows.filter(row => row.goodsNo && row.goodsNo.startsWith('GZTH-')),
                total: response.total
              };
            }).catch(() => ({ rows: [], total: 0 }))
          : Promise.resolve({ rows: [], total: 0 })
      ]).then(([acceptanceRes, refundGoodsRes]) => {
        const acceptanceHeaders = (acceptanceRes && acceptanceRes.rows) || [];
        const refundGoodsHeaders = (refundGoodsRes && refundGoodsRes.rows) || [];
        if (acceptanceHeaders.length === 0 && refundGoodsHeaders.length === 0) {
          this.tableList = [];
          this.total = 0;
          this.loading = false;
          return;
        }

        const batchSize = 10;
        const acceptanceBatches = [];
        for (let i = 0; i < acceptanceHeaders.length; i += batchSize) {
          acceptanceBatches.push(acceptanceHeaders.slice(i, i + batchSize));
        }

        const acceptanceDetailPromise = acceptanceBatches.length === 0 ? Promise.resolve([]) :
          Promise.all(acceptanceBatches.map(batch =>
            Promise.all(batch.map(order =>
              getOrder(order.id)
                .then(detailRes => ({ order, detail: detailRes.data }))
                .catch(() => ({ order, detail: null }))
            ))
          )).then(allBatches => {
            const orderDetails = allBatches.flat();
            return Promise.all(orderDetails.map(({ order, detail }) => {
              if (!detail) {
                return Promise.resolve({ order, detail: null, codeList: [] });
              }
              return listOrderInhospitalcode(order.id)
                .then(codeRes => ({
                  order,
                  detail,
                  codeList: (codeRes && codeRes.data) || []
                }))
                .catch(() => ({ order, detail, codeList: [] }));
            }));
          });

        const refundDetailPromise = this.fetchDetailsInBatch(
          refundGoodsHeaders.map(header => ({ header })),
          item => getRefundGoods(item.header.id).then(res => res.data)
        );

        return Promise.all([acceptanceDetailPromise, refundDetailPromise]).then(([enrichedOrders, refundDetails]) => {
          const orderInventoryPromise = enrichedOrders.length === 0 ? Promise.resolve([]) :
            Promise.all(enrichedOrders.map(({ order, detail }) => {
              if (!detail) {
                return Promise.resolve({ orderId: order.id, list: [] });
              }
              return listDepotInventory({
                orderId: order.id,
                includeZeroQty: true,
                pageNum: 1,
                pageSize: 10000
              })
                .then(res => ({ orderId: order.id, list: (res && res.rows) || [] }))
                .catch(() => ({ orderId: order.id, list: [] }));
            }));

          return orderInventoryPromise.then(orderInventoryResults => {
            const inventoryByOrderEntryId = {};
            const inventoryByMaterialBatch = {};
            orderInventoryResults.forEach(({ list }) => {
              if (!list) {
                return;
              }
              list.forEach(inv => {
                const hospitalCode = inv && inv.inHospitalCode ? String(inv.inHospitalCode).trim() : '';
                if (!hospitalCode) {
                  return;
                }
                if (inv.orderEntryId != null) {
                  const entryKey = String(inv.orderEntryId);
                  if (!inventoryByOrderEntryId[entryKey]) {
                    inventoryByOrderEntryId[entryKey] = [];
                  }
                  inventoryByOrderEntryId[entryKey].push(hospitalCode);
                }
                if (inv.materialId && inv.batchNo) {
                  const batchKey = `${inv.materialId}_${inv.batchNo}`;
                  if (!inventoryByMaterialBatch[batchKey]) {
                    inventoryByMaterialBatch[batchKey] = [];
                  }
                  inventoryByMaterialBatch[batchKey].push(hospitalCode);
                }
              });
            });

            const detailList = [];
            enrichedOrders.forEach(({ order, detail, codeList }) => {
              this.appendAcceptanceRows(
                detailList,
                order,
                detail,
                codeList,
                inventoryByOrderEntryId,
                inventoryByMaterialBatch,
                codeKeyword
              );
            });
            refundDetails.forEach(({ item, detail }) => {
              if (detail) {
                this.appendRefundGoodsRows(detailList, item.header, detail, codeKeyword);
              }
            });

            this.tableList = detailList;
            this.total = detailList.length;
            this.loading = false;
            this.$nextTick(() => {
              this.syncTableScroll();
              if (this.$refs.table) {
                this.$refs.table.doLayout();
              }
            });
          });
        });
      }).catch(error => {
        this.$message.error('获取数据失败: ' + (error.message || '未知错误'));
        this.tableList = [];
        this.total = 0;
        this.loading = false;
      });
    },
    buildAcceptanceParams() {
      const filter = this.resolveOrderNoFilter();
      if (!filter.fetchAcceptance) {
        return null;
      }
      const params = {
        pageNum: this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize,
        warehouseId: this.queryParams.warehouseId,
        departmentId: this.queryParams.departmentId,
        orderStatus: this.queryParams.orderStatus,
        orderType: 101,
        timeField: 'auditDate'
      };
      if (filter.raw) {
        params.orderNo = filter.raw;
        params.pageNum = 1;
        params.pageSize = 100;
      } else {
        params.beginDate = this.queryParams.beginDate;
        params.endDate = this.queryParams.endDate;
      }
      if (this.queryParams.supplierId) {
        params.supplerId = this.queryParams.supplierId;
      }
      return this.normalizeQueryDateTime(params);
    },
    buildRefundGoodsParams() {
      const filter = this.resolveOrderNoFilter();
      if (!filter.fetchRefundGoods) {
        return null;
      }
      const params = {
        pageNum: this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize,
        warehouseId: this.queryParams.warehouseId,
        departmentId: this.queryParams.departmentId,
        goodsStatus: this.queryParams.orderStatus,
        timeField: 'auditDate'
      };
      if (filter.raw) {
        params.goodsNo = filter.raw.startsWith('GZTH-') ? filter.raw : `GZTH-${filter.raw}`;
        params.pageNum = 1;
        params.pageSize = 100;
      } else {
        params.beginDate = this.queryParams.beginDate;
        params.endDate = this.queryParams.endDate;
        params.goodsNo = 'GZTH-';
      }
      if (this.queryParams.supplierId) {
        params.supplerId = this.queryParams.supplierId;
      }
      return this.normalizeQueryDateTime(params);
    },
    resolveOrderNoFilter() {
      const raw = this.queryParams.orderNo != null ? String(this.queryParams.orderNo).trim() : '';
      const upper = raw.toUpperCase();
      return {
        raw,
        fetchAcceptance: !raw || upper.startsWith('GZRK') || (!upper.startsWith('GZTH') && !upper.startsWith('GZTK') && !upper.startsWith('GZCK')),
        fetchRefundGoods: !raw || upper.startsWith('GZTH')
      };
    },
    normalizeDateTimeValue(value, isEnd) {
      if (!value) {
        return value;
      }
      if (typeof value !== 'string') {
        return value;
      }
      const trimVal = value.trim();
      if (!trimVal) {
        return trimVal;
      }
      if (trimVal.length === 10 && trimVal.indexOf(' ') === -1) {
        return `${trimVal} ${isEnd ? '23:59:59' : '00:00:00'}`;
      }
      return trimVal;
    },
    normalizeQueryDateTime(query) {
      const params = { ...query };
      params.timeField = params.timeField || 'auditDate';
      if (params.beginDate != null && params.beginDate !== '') {
        params.beginDate = this.normalizeDateTimeValue(params.beginDate, false);
      } else {
        delete params.beginDate;
      }
      if (params.endDate != null && params.endDate !== '') {
        params.endDate = this.normalizeDateTimeValue(params.endDate, true);
      } else {
        delete params.endDate;
      }
      return params;
    },
    fetchDetailsInBatch(items, fetchDetail, batchSize = 10) {
      if (!items || items.length === 0) {
        return Promise.resolve([]);
      }
      const batches = [];
      for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize));
      }
      return Promise.all(batches.map(batch =>
        Promise.all(batch.map(item =>
          fetchDetail(item)
            .then(detail => ({ item, detail }))
            .catch(() => ({ item, detail: null }))
        ))
      )).then(allBatches => allBatches.flat());
    },
    appendAcceptanceRows(detailList, order, detail, codeList, inventoryByOrderEntryId, inventoryByMaterialBatch, codeKeyword) {
      if (!detail || !detail.gzOrderEntryList || detail.gzOrderEntryList.length === 0) {
        return;
      }
      const materialList = detail.materialList || [];
      const codeItemsByDetailId = {};
      const codeItemsByMaterialBatch = {};

      codeList.forEach(codeRow => {
        const hospitalCode = this.extractInHospitalCode(codeRow);
        if (!hospitalCode) {
          return;
        }
        const item = { hospitalCode, codeRow };
        if (codeRow.detailId != null) {
          const detailKey = String(codeRow.detailId);
          if (!codeItemsByDetailId[detailKey]) {
            codeItemsByDetailId[detailKey] = [];
          }
          codeItemsByDetailId[detailKey].push(item);
        }
        const materialId = codeRow.materialId || codeRow.material_id;
        const batchNo = codeRow.batchNo || codeRow.batch_no || codeRow.batchNumber || codeRow.batch_number;
        if (materialId && batchNo) {
          const batchKey = `${materialId}_${batchNo}`;
          if (!codeItemsByMaterialBatch[batchKey]) {
            codeItemsByMaterialBatch[batchKey] = [];
          }
          if (!codeItemsByMaterialBatch[batchKey].some(x => x.hospitalCode === hospitalCode)) {
            codeItemsByMaterialBatch[batchKey].push(item);
          }
        }
      });

      const collectCodesForEntry = (entry) => {
        const seen = new Set();
        const items = [];
        const pushItem = (item) => {
          if (!item || !item.hospitalCode || seen.has(item.hospitalCode)) {
            return;
          }
          seen.add(item.hospitalCode);
          items.push(item);
        };
        if (entry.id != null) {
          const detailKey = String(entry.id);
          (codeItemsByDetailId[detailKey] || []).forEach(pushItem);
          if (items.length === 0) {
            (inventoryByOrderEntryId[detailKey] || []).forEach(code =>
              pushItem({ hospitalCode: code, codeRow: null })
            );
          }
        }
        if (items.length === 0 && entry.materialId && entry.batchNo) {
          const batchKey = `${entry.materialId}_${entry.batchNo}`;
          (codeItemsByMaterialBatch[batchKey] || []).forEach(pushItem);
          if (items.length === 0) {
            (inventoryByMaterialBatch[batchKey] || []).forEach(code =>
              pushItem({ hospitalCode: code, codeRow: null })
            );
          }
        }
        return items;
      };

      detail.gzOrderEntryList.forEach(entry => {
        if (this.queryParams.materialId && entry.materialId !== this.queryParams.materialId) {
          return;
        }
        const material = materialList.find(m => m && m.id === entry.materialId) || null;
        const codeItems = collectCodesForEntry(entry);

        if (codeItems.length > 0) {
          codeItems.forEach(({ hospitalCode, codeRow }) => {
            const code = hospitalCode.toLowerCase();
            if (codeKeyword && !code.includes(codeKeyword)) {
              return;
            }
            detailList.push(this.buildRowData(order, detail, entry, material, hospitalCode, 'acceptance', {
              perCode: true,
              codeRow
            }));
          });
          return;
        }

        let inHospitalCode = entry.inHospitalCode ? String(entry.inHospitalCode).trim() : '';
        const code = inHospitalCode ? inHospitalCode.toLowerCase() : '';
        if (codeKeyword && !code.includes(codeKeyword)) {
          return;
        }
        detailList.push(this.buildRowData(order, detail, entry, material, inHospitalCode, 'acceptance'));
      });
    },
    appendRefundGoodsRows(detailList, header, detail, codeKeyword) {
      const entries = (detail && detail.gzRefundGoodsEntryList) || [];
      const materialList = (detail && detail.materialList) || [];
      entries.forEach(entry => {
        if (!entry || entry.delFlag === 1) {
          return;
        }
        if (this.queryParams.materialId && entry.materialId !== this.queryParams.materialId) {
          return;
        }
        const material = materialList.find(m => m && m.id === entry.materialId) || null;
        const inHospitalCode = entry.inHospitalCode ? String(entry.inHospitalCode).trim() : '';
        const code = inHospitalCode ? inHospitalCode.toLowerCase() : '';
        if (codeKeyword && !code.includes(codeKeyword)) {
          return;
        }
        detailList.push(this.buildRefundGoodsRow(header, detail, entry, material));
      });
    },
    extractInHospitalCode(codeRow) {
      if (!codeRow) {
        return '';
      }
      const raw = codeRow.inHospitalCode || codeRow.in_hospital_code;
      return raw ? String(raw).trim() : '';
    },
    buildRowData(order, detail, entry, material, inHospitalCode, billKind, options = {}) {
      const perCode = options.perCode === true;
      const codeRow = options.codeRow || null;
      const materialCode = (material && material.code) || '';
      const materialUdiNo = (material && material.udiNo) || (codeRow && codeRow.masterBarcode) || (entry && entry.masterBarcode) || (entry && entry.udiNo) || '';
      const materialName = (codeRow && codeRow.materialName) || (entry && entry.materialName) || (material && material.name) || '';
      const factoryName = (codeRow && codeRow.factoryName) || (entry && entry.factoryName) || (material && material.fdFactory && material.fdFactory.factoryName) || '';
      const price = codeRow && codeRow.price != null ? codeRow.price : (entry && entry.price);
      const qty = perCode ? 1 : (entry && entry.qty);
      const amt = perCode && price != null
        ? Number(price)
        : (entry && entry.amt != null ? entry.amt : (qty != null && price != null ? Number(qty) * Number(price) : null));

      return {
        id: (entry && entry.id) || (codeRow && codeRow.id) || null,
        billKind: billKind || 'acceptance',
        billTypeName: '备货验收',
        parenId: entry && entry.parenId || null,
        materialId: entry && entry.materialId || null,
        price,
        qty,
        amt,
        batchNo: (codeRow && codeRow.batchNo) || (entry && entry.batchNo) || null,
        batchNumber: (codeRow && codeRow.batchNumber) || (entry && entry.batchNumber) || null,
        beginTime: entry && entry.beginTime || null,
        endTime: (codeRow && codeRow.endDate) || (entry && entry.endTime) || null,
        remark: (entry && entry.remark) || detail.remark || '',
        orderNo: detail.orderNo || order.orderNo || '',
        orderStatus: detail.orderStatus != null ? detail.orderStatus : order.orderStatus,
        auditDate: detail.auditDate || order.auditDate || null,
        createBy: detail.createBy || order.createBy || '',
        updateBy: detail.updateBy || order.updateBy || null,
        orderDate: detail.orderDate || order.orderDate || null,
        warehouse: detail.warehouse || order.warehouse || null,
        supplier: detail.supplier || order.supplier || null,
        order,
        material,
        materialName,
        factoryName,
        materialCode,
        specification: (material && material.speci) || (codeRow && codeRow.materialSpeci) || (entry && entry.specification) || null,
        model: (material && material.model) || (codeRow && codeRow.materialModel) || (entry && entry.model) || null,
        unitName: (codeRow && codeRow.materialUnitName)
          || (material && material.fdUnit && material.fdUnit.unitName)
          || (material && material.unitName)
          || (material && material.unit && (typeof material.unit === 'string' ? material.unit : (material.unit.unitName || material.unit.name)))
          || (entry && entry.unitName)
          || (entry && entry.unit)
          || null,
        udiNo: materialUdiNo,
        inHospitalCode: inHospitalCode || ''
      };
    },
    buildRefundGoodsRow(header, detail, entry, material) {
      const inHospitalCode = entry.inHospitalCode ? String(entry.inHospitalCode).trim() : '';
      const materialCode = (material && material.code) || '';
      const qty = entry && entry.qty;
      const price = entry && entry.price;
      const amt = entry && entry.amt != null ? entry.amt : (qty != null && price != null ? Number(qty) * Number(price) : null);

      return {
        id: entry && entry.id || null,
        billKind: 'refundGoods',
        billTypeName: '备货退货',
        materialId: entry && entry.materialId || null,
        price,
        qty,
        amt,
        batchNo: entry && entry.batchNo || null,
        batchNumber: entry && entry.batchNumber || null,
        beginTime: entry && entry.beginTime || null,
        endTime: entry && entry.endTime || null,
        remark: (entry && entry.remark) || (detail && detail.remark) || '',
        orderNo: (detail && detail.goodsNo) || (header && header.goodsNo) || '',
        orderStatus: detail && detail.goodsStatus != null ? detail.goodsStatus : header && header.goodsStatus,
        auditDate: (detail && detail.auditDate) || (header && header.auditDate) || null,
        createBy: (detail && detail.createBy) || (header && header.createBy) || '',
        updateBy: (detail && detail.auditBy) || (header && header.auditBy) || null,
        orderDate: (detail && detail.goodsDate) || (header && header.goodsDate) || null,
        warehouse: (detail && detail.warehouse) || (header && header.warehouse) || null,
        department: (detail && detail.department) || (header && header.department) || null,
        supplier: (detail && detail.supplier) || (header && header.supplier) || null,
        material,
        materialName: (entry && entry.materialName) || (material && material.name) || '',
        factoryName: (entry && entry.factoryName) || (material && material.fdFactory && material.fdFactory.factoryName) || '',
        materialCode,
        specification: (entry && entry.speci) || (material && material.speci) || null,
        model: (entry && entry.model) || (material && material.model) || null,
        unitName: (material && material.fdUnit && material.fdUnit.unitName)
          || (material && material.unitName)
          || null,
        udiNo: (entry && entry.udiNo) || (material && material.udiNo) || (entry && entry.masterBarcode) || '',
        inHospitalCode
      };
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

<style scoped>
.table-container {
  margin-top: 8px;
  margin-bottom: 0;
  overflow: visible;
  width: 100%;
  min-width: 0;
  position: relative;
}
</style>

