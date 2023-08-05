const WikiTextParser = require('parse-wikitext')
const wikiTextParser = new WikiTextParser('minecraft.gamepedia.com')
const async = require('async')
const fs = require('fs')

let nameIndex = require('./common/find_item_object_by_name.js')

function imp (existingItems, existingBlocks) {
  nameIndex = require('./common/find_item_object_by_name.js')(existingItems, existingBlocks)

  return {
    writeAllRecipes
  }
}

module.exports = imp

// getAliases();

// http://minecraft.gamepedia.com/Talk:Crafting#Wiki_source_of_the_recipes
// used to display all the recipes in the recipes page in the wiki
// (see http://minecraft.gamepedia.com/index.php?title=Module:Recipe_list&action=edit
// and http://minecraft.gamepedia.com/Crafting#Complete_recipe_list
// http://minecraft.gamepedia.com/Module:Crafting : useful for shapeless for example
// http://minecraft.gamepedia.com/Module:Grid/Aliases
// http://minecraft.gamepedia.com/Talk:Crafting
// http://minecraft.gamepedia.com/Template:Grid
// http://minecraft.gamepedia.com/Module:Grid
// http://minecraft.gamepedia.com/Mushroom_Stew : shapeless
// http://minecraft.gamepedia.com/Template:Grid/Crafting_Table

// type : not necessarily useful, description useful to exclude pocket
// (http://minecraft.gamepedia.com/index.php?title=Book&action=edit&section=3)

// http://minecraft.gamepedia.com/Module:Grid : important : not really

// http://minecraft.gamepedia.com/Template:Crafting : this is what is really used
// this http://minecraft.gamepedia.com/Module:Crafting

function writeAllRecipes (file, date, cb) {
  async.waterfall([
    function (done) { recipeQuery(date, done) },
    // function(recipes,cb){console.log(recipes);cb(null,recipes);},
    // getUnrecognizedNames,
    removeConsolePocket,
    function (recipes, cb) {
      getAliases(date, function (err, aliases) {
        if (err) {
          cb(err)
          return
        }
        cb(null, recipes, aliases)
      })
    },
    recipesNameToId,
    formatRecipes,
    removeDuplicates,
    indexRecipes
  ]
  , function (err, recipes) {
    if (err) { return cb(err) }
    // console.log(recipes);
    // console.log(JSON.stringify(recipes,null,2));
    fs.writeFile(file, JSON.stringify(recipes, null, 2), cb)
  }
  )
}

// sometimes "ingredients" : see http://minecraft.gamepedia.com/index.php?title=Pickaxe&action=edit&section=4
// : probably not useful though
const rkeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3', 'Output']
const keys = rkeys.concat(['type', 'description'])

function recipeQuery (date, cb) {
  let d = date.replace(/[-T:Z]/g, '')
  d = d.substr(0, d.length - 2)
  wikiTextParser.dplQuery(
    '{{#dpl:categorymatch=%recipe' +
    '|include={Crafting}:1:2:3:4:5:6:7:8:9:A1:B1:C1:A2:B2:C2:A3:B3:C3:Output:type:description' +
    '|mode = userformat' +
    '|secseparators = ====' +
    '|multisecseparators = ====' +
    '|lastrevisionbefore=' + d +
    '}}',
    function (err, info) {
      if (err) {
        cb(err)
        return
      }
      const rawRecipes = info.split('====')
      const recipes = rawRecipes
        .slice(1) // remove the <p> at the beginning
        .map(function (rawRecipe) {
          return rawRecipe
            .split('|')
            .map(function (ingredient) {
              return ingredient.trim()
            })
        })
        .map(function (arrayRecipe) {
          const recipeObject = {}
          for (let i = 0; i < keys.length; i++) { recipeObject[keys[i]] = arrayRecipe[i] }
          return recipeObject
        })
      cb(null, recipes)
    }
  )
}

