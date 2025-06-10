<template>
  <div>
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="保养编号" prop="maintainCode">
            <el-input
              v-model="queryParams.maintainCode"
              placeholder="请输入保养编号"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="设备名称" prop="equipmentName">
            <el-input
              v-model="queryParams.equipmentName"
              placeholder="请输入设备名称"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="保养状态" prop="maintainStatus">
            <el-select v-model="queryParams.maintainStatus" placeholder="请选择保养状态" clearable style="width: 100%">
              <el-option
                v-for="dict in dict.type.maintain_status"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['equipment:equipmentMaintain:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['equipment:equipmentMaintain:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="single"
          @click="handleDelete"
          v-hasPermi="['equipment:equipmentMaintain:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['equipment:equipmentMaintain:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="equipmentMaintainList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="maintainId" width="50"/>
      <el-table-column label="保养编号" align="center" prop="maintainCode" width="120"/>
      <el-table-column label="设备名称" align="center" prop="equipmentName" width="120"/>
      <el-table-column label="保养类型" align="center" prop="maintainType" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.maintain_type" :value="scope.row.maintainType"/>
        </template>
      </el-table-column>
      <el-table-column label="保养状态" align="center" prop="maintainStatus" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.maintain_status" :value="scope.row.maintainStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="创建日期" align="center" prop="createTime" width="100">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['equipment:equipmentMaintain:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['equipment:equipmentMaintain:remove']"
          >删除</el-button>
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

    <!-- 添加或修改设备保养对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="保养编号" prop="maintainCode">
                <el-input v-model="form.maintainCode" :disabled="isDisabled" placeholder="请输入保养编号" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="设备名称" prop="equipmentId">
                <el-select v-model="form.equipmentId" placeholder="请选择设备" style="width: 100%">
                  <el-option
                    v-for="item in equipmentOptions"
                    :key="item.equipmentId"
                    :label="item.equipmentName"
                    :value="item.equipmentId"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="保养类型" prop="maintainType">
                <el-select v-model="form.maintainType" placeholder="请选择保养类型" style="width: 100%">
                  <el-option
                    v-for="dict in dict.type.maintain_type"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="保养状态" prop="maintainStatus">
                <el-select v-model="form.maintainStatus" placeholder="请选择保养状态" style="width: 100%">
                  <el-option
                    v-for="dict in dict.type.maintain_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="保养人员" prop="maintainUser">
                <el-input v-model="form.maintainUser" placeholder="请输入保养人员" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="保养部门" prop="maintainDept">
                <el-input v-model="form.maintainDept" placeholder="请输入保养部门" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="保养费用" prop="maintainCost">
                <el-input-number v-model="form.maintainCost" :precision="2" :step="0.1" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="保养日期" prop="maintainDate">
                <el-date-picker
                  v-model="form.maintainDate"
                  type="date"
                  placeholder="选择保养日期"
                  style="width: 100%"
                  value-format="yyyy-MM-dd"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="保养内容" prop="maintainContent">
                <el-input v-model="form.maintainContent" type="textarea" placeholder="请输入保养内容" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="保养结果" prop="maintainResult">
                <el-input v-model="form.maintainResult" type="textarea" placeholder="请输入保养结果" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="保养备注" prop="maintainRemark">
                <el-input v-model="form.maintainRemark" type="textarea" placeholder="请输入保养备注" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// ... existing code ...
</script>

<style scoped>
.local-modal-mask {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.local-modal-content {
  background-color: #fff;
  padding: 24px;
  border-radius: 6px;
  min-width: 600px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.dialog-footer {
  text-align: right;
  margin-top: 16px;
}
</style> 