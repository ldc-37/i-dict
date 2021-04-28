import Api from '../../api/index'
import Vue from 'vue'
import cloudApi from '../../api/index'
import { ActionTree } from 'vuex'
import { syncFuncParams, SYNC_SOURCE } from '../type'


const state = () => ({
  isLogin: false,
  userId: '',
  info: {
    avatar: '',
    nickname: ''
  },
  config: {
    amountPerDay: 10, //每日背诵数量
    bookId: 1, //单词书Id
  },
  settings: {
    durationKeepAfterRecite: 1500, //单词拼写完成后停留多长时间（ms）
    tipsDuration: 1000, //提示弹窗的展示时长（ms）
    // howToDealWithTips: 1, // 点击跳过后如何处理 1:再次拼写正确后算作熟练度+1；2:不增加熟练度
    timesToChangeBackground: 1, //背多少个单词换一次背景图
    imageType: '二次元', // 图片集类型
    transitionType: '透明度渐变', // 渐变方式
  },
  mark: [], // 单词收藏
  syncTime: {
    setting: 0,
    progress: 0,
    mark: 0,
    dict: 0,
    album: 0
  }
})

const getters = {
  // 获取指定数量收藏单词
  getCollectionWords: (state: any) => (start: number, count: number) => {
    return state.user.collection.slice(start, start + count)
  }
}

const actions: ActionTree<any, any> = {
  async syncSetting({ commit, state }, { source, syncTime }: syncFuncParams) {
    if (source === SYNC_SOURCE.cloud) {
      const setting = await cloudApi.getMyUserData('setting')
      commit('setSetting', setting)
      commit('setSyncTime', {
        setting: syncTime
      })
    } else if (source === SYNC_SOURCE.local) {
      await cloudApi.updateMyUserData({
        setting: state.setting,
        'syncTime.setting': state.syncTime.setting
      })
    }
  },
  async syncMark({ commit, state }, { source }: syncFuncParams) {
    if (source === SYNC_SOURCE.cloud) {
      const setting = await cloudApi.getMyUserData('mark')
      // const settingUpdateTime = await cloudApi.getMyUserData('syncTime.setting')
      commit('setMark', setting)
      // commit('setSyncTime', settingUpdateTime)
    } else if (source === SYNC_SOURCE.local) {
      await cloudApi.updateMyUserData({
        setting: state.setting,
        'syncTime.setting': state.syncTime.setting
      })
    }
  },



  async fetchCollection({ commit }) {
    const res = await Api.getCollection()
    if (res.collection?.wordsCollection?.length) {
      const arr = res.collection.wordsCollection.split(';')
      commit('setCollection', arr)
    } else {
      console.log('>>>云端收藏单词为空')
    }
  },
  async syncCollection({ state }) {
    await Api.setCollection(state.collection)
  },
  async fetchSettingAndConfig({ commit }) {
    const { config } = await Api.getConfig()
    if (config) {
      commit('assignConfig', {
        amountPerDay: config.amountPerDay,
        bookId: config.bookId
      })
      commit('setSettings', {
        durationKeepAfterRecite: config.durationKeepAfterRecite,
        tipsDuration: config.tipsDuration,
        timesToChangeBackground: config.timesToChangeBackground,
        imageType: config.imageType,
        transitionType: config.transitionType,
      })
    }
  },
  async syncSettingAndConfig({ state }) {
    const data = Object.assign({}, state.config, state.settings)
    await Api.setConfig(data)
  },
}

const mutations = {
  setSetting(state, setting: any) {
    state.setting = setting
  },
  setMark(state, mark: Array<string>) {
    state.mark = mark
  },
  setSyncTime(state, syncTime) {
    state.syncTime = Object.assign(state.syncTime, syncTime)
  },
  setUserId(state, userId: string) {
    state.userId = userId
  },



  setCollection(state: any, collection: Array<any>) {
    state.collection = collection
  },
  addCollection(state: any, word: string) {
    state.collection.push(word)
  },
  cancelCollection(state: any, word: string) {
    const index = state.collection.indexOf(word)
    if (index < 0) {
      console.error('Cancel collection that not exist!!')
    }
    state.collection.splice(index, 1)
  },
  setSettings(state: any, settings: any) {
    state.settings = settings
  },
  assignConfig(state: any, config: any) {
    state.config = {...state.config, ...config}
  },
  setSessionId(state: any, id: string) {
    state.sessionId = id
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
