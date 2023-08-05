const WikiTextParser = require('parse-wikitext')
const async = require('async')
const fs = require('fs')

const wikiTextParser = new WikiTextParser('minecraft.gamepedia.com')
const idTableParser = require('./common/id_table_template_parser.js')
const DvtParser = require('./common/dvt_template_parser.js')

const dvtParser = new DvtParser(wikiTextParser)
const infoboxFieldParser = require('./common/infobox_field_parser.js')
const deepFind = require('./common/deep_find')

module.exports = {
  itemInfobox,
  writeAllItems
}

function writeAllItems (file, date, mcpe, cb) {
  async.waterfall([
    function (cb) { idTableParser.parseDataValues(mcpe ? 'Pocket_Edition_data_values#Item_IDs' : 'Data_values/Item_IDs', date, cb) },
    // function(items,cb){console.log(JSON.stringify(items,null,2));cb(null,items);}
    function (items, cb) { itemsToFullItems(items, date, cb) }
  ],
  function (err, fullItems) {
    if (err) { return cb(err) }
    fs.writeFile(file, JSON.stringify(fullItems, null, 2), cb)
  }
  )
}

// http://minecraft.gamepedia.com/Template:Item
function itemInfobox (page, date, cb) {
  wikiTextParser.getFixedArticle(page, date, function (err, data) {
    if (err) {
      cb(err)
      return
    }
    const sectionObject = wikiTextParser.pageToSectionObject(data)

    cb(null, parseItemInfobox(page, sectionObject.content))
  })
}

function parseItemInfobox (page, content) {
  if (content.length > 0 && content[0].toLowerCase() === '') content.shift()
  if (content.length > 0 && content[0].toLowerCase() === '{{snapshot}}') content.shift()
  if (content.length > 0 && content[0].toLowerCase() === '{{stub}}') content.shift()
  if (content.length > 0 && content[0].toLowerCase() === '{{cleanup}}') content.shift()
  if (content.length > 0 && content[0].toLowerCase() === '') content.shift()
  const infoBox = wikiTextParser.parseInfoBox(content)
  const values = infoBox.values
  if (!values.stackable) { console.log('no stackable', page, values) }

  return {
    id: parseInt(values.data),
    displayName: page,
    stackSize: infoboxFieldParser.parseStackable(values.stackable),
    name: page.toLowerCase()
  }
}

function itemsToFullItems (items, date, cb) {
  async.map(items, function (item, cb) {
    async.waterfall([
      function (cb) {
        wikiTextParser.getFixedArticle(item.link === 'Dye' ? 'Ink Sac' : item.link, date, function (err, pageData, title) {
          if (err) {
            cb(err)
            return
          }
          const sectionObject = wikiTextParser.pageToSectionObject(pageData)
          cb(err, sectionObject, title)
        })
      },
      function (sectionObject, title, cb) {
        dvtParser.getVariations(title, item.id, sectionObject, date, function (err, vara) {
          cb(err, sectionObject, vara)
        })
      },
      function (sectionObject, vara, cb) {
        const parts = item.link.split('#')

        const data = parseItemInfobox(item.link, (parts.length > 1 ? deepFind(sectionObject, parts[1]) : sectionObject).content)

        cb(null, {
          id: item.id,
          displayName: item.displayName,
          stackSize: data !== null && 'stackSize' in data ? (data.stackSize === null ? 0 : data.stackSize) : 0,
          name: item.name,
          variations: vara !== null ? vara : undefined
        })
      }
    ], cb)
  }, cb)
}
