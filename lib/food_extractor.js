/*
 * File: getFoods.js
 * Created Date: Sunday, 28th June 2020 2:23:37 pm
 * -----
 * Author: AppDevMichael
 * -----
 * Last Modified: Thursday, 2nd July 2020 11:21:41 pm
 */

var WikiTextParser = require("parse-wikitext");
var wikiTextParser = new WikiTextParser('minecraft.gamepedia.com');
var async = require('async');
var fs = require('fs');

var nameIndex = require('./common/find_item_object_by_name.js');

//const mcData = require('minecraft-data')('1.16.1');

var names = [];

var existingItems;


function imp(existingItems1) {

    existingItems = existingItems1;
    //existingItems = new Map(Object.entries(existingItems));
    //console.log(existingItems);
    //nameIndex = require('./common/find_item_object_by_name.js')(existingItems);

    return {
        writeAllFoods: writeAllFoods
    };
}

module.exports = imp;


function writeAllFoods(file, date, cb) {
    async.waterfall(
        [function () { foodQuery(file, date, cb) }],

        function (err, data) {
            if (err)
                return cb(err);
            //console.log(JSON.stringify(data,null,2));
            fs.writeFile(file, JSON.stringify(data, null, 2), cb);
        }
    );
}


function foodQuery(file, date, cb) {
    var foods = [];
    foodsIndex = 0


    wikiTextParser.getFixedArticle("Food/table", date, function (err, data) {
        if (err) {
            console.log(err);
            return;
        }

        var sections = wikiTextParser.pageToSectionObject(data);

        var table = wikiTextParser.parseTable(sections['content']);
        table.forEach(function (food) {
            // console.log(existingItems.map(a => a.name));
            var i = 0;
            existingItems.forEach(function (item) {

                //console.log(item['displayName'])
                if (food[1] === item['displayName']) {

                    // Stops duplicates
                    if (!names.includes(food[1])) {

                        foods.push(JSON.parse(JSON.stringify(item)));
                        if (food[2].startsWith('link=') || food[2].startsWith('note=')) {
                            foods[foodsIndex]["foodPoints"] = parseFloat(food[3]);
                            foods[foodsIndex]["saturation"] = parseFloat(food[4]);
                            foods[foodsIndex]["effectiveQuality"] = parseFloat(food[3]) + parseFloat(food[4]);
                            foods[foodsIndex]["saturationRatio"] = parseFloat(food[4]) / parseFloat(food[3]);
                        }
                        else {
                            foods[foodsIndex]["foodPoints"] = parseFloat(food[2]);
                            foods[foodsIndex]["saturation"] = parseFloat(food[3]);
                            foods[foodsIndex]["effectiveQuality"] = parseFloat(food[2]) + parseFloat(food[3]);
                            foods[foodsIndex]["saturationRatio"] = parseFloat(food[3]) / parseFloat(food[2]);
                        }

                        names.push(food[1]);
                        foodsIndex += 1;
                    }

                }
                i += 0;
            });
        });
        fs.writeFile(file, JSON.stringify(foods, null, 2), cb);
    });

}