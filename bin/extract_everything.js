const fs=require("fs");

function extractBlock(destinationBlocks,existingItemsPath,existingBlocksPath,revisionDate,kind) {
  const blockFilePath=destinationBlocks;
  const existingItems=JSON.parse(fs.readFileSync(existingItemsPath));
  const existingBlocks=JSON.parse(fs.readFileSync(existingBlocksPath));
  const date=revisionDate;
  const mcpe=kind ? kind=="mcpe" : false;

  const writeAllBlocks=require("./../lib/block_extractor")(existingItems,existingBlocks).writeAllBlocks;

  writeAllBlocks(blockFilePath,date,mcpe,function(err){
    if(err) {
      console.log(err.stack);
      return;
    }
    console.log("Blocks extracted !");
  });
}