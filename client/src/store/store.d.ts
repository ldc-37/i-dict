interface WordInfo {
    definition: string
    pron: string
    audio?: string
}

interface TaskWordInfo extends WordInfo {
    isDone: boolean
    isCorrect: boolean
}

interface Dict {
    [word: string]: WordInfo
}

interface TaskWord {
    [tarkWord: string]: TaskWordInfo
}

interface WordProgress {
    [word: string]: number
}