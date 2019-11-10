import React, { useEffect, useState } from 'react'
import Box from '@material-ui/core/Box'
import Typography from '@material-ui/core/Typography'
import Tooltip from '@material-ui/core/Tooltip'
import Button from '@material-ui/core/Button'
import moment from 'moment'
import * as R from 'ramda'

function useForceUpdate(){
  const [, set] = useState(true); //boolean state
  return () => set(value => !value); // toggle the state to force render
}


function* getRandomColor() {
  const goodColors = [
    'rgb(222, 192, 41)',
    'rgb(161, 207, 243)',
    'rgb(140, 214, 2)',
    'rgb(247, 26, 156)',
    'rgb(33, 208, 138)',
  ]

  let colorIndex = 0
  while (true) {
    const color = goodColors[colorIndex]
    yield color
    colorIndex = (colorIndex + 1) % goodColors.length
  }
}

const toTimestamp = date =>
  parseInt(date.format('X'))

const DateIndicator = React.memo(({ date, style, color }) => (
  <Box
    display="flex"
    style={{
      flexDirection: 'column',
      height: '100%',
      alignItems: 'flex-start',
      ...style,
    }}
  >
    <Box style={{ height: 20 }}>
      <Typography style={{ color: color || 'black' }}>
        { date }
      </Typography>
    </Box>
    <Box style={{ borderRight: `1px solid ${color || 'black'}`, height: '100%', width: 0 }} />
  </Box>
))

const DateOverlay = React.memo(({
  limits,
  width,
}) => {
  const forceUpdate = useForceUpdate()
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate()
    }, 1000000)

    return () => clearInterval(interval)
  })
  const [dateStartString, dateEndString] = limits
  const dateStart = moment(dateStartString)
  const dateEnd = moment(dateEndString)

  const daysDifference = dateEnd.diff(dateStart, 'days')
  let daysInterval = daysDifference
  let divisor = 2
  while (daysInterval > 7) {
    daysInterval = daysDifference / divisor
    divisor += 1
  }

  let timeSeparators = []
  let date = moment(dateEnd)
  while (!date.isBefore(dateStart)) {
    const formattedDate = date.format('YY/MMM/DD')
    const leftSpacing = (toTimestamp(dateEnd) - toTimestamp(date)) * width / (toTimestamp(dateEnd) - toTimestamp(dateStart))
    timeSeparators = [
      ...timeSeparators,
      <DateIndicator
        key={formattedDate}
        date={formattedDate}
        style={{
          position: 'absolute',
          left: leftSpacing,
          top: 0,
        }}
      />,
    ]
    date = date.subtract(daysInterval, 'days')
  }

  const formattedDate = moment().format('YY/MMM/DD')
  const leftSpacing = (toTimestamp(dateEnd) - toTimestamp(moment())) * width
    / (toTimestamp(dateEnd) - toTimestamp(dateStart))
  timeSeparators = [
    ...timeSeparators,
    <DateIndicator
      key={formattedDate}
      color="red"
      style={{
        position: 'absolute',
        left: leftSpacing,
        top: 0,
      }}
    />,
  ]

  return timeSeparators
})

const formatCharacterName = R.pipe(
  R.split('_'),
  R.map(
    R.pipe(
      R.juxt([
        R.head,
        R.tail,
      ]),
      R.over(R.lensIndex(0), R.toUpper),
      R.join(''),
    )
  ),
  R.join(' '),
)


const Lane = React.memo(({ onClickEvent, lane, limits, width }) => {
  const [dateStartString, dateEndString] = limits

  const dateStart = moment(dateStartString)
  const dateEnd = moment(dateEndString)

  const randomColorGenerator = getRandomColor()

  let bars = []
  for (let event of lane) {
    const eventTitle = event.title.gl
    const [eventStartDateString, eventEndDateString] = event.dates.gl
    const eventStartDate = moment(eventStartDateString)
    const eventEndDate = moment(eventEndDateString)

    const barWidth = (toTimestamp(eventEndDate) - toTimestamp(eventStartDate)) * width
      / (toTimestamp(dateEnd) - toTimestamp(dateStart))
    const leftSpacing = (toTimestamp(dateEnd) - toTimestamp(eventEndDate)) * width
      / (toTimestamp(dateEnd) - toTimestamp(dateStart))

    const [eventDateStart, eventDateEnd] = event.dates.gl
    const dateTooltip = moment(eventDateStart).format('YY/MMM/DD HH:mm')
      + ' ~ ' + moment(eventDateEnd).format('YY/MMM/DD HH:mm')
    const charactersTooltips = R.pipe(
      R.map(formatCharacterName),
    )(event.glChara || event.chara)

    bars = [
      ...bars,
      <Tooltip
        key={eventTitle}
        title={
          <>
            {
              <Typography>
                { dateTooltip }
              </Typography>
            }
            {
              charactersTooltips.map(tooltip => (
                <Typography key={tooltip}>
                  { tooltip }
                </Typography>
              ))
            }
          </>
        }
        placement="bottom"
      >
        <Button
          variant="contained"
          key={eventTitle}
          style={{
            position: 'absolute',
            backgroundColor: randomColorGenerator.next().value,
            minHeight: 30,
            width: barWidth,
            left: leftSpacing,
            top: 0,
            padding: 0,
          }}
          onClick={() => onClickEvent(event)}
        >
          { eventTitle }
        </Button>
      </Tooltip>
    ]
  }

  return (
    <Box style={{ position: 'relative', minHeight: 60, marginTop: 20, marginBottom: 10 }}>
      { bars }
    </Box>
  )
})

const EventsTimeline = React.memo(({
  limits,
  lanes,
  onClickEvent,
}) => {
  return (
    <Box
      display="flex"
      style={{ overflowX: 'auto', position: 'relative' }}
    >
      <DateOverlay width={2000} limits={limits}/>
      <Box display="flex" style={{ flexDirection: 'column', paddingTop: 20, overflowY: 'clip' }}>
        {
          lanes.map(lane => (
            <Lane
              key={JSON.stringify(lane[0])}
              lane={lane}
              width={2000}
              limits={limits}
              onClickEvent={onClickEvent}
            />
          ))
        }
      </Box>
    </Box>
  )
})

export default EventsTimeline
