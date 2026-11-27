/**
 * 串行执行异步任务，避免 Promise.all 并发打满连接池/触发超时。
 * @param {Array<() => Promise<any>>} taskFns
 * @returns {Promise<any[]>}
 */
export function runSerial(taskFns) {
  const list = Array.isArray(taskFns) ? taskFns : []
  const results = []
  return list.reduce((chain, fn, idx) => {
    return chain.then(() => {
      const task = typeof fn === 'function' ? fn() : Promise.resolve(fn)
      return Promise.resolve(task).then(res => {
        results[idx] = res
        return res
      })
    })
  }, Promise.resolve()).then(() => results)
}

/**
 * 对 id 列表串行调用 asyncFn(id)。
 * @param {Array} ids
 * @param {(id: any) => Promise<any>} asyncFn
 */
export function mapSerial(ids, asyncFn) {
  const list = Array.isArray(ids) ? ids : []
  return runSerial(list.map(id => () => asyncFn(id)))
}
