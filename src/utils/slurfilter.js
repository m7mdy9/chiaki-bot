const { RegExpMatcher, TextCensor, DataSet, pattern, englishDataset, englishRecommendedTransformers } = require("obscenity")

const badWords = process.env.WORD_BLACKLIST.split(",")

const customDataset = new DataSet();

badWords.forEach(word =>{
    customDataset.addPhrase(phrase =>{
        return phrase.setMetadata({ originalWord: word })
        .addPattern(pattern`${word}`)
    })
})

const matcher = new RegExpMatcher({
  ...customDataset.build(),
  ...englishRecommendedTransformers,
});

const censorWord = (word)=>{
    if(word.length <= 2) return "**";
    const isBigWord = word.length > 4;
    const startChar = isBigWord ? word.slice(0,2) : word[0]
    const repeatTimes = isBigWord ? word.length - 3 : word.length - 2
    const endChar = word[word.length - 1]

    return startChar + "*".repeat(repeatTimes) + endChar;
}

const isSlurPresent = (inputText)=>{
    const matches = matcher.getAllMatches(inputText);
    console.log(matches)
    if(matches.length < 1){
        return {isSlur: false, censoredMatch:null};
    }
    const firstMatch = matches[0]
    const matchedWord = inputText.slice(firstMatch.startIndex, firstMatch.endIndex + 1);
    return {isSlur: true, censoredMatch: censorWord(matchedWord)}
}

module.exports = {
    isSlurPresent
}