/* eslint-disable no-param-reassign */
// 货币格式化，千份符且保留两位小数
const formatCurrency = (value, blankValue = '-') => {
  if (!value) {
    return blankValue;
  }
  try {
    value = Number(value);
  } catch (e) {
    return blankValue;
  }
  const currency = Number(value.toFixed(2)).toLocaleString('zh');
  // eslint-disable-next-line prefer-const
  let [int, float] = currency.split('.');
  if (!float || float.length < 2) {
    float = (float || '').padEnd(2, '0');
  }
  return `${int}.${float}`;
};
// 比率保留两位小数
const formatRate = (value, blankValue = '-') => {
  if (!value) {
    return blankValue;
  }
  try {
    value = Number(value);
  } catch (e) {
    return blankValue;
  }
  const rate = value.toFixed(2);
  // eslint-disable-next-line prefer-const
  let [int, float] = rate.split('.');
  if (!float || float.length < 2) {
    float = (float || '').padEnd(2, '0');
  }
  return `${int}.${float}￥`;
};
// 整数千份符
const filterComma = (number, blankValue = '-') =>
  (number ? String(number).replace(/(?=(\B\d{3})+$)/g, ',') : blankValue);

export default { formatCurrency, formatRate, filterComma };
