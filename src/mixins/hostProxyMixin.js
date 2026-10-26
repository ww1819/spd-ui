/**
 * 将宿主页 data / computed / methods 挂到弹窗子组件，便于原样抽离模板。
 * 父页方法里的 this 仍是列表页；弹窗内 ref 在 mounted/updated 同步回宿主。
 * 新弹窗优先用 props + emit；仅超大强耦合页使用本 mixin。
 *
 * @param {(vm: Vue) => boolean} isHost 向上查找宿主页
 */
export function createHostProxyMixin(isHost) {
  function resolveDialogHost(vm) {
    let p = vm.$parent
    while (p) {
      if (isHost(p)) {
        return p
      }
      p = p.$parent
    }
    return vm.$parent
  }

  return {
    beforeCreate() {
      const host = resolveDialogHost(this)
      if (!host) return
      const computed = (this.$options.computed = Object.assign({}, this.$options.computed))
      const skip = new Set(['dict'].concat(Object.keys(computed), Object.keys(this.$options.props || {})))

      Object.keys(host.$data || {}).forEach(key => {
        if (skip.has(key)) return
        computed[key] = {
          get() {
            return resolveDialogHost(this)[key]
          },
          set(v) {
            resolveDialogHost(this)[key] = v
          }
        }
      })

      Object.keys(host.$options.computed || {}).forEach(key => {
        if (computed[key] || skip.has(key)) return
        computed[key] = {
          get() {
            return resolveDialogHost(this)[key]
          },
          set(v) {
            resolveDialogHost(this)[key] = v
          }
        }
      })

      const methods = (this.$options.methods = Object.assign({}, this.$options.methods))
      Object.keys(host.$options.methods || {}).forEach(key => {
        if (methods[key]) return
        methods[key] = function (...args) {
          return resolveDialogHost(this)[key](...args)
        }
      })
    },
    mounted() {
      this.syncRefsToParent()
    },
    updated() {
      this.syncRefsToParent()
    },
    methods: {
      syncRefsToParent() {
        const parent = resolveDialogHost(this)
        if (!parent || !parent.$refs) return
        Object.keys(this.$refs).forEach(key => {
          parent.$refs[key] = this.$refs[key]
        })
      }
    }
  }
}
