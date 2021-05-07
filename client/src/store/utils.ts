import Taro from '@tarojs/taro'

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
    return currentLevel + append
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
