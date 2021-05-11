import Taro from '@tarojs/taro'
import VirtualList from '@tarojs/components/virtual-list'
import Vue from 'vue'
import cloudApi from './api/index'
import store from './store'
import { batchUploadFileAndGetCloudID, logError } from './utils/util'

Vue.use(VirtualList as any)
Vue.prototype.$cloudApi = cloudApi


// 暂时解决app.config.ts无法import图标的问题
require.context('../assets/tabs', false, /\.png$/)

Vue.config.productionTip = false

const App = {
  store,
  async onLaunch() {
    // await batchUploadFileAndGetCloudID()
    Taro.showLoading({
      title: '加载中',
      mask: true
    })
    // 检查登陆态
    try {
      // 检查是否新用户，并更新数据库
      const res: any = await Taro.cloud.callFunction({
        name: 'login',
      })
      console.log('login success', res)
      store.commit('user/setUserId', res.result.userId)
      const cloudSyncTime = await cloudApi.getSyncTime()
      await store.dispatch('checkAndSyncData', cloudSyncTime)
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
    // await store.dispatch('user/fetchMark') // 可以不用在这边

    // 更新每日单词
    await store.dispatch('progress/checkCurrentTask')
  },
  render(h: (tag: string, node: any) => any) {
    // this.$slots.default 是将要会渲染的页面
    return h('block', this.$slots.default)
  }
}

export default App
