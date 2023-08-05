const WikiTextParser = require('parse-wikitext')
const async = require('async')
const fs = require('fs')
const wikiTextParser = new WikiTextParser('minecraft.gamepedia.com')
const idTableParser = require('./common/id_table_template_parser.js')
const infoboxFieldParser = require('./common/infobox_field_parser.js')
const DvtParser = require('./common/dvt_template_parser.js')

// this means : you may need to run this script two times
let nameIndex

const dvtParser = new DvtParser(wikiTextParser)

module.exports = imp

function imp (existingItems, existingBlocks) {
  items = existingItems
  itemsByName = items.reduce(function (acc, item) {
    acc[item.name] = item.id
    return acc
  }, {})
  nameIndex = require('./common/find_item_object_by_name.js')(existingItems, existingBlocks)

  return {
    blockInfobox,
    writeAllBlocks
  }
}

// values on infobox present on other pages :
// http://minecraft.gamepedia.com/index.php?title=Module:Blast_resistance_values&action=edit

// breaking times : http://minecraft.gamepedia.com/Template:Breaking_row
// http://minecraft.gamepedia.com/Module:Breaking_row : not useful

// http://minecraft.gamepedia.com/Breaking : useful to get the breaking times (materials.json)
// and the harvestTools field (and the material field)
// check http://minecraft.gamepedia.com/Breaking#Speed vs
// https://github.com/andrewrk/mineflayer/blob/master/lib/plugins/digging.js#L88
// materials.json has redundancies

let items
let itemsByName

function writeAllBlocks (file, date, mcpe, cb) {
  async.waterfall([
    function (cb) { idTableParser.parseDataValues(mcpe ? 'Pocket_Edition_data_values#Block_IDs' : 'Data_values/Block_IDs', date, cb) },
    function (blocks, cb) { addHardness(blocks, date, cb) },
    function (blocks, cb) { addMaterial(blocks, date, cb) },
    // function(blocks,cb){console.log(blocks);cb(null,blocks);},
    // function(blocks,cb){cb(null,blocks.slice(0,10))},
    function (blocks, cb) { blocksToFullBlocks(blocks, date, cb) }
  ]
  , function (err, fullBlocks) {
    if (err) { return cb(err) }
    fs.writeFile(file, JSON.stringify(fullBlocks, null, 2), cb)
  }
  )
}

const wikitypeToBoundingBox = {
  'solid block': 'block',
  'non-solid block': 'empty',
  plant: 'empty',
  fluid: 'empty',
  'non-solid': 'empty',
  technical: 'block',
  solid: 'block',
  'ingredient<br>block': 'block',
  'nonsolid block': 'empty',
  'block entity': 'block',
  item: 'empty',
  foodstuff: 'empty',
  'tile entity': 'block',
  tool: 'empty',
  food: 'empty',
  'semi-solid': 'block',
  'light-emitting block': 'block',
  plants: 'empty',
  block: 'block',
  'non-solid; plant': 'empty',
  'wearable items; solid block': 'block',
  'solid, plants': 'block',
  'non-solid; plants': 'empty'
}

// http://minecraft.gamepedia.com/Template:Block
function blockInfobox (page, date, cb) {
  wikiTextParser.getFixedArticle(page, date, function (err, data) {
    if (err) {
      cb(err)
      return
    }
    const sectionObject = wikiTextParser.pageToSectionObject(data)
    cb(null, parseBlockInfobox(page, sectionObject.content))
  })
}

