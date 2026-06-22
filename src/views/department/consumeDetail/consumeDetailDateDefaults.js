/** 科室领用明细：业务日期默认止=今天，起=今天往前 5 天 */
export function formatQueryDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getDefaultBeginDate() {
  const d = new Date();
  d.setDate(d.getDate() - 5);
  return formatQueryDate(d);
}

export function getDefaultEndDate() {
  return formatQueryDate(new Date());
}
