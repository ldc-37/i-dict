import Taro from '@tarojs/taro'
import VirtualList from '@tarojs/components/virtual-list'
import Vue from 'vue'
import cloudApi from './api/index'
import store from './store'
import { batchUploadFileAndGetCloudID, genWebUserId, logError } from './utils/util'

Vue.use(VirtualList as any)
Vue.prototype.$cloudApi = cloudApi

Vue.config.productionTip = false

const App = {
  store,
  async onLaunch() {
    // await batchUploadFileAndGetCloudID()
    if (process.env.TARO_ENV === 'h5') {
      // @ts-ignore Web初始化
      await cloudApi.webInitCloud()
    }
    Taro.showLoading({
      title: '加载中...',
      mask: true
    })
    store.commit('setLocalDataReady', false)
    try {
      let res: any = null
      if (process.env.TARO_ENV === 'h5') {
        // 检查localStorage，登陆临时用户
        const userId = store.state.user?.userId || genWebUserId()
        res = await Taro.cloud.callFunction({
          name: 'web-login',
          data: {
            userId
          }
        })
        console.log('[登陆]H5登陆成功=>', res)
      } else if (process.env.TARO_ENV === 'weapp') {
        // 检查是否新用户，并更新数据库
        res = await Taro.cloud.callFunction({
          name: 'login',
        })
        console.log('[登陆]微信小程序登陆成功=>', res)
      }
      if (res.result.isNewUser) {
        if (store.state.hasDisplayedUseGuide || store.state.user?.userId) {
          // 本地有数据但云端没有，意味着云端数据被清除。用户数据本地上传，资源云端下载。
          console.warn('=====监测到数据库数据丢失=====')
          store.commit('user/setSyncTime', {
            setting: '2099',
            progress: '2099',
            mark: '2099',
            dict: '0',
            album: '0'
          })
        } else {
          // 展示新用户引导 TODO
          console.log('[登陆]当前是新用户')
          Taro.showToast({
            title: '欢迎新用户',
            icon: 'success'
          })
        }
      }
      store.commit('user/setUserId', res.result.userId)
      store.commit('user/setIsVip', res.result.isVip)
      // 数据同步
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
        logError('初始化失败', `错误信息：${e.message}。请重启小程序，如还有问题联系开发者`, e)
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
