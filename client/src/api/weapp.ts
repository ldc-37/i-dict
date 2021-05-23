import store from '../store/index'
import Taro from '@tarojs/taro'
import { logError, sleep } from '../utils/util'

class Cloud {
  db: Taro.DB.Database

  constructor() {
    Taro.cloud.init({
      env: 'zhai-dict-1gopdkut0cd384a2',
      traceUser: true
    })
    this.db = Taro.cloud.database()
  }

  // 获取进度、标记词、设置、词库、图库的最新数据库更新时间
  async getSyncTime() {
    const userData = await this.db.collection('user')
      .where({
        _id: store.state.user!.userId,
        _openid: '{openid}'
      })
      .field({
        setting: true,
        syncTime: true
      })
      .get()
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

  /**
   * 获取个人用户信息
   * @param column 要取的字段名，不传则为全部
   */
  async getMyUserData(column?: string) {
    try {
      const condition = column
        ? {
          _id: false,
          [column]: true
        }
        : {}
      const res = await this.db.collection('user')
        .where({
          _id: store.state.user!.userId,
          _openid: '{openid}'
        })
        .field(condition)
        .get()
      const userData = res.data[0]
      return column ? userData[column] : userData
    } catch (e) {
      logError('网络错误', `获取用户信息失败，请检查网络连接`, e)
    }
  }

  async getResourceData(collectionName: 'dict' | 'album', id?: number) {
    try {
      const _ = this.db.command
      const condition: any = id ? { _id: id } : {}
      if (collectionName === 'album') {
        condition.type = store.state.user!.isVip ? _.eq(1).or(_.eq(2)) : 1
      }
      const res = await this.db.collection(collectionName)
        .where(condition)
        .get()
      const resData = id ? res.data[0] : res.data
      return resData
    } catch (e) {
      logError('网络错误', `获取${collectionName === 'dict' ? '词库' : '图库'}失败，请检查网络连接`, e)
    }
  }

  async updateMyUserData(data: { [fieldName: string]: any }) {
    Object.keys(data).forEach((key) => {
      if (['mark', 'progress', 'setting'].includes(key)) {
        data[`syncTime.${key}`] = this.db.serverDate()
      }
    })
    try {
      const res = await this.db.collection('user')
        .where({
          _id: store.state.user!.userId,
          _openid: '{openid}'
        })
        // @ts-ignore 启用了自定义安全规则
        .update({
          data
        })
      if (res.stats.updated === 0) {
        logError('数据库错误', `updateMyUserData没有更新数据`, data)
      }
    } catch (e) {
      logError('数据库错误', `云端上传个人配置失败`, e)
    }
  }
}

export default Cloud