function removeConsolePocket (recipes, cb) {
  cb(null, recipes.filter(function (recipe) {
    return !((recipe.description.toLowerCase().indexOf('pocket') !== -1 ||
      recipe.description.toLowerCase().indexOf('console') !== -1) &&
      recipe.description.toLowerCase().indexOf('only') !== -1) ||
      recipe.description.toLowerCase().indexOf('pc') !== -1
  }))
}

// http://minecraft.gamepedia.com/Template:Dvt
// http://minecraft.gamepedia.com/Data_values#Flowers
// http://minecraft.gamepedia.com/Category:Data_value_pages
// http://minecraft.gamepedia.com/Category:Block_state_pages

// should probably be handled by collecting variations from the wiki and storing them in a file
// + metadata variations display names
// (example : http://minecraft.gamepedia.com/Sunflower#Flower_biomes)

// see also : redirections
const edgeVariations = {
  'Sugar Canes': 'Sugar Cane',

  Mushroom: 'Red Mushroom',
  'Pillar Quartz Block': 'Block of Quartz',
  Button: 'Wooden Button',
  'Any Firework Star': 'Firework Star',

  'Redstone Lamp': 'Redstone Lamp (inactive)',
  'Mossy Stone Bricks': 'Mossy Stone Brick',
  'Stone Bricks Slab': 'Stone Brick Slab',
  'Chiseled Stone Bricks': 'Chiseled Stone Brick',
  'Oak Fence Gate': 'Fence Gate',
  'Wooden Trapdoor': 'Trapdoor',
  'Redstone Torch': 'Redstone Torch (inactive)',
  'Oak Fence': 'Fence',
  'Cracked Stone Bricks': 'Cracked Stone Brick'
}

function replaceName (name) {
  // should be done properly with metadata
  const firstStep = name
    .replace(/^.*Banner$/, 'Banner')
    .replace(/^.*Firework Star$/, 'Firework Star')
    .replace(/^.*Boat/, 'Boat')
    .replace(/^.*Shield/, 'Shield')
    .replace(/^.*Wood$/, 'Wood')
    .replace(/^.*Wool$/, 'Wool')
    .replace(/Damaged /, '')
    .trim()
  if (firstStep in edgeVariations) { return edgeVariations[firstStep] } else return firstStep
}

