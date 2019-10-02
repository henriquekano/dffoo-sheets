const { parse } = require('../scrapper/dffoodb')
const fetch = require('node-fetch')
const fs = require('fs')

const fetchPageAndParse = async () => {
  const res = await fetch('https://dissidiadb.com')
  const resText = await res.text()
  const appJsEndpoint = resText.match(/\/static\/js\/app[^>]+/)

  const jsRes = await fetch(`https://dissidiadb.com${appJsEndpoint}`)
  const jsResText = await jsRes.text()
  const parsed = parse(jsResText)
  fs.writeFileSync('events.json', JSON.stringify(parsed, null, 2))
}

fetchPageAndParse()
