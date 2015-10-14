if(process.argv.length !=3) {
  console.log("Usage : node entities_to_json.js <entities.json>");
  process.exit(1);
}
var entitiesFilePath=process.argv[2];

var writeAllEntities=require("./../lib/entities_extractor").writeAllEntities;

writeAllEntities(entitiesFilePath,function(err){
  if(err) {
    console.log(err.stack);
    return;
  }
  console.log("Entities extracted !");
});