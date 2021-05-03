import req from '../utils/request'
import store from '../store/index'
import Taro from '@tarojs/taro'
import { logError } from '../utils/util'


class Cloud {
  db: Taro.DB.Database
  constructor() {
    if (process.env.TARO_ENV === 'weapp') {
      Taro.cloud.init({
        env: 'zhai-dict-1gopdkut0cd384a2',
        traceUser: true
      })
    }
    this.db = Taro.cloud.database()
  }

  // 获取进度、标记词、设置、词库、图库的最新数据库更新时间
  async getSyncTime() {
    const userData = await this.db.collection('user')
      .field({
        setting: true,
        syncTime: true
      })
      .get()
    console.log(userData.data)
    const mySetting = userData.data[0].setting
    const dictData = await this.db.collection('dict')
      .where({
        _id: mySetting.dictId
      })
      .get()
    const dictUpdateTime = dictData.data[0].updateTime
    const albumData = await this.db.collection('album')
      .where({
        _id: mySetting.albumId
      })
      .get()
    const albumUpdateTime = albumData.data[0].updateTime
    return { 
      ...userData.data[0].syncTime,
      dict: dictUpdateTime,
      album: albumUpdateTime
    }
  }

  async getMyUserData(column: string) {
    try {
      const res = await this.db.collection('user')
        .field({
          _id: false,
          [column]: true
        })
        .get()
      const userData = res.data[0]
      return userData[column]
    } catch (e) {
      logError('网络错误', `获取用户信息失败，请检查网络连接`, e)
    }
  }

  async getResourceData(collectionName: 'dict' | 'album', id: number) {
    try {
      const res = await this.db.collection(collectionName)
        .where({
          _id: id
        })
        .get()
      const resData = res.data[0]
      return resData
    } catch (e) {
      logError('网络错误', `获取${collectionName === 'dict' ? '词库' : '图库'}失败，请检查网络连接`, e)
    }
  }

  async updateMyUserData(data: { [fieldName: string]: any }) {
    // TODO 检查更新时间是否能正常使用
    Object.keys(data).forEach((key) => {
      if (['mark', 'progress', 'setting'].includes(key)) {
        data[`syncTime.${key}`] = this.db.serverDate({
          offset: 8 * 60 * 60
        })
      }
    })
    try {
      const res = await this.db.collection('user')
        .doc(store.state.user!.userId)
        .update({
          data
        })
      if (res.stats.updated === 0) {
        logError('数据库错误', `updateMyUserData没有更新数据`, data)
      }
    } catch(e) {
      logError('数据库错误', `云端上传个人配置失败`, e)
    }
  }
}

export default new Cloud()