import moment from 'moment'
import { getRandomInt, shuffle } from '../../utils/util'
import { Module } from 'vuex'
import Api from '../../api/index'
import { syncFuncParams, SYNC_SOURCE } from '../type'
import { calcWordLevel, updateToCloud } from '../utils'

const progressVuexOption: Module<IProgressState, IState> = {
  namespaced: true,
  state: () => ({
    progress: {},
    taskDate: undefined,
    todayTask: []
  }),
  getters: {
    // TODO 以下统计需要过滤属于当前词库的单词
    learnedAmount(state) {
      return Object.values(state.progress).filter((level) => level === 5).length
    },
    learningAmount(state) {
      return Object.values(state.progress).filter((level) => level < 5 && level > 0).length
    },
    learnedWords(state) {
      return Object.keys(state.progress).filter((word) => state.progress[word] === 5)
    },
    learningWords(state) {
      return Object.keys(state.progress).filter((word) => state.progress[word] < 5 && state.progress[word] > 0)
    },
    notLearnWords(_1, getters, _2, rootGetters) {
      const allWordList: Array<string> = rootGetters['resource/getWordList']
      const learnedOrLearningWordList: Array<string> = getters.learningWords.concat(getters.learnedWords)
      return allWordList.filter(v => !learnedOrLearningWordList.includes(v))
    },
    todayNotLearnWords(state) {
      const words: TaskWordInfo[] = []
      state.todayTask.forEach((info) => {
        !info.isDone && (words.push(info))
      })
      return words
    },
    todayFinishedWords(state) {
      const words: TaskWordInfo[] = []
      state.todayTask.forEach((info) => {
        info.isDone && (words.push(info))
      })
      return words
    },
    isTaskFinished(state) {
      return state.todayTask.every((info) => info.isDone)
    }
  },
  actions: {
    async syncProgress({ commit, state }, { source, syncTime }: syncFuncParams) {
      if (source === SYNC_SOURCE.cloud) {
        const progress = await Api.getMyUserData('progress')
        commit('setProgress', progress)
        commit('user/setSyncTime', {
          progress: syncTime
        }, {
          root: true
        })
      } else if (source === SYNC_SOURCE.local) {
        // await Api.updateMyUserData({
        //   progress: state.progress,
        //   // 'syncTime.progress': rootState.user!.syncTime.progress
        // })
        // // 防止用户调整系统时间导致同步失效，同步成功后把服务端同步时间取回
        // const cloudTimeNew = await Api.getMyUserData('syncTime')
        // commit('user/setSyncTime', {
        //   progress: cloudTimeNew.progress.toISOString()
        // }, {
        //   root: true
        // })
        await updateToCloud(commit, 'progress', state.progress)
      }
    },
    async checkCurrentTask({ state, commit, getters, rootState, dispatch }, directUpdate: boolean = false) {
      if (directUpdate) {
        console.log('[当日任务]强制直接更新')
        // await dispatch('assignTaskToProgress')
      } else if (!state.taskDate) {
        // 新用户还没有生成今日任务
        console.log('[当日任务]新用户暂无任务')
      } else if (!moment(state.taskDate).isSame(undefined, 'day')) {
        if (getters.isTaskFinished) {
          // 任务之前已完成，无需再次合并
          console.log('[当日任务]任务昨天已完成')
        } else {
          // 任务过期，需要合并到总进度
          console.log('[当日任务]任务过期且未完成（之前没有合并过），准备合并进度...')
          await dispatch('assignTaskToProgress')
        }
      } else {
        // 任务没有过期，保持现状不再生成新任务
        console.log('[当日任务]当前任务是今天的，不需要更新')
        return
      }
      console.log('[当日任务]正在生成今天的新任务...')
      const taskWords = genTaskWords(rootState, getters)
      const todayTask = taskWords.map(word => ({
        word,
        ...rootState.resource!.dict[word],
        isDone: false,
        isCorrect: true, // 默认拼写正确
        isMastered: false,
        level: state.progress[word] || 0
      }))
      commit('setTodayTask', todayTask)
      commit('setTaskDate', moment().format('YYYY-MM-DD'))
      console.log('[当日任务]已更新任务单词', taskWords)
    },
    async assignTaskToProgress({ state, commit }) {
      console.log('[当日任务]正在合并进度并同步...')
      const updatingProgress = calcCurrentTaskLevel(state)
      commit('updateProgress', updatingProgress)
      // 同步到云端，如果失败则不再尝试增量同步，启动时会检测到差异并进行全量同步
      // await Api.updateMyUserData({
      //   progress: updatingProgress
      // })
      await updateToCloud(commit, 'progress', updatingProgress)
    }
  },
  mutations: {
    setProgress(state, progress) {
      state.progress = progress
    },
    setTodayTask(state, task: TaskWordInfo[]) {
      state.todayTask = task
    },
    updateProgress(state, partProgress) {
      state.progress = {
        ...state.progress,
        ...partProgress
      }
    },
    updateTodayTask(state, { word, isCorrect, isMastered }) {
      const taskWord = state.todayTask.find(v => v.word === word)
      if (!taskWord) throw new Error('今日单词不存在：' + word)
      taskWord.isDone = true
      taskWord.isCorrect = isCorrect
      taskWord.isMastered = isMastered
    },
    setTaskDate(state, date) {
      state.taskDate = date
    },
    clearAllProgress(state) {
      // 慎用！！
      state.progress = {}
      state.todayTask = []
      // TODO 同步云端
    }
  }
}

// 生成今日任务单词列表
function genTaskWords(rootState: IState, getters: any) {
  const setting = rootState.user!.setting
  // 生成复习单词
  const allLearningWords: Array<string> = getters.learningWords
  const planReviewWordAmount = Math.round(setting.amountPerDay * setting.reviewRate)
  const reviewWordAmount = Math.min(allLearningWords.length, planReviewWordAmount)
  const reviewWords: Array<string> = getRandomInt(0, allLearningWords.length - 1, reviewWordAmount).map(index => allLearningWords[index])
  // 生成新单词
  const allNotLearnWords = getters.notLearnWords
  const planNewWordAmount = setting.amountPerDay - reviewWordAmount
  const newWordAmount = Math.min(allNotLearnWords.length, planNewWordAmount)
  const newWords: Array<string> = getRandomInt(0, allNotLearnWords.length - 1, newWordAmount).map(index => allNotLearnWords[index])
  // 打乱单词顺序
  const shuffleWords = shuffle(newWords.concat(reviewWords))
  return shuffleWords
}

// 当日任务合并入总进度
function calcCurrentTaskLevel(state: IProgressState) {
  const willUpdateProgress: WordProgress = {}
  state.todayTask.forEach((info) => {
    const word = info.word
    if (info.isDone) {
      willUpdateProgress[word] =
        info.isMastered
          ? 5
          : calcWordLevel(state.progress[word] || 0, info.isCorrect)
    }
  })
  return willUpdateProgress
}


export default progressVuexOption
