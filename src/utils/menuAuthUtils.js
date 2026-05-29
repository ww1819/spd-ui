/** 将菜单 ID 列表规范为大于 0 的数字 */
export function toMenuIdNumbers(ids) {
  if (!Array.isArray(ids)) return [];
  return ids
    .map(id => Number(id))
    .filter(id => !isNaN(id) && id > 0);
}

/** 合并多组菜单 ID（去重） */
export function mergeMenuAuthIds(...arrays) {
  const set = new Set();
  arrays.forEach(arr => {
    toMenuIdNumbers(arr).forEach(id => set.add(id));
  });
  return Array.from(set);
}

/** 仅保留树中可勾选节点范围内的 ID */
export function filterMenuIdsByAllowed(menuIds, allowedSet) {
  return toMenuIdNumbers(menuIds).filter(id => allowedSet.has(id));
}
