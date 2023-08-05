/*
 * File: getFoods.js
 * Created Date: Sunday, 28th June 2020 2:23:37 pm
 * -----
 * Author: AppDevMichael
 * -----
 * Last Modified: Friday, 3rd July 2020 12:25:02 am
 */

const WikiTextParser = require('parse-wikitext')
const wikiTextParser = new WikiTextParser('minecraft.gamepedia.com')
const async = require('async')
const fs = require('fs')

// const mcData = require('minecraft-data')('1.16.1');

const names = []

let existingItems

function imp (existingItems1) {
  existingItems = existingItems1
  // existingItems = new Map(Object.entries(existingItems));
  // console.log(existingItems);
  // nameIndex = require('./common/find_item_object_by_name.js')(existingItems);

  return {
    writeAllFoods
  }
}

module.exports = imp

function writeAllFoods (file, date, cb) {
  async.waterfall(
    [function () { foodQuery(file, date, cb) }],

    function (err, data) {
      if (err) { return cb(err) }
      // console.log(JSON.stringify(data,null,2));
      fs.writeFile(file, JSON.stringify(data, null, 2), cb)
    }
  )
}

function foodQuery (file, date, cb) {
  const foods = []
  let foodsIndex = 0

  wikiTextParser.getFixedArticle('Food/table', date, function (err, data) {
    if (err) {
      console.log(err)
      return
    }

    const sections = wikiTextParser.pageToSectionObject(data)

    const table = wikiTextParser.parseTable(sections.content)
    // console.log(data);
    // console.log(table);
    table.forEach(function (food) {
      // console.log(existingItems.map(a => a.name));
      existingItems.forEach(function (item) {
        // console.log(item['displayName'])
        if (food[1] === item.displayName) {
          // Stops duplicates
          if (!names.includes(food[1])) {
            foods.push(JSON.parse(JSON.stringify(item)))
            if (food[2].startsWith('link=') || food[2].startsWith('note=')) {
              foods[foodsIndex].foodPoints = parseFloat(food[3])
              foods[foodsIndex].saturation = parseFloat(food[4])
              foods[foodsIndex].effectiveQuality = parseFloat(food[3]) + parseFloat(food[4])
              foods[foodsIndex].saturationRatio = parseFloat(food[4]) / parseFloat(food[3])
            } else {
              foods[foodsIndex].foodPoints = parseFloat(food[2])
              foods[foodsIndex].saturation = parseFloat(food[3])
              foods[foodsIndex].effectiveQuality = parseFloat(food[2]) + parseFloat(food[3])
              foods[foodsIndex].saturationRatio = parseFloat(food[3]) / parseFloat(food[2])
            }
            names.push(food[1])
            // console.log(foods[19]);
            // console.log(item['displayName']);
            foodsIndex += 1
          }
        }
      })
    })
    fs.writeFile(file, JSON.stringify(foods, null, 2), cb)
  })
}
