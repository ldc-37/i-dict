import Taro from '@tarojs/taro'
import VirtualList from '@tarojs/components/virtual-list'
import Vue from 'vue'
import cloudApi from './api/index'
import store from './store'
import { batchUploadFileAndGetCloudID, genWebUserId, logError } from './utils/util'

Vue.use(VirtualList as any)
Vue.prototype.$cloudApi = cloudApi

Vue.config.productionTip = false

if (process.env.TARO_ENV === 'h5') {
  // 引入依赖
  const scriptEl = document.createElement('script')
  scriptEl.src = 'https://res.wx.qq.com/open/js/cloudbase/1.1.0/cloud.js'
  document.body.append(scriptEl)
}

const App = {
  store,
  async onLaunch() {
    // await batchUploadFileAndGetCloudID()
    if (process.env.TARO_ENV === 'h5') {
      await cloudApi.webInitCloud()
    }
    Taro.showLoading({
      title: '加载中...',
      mask: true
    })
    store.commit('setLocalDataReady', false)
    try {
      if (process.env.TARO_ENV === 'h5') {
        // 检查localStorage，登陆临时用户
        const userId = store.state.user?.userId || genWebUserId()
        const res: any = await Taro.cloud.callFunction({
          name: 'web-login',
          data: {
            userId
          }
        })
        console.log('[登陆]H5登陆成功=>', res)
        store.commit('user/setUserId', res.result.userId)
      } else if (process.env.TARO_ENV === 'weapp') {
        // 检查是否新用户，并更新数据库
        const res: any = await Taro.cloud.callFunction({
          name: 'login',
        })
        console.log('[登陆]微信小程序登陆成功=>', res)
        store.commit('user/setUserId', res.result.userId)
        store.commit('user/setIsVip', res.result.isVip)
      }
      const cloudSyncTime = await cloudApi.getSyncTime()
      await store.dispatch('checkAndSyncData', cloudSyncTime)
      // 更新每日单词
      await store.dispatch('progress/checkCurrentTask')
    } catch (e) {
      console.error(e)
      if (e.name === 'Failed to fetch') {
        Taro.showToast({
          title: '当前没有连接网络，请注意'
        })
      } else {
        logError('初始化失败', '请重启小程序或者联系开发者', e)
      }
    } finally {
      Taro.hideLoading()
    }

    // if (store.state.syncFailedFlag) {
    // 上一次上传动作失败
    // 同步本地数据
    // }
  },
  render(h: (tag: string, node: any) => any) {
    // this.$slots.default 是将要会渲染的页面
    return h('block', this.$slots.default)
  }
}

export default App
