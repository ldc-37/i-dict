import Taro from '@tarojs/taro'

// @deprecated es6中已有repeat()可用
// 重复amount次mask
export function repeatStrGen(mask: string, amount: number): string {
  // NOTE:据说v8下用+拼接字符串效率也差不多。。
  return new Array(amount > 0 ? amount + 1 : 0).join(mask)
}

/**
 * 打乱数组，并将会改变原数组
 * @param arr 需要打乱的数组
 * @returns 打乱后的数组
 */
export function shuffle<T>(arr: Array<T>) {
  for (let i = 1; i < arr.length; i++) {
    const random = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[random]] = [arr[random], arr[i]]
  }
  return arr
}


// 通用错误记录
export const logError = (type: string, desc: string, detail: any, showModal = true) => {
  let deviceInfo: Taro.getSystemInfoSync.Result, device = ''
  try {
    deviceInfo = Taro.getSystemInfoSync()
    device = JSON.stringify(deviceInfo)
  } catch (e) {
    console.error('not support getSystemInfoSync api', e.message)
  }
  const time = new Date().toLocaleString()
  console.error(`${time}: [${type}]${desc}`, detail)
  showModal && Taro.showModal({
    title: type,
    content: desc,
    showCancel: false
  })
  // 第三方日志自动上报
  // if (typeof action !== 'object') {
  // fundebug.notify(name, action, info)
  // }
  // fundebug.notifyError(info, { name, action, device, time })
}

/**
 * [min, max]中取amount个整数，返回随机数数组
 * @param min 随机数下限（包括min）
 * @param max 随机数上限（包括max）
 * @param amount 取随机数的数量
 * @param allowRepeat 是否允许重复，默认不允许
 */
export const getRandomInt = (min: number, max: number, amount = 1, allowRepeat = false) => {
  const gap = max - min + 1
  if (typeof gap !== 'number' || isNaN(gap)) {
    throw new Error(`非法参数 min${min}max${max}`)
  }
  if (!allowRepeat && amount > gap) {
    throw new Error('区间内没有足够的整数')
  }
  if (amount === 1) {
    const result = Math.floor(Math.random() * gap) + min
    return [result]
  } else if (allowRepeat) {
    const result: Array<number> = []
    for (let i = 0; i < amount; i++) {
      result.push(Math.floor(Math.random() * gap) + min)
    }
    return result
  } else {
    const result: Set<number> = new Set()
    while (result.size < amount) {
      result.add(Math.floor(Math.random() * gap) + min)
    }
    return Array.from(result)
  }
}

export async function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function genWebUserId() {
  function getRandomString(len: number = 14) {
    const $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
    const maxPos = $chars.length
    let pwd = ''
    for (let i = 0; i < len; i++) {
      pwd += $chars.charAt(Math.floor(Math.random() * maxPos))
    }
    return pwd
  }

  const timestamp = +new Date()
  const randomStr = getRandomString()
  console.log('genWebUserId', `web_${randomStr}_${timestamp}`)
  return `web_${randomStr}_${timestamp}` // len=32
}

export async function batchUploadFileAndGetCloudID() {
  // const files = require.context('../../../../../../Downloads/food', false, /^\.\/.*$/)
  // console.log(files.keys())
  // console.log(Taro.env.USER_DATA_PATH)
  // Taro.chooseImage({
  //   success: function (res) {
  //     console.log(res)
  //     // var tempFilePaths = res.tempFilePaths // tempFilePaths 的每一项是一个本地临时文件路径
  //   }
  // })
}