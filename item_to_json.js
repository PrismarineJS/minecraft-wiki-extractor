if(process.argv.length !=3) {
  console.log("Usage : node item_to_json.js <items.json>");
  process.exit(1);
}
var itemFilePath=process.argv[2];

var writeAllItems=require("./lib/item_extractor").writeAllItems;

writeAllItems(itemFilePath,function(err){
  if(err) {
    console.log(err.stack);
    return;
  }
  console.log("Items extracted !");
});