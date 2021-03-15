const fs = require('fs')
const path = require('path')
const WikiTextParser = require('parse-wikitext')
const wikiTextParser = new WikiTextParser('minecraft.gamepedia.com')
const LuaVM = require('lua.vm.js')
const toJSON = fs.readFileSync(path.join(__dirname, '../lib/common/toJSON2.lua'), 'utf8')
const mcData = require('minecraft-data')('1.16.4')
const fuzzysort = require('fuzzysort')

wikiTextParser.getArticle('Module:InvSprite#the-code', function (err, lua) {
  if (err) {
    console.log(err)
    return
  }
  lua = lua.replace('return', 'aliases = ')
  lua = lua.split('\n').filter(line => !line.includes('require')).join('\n')
  lua += '\n' + toJSON
  // console.log(lua)

  const l = new LuaVM.Lua.State()
  const json = JSON.parse(l.execute(lua).toString())

  console.log(JSON.stringify(json.settings, null, 2))
  const size = parseInt(json.settings.size)
  const sheetWidth = parseInt(json.settings.sheetsize)
  const tiles = Math.floor(sheetWidth / size)
  const scale = 1

  const ids = {}
  for (const item of mcData.itemsArray) {
    let found = fuzzysort.go(item.displayName, Object.entries(json.ids).map(([k, v]) => ({ name: k, ...v })), { key: 'name' })[0]

    if (!found) console.log(`[Warning] ${item.name} not found`)
    else {
      found = found.obj
      const pos = found.pos - 1
      found.x = pos % tiles * size * scale
      found.y = Math.floor(pos / tiles) * size * scale
      delete found.section
      delete found.pos
    }

    ids[item.name] = found
  }
  fs.writeFileSync('invsprite.json', JSON.stringify(ids, null, 2))
})
