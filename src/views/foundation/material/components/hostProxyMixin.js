import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Material')
