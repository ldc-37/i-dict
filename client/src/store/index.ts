import Taro from '@tarojs/taro'
import Vue from 'vue'
import Vuex, { StoreOptions } from 'vuex'
import createLogger from 'vuex/dist/logger'
import createPersistedState from "vuex-persistedstate";
import { SYNC_SOURCE } from './type'
import progress from './modules/progress'
import resource from './modules/resource'
import user from './modules/user'

Vue.use(Vuex)

const vuexOption: StoreOptions<IState> = {
  modules: {
    progress,
    resource,
    user
  },
  strict: process.env.NODE_ENV !== 'production',
  state: () => ({
    syncFailedFlag: false, // 数据上行失败
    localDataReady: false // 启动时false 确认同步后true  
  }),
  actions: {
    // 检查并同步与云端不一致的数据
    async checkAndSyncData({ state, commit, dispatch }, cloudTimeMap) {
      commit('setLocalDataReady', false) // TODO 调整代码位置？
      const taskList: Array<() => Promise<any>> = []
      const syncActionNameMap = {
        album: 'resource/syncAlbum',
        dict: 'resource/syncDict',
        progress: 'progress/syncProgress',
        mark: 'user/syncMark',
        setting: 'user/syncSetting'
      }
      // 同步顺序：设置-进度-标记词-资源
      Object.entries(state.user.syncTime).forEach(([item, localTime]) => {
        const cloudTime = cloudTimeMap[item]
        if (localTime === cloudTime) {
          console.log(`${item}已经同步`)
        } else if (localTime < cloudTime) {
          console.log(`${item}本地落后云端，下载中...`)
          taskList.push(() => dispatch(syncActionNameMap[item], {
            source: SYNC_SOURCE.cloud,
            syncTime: cloudTime
          }))
        } else {
          console.log(`${item}本地领先云端，上传中...`)
          taskList.push(() => dispatch(syncActionNameMap[item], {
            source: SYNC_SOURCE.local
          }))
        }
      })
      for (const syncFunc of taskList) {
        await syncFunc()
      }
      // await Promise.all(taskList)
      commit('setLocalDataReady', true)
    }
  },
  mutations: {
    setLocalDataReady(state, isReady: boolean) {
      state.localDataReady = isReady
    }
  },
  plugins: [
    createPersistedState({
      storage: {
        getItem: (key) => Taro.getStorageSync(key),
        setItem: (key, value) => Taro.setStorageSync(key, value),
        removeItem: (key) => Taro.removeStorageSync(key),
      }
    }),
    createLogger()
  ]
}

export default new Vuex.Store(vuexOption)
