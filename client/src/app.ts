import Taro from '@tarojs/taro'
import VirtualList from '@tarojs/components/virtual-list'
import Vue from 'vue'
import cloudApi from './api/index'
import store from './store'
import { logError } from './utils/util'

Vue.use(VirtualList as any)
Vue.prototype.$cloudApi = cloudApi


// 暂时解决app.config.ts无法import图标的问题
require.context('../assets/tabs', false, /\.png$/)

Vue.config.productionTip = false

// const App = new Vue({
const App = {
  store,
  async onLaunch() {
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
      store.dispatch('checkAndSyncData', cloudSyncTime)
    } catch (e) {
      console.error(e)
      logError('初始化失败', '请重启小程序或者联系开发者', e)
    } finally {
      Taro.hideLoading()
    }
    // // 首次打开小程序，缓存为空
    // if (store.state.progress.totalProgress.length === 0) {
    //   Taro.showLoading({
    //     title: '同步词库记录...',
    //     mask: true
    //   })
    //   // 同步选项
    //   await store.dispatch('user/fetchSettingAndConfig')
    //   // 同步词库图库，注意要在配置同步之后
    //   await store.dispatch('resource/fetchWordList')
    //   await store.dispatch('resource/fetchImageList')
    //   // 同步单词进度
    //   await store.dispatch('progress/fetchWordProgress')
    //   // 云端单词进度为空，则从单词库初始化总进度
    //   if (store.state.progress.totalProgress.length === 0) {
    //     await store.dispatch('progress/initTotalProgress')
    //   }
    //   // 同步收藏
    //   await store.dispatch('user/fetchCollection')
    // } else {
    //   // 初始化词库图库
    //   if (store.state.resource.vocabulary.length === 0) {
    //     await store.dispatch('resource/fetchWordList')
    //   }
    //   if (store.state.resource.imagesList.length === 0) {
    //     await store.dispatch('resource/fetchImageList')
    //   }
    // }

    // if (store.state.syncFailedFlag) {
      // 上一次上传动作失败
      // 同步本地数据
    // }
    // await store.dispatch('user/fetchMark') // 可以不用在这边

    // 更新每日单词
    await store.dispatch('progress/checkCurrentTask')
    // TODO 考虑检查本地时间与服务器时间是否一致
  },
  render(h) {
    // this.$slots.default 是将要会渲染的页面
    return h('block', this.$slots.default)
  }
}

export default App
