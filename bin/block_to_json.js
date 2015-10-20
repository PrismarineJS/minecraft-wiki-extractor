if(process.argv.length <5 || process.argv.length >6) {
  console.log("Usage : node block_to_json.js <blocks.json> <existingItems.json> <existingBlocks.json> [<wikidate>]");
  process.exit(1);
}
var blockFilePath=process.argv[2];
var fs=require("fs");
var existingItems=JSON.parse(fs.readFileSync(process.argv[3]));
var existingBlocks=JSON.parse(fs.readFileSync(process.argv[4]));
var date=process.argv[5] ? process.argv[5] : "2015-05-07T00:00:00Z";

var writeAllBlocks=require("./../lib/block_extractor")(existingItems,existingBlocks).writeAllBlocks;

writeAllBlocks(blockFilePath,date,function(err){
  if(err) {
    console.log(err.stack);
    return;
  }
  console.log("Blocks extracted !");
});
