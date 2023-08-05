const WikiTextParser = require('parse-wikitext')
const wikiTextParser = new WikiTextParser('minecraft.gamepedia.com')
const fs = require('fs')

module.exports = {
  getEntchantments,
  writeAllEnchantments
}

function getEntchantments (date, cb) {
  wikiTextParser.getFixedArticle('Enchanting/ID', date, function (err, data) {
    if (err) {
      cb(err)
      return
    }
    const content = wikiTextParser.pageToSectionObject(data).content
    const entchantments = content
      .join('')
      .replace('| data-sort-value="unbreaking"', '')
      .split('|-')
      .filter(function (line) {
        return line.startsWith('| ')
      })
      .map(function (line) {
        const values = line.split('|')
        return {
          id: Number(values[3].trim()),
          name: values[2].replace(/^.*?<code>(.+?)<\/code>.*$/g, '$1').trim(),
          displayName: values[1].trim()
        }
      })
    cb(null, entchantments)
  })
}

function writeAllEnchantments (file, date, cb) {
  getEntchantments(date, function (err, enchantments) {
    if (err) {
      cb(err)
      return
    }
    fs.writeFile(file, JSON.stringify(enchantments, null, 2), cb)
  })
}
