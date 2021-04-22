import req from '../utils/request'
import store from '../store/index'
import Taro from '@tarojs/taro'
import { logError } from '../utils/util'
export class Api {
  static userId() {
    return store.state.user.sessionId
  }
  static bookId() {
    return store.state.user.config.bookId
  }

  static login(code: string) {
    return req.post('/login', { code })
  }

  static getBookList() {
    return req.get('/books/list')
  }

  static getBook(id: string) {
    return req.get(`/books/${id}`)
  }

  static getConfig() {
    return req.get('/config', {
      id: this.userId()
    })
  }

  static setConfig(config: any) {
    return req.post('/config', {
      ...config,
      userId: this.userId()
    })
  }

  static getRecord(bookId?: string) {
    return req.get('/record', {
      id: this.userId(),
      bookId: bookId || this.bookId()
    })
  }

  static setRecord(record: any, bookId?: string) {
    return req.post('/record', {
      recordList: record,
      userId: this.userId(),
      bookId: bookId || this.bookId()
    })
  }

  static getCollection() {
    return req.get('/collection', {
      id: this.userId()
    })
  }

  static setCollection(collection: string | Array<any>) {
    if (typeof collection === 'string') {
      return req.post('/collection', {
        userId: this.userId(),
        wordsCollection: collection
      })
    } else if (Array.isArray(collection)) {
      const collectionStr = collection.join(';')
      return req.post('/collection', {
        userId: this.userId(),
        wordsCollection: collectionStr
      })
    }
  }

  static postCheckIn() {
    return req.post('/finish')
  }

  static getImageType() {
    return req.get('/images', {
      type: 'list'
    })
  }

  static getImageList(type: string) {
    return req.get('/images', { type })
  }
}

export default class Cloud {
  db: Taro.DB.Database
  constructor() {
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
    const mySetting = userData[0].setting
    const dictData = await this.db.collection('dict')
      .where({
        _id: mySetting.dictId
      })
      .get()
    const dictUpdateTime = dictData[0].updateTime
    const albumData = await this.db.collection('album')
      .where({
        _id: mySetting.albumId
      })
      .get()
    const albumUpdateTime = albumData[0].updateTime
    return { 
      ...userData[0].syncTime,
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
          id
        })
        .get()
      const resData = res.data[0]
      return resData
    } catch (e) {
      logError('网络错误', `获取${collectionName === 'dict' ? '词库' : '图库'}失败，请检查网络连接`, e)
    }
  }

  async updateMyUserData(data: { [x: string]: any }) {
    // NOT Correct 用户可能修改系统时间，后续改为云函数处理
    // Object.keys(data).forEach((key) => {
    //   if (['mark', 'progress', 'setting'].includes(key)) {
    //     data[`syncTime.${key}`] = new Date()
    //   }
    // })
    try {
      const res = await this.db.collection('user')
        .doc(store.state.user.userId)
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