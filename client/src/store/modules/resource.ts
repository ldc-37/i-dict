import Api from '../../api/index'
import Taro from '@tarojs/taro'
import { getRandomInt } from '../../utils/util'
import { Module } from 'vuex'
import { syncFuncParams, SYNC_SOURCE } from '../type'
import { transFileUrl } from '../utils'

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
      // 库存不足时自动允许重复图片
      const len = state.album.length
      let allowRepeat = false
      if (count > len) {
        console.warn('getImage图片不足，允许重复图片', count, len)
        allowRepeat = true
      }
      const arr: Array<number|string> = getRandomInt(0, len - 1, count, allowRepeat)
      return arr.map(item => state.album[item])
    },
    getWordList(state) {
      return Object.keys(state.dict)
    }
  },
  actions: {
    async syncAlbum({ commit, rootState }, { source, syncTime }: syncFuncParams) {
      if (source === SYNC_SOURCE.cloud) {
        const data: any = await Api.getResourceData('album', rootState.user!.setting.albumId)
        commit('setAlbumInfo', data)
        let albumList: string[] = data.list
        // 如果第一个是cloudFileID，那么所有都需要转换真实url
        if (data.list[0].startsWith('cloud')) {
          albumList = await transFileUrl(data.list)
        }
        commit('setAlbum', albumList)
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
        console.error('dict同步方向错误')
      }
    },
  
    async fetchFirstBackground({ commit, getters }) {
      const src = getters.getImages(1)[0]
      // const realSrc = await transFileUrl(src)
      // await Taro.getImageInfo({
      //   src: realSrc.fileList[0].tempFileURL
      // })
      // commit('setFirstBackground', realSrc.fileList[0].tempFileURL)
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