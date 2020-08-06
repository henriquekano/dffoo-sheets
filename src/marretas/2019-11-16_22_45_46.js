const { parse } = require('../scrapper/altema')
const fs = require('fs')
const fetch = require('node-fetch')
const tesseract = require('tesseract.js')

const fetchPageAndParse = async () => {
  const res = await fetch('https://altema.jp/dffoo/gachamemorialhall-2-7012')
  const resText = await res.text()
  const parsed = parse(resText)

  const promises = []
  parsed.forEach((banner, index) => {
    const promise = async () => {
      try {
        const imageRecognized = await tesseract.recognize(
          banner.image,
          'jpn'
        )
        console.log({ image: banner.image }, 'success!')
        parsed[index] = {
          ...banner,
          recognized: imageRecognized.text
        }
      } catch (err) {
        console.log(banner.image, err)
        parsed[index] = banner
      }
    }
    promises.push(promise())
  })
  console.log(promises)
  await Promise.all(promises)
  // parsed.map(async (banner) => {
  //   try {
  //     const imageRecognized = await tesseract.recognize(
  //       banner.image,
  //       'jpn'
  //     )
  //     console.log({ image: banner.image }, 'success!')
  //     return {
  //       ...banner,
  //       recognized: imageRecognized.text
  //     }
  //   } catch (err) {
  //     console.log(banner.image, err)
  //     return banner
  //   }
  // })
  fs.writeFileSync('banners.json', JSON.stringify(parsed, null, 2))
}

fetchPageAndParse()
