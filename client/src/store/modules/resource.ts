import Api from '../../api/index'
import Taro from '@tarojs/taro'
import { getRandomInt } from '../../utils/util'
import { Module } from 'vuex'

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
    album: defaultAlbum,
    firstBackground: '',
  }),
  getters: {
    getImages: (state: any) => (count: number) => {
      // FIXME:需求大于库存时也许会炸???
      const len = state.album.length
      const arr: Array<number|string> = getRandomInt(0, len - 1, count)
      return arr.map(item => state.album[item])
    }
  },
  actions: {
    async syncAlbum({ commit, rootState }) {
      const data: any = await Api.getResourceData('album', rootState.user.setting.albumId)
      commit('setAlbum', data.list)
      commit('user/setSyncTime', {
        album: data.updateTime
      }, {
        root: true
      })
    },
    async syncDict({ commit, rootState }) {
      const data: any = await Api.getResourceData('dict', rootState.user.setting.dictId)
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
  
    setFirstBackground(state: any, bg: string) {
      // const index = getRandomInt(0, state.album.length - 1)
      state.firstBackground = bg
    },
  }
}


export default resourceVuexOption