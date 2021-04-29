import Api from '../../api/index'
import moment from 'moment'
import { ActionTree } from 'vuex'
import cloudApi from '../../api/index'
import { SYNC_SOURCE } from '../type'

const state = () => ({
  progress: {},
  // validDate: '',
  todayTask: {}
})

// getters
const getters = {
  totalAmount(state: any) {
    return Object.keys(state.progress).length
  },
  learnedAmount(state: any) {
    return Object.values(state.progress).filter((level: number) => level === 5).length
  },
  learningAmount(state: any) {
    return Object.values(state.progress).filter((level: number) => level < 5 && level > 0).length
  },
  todayFinished(state: any) {
    // return Object.entries(state.todayProgress).filter(item => item[1] === true).map(item => item[0])
  },
  todayNewLearnedAmount(state: any, getters) {
  //   // TODO:僵硬。看看能不能改。
  //   // 考虑到目前“已掌握”时的粗糙做法，level只在totalProgress中正确而非todayWords
  //   return getters.todayFinished.filter(item => (state.totalProgress.find(item2 => item2.word === item)?.level === 0)).length
  },

  getLearningWords() {

  },
  getLearnedWords() {

  },
  getNotLearnWords() {

  }
}

const actions: ActionTree<any, any> = {
  async syncProgress({ commit, state, rootState }, { source }: { source: SYNC_SOURCE }) {
    if (source === SYNC_SOURCE.cloud) {
      const progress = await cloudApi.getMyUserData('progress')
      // const progressUpdateTime = await cloudApi.getMyUserData('syncTime.progress')
      commit('setProgress', progress)
      // commit('setSyncTime', progressUpdateTime)
    } else if (source === SYNC_SOURCE.local) {
      await cloudApi.updateMyUserData({
        progress: state.progress,
        'syncTime.progress': rootState.user.syntTime.progress
      })
    }
  },



  _updateTodayWords({ rootState, rootGetters, commit }) {
    const amount = rootState.user.config.amountPerDay,
      reviewWords: Array<any> = rootGetters['getLearningWords'](Math.floor(amount / 2)),
      newWords: Array<any> = rootGetters['getNotLearnWords'](amount - reviewWords.length)
    // return state.todayWords = reviewWords.concat(newWords)
    commit('setTodayWords', reviewWords.concat(newWords))
    console.log('>>>今日单词更新完成')
  },
  async updateTodayData({ state, dispatch, commit, getters }, force: boolean) {
    // if (!state.validDate || moment(state.validDate).isBefore(undefined, 'day')) {
    // 考虑到用户可能把系统时间往前改，为避免永远不更新每日单词导致无法使用，改成判断日期是否一致
    if (force || !state.validDate || !moment(state.validDate).isSame(undefined, 'day')) {
      // 昨天没有背完，把有背的合并到总进度
      console.log('>>>正在合并单词到总进度')
      const finished = getters.todayFinished
      commit('_updateTotalProgress', {
        words: finished,
        date: state.validDate
      })
      await dispatch('_updateTodayWords')
      // 更新日期、清除昨日剩余进度
      const today = moment().format('YYYY-MM-DD')
      commit('setValidDate', today)
      commit('clearTodayProgress')
      // 同步进度
      dispatch('syncWordProgress')
    }
    console.log('>>>昨天已经背完单词或还没有跨天')
  },
  async initTotalProgress({ rootState, commit }) {
    const { recordList } = await Api.getRecord()
    if (!recordList?.recordList?.length) {
      console.warn('云端无历史记录')
      const initTotal: Array<any> = rootState.resource.vocabulary.map((item: any) => ({
        word: item.content,
        level: 0,
      }))
      commit('setTotalProgress', initTotal)
    } else {
      commit('setTotalProgress', recordList.recordList)
    }
  }
}

const mutations = {
  setProgress(state, progress) {
    state.progress = progress
  },



  assignTodayProgress(state: any, progress: any) {
    // 需遵循vue的响应规则，或使用Vue.set
    // return Object.assign(state.todayProgress, progress)
    return state.todayProgress = {...state.todayProgress, ...progress}
  },
  clearTodayProgress(state: any) {
    state.todayProgress = {}
  },
  setTotalProgress(state: any, progress: Array<any>) {
    return state.totalProgress = progress
  },
  setTodayWords(state: any, words: Array<any>) {
    return state.todayWords = words
  },
  _updateTotalProgress(state: any, { words, date = state.validDate }: { words: Array<string>, date?: string }) {
    words.forEach(word => {
      const index = state.totalProgress.findIndex(item => item.word === word)
      if (index >= 0) {
        state.totalProgress[index].date = date
        state.totalProgress[index].level += 1
      } else {
        throw new Error('cannot find word(' + word +') in history!')
      }
    })
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