function parseDrops (text) {
  if (text.toLowerCase() === 'nothing' || text.toLowerCase() === 'none' || text.toLowerCase() === 'n/a' || text.toLowerCase() === 'no') { return [] }
  if (text.indexOf('{') === -1) { return [{ drop: nameIndex.nameToId(replaceName(text.trim())) }] }
  const templates = text.split('}}{{Drop').join('}};{{Drop').split(';')
  return templates
    .map(wikiTextParser.parseTemplate)
    .filter(function (template) {
      return template.template.toLowerCase() === 'drop'
    })
    .map(function (data) {
      const type = data.simpleParts[0]
      const id = nameIndex.nameToId(replaceName(data.simpleParts[1]) + ' (' + type + ')')
      const min = data.simpleParts[2].indexOf('%') !== -1
        ? parseFloat(data.simpleParts[2].replace('%', '')) / 100
        : parseInt(data.simpleParts[2])
      const max = data.simpleParts.length > 3
        ? parseInt(data.simpleParts[3])
        : undefined
      return {
        drop: id,
        minCount: min === 1 ? undefined : min,
        maxCount: max
      }
    })
}

const rn = {
  Mushroom: 'Red Mushroom',
  Flowers: 'Dandelion',
  Slab: 'Stone Slab',
  Stairs: 'Oak Wood Stairs',
  Door: 'Oak Door',
  'Pressure Plate': 'Stone Pressure Plate',
  'Redstone Torch': 'Redstone Torch (inactive)',
  Button: 'Stone Button',
  'Redstone Lamp': 'Redstone Lamp (inactive)',
  'String#Tripwire': 'String',
  'Weighted Pressure Plate': 'Weighted Pressure Plate (Light)'
}

function replaceName (name) {
  if (name in rn) { return rn[name] } else return name
}

function parseBlockInfobox (page, content) {
  const infoBox = wikiTextParser.parseInfoBox(content)
  const values = infoBox.values

  if (values.type && !(values.type.trim().toLowerCase() in wikitypeToBoundingBox)) { console.log(page + ' : ' + values.type) }

  if (!('stackable' in values)) values.stackable = 'N/A'

  const stackSize = infoboxFieldParser.parseStackable(values.stackable)
  if (stackSize === null) {
    console.log("can't parse stackable of " + page)
    console.log(values)
  }
  let p
  if (!('drops' in values) || values.drops.toLowerCase() === 'itself') { p = 'Itself' } else {
    let drops = values.drops
    if (page.indexOf('Slab') !== -1) { drops = 'Slab' }
    if (page === 'Monster Egg' || page.startsWith('Technical blocks')) { drops = 'Nothing' }
    p = parseDrops(drops)
    // if("drops" in values && drops!=="None") console.log(page+" ;;;; "+drops);
    // console.log(page+" ;;;; "+p);
    p.forEach(function (p1) {
      if (!('drop' in p1) || (typeof p1.drop === 'undefined')) {
        console.log('PB with ' + drops)
        console.log(p1)
        console.log(values)
      }
    })
  }

  let transparent = false
  let filterLight = 15
  if (values.transparent && values.transparent.toLowerCase() !== 'no') {
    transparent = true
    const t = values.transparent.toLowerCase()
    if (values.transparent.toLowerCase() === 'yes') { filterLight = 0 } else if (t === 'partial <small>(blocks light)</small>') { filterLight = 15 } else if (t === 'partial <small>(-2 to light)</small>') { filterLight = 2 } else if (t === 'partial <small>(diffuses sky light)</small>') { filterLight = 0 } else if (t === "partial <small>(doesn't block light)</small>") { filterLight = 0 } else if (t === 'partial <sub>(when active)</sub>') { filterLight = 0 } else if (t === 'opaque, but lets light pass through') { filterLight = 0 } else {
      filterLight = 0
      // console.log(page, values);
    }
  }

  let emitLight = 0
  if (values.light && values.light.toLowerCase() !== 'no') {
    const n = parseInt(values.light.split(',')[1])
    if (!isNaN(n) && n !== null) {
      emitLight = n
    }
  }

  return {
    id: parseInt(values.data),
    name: page.toLowerCase(),
    displayName: page,
    stackSize,
    // see http://minecraft.gamepedia.com/Breaking and http://minecraft.gamepedia.com/Module:Breaking_row (unbreakable)
    liquid: values.type && values.type.trim().toLowerCase() === 'fluid',
    tool: 'tool' in values ? values.tool : null,
    tool2: 'tool2' in values ? values.tool2 : null,
    harvestTools: toolToHarvestTools(values.tool, page === 'Cobweb'),
    harvestTools2: toolToHarvestTools(values.tool2, page === 'Cobweb'),
    boundingBox: values.type && values.type.trim().toLowerCase() in
    wikitypeToBoundingBox
      ? wikitypeToBoundingBox[values.type.trim().toLowerCase()]
      : 'block',
    drops: p,
    transparent,
    emitLight,
    filterLight
  }
}

