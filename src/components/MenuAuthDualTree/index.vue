<template>
  <div class="menu-auth-dual-tree">
    <div class="menu-auth-dual-tree-legend">
      <span class="legend-col legend-existing"><i class="el-icon-lock" /> 已有权限</span>
      <span class="legend-col legend-select">本次选择</span>
      <span class="legend-name">菜单名称</span>
    </div>
    <el-tree
      ref="tree"
      class="menu-auth-dual-tree-body"
      :data="data"
      :props="treeProps"
      :node-key="nodeKey"
      :default-expand-all="defaultExpandAll"
      :expand-on-click-node="false"
      :style="treeStyle"
      :empty-text="emptyText"
    >
      <span slot-scope="{ node, data: nodeData }" class="menu-auth-dual-node">
        <el-checkbox
          class="legend-col legend-existing"
          :value="isExisting(nodeData)"
          disabled
        />
        <el-checkbox
          class="legend-col legend-select"
          :value="isSelectChecked(nodeData)"
          :indeterminate="isSelectIndeterminate(nodeData)"
          :disabled="!isNodeSelectable(nodeData)"
          @change="val => toggleSelect(nodeData, val)"
        />
        <span class="legend-name node-label" :class="{ 'node-disabled': !isNodeSelectable(nodeData) }">
          {{ node.label }}
        </span>
      </span>
    </el-tree>
  </div>
</template>

