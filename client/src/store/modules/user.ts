import Api from '../../api/index'
import { Module } from 'vuex'
import { syncFuncParams, SYNC_SOURCE } from '../type'
import { updateToCloud } from '../utils'


const userVuexOption: Module<IUserState, IState> = {
  namespaced: true,
  state: () => ({
    userId: '',
    setting: {
      durationKeepAfterRecite: 1500, //单词拼写完成后停留多长时间（ms）
      tipsDuration: 1000, //提示弹窗的展示时长（ms）
      // howToDealWithTips: 1, // 点击跳过后如何处理 1:再次拼写正确后算作熟练度+1；2:不增加熟练度
      timesToChangeBackground: 1, //背多少个单词换一次背景图
      imageType: '随机', // 图片集类型名称
      transitionType: '透明度渐变', // 渐变方式
      amountPerDay: 10, //每日背诵数量
      reviewRate: 0.5, // 复习比例
      albumId: 1,
      dictId: 1,
    },
    isVip: false,
    mark: [], // 标记单词
    // 最后同步时间，初始值单位是xxxx年
    syncTime: {
      setting: '2099',
      progress: '2099',
      mark: '2099',
      dict: '0',
      album: '0'
    }
  }),
  getters: {
    // 获取指定数量标记单词
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
        await updateToCloud(commit, 'setting', state.setting)
      }
    },
    async syncMark({ commit, state }, { source, syncTime }: syncFuncParams) {
      if (source === SYNC_SOURCE.cloud) {
        const mark = await Api.getMyUserData('mark')
        commit('setMark', mark)
        commit('setSyncTime', {
          mark: syncTime
        })
      } else if (source === SYNC_SOURCE.local) {
        await updateToCloud(commit, 'mark', state.mark)
      }
    },
    // TODO 专门给mark写个增量同步函数
    async addMark({ state, commit }, word) {
      commit('addMark', word)
      await updateToCloud(commit, 'mark', state.mark)
    },
    async cancelMark({ state, commit }, word: string) {
      commit('cancelMark', word)
      await updateToCloud(commit, 'mark', state.mark)
    }
  },
  mutations: {
    setSetting(state, setting: any) {
      // 慎用
      state.setting = setting
    },
    setMark(state, mark: Array<string>) {
      state.mark = mark
    },
    setSyncTime(state, syncTime: string) {
      state.syncTime = Object.assign(state.syncTime, syncTime)
    },
    setUserId(state, userId: string) {
      state.userId = userId
    },
    addMark(state, word: string) {
      state.mark.push(word)
    },
    cancelMark(state, word: string) {
      const index = state.mark.indexOf(word)
      if (index < 0) {
        throw new Error(`取消标记的单词不在标记列表中: ${word}`)
      }
      state.mark.splice(index, 1)
    },
    assignSetting(state, setting: any) {
      state.setting = { ...state.setting, ...setting }
    },
    setIsVip(state, isVip: boolean) {
      state.isVip = isVip
    }
  }
}

export default userVuexOption
