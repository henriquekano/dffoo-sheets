import React, { PureComponent } from 'react'
import Box from '@material-ui/core/Box'
import Card from '@material-ui/core/Card'
import Button from '@material-ui/core/Button'
import CardContent from '@material-ui/core/CardContent'
import MaterialTable from "material-table"
import 'react-big-calendar/lib/css/react-big-calendar.css'
import EmojiEvents from '@material-ui/icons/EmojiEvents'
import MonetizationOn from '@material-ui/icons/MonetizationOn'
import Typography from '@material-ui/core/Typography'
import FormGroup from '@material-ui/core/FormGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'
import {
  sortBy,
  prop,
  propEq,
  difference,
  pathOr,
  path,
  applySpec,
  map,
  intersection,
  pipe,
  length,
  equals,
  without,
  union,
  reject,
  isNil,
} from 'ramda'
import tableIcons from './icons'
import characterList from './data/characterList'
import banners from './data/banners.json'
import summonBoards from './data/summonBoards'
import {
  createDffoodbParser,
  characterDffooNameToLocalNames,
} from './thirdPartyReaders/dffoodb'
import { EventsTimeline } from './components'

const dffoodb = createDffoodbParser('global')
const jpnDdffo = createDffoodbParser('jpn')

const IS_DEV = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
const log = (...stuff) => {
  if (IS_DEV) {
    console.log(stuff)
  }
}

class SummonBoardLevel {
  constructor (fieldName, fieldValue) {
    this.level = { fieldName, fieldValue }
  }

  calculatedTreasureLevel = () =>
    this.level.fieldName === 'ifrit_sb_level'
      ? 20
      : 21

  calculatedMasterLevel = () => 56

  isTreasured = () => {
    if (this.level.fieldName === 'ifrit_sb_level') {
      return this.level.fieldValue >= 20
    }

    return this.level.fieldValue >= 21
  }

