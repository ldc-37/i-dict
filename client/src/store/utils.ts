import Taro from '@tarojs/taro'
import Api from '../api/index'

export function calcWordLevel (currentLevel: Level, isCorrect: boolean) {
    let append = 0
    switch (`${currentLevel}_${+isCorrect}`) {
        case '0_0':
        case '0_1':
        case '1_0':
        case '2_0':
        case '3_1':
        case '4_1':
            append = 1
            break
        case '3_0':
            append = 0
            break
        case '4_0':
            append = -1
            break
        case '1_1':
        case '2_1':
            append = 2
            break
        default:
            console.error('calcWordLevel', currentLevel, isCorrect)
            append = 0
    }
    return (currentLevel + append) as Level
}

export async function transFileUrl (cloudUrls: string[]) {
    const API_LIMIT = 50
    const realUrlList: string[] = []
    const asyncTasks: Promise<void>[] = []
    const getRealUrls = async (fileList: string[]) => {
        return new Promise(async (resolve) => {
            const list = await Taro.cloud.getTempFileURL({
                fileList
            })
            realUrlList.push(...list.fileList.map(v => v.tempFileURL))
            resolve()
        }) as Promise<void>
    }
    for (let i = 0; i < cloudUrls.length; i += API_LIMIT) {
        asyncTasks.push(getRealUrls(cloudUrls.slice(i, i + API_LIMIT)))
    }
    await Promise.all(asyncTasks)
    return realUrlList
}

type updateItemName = 'progress' | 'mark' | 'setting'
// 同步本地数据到云端，并设置本地同步时间为服务器时间
export async function updateToCloud(commit: any, name: updateItemName, content: any) {
    try {
      await Api.updateMyUserData({
        [name]: content,
      })
      // 防止用户调整系统时间导致同步失效，同步成功后把服务端同步时间取回
      const cloudTimeNew = await Api.getMyUserData('syncTime')
      commit('user/setSyncTime', {
        [name]: cloudTimeNew[name].toISOString()
      }, {
        root: true
      })
    } catch (e) {
      // 失败容错，更新时间设置为本地时间
      commit('user/setSyncTime', {
        [name]: new Date().toISOString()
      }, {
        root: true
      })
    }
  }