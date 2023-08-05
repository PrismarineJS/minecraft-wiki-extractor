const WikiTextParser = require('parse-wikitext')

const wikiTextParser = new WikiTextParser('minecraft.gamepedia.com')
const deepFind = require('./deep_find')

module.exports = { parseDataValues }

function tableToItems (table) {
  let id = -1
  return table
    .filter(function (element) { return element !== '' && element.indexOf('{') !== -1 }) // get rid of the unrelated beginning and ending lines
    .map(function (element) {
      const r = wikiTextParser.parseTemplate(element)
      if (r === null || ['id table', 'dv table'].indexOf(r.template.toLowerCase()) === -1) {
        if (r !== null && (r.template === '-' || r.template === 'Notelist')) { return null }
        console.log(r)
        console.log('problem with parsing id table template ' + element)
        return null
      }
      return r
    })
    .filter(function (r) { return r !== null })
    .map(function (r) {
      if (!(r.simpleParts.length !== 0 && r.simpleParts[0] !== '')) {
        id++
        return null
      }
      id = 'dv' in r.namedParts ? parseInt(r.namedParts.dv) : id + 1
      return {
        id,
        displayName: ((r.simpleParts.length === 3 ? r.simpleParts[2] + ' ' : '') + r.simpleParts[0]).trim(),
        link: 'link' in r.namedParts ? r.namedParts.link : r.simpleParts[0].replace(/ \(.+?\)/g, ''),
        name: 'nameid' in r.namedParts ? r.namedParts.nameid : r.simpleParts[0].toLowerCase().replace(/ \(.+?\)/g, '').replace(/ /g, '_'),
        note: r.simpleParts.length >= 2 ? r.simpleParts[1] : undefined
      }
    })
    .filter(function (r) { return r !== null })
}

// http://minecraft.gamepedia.com/Template:ID_table
// algo : dv=256 start the counter, +1 for next items, until there's a new dv
// nameid is the name in lower case if not defined
function parseDataValues (page, date, cb) {
  wikiTextParser.getFixedArticle(page, date, function (err, data) {
    if (err) {
      cb(err)
      return
    }
    const sectionObject = wikiTextParser.pageToSectionObject(data)

    const parts = page.split('#')
    const section = parts.length > 1 ? parts[1].replace('_', ' ') : ''
    const itemsText = (parts.length > 1 ? deepFind(sectionObject, section) : sectionObject).content
    const items = tableToItems(itemsText)
    cb(null, items)
  })
}
