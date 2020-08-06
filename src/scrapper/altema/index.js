const cheerio = require('cheerio')
const R = require('ramda')

const parse = (html) => {
  const $ = cheerio.load(html)
  const trs = $('tr')
  const bannerImages = trs.has('[data-lazy-src]').map(function (_index, el) {
    const timeFrame = $(this).parent().parent().prev().text()
    const year = timeFrame.match(/\d{4}/)[0]
    const lastMonth = parseInt(timeFrame.match(/～(\d+)/)[0].replace(/\D/g, '') || -1)
    const bannerImage = $(el).find('td a [data-lazy-src]').attr('data-lazy-src')
      || $(el).find('[src^="https://img.altema.jp/dffoo/uploads"]')
        .attr('src')
    const weaponList = $(this).find('td > ul').map(function () {
      return $(this).find('li').map(function (__index, el) {
        return $(el).text()
      }).get()
    }).get()

    return {
      image: bannerImage,
      gears: R.tail(weaponList),
      year,
      quarter: lastMonth / 3,
    }
  }).get()

  return bannerImages
}

module.exports = { parse }