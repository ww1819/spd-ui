<template>
  <div>
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="借用编号" prop="borrowCode">
            <el-input
              v-model="queryParams.borrowCode"
              placeholder="请输入借用编号"
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
          <el-form-item label="借用状态" prop="borrowStatus">
            <el-select v-model="queryParams.borrowStatus" placeholder="请选择借用状态" clearable style="width: 100%">
              <el-option
                v-for="dict in dict.type.borrow_status"
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
          v-hasPermi="['equipment:equipmentBorrow:add']"
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
          v-hasPermi="['equipment:equipmentBorrow:edit']"
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
          v-hasPermi="['equipment:equipmentBorrow:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['equipment:equipmentBorrow:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="equipmentBorrowList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="borrowId" width="50"/>
      <el-table-column label="借用编号" align="center" prop="borrowCode" width="120"/>
      <el-table-column label="设备名称" align="center" prop="equipmentName" width="120"/>
      <el-table-column label="借用类型" align="center" prop="borrowType" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.borrow_type" :value="scope.row.borrowType"/>
        </template>
      </el-table-column>
      <el-table-column label="借用状态" align="center" prop="borrowStatus" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.borrow_status" :value="scope.row.borrowStatus"/>
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
            v-hasPermi="['equipment:equipmentBorrow:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['equipment:equipmentBorrow:remove']"
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

    <!-- 添加或修改设备借用对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="借用编号" prop="borrowCode">
                <el-input v-model="form.borrowCode" :disabled="isDisabled" placeholder="请输入借用编号" />
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
              <el-form-item label="借用类型" prop="borrowType">
                <el-select v-model="form.borrowType" placeholder="请选择借用类型" style="width: 100%">
                  <el-option
                    v-for="dict in dict.type.borrow_type"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="借用状态" prop="borrowStatus">
                <el-select v-model="form.borrowStatus" placeholder="请选择借用状态" style="width: 100%">
                  <el-option
                    v-for="dict in dict.type.borrow_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="借用人" prop="borrowUser">
                <el-input v-model="form.borrowUser" placeholder="请输入借用人" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="借用部门" prop="borrowDept">
                <el-input v-model="form.borrowDept" placeholder="请输入借用部门" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="借用数量" prop="borrowNum">
                <el-input-number v-model="form.borrowNum" :min="1" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="借用日期" prop="borrowDate">
                <el-date-picker
                  v-model="form.borrowDate"
                  type="date"
                  placeholder="选择借用日期"
                  style="width: 100%"
                  value-format="yyyy-MM-dd"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="预计归还" prop="expectReturnDate">
                <el-date-picker
                  v-model="form.expectReturnDate"
                  type="date"
                  placeholder="选择预计归还日期"
                  style="width: 100%"
                  value-format="yyyy-MM-dd"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="实际归还" prop="actualReturnDate">
                <el-date-picker
                  v-model="form.actualReturnDate"
                  type="date"
                  placeholder="选择实际归还日期"
                  style="width: 100%"
                  value-format="yyyy-MM-dd"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="借用说明" prop="borrowDesc">
                <el-input v-model="form.borrowDesc" type="textarea" placeholder="请输入借用说明" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="借用备注" prop="borrowRemark">
                <el-input v-model="form.borrowRemark" type="textarea" placeholder="请输入借用备注" />
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