// see http://minecraft.gamepedia.com/Module:Breaking_row materialGrade
const toolMaterials = ['wooden', 'golden', 'stone', 'iron', 'diamond']

function toolToHarvestTools (tool, cobweb) {
  if (tool === undefined) { return undefined }
  tool = tool.toLowerCase().trim()
  // not sure what to do about bucket (is it digging ?)
  if (['any', 'n/a', 'all', 'none', 'bucket'].indexOf(tool) !== -1) {
    return undefined
  }
  // : not required tools (the fact that they make digging faster is already handled by materials.json)
  if (['axe', 'shovel', 'pickaxe', 'spade', 'sword', 'shears'].indexOf(tool) !== -1 && !cobweb) {
    return undefined
  }
  if (['axe', 'pickaxe', 'wooden pickaxe', 'iron pickaxe', 'stone pickaxe', 'diamond pickaxe', 'shovel', 'shears', 'spade',
    'bucket', 'sword', 'wooden shovel'].indexOf(tool) === -1) {
    console.log(tool) // this shouldn't happen
    return undefined
  }
  let harvestTools = []
  if (tool === 'sword') tool = 'wooden sword'// for cobweb
  if (tool === 'shears') harvestTools = [itemsByName[tool]]
  else {
    const parts = tool.split(' ')
    const cmaterial = parts[0]
    const ctool = parts[1]
    let adding = false
    toolMaterials.forEach(function (toolMaterial) {
      if (toolMaterial === cmaterial) { adding = true }
      if (adding) {
        if (!itemsByName[toolMaterial + '_' + ctool]) console.log('PB in harvests', toolMaterial + '_' + ctool)
        harvestTools.push(itemsByName[toolMaterial + '_' + ctool])
      }
    })
  }

  return harvestTools.reduce(function (acc, harvestTool) {
    acc[harvestTool] = true
    return acc
  }, {})
}

// useful for pages like http://minecraft.gamepedia.com/Stairs with two tools : one for rock material,
// one for wood material
function chooseCorrectHarvestTools (tool, tool2, harvestTools, harvestTools2, material) {
  if (!tool2) { return harvestTools }
  if (material === 'web') {
    // http://minecraft.gamepedia.com/Cobweb : both tools
    return Object.keys(harvestTools).concat(Object.keys(harvestTools2))
      .reduce(function (acc, e) { acc[e] = true; return acc }, {})
  }
  if (material === 'rock') { return tool.toLowerCase().indexOf('pick') !== -1 ? harvestTools : harvestTools2 }
  if (material === 'wood' || material === 'plant') { return tool.toLowerCase().indexOf('pick') !== -1 ? harvestTools2 : harvestTools }
  console.log("shouldn't happen material:" + material)
  return harvestTools // shouldn't happen
}

