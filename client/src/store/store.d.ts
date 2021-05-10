type Word = string
type Level = 0 | 1 | 2 | 3 | 4 | 5

interface WordInfo {
    definition: string
    pron: string
    audio?: string
}

interface TaskWordInfo extends WordInfo {
    word: Word
    isDone: boolean
    isCorrect: boolean
    isMastered: boolean
}

interface Dict {
    [word: string]: WordInfo
}

interface TaskWord {
    [tarkWord: string]: TaskWordInfo
}

interface WordProgress {
    [word: string]: Level
}


interface IState {
    syncFailedFlag: boolean // 数据上行失败
    localDataReady: boolean // 启动时false 确认同步后true
    user?: IUserState
    progress?: IProgressState
    resource?: IResourceState
}

interface IUserState {
    userId: string
    setting: {
        durationKeepAfterRecite: number, //单词拼写完成后停留多长时间（ms）
        tipsDuration: number, //提示弹窗的展示时长（ms）
        // howToDealWithTips: number, // 点击跳过后如何处理 1:再次拼写正确后算作熟练度+1；2:不增加熟练度
        timesToChangeBackground: number, //背多少个单词换一次背景图
        imageType: string, // 图片集类型
        transitionType: string, // 渐变方式
        amountPerDay: number
        reviewRate: number
        albumId: number
        dictId: number
    }
    mark: Word[]
    syncTime: {
        setting: string,
        progress: string,
        mark: string,
        dict: string,
        album: string
    }
}

interface IProgressState {
    progress: WordProgress,
    taskDate: Date | undefined,
    todayTask: TaskWordInfo[]
}

interface IResourceState {
    dict: Dict,
    dictInfo: {
        _id?: number,
        count?: number,
        coverImg?: string,
        desc?: string,
        fileId?: string,
        list?: string[],
        name?: string,
        updateTime?: string
    },
    album: string[],
    albumInfo: {
        _id?: number,
        desc?: number,
        list?: string[],
        name?: string,
        type?: number,
        updateTime?: string
    },
    firstBackground: string,
}