// for recipes with several items in one box : first item of first box correspond to first item of second box
// (or always the first if there's only one)
// for theses recipes : generation of several recipes (example : http://minecraft.gamepedia.com/Banner#Crafting)
function recipesNameToId (recipes, aliases, cb) {
  const unreco = {}
  const newRecipes = recipes
    .map(function (recipe) {
      const newRecipe = rkeys.reduce(function (newRecipe, key) {
        let name = recipe[key]
        name = name.replace('&#160', '').trim()
        if (name !== '') {
          let names = name.split(';')
          names = [].concat.apply([], names
            .map(function (name) { return name.trim() })
            .map(function (name) { return name.replace(/\{(.+?)\}/, '$1') })
            .map(function (name) {
              const parts = name.split(',')
              name = parts[0]
              const count = parts.length > 1 ? parseInt(parts[1]) : null
              return name in aliases
                ? aliases[name].split(';').map(function (name) {
                  return name + (count !== null ? ',' + count : '')
                })
                : [name + (count !== null ? ',' + count : '')]
            }))
          newRecipe[key] = names
            .map(function (name) { return name.trim() })
          // .filter(function(name){return name!=="";})
            .map(function (name) {
              const parts = name.split(',')
              name = parts[0]
              const count = parts.length > 1 ? parseInt(parts[1]) : 1

              let id = nameIndex.nameToId(name)
              if (typeof id === 'undefined') {
                name = replaceName(name)
                id = nameIndex.nameToId(name)
                if (typeof id === 'undefined') {
                  unreco[name] = true
                }
              }
              return count !== null && (count !== 1 || key === 'Output') && (typeof id !== 'undefined')
                ? id instanceof Object
                  ? { count, id: id.id, metadata: id.metadata }
                  : { count, id, metadata: 0 }
                : id
            })/* ) */
        } else { newRecipe[key] = null }
        return newRecipe
      }, {})

      // newRecipe["type"]=recipe["type"];
      // newRecipe["description"]=recipe["description"];
      return newRecipe
    })
    // drop if can't find the id
    .filter(function (r) {
      return rkeys.every(function (k) {
        return r[k] === null || r[k].every(function (i) { return typeof i !== 'undefined' })
      })
    })

  // console.log(newRecipes);
  const unrecoNames = Object.keys(unreco)
  if (unrecoNames.length > 0) {
    console.log('There are some unrecognized names :')
    console.log(unrecoNames)
    console.log(recipes.length)
    console.log(newRecipes.length)
  }

  const unitRecipes = [].concat.apply([], newRecipes.map(function (recipe) {
    const multipleKey = rkeys.find(function (key) { return recipe[key] !== null && recipe[key].length > 1 })
    let n = multipleKey === null ? 1 : recipe[multipleKey].length
    const keepRecipeGeneric = n !== 1 && recipe.Output.length === 1 // when the result doesn't change (for example bed : #19)
    n = keepRecipeGeneric ? 1 : n
    const splitRecipes = []
    for (let i = 0; i < n; i++) {
      const nRecipe = rkeys.reduce(function (nRecipe, key) {
        if (keepRecipeGeneric && recipe[key] !== null && recipe[key].length > 1) { nRecipe[key] = recipe[key][0] instanceof Object ? recipe[key][0].id : recipe[key][0] } else { nRecipe[key] = recipe[key] === null ? null : (recipe[key].length > i ? recipe[key][i] : recipe[key][0]) }
        return nRecipe
      }, {})
      splitRecipes.push((nRecipe))
    }
    return splitRecipes
  }))
  // console.log(unitRecipes);
  // console.log(unitRecipes.length);

  cb(null, unitRecipes)
  // cb(null,recipes);
}

// plan :
// 1. map item to ids (and metadata ??) : ok
// 2. map recipes using item mapping : ok
// 3. check whether the format is correct relative to recipes.json

const nums = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
const letters = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3']

// http://minecraft.gamepedia.com/Coal#Crafting is actually shapeless, why not written as so ?
function formatShapelessRecipe (recipe) {
  const result = recipe.Output
  const ingredients = nums
    .filter(function (num) { return recipe[num] !== null })
    .map(function (num) { return recipe[num] })
  // see "Automatic shapeless positioning" in http://minecraft.gamepedia.com/Module:Crafting
  if (ingredients.length === 1) { return formatShapedRecipe({ Output: result, A1: ingredients[0] }) } else if (ingredients.length === 9 && ingredients.every(function (e) { return e === ingredients[0] })) {
    return formatShapedRecipe(letters.reduce(function (newRecipe, l) { newRecipe[l] = ingredients[0]; return newRecipe },
      { Output: result }))
  } else {
    return {
      ingredients,
      result
    }
  }
}
const cake = [
  [
    325,
    325,
    325
  ],
  [
    null,
    null,
    null
  ],
  [
    null,
    null,
    null
  ]]

// check 425 : banner...
function formatShapedRecipe (recipe) {
  const result = recipe.Output
  const inShape =
    [
      [recipe.A1, recipe.B1, recipe.C1],
      [recipe.A2, recipe.B2, recipe.C2],
      [recipe.A3, recipe.B3, recipe.C3]
    ]

  return {
    inShape: removeMostNulls(inShape),
    outShape: result.id === 354 ? cake : undefined,
    result
  }
}
// need outShape and one more transformation to remove the unneeded nulls (see transform2_recipes.js)

