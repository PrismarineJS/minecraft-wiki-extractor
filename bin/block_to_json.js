if (process.argv.length < 5 || process.argv.length > 7) {
  console.log('Usage : node block_to_json.js <blocks.json> <existingItems.json> <existingBlocks.json> [<wikidate>] [<mcpe|mcpe>]')
  process.exit(1)
}
const blockFilePath = process.argv[2]
const fs = require('fs')
const existingItems = JSON.parse(fs.readFileSync(process.argv[3]))
const existingBlocks = JSON.parse(fs.readFileSync(process.argv[4]))
const date = process.argv[5] ? process.argv[5] : '2015-05-07T00:00:00Z'
const mcpe = process.argv[6] ? process.argv[6] === 'mcpe' : false

const writeAllBlocks = require('./../lib/block_extractor')(existingItems, existingBlocks).writeAllBlocks

writeAllBlocks(blockFilePath, date, mcpe, function (err) {
  if (err) {
    console.log(err.stack)
    return
  }
  console.log('Blocks extracted !')
})