function blocksToFullBlocks (blocks, date, cb) {
  async.map(blocks, function (block, cb) {
    async.waterfall([
      function (cb) {
        wikiTextParser.getFixedArticle(block.link, date, function (err, pageData, title) {
          if (err) {
            cb(err)
            return
          }
          const sectionObject = wikiTextParser.pageToSectionObject(pageData)
          cb(null, sectionObject, title)
        })
      },
      function (sectionObject, title, cb) {
        dvtParser.getVariations(title, block.id, sectionObject, date, function (err, vara) {
          cb(err, sectionObject, vara)
        })
      },
      function (sectionObject, vara, cb) {
        const data = parseBlockInfobox(block.link, sectionObject.content)

        if (data === null) { console.log("can't get infobox of " + block) }
        if (!(data !== null && 'stackSize' in data)) { console.log('stackSize problem in ' + block + ' ' + data) }

        cb(null, {
          id: block.id,
          displayName: block.displayName,
          name: block.name,
          hardness: block.hardness,
          stackSize: data !== null && 'stackSize' in data ? data.stackSize : null,
          // see http://minecraft.gamepedia.com/Breaking and
          // http://minecraft.gamepedia.com/Module:Breaking_row (unbreakable)
          // or use this http://minecraft.gamepedia.com/Breaking#Best_tools
          diggable: block.id === 59 || (!data.liquid && block.hardness !== null &&
          (!data.tool || data.tool !== 'N/A')),
          boundingBox: data.boundingBox,
          material: block.material,
          harvestTools: chooseCorrectHarvestTools(data.tool, data.tool2,
            data.harvestTools, data.harvestTools2, block.material),
          variations: vara !== null ? vara : undefined,
          drops: data.drops === 'Itself' ? [{ drop: block.id }] : data.drops,
          transparent: data.transparent,
          emitLight: data.emitLight,
          filterLight: data.filterLight
        })
      }
    ], cb)
  }, cb)
}

// http://minecraft.gamepedia.com/Breaking#Best_tools
function getMaterials (date, cb) {
  wikiTextParser.getFixedArticle('Breaking', date > new Date('2015-04-09T00:00:00Z') ? date : new Date('2015-04-09T00:00:00Z'), function (err, data) {
    if (err) {
      cb(err)
      return
    }
    const sectionObject = wikiTextParser.pageToSectionObject(data)
    const tableContent = sectionObject.Speed['Best tools'].content
    const blockToMaterial = {}
    const materialToBestTool = {}
    let currentMaterial = ''
    let currentTool = ''
    let prevMaterials = []
    let currentBlocks = []
    let currentColumn = 0
    let started = false
    tableContent.forEach(function (line) {
      if (line.startsWith('| rowspan') || line.startsWith('|rowspan')) {
        if (currentTool !== '') {
          prevMaterials.forEach(function (material) {
            materialToBestTool[material] = currentTool
          })
          prevMaterials = []
        }

        line = line.replace(/\| ?rowspan="[0-9]+"\|/, '').trim()
        line = line.replace(/\{\{ItemLink\|(.+)\}\}/, '$1')
        if (line.indexOf('all tools') !== -1) line = 'all tools'
        if (line.indexOf('instantly breaks') !== -1) line = 'instantly breaks'
        if (line.indexOf('unbreakable') !== -1) line = 'unbreakable'
        currentTool = line
        started = true
        return
      }
      if (!started) return
      if (line.startsWith('|')) { currentColumn++ }
      if (line === '|-') {
        currentColumn = 0
        currentBlocks.forEach(function (block) {
          blockToMaterial[block] = currentMaterial
        })
      } else if (currentColumn === 1) {
        currentMaterial = line.replace('|', '').trim().replace(/\[\[(.+)\]\]/, '$1')
        prevMaterials.push(currentMaterial)
        currentBlocks = []
      } else if (currentColumn === 2 && line.startsWith('*')) {
        const dt = parseBlockItemTemplate(line)
        currentBlocks.push(dt.text.length > dt.link.length ? dt.text : dt.link)
      }
    })
    currentBlocks.forEach(function (block) {
      blockToMaterial[block] = currentMaterial
    })
    prevMaterials.forEach(function (material) {
      materialToBestTool[material] = currentTool
    })

    // console.log(blockToMaterial);
    // console.log(materialToBestTool);
    cb(null, { blockToMaterial, materialToBestTool })
  })
}

function parseBlockItemTemplate (text) {
  const results = wikiTextParser.parseTemplate(text)
  if (results === null || ['BlockLink', 'ItemLink'].indexOf(results.template) === -1) {
    console.log(results)
    console.log('problem with parsing block or item template ' + text)
    return null
  }
  const namedParts = results.namedParts
  const simpleParts = results.simpleParts
  // might be possible to make a more general version of that for handling defaults
  return {
    id: 'id' in namedParts ? namedParts.id : simpleParts[0],
    text: 'text' in namedParts ? namedParts.text : (simpleParts.length === 2 ? simpleParts[1] : simpleParts[0]),
    link: 'link' in namedParts ? namedParts.link : simpleParts[0]
  }
}