<script>
export default {
  name: 'MenuAuthDualTree',
  props: {
    data: { type: Array, default: () => [] },
    value: { type: Array, default: () => [] },
    /** 打开弹窗时已有的菜单 ID（锁定展示，不随本次勾选变化） */
    existingMenuIds: { type: Array, default: () => [] },
    /** 开启后勾选父级自动勾选子孙，勾选子级自动勾选父级；关闭则仅勾选当前节点 */
    parentChildLinked: { type: Boolean, default: false },
    nodeKey: { type: String, default: 'id' },
    treeProps: {
      type: Object,
      default: () => ({ label: 'label', children: 'children' })
    },
    defaultExpandAll: { type: Boolean, default: false },
    maxHeight: { type: String, default: '300px' },
    emptyText: { type: String, default: '加载中，请稍候' }
  },
  data() {
    return {
      selectedMap: {}
    };
  },
  computed: {
    treeStyle() {
      return { maxHeight: this.maxHeight, overflowY: 'auto' };
    },
    existingSet() {
      const s = new Set();
      (this.existingMenuIds || []).forEach(id => {
        if (id != null && id !== '') s.add(String(id));
      });
      return s;
    },
    childrenKey() {
      return (this.treeProps && this.treeProps.children) || 'children';
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(ids) {
        this.syncSelectedFromValue(ids);
      }
    }
  },
  methods: {
    resolveNodeId(nodeData) {
      if (!nodeData) return null;
      const k = this.nodeKey;
      const id = nodeData[k] != null ? nodeData[k] : (nodeData.menuId != null ? nodeData.menuId : nodeData.id);
      return id != null && id !== '' ? String(id) : null;
    },
    isNodeSelectable(nodeData) {
      return nodeData && nodeData.checkable !== false;
    },
    isExisting(nodeData) {
      const id = this.resolveNodeId(nodeData);
      return id != null && this.existingSet.has(id);
    },
    /** 当前节点及全部可勾选子孙 ID */
    getSelectableSubtreeIds(nodeData) {
      const ids = [];
      if (!nodeData) return ids;
      if (this.isNodeSelectable(nodeData)) {
        const id = this.resolveNodeId(nodeData);
        if (id) ids.push(id);
      }
      const children = nodeData[this.childrenKey] || [];
      children.forEach(child => {
        ids.push(...this.getSelectableSubtreeIds(child));
      });
      return ids;
    },
    hasSelectableChildren(nodeData) {
      const children = nodeData && nodeData[this.childrenKey];
      if (!children || !children.length) return false;
      return this.getSelectableSubtreeIds(nodeData).length > 1;
    },
    isSelectChecked(nodeData) {
      const ids = this.parentChildLinked && this.hasSelectableChildren(nodeData)
        ? this.getSelectableSubtreeIds(nodeData)
        : [this.resolveNodeId(nodeData)].filter(Boolean);
      if (!ids.length) return false;
      return ids.every(id => !!this.selectedMap[id]);
    },
    isSelectIndeterminate(nodeData) {
      if (!this.parentChildLinked || !this.hasSelectableChildren(nodeData)) return false;
      const ids = this.getSelectableSubtreeIds(nodeData);
      const n = ids.filter(id => !!this.selectedMap[id]).length;
      return n > 0 && n < ids.length;
    },
    syncSelectedFromValue(ids) {
      const map = {};
      (ids || []).forEach(id => {
        if (id != null && id !== '') map[String(id)] = true;
      });
      this.selectedMap = map;
    },
    emitValue() {
      const ids = Object.keys(this.selectedMap)
        .filter(k => this.selectedMap[k])
        .map(k => {
          const n = Number(k);
          return isNaN(n) ? k : n;
        });
      this.$emit('input', ids);
      this.$emit('change', ids);
    },
    setSelectedForIds(ids, checked) {
      (ids || []).forEach(id => {
        if (id != null && id !== '') {
          this.$set(this.selectedMap, String(id), !!checked);
        }
      });
    },
    getAncestorSelectableIds(nodeData) {
      const tree = this.$refs.tree;
      if (!tree || !nodeData) return [];
      const node = tree.getNode(this.resolveNodeId(nodeData));
      if (!node) return [];
      const ids = [];
      let p = node.parent;
      while (p && p.data) {
        const pid = this.resolveNodeId(p.data);
        if (pid && this.isNodeSelectable(p.data)) {
          ids.push(pid);
        }
        p = p.parent;
      }
      return ids;
    },
    cleanupAncestorsAfterUncheck(nodeData) {
      const tree = this.$refs.tree;
      if (!tree || !nodeData) return;
      const node = tree.getNode(this.resolveNodeId(nodeData));
      if (!node) return;
      let p = node.parent;
      while (p && p.data) {
        if (!this.isNodeSelectable(p.data)) {
          p = p.parent;
          continue;
        }
        const anyChildSelected = (p.childNodes || []).some(c => {
          const cid = c.data ? this.resolveNodeId(c.data) : null;
          return cid && !!this.selectedMap[cid];
        });
        if (anyChildSelected) break;
        const pid = this.resolveNodeId(p.data);
        if (pid) this.$set(this.selectedMap, pid, false);
        p = p.parent;
      }
    },
    toggleSelect(nodeData, checked) {
      if (!this.isNodeSelectable(nodeData)) return;
      if (this.parentChildLinked) {
        const subtreeIds = this.getSelectableSubtreeIds(nodeData);
        this.setSelectedForIds(subtreeIds, checked);
        if (checked) {
          this.setSelectedForIds(this.getAncestorSelectableIds(nodeData), true);
        } else {
          this.cleanupAncestorsAfterUncheck(nodeData);
        }
      } else {
        const id = this.resolveNodeId(nodeData);
        if (id) this.$set(this.selectedMap, id, !!checked);
      }
      this.emitValue();
    },
    getSelectedIds() {
      return Object.keys(this.selectedMap)
        .filter(k => this.selectedMap[k])
        .map(k => {
          const n = Number(k);
          return isNaN(n) ? k : n;
        });
    },
    setSelectedIds(ids) {
      this.syncSelectedFromValue(ids);
      this.emitValue();
    },
    getCheckableIds(nodes, acc) {
      const list = acc || [];
      if (!nodes || !nodes.length) return list;
      nodes.forEach(n => {
        if (this.isNodeSelectable(n)) {
          const id = this.resolveNodeId(n);
          if (id != null) {
            const num = Number(id);
            list.push(isNaN(num) ? id : num);
          }
        }
        const ch = n[this.childrenKey];
        if (ch && ch.length) {
          this.getCheckableIds(ch, list);
        }
      });
      return list;
    },
    selectAllCheckable() {
      const ids = this.getCheckableIds(this.data);
      this.setSelectedIds(ids);
    },
    clearSelection() {
      this.setSelectedIds([]);
    },
    setExpandAll(expanded) {
      const tree = this.$refs.tree;
      if (!tree || !tree.store || !tree.store.nodesMap) return;
      Object.values(tree.store.nodesMap).forEach(n => {
        n.expanded = !!expanded;
      });
    }
  }
};
</script>

<style scoped>
.menu-auth-dual-tree-legend,
.menu-auth-dual-node {
  display: flex;
  align-items: center;
  width: 100%;
  font-size: 13px;
}
.menu-auth-dual-tree-legend {
  padding: 6px 0 8px;
  color: #909399;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 4px;
}
.legend-col {
  flex: 0 0 72px;
  text-align: center;
}
.legend-existing {
  color: #909399;
}
.legend-select {
  color: #606266;
}
.legend-name {
  flex: 1;
  min-width: 0;
  padding-left: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.node-disabled {
  color: #c0c4cc;
}
.menu-auth-dual-tree-body >>> .el-tree-node__content {
  height: 32px;
}
</style>
