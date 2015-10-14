if(process.argv.length !=5) {
  console.log("Usage : node block_to_json.js <blocks.json> <existingItems.json> <existingBlocks.json>");
  process.exit(1);
}
var blockFilePath=process.argv[2];
var existingItems=require(process.argv[3]);
var existingBlocks=require(process.argv[4]);

var writeAllBlocks=require("./../lib/block_extractor")(existingItems,existingBlocks).writeAllBlocks;

writeAllBlocks(blockFilePath,function(err){
  if(err) {
    console.log(err.stack);
    return;
  }
  console.log("Blocks extracted !");
});