const wikiMaterialToSimpleMaterial = {
  Plants: 'plant',
  Wood: 'wood',
  Ice: 'rock',
  'Metal I': 'rock',
  'Metal II': 'rock',
  'Metal III': 'rock',
  Rail: 'rock',
  'Rock I': 'rock',
  'Rock II': 'rock',
  'Rock III': 'rock',
  'Rock IV': 'rock',
  Leaves: 'leaves',
  Web: 'web',
  Wool: 'wool',
  Ground: 'dirt',
  Snow: 'dirt',
  Circuits: '',
  Glass: '',
  Other: '',
  Piston: '',
  Liquid: ''
}

function getWithVariations (object, variations, verbose) {
  const correctVariation = variations.find(function (variation) { return variation in object })
  if (correctVariation !== undefined) { return object[correctVariation] } else {
    if (verbose) console.log("can't find material of " + variations)
    return null
  }
}

function addMaterial (blocks, date, cb) {
  getMaterials(date, function (err, data) {
    if (err) {
      cb(err)
      return
    }
    const blockToMaterial = data.blockToMaterial
    // console.log(blockToMaterial);
    cb(null, blocks.map(function (block) {
      const changedDisplayName = block.displayName
        .replace(/Spruce Door|Birch Door|Jungle Door|Acacia Door|Dark Oak Door|Oak Door/, 'Wooden Door')
        .replace(/(Spruce|Birch|Jungle|Acacia|Dark Oak|Oak) Fence/, 'Fence')
        .replace(/(Wooden|Spruce|Birch|Jungle|Acacia|Dark Oak|Oak) Double? Slab/, 'Slab')
        .replace(/^Dandelion|Sunflower$/, 'Flowers')
        .replace(/^Wooden Button/, 'Wood Button')
        .replace(/^Trapdoor$/, 'Wooden Trapdoor')
        .replace(/^Acacia Leaves$/, 'Leaves')
        .replace(/^Acacia Wood$/, 'Wood')
        .replace(/^Iron Door$/, 'Door')
        .replace(/^Nether Portal_(block)|Portal$/, 'Nether Portal')
        .replace(/^Invisible Bedrock/, 'Bedrock')
        .replace(/^Nether Reactor Core|Update Game Block \(update!\)|Update Game Block \(ate!upd\)|Observer|info_reserved6|Glowing Obsidian/, 'Bedrock') // unbreakable
        .replace(/^Grass Block$/, 'Grass')
        .replace(/^Double /, '')
        .replace(/^Stone Slab$/, 'Slabs')
        .replace(/^Crops$/, 'Seeds')
        .replace(/^Grass Path/, 'Grass')
        .replace(/^Item Frame/, 'Banner')
        .replace(/^Beetroot/, 'Seeds')
        .replace(/^Stonecutter/, 'Stone')
        .replace(/^.+ Glazed Terracotta/, 'Glazed Terracotta')
        .replace(/^.+ Shulker Box/, 'Shulker Box')
        .replace(/^.+ Command Block/, 'Command Block')
        .replace(/^.+ Clay/, 'Clay (block)')
        .replace(/^(Brick|Cobblestone|Stone Brick|Nether Brick|Sandstone|Quartz) Stairs$/, 'Stairs')
        .replace(/^Nether Portal$/, 'Nether Portal (block)')
        .replace(/^Potato$/, 'Potatoes')
        .replace(/^Red Mushroom$/, 'Mushroom')
        .replace(/^Brown Mushroom$/, 'Mushroom')
        .replace(/^.+Wood Stairs$/, 'Wooden Stairs')
      const wikiMaterial = getWithVariations(blockToMaterial, [changedDisplayName, changedDisplayName.replace(/s$/, ''),
        changedDisplayName + 's',
        block.link, block.link.replace(/s$/, ''), block.link + 's'],

      ['Air', 'Piston Head', 'Block moved by Piston'].indexOf(block.displayName) === -1)
      if (wikiMaterial !== null) {
        const material = wikiMaterialToSimpleMaterial[wikiMaterial]
        if (material !== '') block.material = material
      }
      return block
    }))
  })
}

