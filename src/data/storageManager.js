import {
  pipe,
  sortBy,
  keys,
  toLower,
  difference,
  propEq,
  pluck,
} from 'ramda'

const extractKeys = pipe(
  keys,
  sortBy(toLower),
)

const updateStorageData = (characterList, summonList, storage) => {
  const buildCharacterObject = ({
    index,
    character_name,
    ...summonBoardsProvided,
  }) => {
    const mergedSummonBoardInfo = summonList.reduce((acc, summon) => {
      const key = `${summon.toLowerCase()}_sb_level`
      const providedLevel = summonBoardsProvided[key]
      if (providedLevel) {
        return { ...acc, [key]: providedLevel }
      }

      return { ...acc, [key]: 0 }
    }, {})
    return {
      index,
      character_name,
      ...mergedSummonBoardInfo,
    }
  }
  const exampleEmptyCharacterObject = buildCharacterObject({
    character_name: '',
    index: 0,
  })

  let entries = storage
  const addedSummon = extractKeys(storage[0]).length <
    extractKeys(exampleEmptyCharacterObject)
  if (addedSummon) {
    entries = entries.map((entry) => {
      const entryKeys = Object.keys(entry)
      const newKeys = Object.keys(exampleEmptyCharacterObject)
      const differenceSet = difference(newKeys, entryKeys)

      const newEntry = { ...entry }
      differenceSet.forEach(newSummonKey => {
        newEntry[newSummonKey] = 0
      })

      return newEntry
    })
  }

  const addedNewCharacters = entries.length !== characterList.length
  if (addedNewCharacters) {
    const oldCharacterList = pluck('character_name', storage)
    const newCharacters = difference(
      characterList,
      oldCharacterList
    )
    entries = [
      ...entries,
      ...newCharacters.map((characterName, index) =>
        buildCharacterObject({
          index,
          character_name: characterName,
        })
      )
    ]
  }

  return entries
}

export default updateStorageData