  isMastered = () =>
    this.level.fieldValue === 56
}

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
        const existingDataOnCharacter = entries.filter(propEq('character_name', characterName))[0]
        if (existingDataOnCharacter) {
          return existingDataOnCharacter
        }

        return buildCharacterObject({
          character_name: characterName,
          index,
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

  getFormatterEvents = () => {
    const formatToCalendar = applySpec({
      title: pathOr('ERROR', ['title', 'gl']),
      start: path(['dates', 'gl', 0]),
      end: path(['dates', 'gl', 1]),
      resource: path(['chara']),
    })

    return map(formatToCalendar)(dffoodb.getEvents())
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

  updateEntry = (entry) => {
    const {
      entries
    } = this.state
    const newEntries = entries.map((savedEntry) => {
      if (savedEntry.index === entry.index) {
        return {
          ...savedEntry,
          ...entry,
        }
      }
      return savedEntry
    })
    this.setState({
      entries: newEntries
    }, () => {
      this.setEntries(newEntries)
    })
  }

  addByCharacterFilter = entry => {
    log('addByCharacterFilter', entry)
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
    log('removeByCharacterFilter', entry)
    this.setState((prevState) => ({
      filters: {
        byCharacter: prevState.filters.byCharacter.filter(index =>
          !(index === entry.index)
        ),
      }
    }))
  }

  clearByCharacterFilter = () => {
    this.setState({
      filters: {
        byCharacter: [],
      }
    })
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

  handleEventClick = (event) => {
    const {
      filters: {
        byCharacter: characterFilter,
      },
    } = this.state
    const { chara, glChara } = event

    const convertedEventCharaterNames = map(
      characterDffooNameToLocalNames,
      glChara || chara,
    )
    log('convertedEventCharaterNames', convertedEventCharaterNames)
    const hasAllTheEventsCharacters = pipe(
      intersection(convertedEventCharaterNames),
      length,
      equals(chara.length),
    )

    let newCharacterFilter = []
    if (hasAllTheEventsCharacters(characterFilter)) {
      newCharacterFilter = without(convertedEventCharaterNames, characterFilter)
    } else {
      newCharacterFilter = union(convertedEventCharaterNames, characterFilter)
    }
    newCharacterFilter = reject(isNil, newCharacterFilter)
    log('newCharacterFilter', newCharacterFilter)

    this.setState({
      filters: {
        byCharacter: newCharacterFilter,
      },
    })
  }

  handleLevelClick = ({
    entryId,
    fieldName,
    fieldValue,
  }) => {
    const sbCalculator = new SummonBoardLevel(fieldName, fieldValue)
    let newFieldValue = 0
    if (!sbCalculator.isTreasured()) {
      newFieldValue = sbCalculator.calculatedTreasureLevel()
    }
    if (sbCalculator.isTreasured() && !sbCalculator.isMastered()) {
      newFieldValue = sbCalculator.calculatedMasterLevel()
    }
    if (sbCalculator.isMastered()) {
      newFieldValue = 0
    }
    this.updateEntry({
      index: entryId,
      [fieldName]: newFieldValue,
    })
  }

  renderCharacterFilter = () => {
    const {
      filters: {
        byCharacter: characterFilter,
      },
    } = this.state
    const sortedEntries = sortBy(prop('character_name'))(this.state.entries)
    const isEntryChecked = entry => {
      const entryId = entry.index
      return characterFilter.includes(entryId)
    }
    return (
      <Card>
        <CardContent>
          <Typography variant="h5" component="h1">
            Character Name
          </Typography>
          <Button
            onClick={this.clearByCharacterFilter}
            variant="contained"
            style={{
              backgroundColor: 'white',
            }}
          >
            Clear
          </Button>
          <FormGroup row style={{ maxHeight: 400, overflow: 'scroll' }}>
            {
              sortedEntries.map(entry => (
                <FormControlLabel
                  style={{ maxWidth: '100%', minWidth: '24%' }}
                  key={entry.character_name}
                  control={
                    <Checkbox
                      value={entry.index}
                      checked={isEntryChecked(entry)}
                      color="primary"
                      onChange={(event, checked) => {
                        log(event, checked)
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
    )
  }

  renderCustomCell = (props) => {
    const {
      rowData: {
        index,
      },
      columnDef: {
        field,
      },
      value,
    } = props
    const cellValue = props.rowData[props.columnDef.field]
    const sbCalculator = new SummonBoardLevel(props.columnDef.field, cellValue)
    let boardStatusColor = {}
    if (sbCalculator.isTreasured()) {
      boardStatusColor = { backgroundColor: 'lightblue' }
    }
    if (sbCalculator.isMastered()) {
      boardStatusColor = { backgroundColor: '#ffcc00' }
    }
    return (
      <td
        style={{
          ...props.columnDef.cellStyle,
          border: '1px solid white',
          ...boardStatusColor,
        }}
      >
        <Box display="flex" style={{
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {
            props.columnDef.editable === 'never'
              ? cellValue
              : (
                <Button
                  onClick={() => this.handleLevelClick({
                    entryId: index,
                    fieldName: field,
                    fieldValue: value,
                  })}
                  variant="outlined"
                  style={{
                    backgroundColor: 'white',
                  }}
                >
                  { cellValue }
                </Button>
              )
          }
        </Box>
      </td>
    )
  }

  render = () => {
    const entriesToRender = this.filterEntries()
    log(entriesToRender)
    const summonBoardColumns = summonBoards.map((summonName) =>
      ({
        title: `${summonName}`,
        field: `${summonName.toLowerCase()}_sb_level`,
        type: 'numeric',
        cellStyle: { color: '#ffffff', fontSize: 16 },
        customSort: (first, second) => (first[`${summonName.toLowerCase()}_sb_level`] || 0) - (second[`${summonName.toLowerCase()}_sb_level`] || 0)
      })
    )
    log('render', this.state)

    const events = dffoodb.calculateEventsInPercentage(
      dffoodb.organizeEventsInLanes(
        dffoodb.getEvents()
      )
    )
    const bannersLanes = jpnDdffo.calculateEventsInPercentage(
      jpnDdffo.organizeEventsInLanes(
        banners
      )
    )

    return (
      <>
        <Card>
          <CardContent>
            <Typography variant="h5" component="h1">
              Banners history
            </Typography>
            <Box style={{ padding: 10 }}>
              <EventsTimeline
                lanes={bannersLanes.data}
                limits={bannersLanes.limits}
                onClickEvent={() => null}
              />
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h5" component="h1">
              Events history
            </Typography>
            <Box style={{ padding: 10 }}>
              <EventsTimeline
                lanes={events.data}
                limits={events.limits}
                onClickEvent={this.handleEventClick}
              />
            </Box>
          </CardContent>
        </Card>
        <Box display="flex" flexDirection="row">
          <Box flex={1} display="flex">
            <Box flexGrow={0} display="flex" flexDirection="column">
              { this.renderCharacterFilter() }
            </Box>
          </Box>

          <Box flex={1} display="flex">
            <MaterialTable
              title="Summon Boards"
              icons={tableIcons}
              data={entriesToRender}
              // style={{ flex: 0 }}
              actions={[
                {
                  icon: MonetizationOn,
                  tooltip: 'Treasures',
                  onClick: (event, rowData) => {
                    this.addEntryToStorage({
                      index: rowData.index,
                      character_name: rowData.character_name,
                      ifrit_sb_level: 20,
                      shiva_sb_level: 21,
                      ramuh_sb_level: 21,
                    }, () => null)
                  },
                },
                {
                  icon: EmojiEvents,
                  tooltip: 'Mastered',
                  onClick: (event, rowData) => {
                    this.addEntryToStorage({
                      index: rowData.index,
                      character_name: rowData.character_name,
                      ifrit_sb_level: 56,
                      shiva_sb_level: 56,
                      ramuh_sb_level: 56,
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
              components={{
                Cell: this.renderCustomCell,
              }}
              options={{
                paging: true,
                pageSize: 20,
                paginationType: 'stepped',
                headerStyle: {
                  backgroundColor: '#044343',
                  color: '#FFF',
                  fontWeight: 'bold',
                  fontSize: 20,
                  border: '1px solid white',
                },
                actionsCellStyle: {
                  color: 'white',
                },
                rowStyle: {
                  backgroundColor: '#045757',
                  color: '#fff',
                },
              }}
            />
          </Box>
        </Box>
      </>
    )
  }
}

export default App
