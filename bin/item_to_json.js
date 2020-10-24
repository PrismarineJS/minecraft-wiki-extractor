if (process.argv.length < 3 || process.argv.length > 5) {
  console.log('Usage : node item_to_json.js <items.json> [<wikidate>] [<mcpe|mcpe>]')
  process.exit(1)
}
var itemFilePath = process.argv[2]
var date = process.argv[3] ? process.argv[3] : '2015-05-07T00:00:00Z'
var mcpe = process.argv[4] ? process.argv[4] === 'mcpe' : false

var writeAllItems = require('./../lib/item_extractor').writeAllItems

writeAllItems(itemFilePath, date, mcpe, function (err) {
  if (err) {
    console.log(err.stack)
    return
  }
  console.log('Items extracted !')
})
