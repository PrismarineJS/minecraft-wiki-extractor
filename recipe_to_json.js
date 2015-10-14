if(process.argv.length !=5) {
  console.log("Usage : node recipe_to_json.js <recipes.json> <existingItems.json> <existingBlocks.json>");
  process.exit(1);
}
var recipeFilePath=process.argv[2];
var existingItems=require(process.argv[3]);
var existingBlocks=require(process.argv[4]);

var writeAllRecipes=require("./lib/recipe_extractor")(existingItems,existingBlocks).writeAllRecipes;

writeAllRecipes(recipeFilePath,function(err){
  if(err) {
    console.log(err.stack);
    return;
  }
  console.log("Recipes extracted !");
});