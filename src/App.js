import React, { PureComponent } from "react";
import Box from "@material-ui/core/Box";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Typography from "@material-ui/core/Typography";

import { pathOr, path, applySpec, map } from "ramda";
import banners from "./data/banners.json";
import { createDffoodbParser } from "./thirdPartyReaders/dffoodb";
import { EventsTimeline } from "./components";

const dffoodb = createDffoodbParser("global");
const jpnDdffo = createDffoodbParser("jpn");

const IS_DEV = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
const log = (...stuff) => {
  if (IS_DEV) {
    console.log(stuff);
  }
};

class App extends PureComponent {
  getFormatterEvents = () => {
    const formatToCalendar = applySpec({
      title: pathOr("ERROR", ["title", "gl"]),
      start: path(["dates", "gl", 0]),
      end: path(["dates", "gl", 1]),
      resource: path(["chara"]),
    });

    return map(formatToCalendar)(dffoodb.getEvents());
  };

  render = () => {
    const events = dffoodb.calculateEventsInPercentage(
      dffoodb.organizeEventsInLanes(dffoodb.getEvents())
    );
    const bannersLanes = jpnDdffo.calculateEventsInPercentage(
      jpnDdffo.organizeEventsInLanes(banners)
    );

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
        {/* <Box display="flex" flexDirection="row">
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
        </Box> */}
      </>
    );
  };
}

export default App;
