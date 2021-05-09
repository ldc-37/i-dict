// result.json 2080 cet4?
// result.js 4421 unknown
// parsed.json 4489 cet6?

const fs = require('fs')
const out = fs.createWriteStream('./new-cet4.json')
const word = require('./parsed.json')

console.log(word.length)
const output = {}
for (const item of word) {
    output[item.content] = {
        pron: item.pron,
        translation: item.definition
    }
}

// console.log(output)

out.write(JSON.stringify(output))