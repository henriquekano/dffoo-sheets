import scrappedEvents from '../data/scrappedPastEvents.json'
import * as R from 'ramda'
import moment from 'moment'

const realmToAccronym = realm =>
  realm === 'global' ? 'gl' : 'jp'

const filterByRealm = (realm = 'global') => R.filter(event =>
  event.title[realmToAccronym(realm)]
)

const sortByEndDate = (realm = 'global') => R.sortBy(
  R.path(['dates', realmToAccronym(realm), 1])
)

const getEvents = (realm = 'global') => {
  const {
    events,
    raids,
  } = scrappedEvents

  const realmFilter = filterByRealm()
  const sorter = sortByEndDate()
  return R.pipe(
    realmFilter,
    sorter,
    R.reverse,
  )([
    ...events,
    ...raids,
  ])
}

const organizeEventsInLanes = (events, realm = 'global') => {
  const extractDatesByRealm = realm => R.path(['dates', realm])
  const hasDateClash = lanedEvents => comparedEvent => lanedEvents
    .reduce((acc, event) => {
      const extractDates = extractDatesByRealm(realmToAccronym(realm))
      const eventDates = extractDates(event)
      const comparedDates = extractDates(comparedEvent)

      const comparedStartIsBetween = moment(comparedDates[0]).isBetween(eventDates[0], eventDates[1], 'second')
      const comparedEndIsBetween = moment(comparedDates[1]).isBetween(eventDates[0], eventDates[1], 'second')
      // if (comparedStartIsBetween || comparedEndIsBetween) {
      //   console.log('clash!', comparedDates, eventDates)
      // }
      return acc || comparedStartIsBetween || comparedEndIsBetween
    }, false)

  const lanedEvents = events.reduce((acc, event) => {
    if (acc.length === 0) {
      return [
        [event]
      ]
    }

    // let's find a lane with no date clash
    let laneIndex = 0
    let lane = acc[laneIndex]
    do {
      const chechDateClashes = hasDateClash(lane)
      if (!chechDateClashes(event)) {
        return R.set(R.lensIndex(laneIndex), [...lane, event], acc)
      }
      laneIndex += 1
      lane = acc[laneIndex]
    } while(lane)

    // didn't found a free space in the existing lanes
    return [
      ...acc,
      [event],
    ]
  }, [])

  return lanedEvents
}

const calculateEventsInPercentage = (lanedEvents, realm = 'global') => {
  const toTimeStamp = date => moment(date).format('X')
  const minMaxTimestamp = R.pipe(
    R.flatten,
    R.juxt([
      R.pipe(
        R.reduce(
          R.minBy((event) =>
            toTimeStamp(event.dates[realmToAccronym(realm)][0])
          ),
          { dates: { [realmToAccronym(realm)]: [Infinity] } },
        ),
        R.path(['dates', realmToAccronym(realm), 0]),
      ),
      R.pipe(
        R.reduce(
          R.maxBy((event) =>
            toTimeStamp(event.dates[realmToAccronym(realm)][1])
          ),
          { dates: { [realmToAccronym(realm)]: [Infinity] } },
        ),
        R.path(['dates', realmToAccronym(realm), 1]),
      )
    ]),
  )(lanedEvents)

  return {
    limits: minMaxTimestamp,
    data: lanedEvents,
  }
}

export {
  getEvents,
  organizeEventsInLanes,
  calculateEventsInPercentage,
}
