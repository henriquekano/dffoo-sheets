import React, { PureComponent } from 'react'
import Box from '@material-ui/core/Box'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import MaterialTable from "material-table"
import EmojiEvents from '@material-ui/icons/EmojiEvents'
import Typography from '@material-ui/core/Typography'
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import {
  sortBy,
  prop,
  propEq,
  difference,
} from 'ramda'
import tableIcons from './icons'
import characterList from './data/characterList'
import summonBoards from './data/summonBoards'

const buildCharacterObject = ({
  index,
  character_name,
  ...summonBoardsProvided,
}) => {
  const mergedSummonBoardInfo = summonBoards.reduce((acc, summon) => {
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

class App extends PureComponent {
  constructor (props) {
    super(props)
    let entries = this.getEntries()
    const firstAccess = !entries
    if (firstAccess) {
      entries = characterList.map((characterName, index) =>
        buildCharacterObject({
          character_name: characterName,
          index,
        })
      )
      this.setEntries(entries)
    }

    const addedSummon = Object.keys(entries[0]).length <
      Object.keys(
        buildCharacterObject({ character_name: '', index: 0 })
      ).length
    if (addedSummon) {
      entries = entries.map((entry) => {
        const entryKeys = Object.keys(entry)
        const newKeys = Object.keys(
          buildCharacterObject({ character_name: '', index: 0 })
        )
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
      entries = characterList.map((characterName, index) => {
        const existingDataOnCharacter = entries.filter(propEq('character_name', characterName))
        if (existingDataOnCharacter) {
          return existingDataOnCharacter
        }

        return ({
          index,
          character_name: characterName,
          ifrit_sb_level: 0,
          shiva_sb_level: 0,
        })
      })
      this.setEntries(entries)
    }

    this.state = {
      entries,
      filters: {
        byCharacter: [],
      },
    }
  }

  getEntries = () => {
    try {
      return JSON.parse(localStorage.getItem('entries'))
    } catch (err) {
      return null
    }
  }

  setEntries = entries => {
    localStorage.setItem('entries', JSON.stringify(entries))
  }

  addEntryToStorage = (entry, callback) => {
    const {
      entries
    } = this.state
    const newEntries = entries.map((savedEntry) => {
      if (savedEntry.index === entry.index) {
        return entry
      }
      return savedEntry
    })
    this.setState({
      entries: newEntries
    }, () => {
      this.setEntries(newEntries)
      callback()
    })
  }

  addByCharacterFilter = entry => {
    console.log('addByCharacterFilter', entry)
    this.setState((prevState) => ({
      filters: {
        byCharacter: [
          ...prevState.filters.byCharacter,
          entry.index,
        ],
      }
    }))
  }

  removeByCharacterFilter = entry => {
    console.log('removeByCharacterFilter', entry)
    this.setState((prevState) => ({
      filters: {
        byCharacter: prevState.filters.byCharacter.filter(index =>
          !(index === entry.index)
        ),
      }
    }))
  }

  filterEntries = () => {
    const {
      entries,
      filters: {
        byCharacter,
      },
    } = this.state

    const hasCharacterFilter = byCharacter.length > 0
    if (hasCharacterFilter) {
      return entries.filter(entry => byCharacter.includes(entry.index))
    }

    return entries
  }

  render = () => {
    const {
      entries,
    } = this.state

    const summonBoardColumns = summonBoards.map((summonName) =>
      ({
        title: `${summonName} SB lvl`,
        field: `${summonName.toLowerCase()}_sb_level`,
        type: 'numeric',
        cellStyle: { color: '#ffffff', fontSize: 16 },
      })
    )
    console.log('render', this.state)
    return (
      <Box display="flex" flexDirection="row">
        <Box flex={1} display="flex">
          <Box flexGrow={0} display="flex" flexDirection="column">
            <Card>
              <CardContent>
                <Typography variant="h5" component="h1">
                  Character Name
                </Typography>
                <FormGroup row style={{ maxHeight: 400, overflow: 'scroll' }}>
                  {
                    sortBy(prop('character_name'))(entries).map(entry => (
                      <FormControlLabel
                        style={{ maxWidth: '100%', minWidth: '24%' }}
                        key={entry.character_name}
                        control={
                          <Checkbox
                            value={entry.index}
                            color="primary"
                            onChange={(event, checked) => {
                              console.log(event, checked)
                              if (checked) {
                                this.addByCharacterFilter(entry)
                              } else {
                                this.removeByCharacterFilter(entry)
                              }
                            }}
                          />
                        }
                        label={entry.character_name}
                      />
                    ))
                  }
                </FormGroup>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Box flex={1} display="flex">
          <MaterialTable
            icons={tableIcons}
            actions={[
              {
                icon: EmojiEvents,
                tooltip: 'Mastered',
                onClick: (event, rowData) => {
                  this.addEntryToStorage({
                    index: rowData.index,
                    character_name: rowData.character_name,
                    ifrit_sb_level: 56,
                    shiva_sb_level: 56,
                  }, () => null)
                },
              },
            ]}
            editable={{
              onRowUpdate: newData =>
                new Promise((resolve, reject) => {
                  this.addEntryToStorage(newData, resolve)
                })
            }}
            columns={[
              { title: "Character", field: "character_name", editable: 'never', cellStyle: { color: '#ffffff', fontSize: 16 } },
              ...summonBoardColumns,
            ]}

            data={this.filterEntries()}
            title="Summon Boards"
            options={{
              paging: false,
              headerStyle: {
                backgroundColor: '#044343',
                color: '#FFF',
                fontWeight: 'bold',
                fontSize: 20,
              },
              rowStyle: {
                backgroundColor: '#045757',
                color: '#fff',
              },
            }}
          />
        </Box>
      </Box>
    )
  }
}

export default App
