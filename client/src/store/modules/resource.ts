import Api from '../../api/index'
import Taro from '@tarojs/taro'
// import Vue from 'vue'
import cloudApi from '../../api/index'
import { getRandomInt } from '../../utils/util'
import { ActionTree, MutationTree } from 'vuex'
import { SYNC_SOURCE } from '../type'

// const cloudApi = Vue.prototype.$cloudApi

const state = () => ({
  // vocabulary: [],
  dict: {},
  album: (() => {
    const arr: Array<String> = []
    for(let i = 1; i <= 10; i++) {
      arr.push(`https://test-fe.obs.cn-east-2.myhuaweicloud.com/images/magazine/image${i}.jpg`)
    }
    return arr
  })(),
  firstBackground: '',
})

const getters = {
  getPureWords(state: any) {
    return state.vocabulary.map(item => item.content)
  },
  getImages: (state: any) => (count: number) => {
    // FIXME:需求大于库存时也许会炸
    const len = state.imagesList.length
    const arr: Array<number|String> = getRandomInt(0, len - 1, count)
    // TODO:数组下标到底是个啥类型
    return arr.map(item => state.imagesList[item as any])
  }
}

const actions: ActionTree<any, any> = {
  async syncAlbum({ commit, rootState }) {
    const data: any = await cloudApi.getResourceData('album', rootState.user.setting.albumId)
    commit('setAlbum', data.list)
    commit('user/setSyncTime', {
      album: data.updateTime
    }, {
      root: true
    })
  },
  async syncDict({ commit, rootState }) {
    const data: any = await cloudApi.getResourceData('dict', rootState.user.setting.dictId)
    const { tempFilePath } = await Taro.cloud.downloadFile({
      fileID: data.fileId
    })
    const dictText = Taro.getFileSystemManager().readFileSync(tempFilePath, 'utf-8') as string
    commit('setDict', JSON.parse(dictText))
    commit('user/setSyncTime', {
      album: data.updateTime
    }, {
      root: true
    })
  },



  async fetchImageList({ commit, rootState }) {
    const res = await Api.getImageType()
    if (res.typeList) {
      const urls = res.typeList.find(item => item.description === rootState.user.settings.imageType || '二次元').urls
      commit('setImagesList', urls)
    }
  },
  async fetchWordList({ commit, rootState}) {
    const res = await Api.getBook(rootState.user.config.bookId)
    if (res) {
      commit('setVocabulary', res)
    }
  },
  async fetchFirstBackground({ commit, getters }) {
    const src = getters.getImages(1)[0]
    await Taro.getImageInfo({
      src
    })
    commit('setFirstBackground', src)
  }
}

const mutations: MutationTree<any> = {
  setAlbum(state, data) {
    state.album = data
  },
  setDict(state, data) {
    state.dict = data
  },



  setImagesList(state: any, data: any) {
    state.imagesList = data
  },
  setVocabulary(state: any, data: any) {
    // TODO: 数量过多会卡死
    state.vocabulary = data
  },
  setFirstBackground(state: any, data: string) {
    const index = getRandomInt(0, state.imagesList.length - 1)
    state.firstBackground = data
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