// useful for example for recipes that fit in the inventory crafting
function removeMostNulls (shape) {
  const r = shape
  const nr = []
  const uselessLines = []
  const uselessColumns = []
  let remove
  let k, l

  // find useless lines
  remove = 1
  for (k = 0; k < 3; k++) {
    for (l = 0; l < 3; l++) {
      if (r[k][l] !== null) {
        remove = 0
        break
      }
    }
    if (remove) uselessLines.push(k)
    else break
  }
  remove = 1
  for (k = 2; k >= 0; k--) {
    for (l = 0; l < 3; l++) {
      if (r[k][l] !== null) {
        remove = 0
        break
      }
    }
    if (remove) uselessLines.push(k)
    else break
  }
  // find useless columns
  remove = 1
  for (k = 0; k < 3; k++) {
    for (l = 0; l < 3; l++) {
      if (r[l][k] !== null) {
        remove = 0
        break
      }
    }
    if (remove) uselessColumns.push(k)
    else break
  }
  remove = 1
  for (k = 2; k >= 0; k--) {
    for (l = 0; l < 3; l++) {
      if (r[l][k] !== null) {
        remove = 0
        break
      }
    }
    if (remove) uselessColumns.push(k)
    else break
  }

  // remove useless lines and columns
  let m = 0
  for (k = 0; k < 3; k++) {
    if (uselessLines.indexOf(k) === -1) {
      nr.push([])
      for (l = 0; l < 3; l++) {
        if (uselessColumns.indexOf(l) === -1) {
          nr[m].push(r[k][l])
        }
      }
      m++
    }
  }
  return nr
}

function formatRecipes (recipes, cb) {
  cb(null, recipes.map(function (recipe) {
    // 42 ? iron ? http://minecraft.gamepedia.com/Block_of_Iron : shape ? same for
    // http://minecraft.gamepedia.com/Block_of_Emerald
    // see http://minecraft.gamepedia.com/Module:Crafting ctrl+f shapeless
    // not considered shapeless in the wiki but they are shapeless !
    // recipe["1"]!==null can't be used because of map and book recipes (which now work except for the outShape)
    const shapeless = nums.some(function (num) { return recipe[num] !== null })
    return shapeless ? formatShapelessRecipe(recipe) : formatShapedRecipe(recipe)
  }).filter(function (recipe) { return recipe !== null }))
}

function indexRecipes (recipes, cb) {
  cb(null, recipes.reduce(function (indexedRecipes, recipe) {
    // console.log(recipe);
    // console.log(":");
    const resultId = recipe.result.id.toString()
    if (resultId in indexedRecipes) { indexedRecipes[resultId].push(recipe) } else { indexedRecipes[resultId] = [recipe] }
    return indexedRecipes
  }, {}))
}

function removeDuplicates (recipes, cb) {
  const o = recipes.reduce(function (o, e) { o[JSON.stringify(e)] = e; return o }, {})
  cb(null, Object.keys(o).map(function (k) { return o[k] }))
}
const LuaVM = require('lua.vm.js')
const path = require('path')
const toJSON = fs.readFileSync(path.join(__dirname, 'common/toJSON.lua'), 'utf8')

// http://minecraft.gamepedia.com/Module:Inventory_slot/Aliases
function getAliases (date, cb) {
  wikiTextParser.getFixedArticle('Module:Inventory_slot/Aliases', date, function (err, lua) {
    if (err) {
      cb(err)
      return
    }
    lua = lua.replace(/mw.clone\((.+)\)/, '$1')
    const lines = lua.split('\n')
    lua = lines.slice(0, lines.length - 2).join('\n')
    lua += '\n' + toJSON
    const l = new LuaVM.Lua.State()
    let json = l.execute(lua).toString()
    json = json.substring(0, json.length - 1) + '}'
    let aliases = JSON.parse(json)
    aliases = Object.keys(aliases).reduce(function (acc, key) {
      acc[key] = aliases[key].replace(/\[.+?\]/g, '').trim()
      return acc
    }, {})
    cb(null, aliases)
  })
}
