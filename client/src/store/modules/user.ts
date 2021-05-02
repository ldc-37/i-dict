import Api from '../../api/index'
import { Module } from 'vuex'
import { syncFuncParams, SYNC_SOURCE } from '../type'


const userVuexOption: Module<IUserState, IState> = {
  namespaced: true,
  state: () => ({
    userId: '',
    info: {
      avatar: '',
      nickname: ''
    },
    config: {
      amountPerDay: 10, //每日背诵数量
      bookId: 1, //单词书Id
    },
    setting: {
      durationKeepAfterRecite: 1500, //单词拼写完成后停留多长时间（ms）
      tipsDuration: 1000, //提示弹窗的展示时长（ms）
      // howToDealWithTips: 1, // 点击跳过后如何处理 1:再次拼写正确后算作熟练度+1；2:不增加熟练度
      timesToChangeBackground: 1, //背多少个单词换一次背景图
      imageType: '二次元', // 图片集类型
      transitionType: '透明度渐变', // 渐变方式
      albumId: -1,
      dictId: -1,
    },
    mark: [], // 单词收藏
    syncTime: {
      setting: 0,
      progress: 0,
      mark: 0,
      dict: 0,
      album: 0
    }
  }),
  getters: {
    // 获取指定数量收藏单词
    getCollectionWords: (state: any) => (start: number, count: number) => {
      return state.user.collection.slice(start, start + count)
    }
  },
  actions: {
    async syncSetting({ commit, state }, { source, syncTime }: syncFuncParams) {
      if (source === SYNC_SOURCE.cloud) {
        const setting = await Api.getMyUserData('setting')
        commit('setSetting', setting)
        commit('setSyncTime', {
          setting: syncTime
        })
      } else if (source === SYNC_SOURCE.local) {
        await Api.updateMyUserData({
          setting: state.setting,
          'syncTime.setting': state.syncTime.setting
        })
      }
    },
    async syncMark({ commit, state }, { source, syncTime }: syncFuncParams) {
      if (source === SYNC_SOURCE.cloud) {
        const setting = await Api.getMyUserData('mark')
        commit('setMark', setting)
        commit('setSyncTime', {
          setting: syncTime
        })
      } else if (source === SYNC_SOURCE.local) {
        await Api.updateMyUserData({
          setting: state.setting,
          'syncTime.setting': state.syncTime.setting
        })
      }
    }
  },
  mutations: {
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
    addMark() {
      // TODO push 更新时间 同步数据库
    },
    cancelMark(state: any, word: string) {
      const index = state.collection.indexOf(word)
      if (index < 0) {
        throw new Error(`取消标记的单词不在标记列表中: ${word}`)
      }
      state.collection.splice(index, 1)
      // TODO 更新时间并同步
    },
    assignConfig(state: any, config: any) {
      state.config = {...state.config, ...config}
    }
  }
}

export default userVuexOption
