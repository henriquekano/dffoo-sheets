import React, { PureComponent } from 'react'
import MaterialTable from "material-table"
import EmojiEvents from '@material-ui/icons/EmojiEvents'
import tableIcons from './icons'
import characterList from './characterList'
import Typography from '@material-ui/core/Typography'
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import {
  sortBy,
  prop,
} from 'ramda'

class App extends PureComponent {
  constructor (props) {
    super(props)
    let entries = this.getEntries()
    if (!entries) {
      entries = characterList.map((characterName, index) => ({
        index,
        character_name: characterName,
        ifrit_sb_level: 0,
        shiva_sb_level: 0,
      }))
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
    console.log('render', this.state, this.filterEntries())
    const {
      entries,
    } = this.state
    return (
      <div style={{ flex: 1 }}>
        <ExpansionPanel>
          <ExpansionPanelSummary
            expandIcon={<ExpandMoreIcon />}
          >
            <Typography variant="h5" component="h1">
              Character Name
            </Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <FormGroup row>
              {
                sortBy(prop('character_name'))(entries).map(entry => (
                  <FormControlLabel
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
          </ExpansionPanelDetails>
        </ExpansionPanel>

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
            { title: "Character", field: "character_name", editable: 'never' },
            { title: "Ifrit SB Level", field: 'ifrit_sb_level', type: 'numeric' },
            { title: "Shiva SB Level", field: 'shiva_sb_level', type: 'numeric' },
          ]}
          data={this.filterEntries()}
          title="Summon Boards"
          options={{
            headerStyle: {
              backgroundColor: '#044343',
              color: '#FFF'
            },
            rowStyle: {
              backgroundColor: '#045757',
            },
          }}
        />
      </div>
    )
  }
}

export default App
