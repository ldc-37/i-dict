import Taro from '@tarojs/taro'
import Vue from 'vue'
import Vuex, { Action, ActionTree, MutationTree, Store, StoreOptions } from 'vuex'
import createLogger from 'vuex/dist/logger'
import createPersistedState from "vuex-persistedstate";
import { getRandomInt } from '../utils/util'
import progress from './modules/progress'
import resource from './modules/resource'
import user from './modules/user'

Vue.use(Vuex)



const getters = {
  // 获取已学习完的单词，按默认顺序
  getLearnedWords: (state: any) => (count?: number, start?: number) => {
    start = start || 0
    const learned = state.progress.totalProgress.filter((item: any) => item.level === 4) || []
    let result: Array<any> = []
    if (count) {
      result = learned.slice(start, start + count)
    } else {
      result = learned
    }
    // 填充中文含义及发音
    return result.map((item: any) => {
      const wordData = state.resource.vocabulary.find((item2: any) => item2.content === item.word)
      return {
        ...item,
        translation: wordData.definition,
        pronounce: wordData.pron
      }
    })
  },
  // 获取尚未学习的单词，不给定start时为随机获取count个单词
  getNotLearnWords: (state: any) => (count: number, start?: number) => {
    const notLearn: Array<any> = state.progress.totalProgress.filter((item: any) => item.level === 0) || []
    count = Math.min(notLearn.length, count)
    let result: Array<any> = []
    if (start === undefined || start === null) {
      // 未给定start，获取每日新单词使用
      const randArr = getRandomInt(0, notLearn.length - 1, count)
      for(const idx of randArr) {
        result.push(notLearn[idx])
      }
    } else {
      // 给定start，历史记录中使用
      result = notLearn.slice(start, start + count)
    }
    return result.map((item: any) => {
      const wordData = state.resource.vocabulary.find((item2: any) => item2.content === item.word)
      return {
        ...item,
        translation: wordData.definition,
        pronounce: wordData.pron
      }
    })
  },
  // 获取正在学习的单词，随机顺序【暂时】，获取到的数量可能小于count
  getLearningWords: (state: any) => (count: number, start?: number) => {
    start = start || 0
    const learning: Array<any> = state.progress.totalProgress.filter((item: any) => item.level !== 0 && item.level !== 4) || []
    count = Math.min(learning.length, count)
    let result: Array<any> = []
    if (start === undefined || start === null) {
      // 未给定start，获取每日复习的单词使用
      const randArr = getRandomInt(0, learning.length - 1, count)
      for(const idx of randArr) {
        result.push(learning[idx])
      }
    } else {
      // 给定start，历史记录中使用
      result = learning.slice(start, start + count)
    }
    return result.map((item: any) => {
      const wordData = state.resource.vocabulary.find((item2: any) => item2.content === item.word)
      // delete item.date
      return {
        ...item,
        translation: wordData.definition,
        pronounce: wordData.pron
      }
    })
  },
  // 读取所有的学习进度（历史记录）
  // getTotalProgress: (state: any) => (start: number, count: number) => {
  //   return state.totalProgress.slice(start, start + count)
  // },
  // 读取今天的单词
  // getTodayWords: (state: any, getter: any) => {
  //   return state.todayWords
  // },
}

const state = {
  // hadSynced: false,
  // dataUpToDate: {
  //   settingAndConfig: false,
  //   collection: false,
  //   progress: false
  // }
  // test: []
  syncFailedFlag: false, // 数据上行失败
  localDataReady: false // 启动时false 确认同步后true
}

const mutations: MutationTree<any> = {
  // test(state, data) {
  //   state.test = data

  //   Taro.showToast({
  //     title: 'ok'
  //   })
  // }
  setLocalDataReady(state, isReady) {
    state.localDataReady = isReady
  }
}

const actions: ActionTree<any, any> = {
  // 检查并同步与云端不一致的数据
  async checkAndSyncData({ state, commit, dispatch }, cloudTimeMap) {
    commit('setLocalDataReady', false) // TODO 调整代码位置？
    // const isLocalLatest = state.syncFailedFlag
    const taskList: Array<() => Promise<any>> = []
    const syncActionNameMap = {
      album: 'resource/syncAlbum',
      dict: 'resource/syncDict',
      progress: 'progress/syncProgress',
      mark: 'user/syncMark',
      setting: 'user/syncSetting'
    }
    // 同步顺序：设置-进度-标记词-资源
    Object.entries(state.user.syncTime).forEach(([item, localTime]: [string, Date]) => {
      const cloudTime = cloudTimeMap[item]
      if (localTime === cloudTime) {
        console.log(`${item}已经同步`)
      } else if (localTime < cloudTime) {
        console.log(`${item}本地落后云端，下载中...`)
        taskList.push(() => dispatch(syncActionNameMap[item], {
          source: SYNC_SOURCE.cloud
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
}

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  modules: {
    progress,
    resource,
    user
  },
  strict: debug,
  state,
  mutations,
  actions,
  getters,
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
})
