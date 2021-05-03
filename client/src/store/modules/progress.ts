import moment from 'moment'
import { getRandomInt, shuffle } from '../../utils/util'
import { Module } from 'vuex'
import Api from '../../api/index'
import { syncFuncParams, SYNC_SOURCE } from '../type'
import { calcWordLevel } from '../utils'

const progressVuexOption: Module<IProgressState, IState> = {
  namespaced: true,
  state: () => ({
    progress: {},
    taskDate: undefined,
    todayTask: {}
  }),
  getters: {
    learnedAmount(state) {
      return Object.values(state.progress).filter((level) => level === 5).length
    },
    learningAmount(state) {
      return Object.values(state.progress).filter((level) => level < 5 && level > 0).length
    },
    learningWords(state) {
      return Object.keys(state.progress).filter((word) => state.progress[word] === 5)
    },
    learnedWords(state) {
      return Object.keys(state.progress).filter((word) => state.progress[word] < 5 && state.progress[word] > 0)
    },
    notLearnWords(_1, getters, _2, rootGetters) {
      const allWordList: Array<string> = rootGetters.resource.getWordList
      const learnedOrLearningWordList: Array<string> = getters.learningWords.concat(getters.learnedWords)
      return allWordList.filter(v => !learnedOrLearningWordList.includes(v))
    },
    todayNotLearnWords(state) {
      const words: TaskWord = {}
      Object.entries(state.todayTask).forEach(([word, info]) => {
        !info.isDone && (words[word] = info)
      })
      return words
    },
    isTaskFinished(state) {
      return Object.values(state.todayTask).every((info) => info.isDone)
    }
  },
  actions: {
    async syncProgress({ commit, state, rootState }, { source, syncTime }: syncFuncParams) {
      if (source === SYNC_SOURCE.cloud) {
        const progress = await Api.getMyUserData('progress')
        commit('setProgress', progress)
        commit('user/setSyncTime', {
          progress: syncTime
        }, {
          root: true
        })
      } else if (source === SYNC_SOURCE.local) {
        await Api.updateMyUserData({
          progress: state.progress,
          'syncTime.progress': rootState.user!.syncTime.progress
        })
      }
    },
    checkCurrentTask({ state, commit, getters, rootState, dispatch }) {
      if (!state.taskDate) {
        // 新用户还没有生成今日任务
        console.log('[当日任务]新用户暂无任务')
      } else if (!moment(state.taskDate).isSame(undefined, 'day')) {
        if (getters.isTaskFinished) {
          // 任务之前已完成，无需再次合并
          console.log('[当日任务]任务昨天已完成')
        } else {
          // 任务过期，需要合并到总进度
          console.log('[当日任务]任务过期且未完成（之前没有合并过），准备合并进度...')
          dispatch('assignTaskToProgress')
        }
        console.log('[当日任务]正在生成今天的新任务...')
        const taskWords = genTaskWords(getters)
        const todayTask = taskWords.map(word => rootState.resource!.dict[word])
        commit('setTodayTask', todayTask)
        commit('setTaskDate', moment().format('YYYY-MM-DD'))
        console.log('[当日任务]已更新任务单词', taskWords)
      } else {
        // 任务没有过期，保持现状不再生成新任务
        console.log('[当日任务]当前任务是今天的，不需要更新')
      }
    },
    async assignTaskToProgress({ state, commit }) {
      console.log('[当日任务]正在合并进度并同步...')
      const updatingProgress = calcCurrentTaskLevel(state)
      commit('updateProgress', updatingProgress)
      // 同步到云端，如果失败则不再尝试增量同步，启动时会检测到差异并进行全量同步
      await Api.updateMyUserData({
        progress: updatingProgress
      })
    }
  },
  mutations: {
    setProgress(state, progress) {
      state.progress = progress
    },
    setTodayTask(state, task) {
      state.todayTask = task
    },
    updateProgress(state, partProgress) {
      state.progress = {
        ...state.progress,
        ...partProgress
      }
    },
    setTaskDate(state, date) {
      state.todayTask = date
    }
  }
}

// 生成今日任务单词列表
function genTaskWords(getters: any) {
  // FIXME 编写取词逻辑
  const learningWords: Array<string> = getRandomInt(0, 9, 5).map(index => getters.learningWords[index])
  const newWords: Array<string> = getRandomInt(0, 9, 5).map(index => getters.notLearnWords[index])
  const shuffleWords = shuffle(newWords.concat(learningWords))
  return shuffleWords
}

// 当日任务合并入总进度
function calcCurrentTaskLevel(state: IProgressState) {
  const willUpdateProgress = {}
  Object.entries(state.todayTask).forEach(([word, info]) => {
    if (info.isDone) {
      willUpdateProgress[word] = calcWordLevel(state.progress[word], info.isCorrect)
    } else {
      console.log('此单词没有记忆', word)
    }
  })
  return willUpdateProgress
}

export default progressVuexOption
