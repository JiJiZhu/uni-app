import { hasOwn } from '@vue/shared'

import { MPComponentInstance, MPComponentOptions } from '@dcloudio/uni-mp-core'

import { findVmByVueId } from '@dcloudio/uni-mp-core'

import { initInjections, initProvide } from './apiInject'
import { ParseComponentOptions } from 'packages/uni-mp-core/src/runtime/component'

export { initLifetimes } from './componentLifetimes'

export const mocks = [
  '__route__',
  '__webviewId__',
  '__nodeId__',
  '__nodeid__' /* @Deprecated */
]

export function isPage(mpInstance: MPComponentInstance) {
  return (
    (mpInstance as any).__nodeId__ === 0 || (mpInstance as any).__nodeid__ === 0
  )
}

interface RelationOptions {
  vuePid: string
  nodeId: string
  webviewId: string
}

export const instances = Object.create(null)

export function initRelation(mpInstance: MPComponentInstance, detail: Object) {
  // 头条 triggerEvent 后，接收事件时机特别晚，已经到了 ready 之后
  const nodeId = hasOwn(mpInstance, '__nodeId__')
    ? mpInstance.__nodeId__
    : mpInstance.__nodeid__
  const webviewId = mpInstance.__webviewId__ + ''
  instances[webviewId + '_' + nodeId] = mpInstance.$vm
  mpInstance.triggerEvent('__l', {
    vuePid: (detail as any).vuePid,
    nodeId,
    webviewId
  })
}

export function handleLink(
  this: MPComponentInstance,
  {
    detail: { vuePid, nodeId, webviewId }
  }: {
    detail: RelationOptions
  }
) {
  const vm = instances[webviewId + '_' + nodeId]
  if (!vm) {
    return
  }

  let parentVm
  if (vuePid) {
    parentVm = findVmByVueId(this.$vm!, vuePid)
  }
  if (!parentVm) {
    parentVm = this.$vm!
  }
  vm.$.parent = parentVm.$

  if (__VUE_OPTIONS_API__) {
    ;(parentVm as any).$children.push(vm)
    const parent = parentVm.$ as any
    vm.$.provides = parent
      ? parent.provides
      : Object.create(parent.appContext.provides)
    initInjections(vm)
    initProvide(vm)
  }

  vm.$callSyncHook('created')
  vm.$callHook('mounted')
  vm.$callHook('onReady')
}

export function parse(
  componentOptions: MPComponentOptions,
  { handleLink }: Partial<ParseComponentOptions>
) {
  componentOptions.methods!.__l = handleLink!
}
