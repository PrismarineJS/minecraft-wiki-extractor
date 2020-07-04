if (process.argv.length < 4 || process.argv.length > 5) {
    console.log("Usage : node food_to_json.js <foods.json> <existingItems.json> [<wikidate>]");
    process.exit(1);
}
var foodFilePath = process.argv[2];
var fs = require("fs");
var existingItems = JSON.parse(fs.readFileSync(process.argv[3]));
var date = process.argv[4] ? process.argv[4] : "2050-05-07T00:00:00Z";


var writeAllFoods = require("./../lib/food_extractor")(existingItems).writeAllFoods;

writeAllFoods(foodFilePath, date, function (err) {
    if (err) {
        console.log(err.stack);
        return;
    }
    console.log("Foods extracted !");
});