export function calcWordLevel (currentLevel: number, isCorrect: boolean) {
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
            throw new Error('calcWordLevel case invalid')
    }
    return currentLevel + append
}