// http://minecraft.gamepedia.com/Breaking#Blocks_by_hardness
// http://minecraft.gamepedia.com/Module:Hardness_values : keys are links in lowercase with _ removed
// http://minecraft.gamepedia.com/Module:Breaking_row
// http://minecraft.gamepedia.com/Module:Block_value

function getHardnessValues (date, cb) {
  wikiTextParser.getFixedArticle('Module:Hardness_values', date > new Date('2014-10-07T00:00:00Z') ? date : new Date('2014-10-07T00:00:00Z'), function (err, data) {
    if (err) {
      cb(err)
      return
    }
    const sectionObject = wikiTextParser.pageToSectionObject(data)
    const linkToHardness = sectionObject.content
      .filter(function (element) { return element.indexOf('=') !== -1 })
      .reduce(function (acc, element) {
        const parts = element.split('=')
        const key = parts[0].trim().replace(/'|\t|\[|\]/g, '')
        acc[key] = parseFloat(parts[1].trim())
        return acc
      }, {})
    cb(null, linkToHardness)
  })
}

// http://minecraft.gamepedia.com/Module:Block_value
function displayNameToBlockValueKey (displayName) {
  let key = displayName.replace(/ \(.+?\)/g, '').replace(/ /g, '').toLowerCase()
  const keepS = [
    'glass',
    'steps',
    'stairs',
    'bars',
    'cactus',
    'leaves',
    'grass',
    'potatoes'
  ]

  if (!keepS.some(function (keep) { return key.indexOf(keep) !== -1 })) { key = key.replace(/s$/, '') }

  key = key.replace('wooden', 'wood')
    .replace('mossy', 'moss')
    .replace('steps', 'stairs')
    .replace(/^.+woodstairs/, 'woodstairs')
    .replace(/.+shulkerbox/, 'shulkerbox')
    .replace(/.+glazedterracotta/, 'glazedterracotta')
    .replace(/.+commandblock/, 'commandblock')
    .replace(/oakfence/, 'fence')
    .replace(/sprucedoor|birchdoor|jungledoor|acaciadoor|darkoakdoor|oakdoor/, 'wooddoor')
    .replace(/^.+#/, '')
    .replace(/'/, '')
  return key
}

function transformHardness (hardness) {
  return hardness === -1 ? null : hardness // bedrock and some other blocks
}

const hardnessNull = ['dandelion', 'doublestoneslab', 'acacialeaves', 'acaciawood', 'sunflower', 'sprucefencegate', 'birchfencegate', 'junglefencegate', 'darkoakfencegate',
  'acaciafencegate', 'itemframe', 'beetroot', 'glowingobsidian', 'netherreactorcore', 'updategameblock', 'blockmovedbypiston', 'info_reserved6']

function addHardness (blocks, date, cb) {
  getHardnessValues(date, function (err, linkToHardness) {
    if (err) {
      cb(err)
      return
    }
    cb(null, blocks.map(function (block) {
      const key1 = displayNameToBlockValueKey(block.displayName)
      const key2 = displayNameToBlockValueKey(block.link)
      if (!(key1 in linkToHardness) && !(key2 in linkToHardness) && hardnessNull.indexOf(key1) === -1) { console.log('hardness not found for : ' + key1 + ' ' + key2) }
      block.hardness = hardnessNull.indexOf(key1) !== -1
        ? 0
        : (key1 in linkToHardness
            ? linkToHardness[key1]
            : (key2 in linkToHardness
                ? linkToHardness[key2]
                : 0))
      block.hardness = transformHardness(block.hardness)
      return block
    }))
  })
}
