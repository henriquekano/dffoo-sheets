import scrappedEvents from "../data/scrappedPastEvents.json";
import manualEvents from "../data/manualEvents.json";
import * as R from "ramda";
import moment from "moment";
import localCharacterList from "../data/characterList";

const _capitalizeWord = R.pipe(
  R.juxt([R.pipe(R.head, R.toUpper), R.tail]),
  R.join("")
);

const characterDffooNameToLocalNames = (characterName) => {
  const idVsCharacterList = R.pipe(
    R.invert,
    R.map(R.prop(0))
  )(localCharacterList);
  const convertNameToId = (name) => {
    const id = parseInt(idVsCharacterList[name]);
    if (isNaN(id)) {
      return null;
    }
    return id;
  };
  if (characterName === "cecil_paladin") {
    return convertNameToId("Paladin Cecil");
  }
  if (characterName === "lann&reynn") {
    return convertNameToId("Lann & Reynn");
  }
  if (characterName === "yshtola") {
    return convertNameToId("Y'shtola");
  }
  if (characterName === "cecil") {
    return convertNameToId("Dark Cecil");
  }
  if (characterName === "leonhart") {
    return convertNameToId("Leon");
  }
  return convertNameToId(
    characterName.split("_").map(_capitalizeWord).join(" ")
  );
};

const createDffoodbParser = (realm) => {
  const _realmToAccronym = (realm) => (realm === "global" ? "gl" : "jp");

  const realmAccronym = _realmToAccronym(realm);

  const _filterByRealm = R.filter(
    (event) => event.title[_realmToAccronym(realm)]
  );

  const _filterXMonthsAgo = (x) =>
    R.filter((event) => {
      const eventStartDate = moment(event.dates[realmAccronym][0]);
      return eventStartDate.isSameOrAfter(
        moment().subtract(x, "months"),
        "seconds"
      );
    });

  const _sortByEndDate = R.sortBy(
    R.path(["dates", _realmToAccronym(realm), 1])
  );

  // The scrapped events don't include end date
  // for the LC synergy end
  const _expandLostChapters = R.pipe(
    R.map((event) => {
      const lcStartDate = event.lcDates[realmAccronym];
      if (!lcStartDate) {
        return event;
      }

      const lcEvent = {
        ...event,
        title: {
          [realmAccronym]: `${event.title[realmAccronym]} LC`,
        },
        dates: {
          [realmAccronym]: [
            moment(lcStartDate).format(),
            moment(lcStartDate).add(2, "weeks").format(),
          ],
        },
      };

      return [event, lcEvent];
    }),
    R.flatten
  );

  // sboard and story, for now
  const _expandEventsWithNoEndDate = R.pipe(
    R.map((event) => {
      const startDate = event.dates[realmAccronym];
      if (!startDate) {
        return event;
      }

      const expandedEvent = {
        ...event,
        dates: {
          [realmAccronym]: [
            moment(startDate).format(),
            moment(startDate).add(2, "weeks").format(),
          ],
        },
      };

      return expandedEvent;
    }),
    R.flatten
  );

  const getEvents = () => {
    const { events, raids, sBoards, story } = scrappedEvents;
    const {
      events: manualEventsEvents,
      crystal_awakenings,
      sBoards: manualSboards,
    } = manualEvents;

    const realmFilter = _filterByRealm();
    const sorter = _sortByEndDate();
    return R.pipe(
      realmFilter,
      _filterXMonthsAgo(10),
      sorter,
      R.reverse
    )([
      ..._expandLostChapters([...events, ...manualEventsEvents]),
      ..._expandEventsWithNoEndDate(story),
      ..._expandEventsWithNoEndDate([...sBoards, ...manualSboards]),
      ...raids,
      ...crystal_awakenings,
    ]);
  };

  const organizeEventsInLanes = (events) => {
    const extractDatesByRealm = (realm) => R.path(["dates", realm]);
    const hasDateClash = (lanedEvents) => (comparedEvent) =>
      lanedEvents.reduce((acc, event) => {
        const extractDates = extractDatesByRealm(_realmToAccronym(realm));
        const eventDates = extractDates(event);
        const comparedDates = extractDates(comparedEvent);

        const comparedStartIsBetween = moment(comparedDates[0]).isBetween(
          eventDates[0],
          eventDates[1],
          "second"
        );
        const comparedEndIsBetween = moment(comparedDates[1]).isBetween(
          eventDates[0],
          eventDates[1],
          "second"
        );
        const eventsHaveTheExactSameTimeSpan =
          eventDates[0] === comparedDates[0] &&
          eventDates[1] === comparedDates[1];
        // if (comparedStartIsBetween || comparedEndIsBetween) {
        //   console.log('clash!', comparedDates, eventDates)
        // }
        return (
          acc ||
          comparedStartIsBetween ||
          comparedEndIsBetween ||
          eventsHaveTheExactSameTimeSpan
        );
      }, false);

    const lanedEvents = events.reduce((acc, event) => {
      if (acc.length === 0) {
        return [[event]];
      }

      // let's find a lane with no date clash
      let laneIndex = 0;
      let lane = acc[laneIndex];
      do {
        const chechDateClashes = hasDateClash(lane);
        if (!chechDateClashes(event)) {
          return R.set(R.lensIndex(laneIndex), [...lane, event], acc);
        }
        laneIndex += 1;
        lane = acc[laneIndex];
      } while (lane);

      // didn't found a free space in the existing lanes
      return [...acc, [event]];
    }, []);

    return lanedEvents;
  };

  const calculateEventsInPercentage = (lanedEvents) => {
    const toTimeStamp = (date) => moment(date).format("X");
    const minMaxTimestamp = R.pipe(
      R.flatten,
      R.juxt([
        R.pipe(
          R.reduce(
            R.minBy((event) =>
              toTimeStamp(event.dates[_realmToAccronym(realm)][0])
            ),
            { dates: { [_realmToAccronym(realm)]: [Infinity] } }
          ),
          R.path(["dates", _realmToAccronym(realm), 0])
        ),
        R.pipe(
          R.reduce(
            R.maxBy((event) =>
              toTimeStamp(event.dates[_realmToAccronym(realm)][1])
            ),
            { dates: { [_realmToAccronym(realm)]: [0, 0] } }
          ),
          R.tap(console.log),
          R.path(["dates", _realmToAccronym(realm), 1])
        ),
      ])
    )(lanedEvents);

    return {
      limits: minMaxTimestamp,
      data: lanedEvents,
    };
  };

  return {
    getEvents,
    organizeEventsInLanes,
    calculateEventsInPercentage,
  };
};

export { createDffoodbParser, characterDffooNameToLocalNames };
