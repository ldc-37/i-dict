import Api from '../../api/index'
import Taro from '@tarojs/taro'
import { getRandomInt } from '../../utils/util'
import { Module } from 'vuex'
import { syncFuncParams, SYNC_SOURCE } from '../type'

const defaultAlbum = (() => {
  const arr: Array<string> = []
  for(let i = 1; i <= 10; i++) {
    arr.push(`https://test-fe.obs.cn-east-2.myhuaweicloud.com/images/magazine/image${i}.jpg`)
  }
  return arr
})()

const resourceVuexOption: Module<IResourceState, IState> = {
  namespaced: true,
  state: () => ({
    dict: {},
    dictInfo: {},
    album: defaultAlbum,
    albumInfo: {},
    firstBackground: '',
  }),
  getters: {
    getImages: (state) => (count: number) => {
      // FIXME:需求大于库存时也许会炸???
      const len = state.album.length
      const arr: Array<number|string> = getRandomInt(0, len - 1, count)
      return arr.map(item => state.album[item])
    },
    getWordList(state) {
      return Object.keys(state.album)
    }
  },
  actions: {
    async syncAlbum({ commit, rootState }, { source, syncTime }: syncFuncParams) {
      if (source === SYNC_SOURCE.cloud) {
        const data: any = await Api.getResourceData('album', rootState.user!.setting.albumId)
        commit('setAlbum', data.list)
        delete data.list
        commit('setAlbumInfo', data)
        commit('user/setSyncTime', {
          album: syncTime
        }, {
          root: true
        })
      } else {
        console.error('album同步方向错误')
      }
    },
    async syncDict({ commit, rootState }, { source, syncTime }: syncFuncParams) {
      if (source === SYNC_SOURCE.cloud) {
        const data: any = await Api.getResourceData('dict', rootState.user!.setting.dictId)
        const { tempFilePath } = await Taro.cloud.downloadFile({
          fileID: data.fileId
        })
        const dictText = Taro.getFileSystemManager().readFileSync(tempFilePath, 'utf-8') as string
        commit('setDict', JSON.parse(dictText))
        commit('setDictInfo', data)
        commit('user/setSyncTime', {
          dict: syncTime
        }, {
          root: true
        })
      } else {
        console.error('album同步方向错误')
      }
    },
  
    async fetchFirstBackground({ commit, getters }) {
      const src = getters.getImages(1)[0]
      await Taro.getImageInfo({
        src
      })
      commit('setFirstBackground', src)
    }
  },
  mutations: {
    setAlbum(state, data) {
      state.album = data
    },
    setDict(state, data) {
      state.dict = data
    },
    setAlbumInfo(state, info) {
      state.albumInfo = info
    },
    setDictInfo(state, info) {
      state.dictInfo = info
    },
  
    setFirstBackground(state: any, bg: string) {
      // const index = getRandomInt(0, state.album.length - 1)
      state.firstBackground = bg
    },
  }
}


export default resourceVuexOption