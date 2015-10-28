if(process.argv.length <5 && process.argv.length >6) {
  console.log("Usage : node recipe_to_json.js <recipes.json> <existingItems.json> <existingBlocks.json> [<wikidate>]");
  process.exit(1);
}
var recipeFilePath=process.argv[2];
var fs=require("fs");
var existingItems=JSON.parse(fs.readFileSync(process.argv[3]));
var existingBlocks=JSON.parse(fs.readFileSync(process.argv[4]));
var date=process.argv[5] ? process.argv[5] : "2015-05-07T00:00:00Z";

var writeAllRecipes=require("./../lib/recipe_extractor")(existingItems,existingBlocks).writeAllRecipes;

writeAllRecipes(recipeFilePath,date,function(err){
  if(err) {
    console.log(err.stack);
    return;
  }
  console.log("Recipes extracted !");
});