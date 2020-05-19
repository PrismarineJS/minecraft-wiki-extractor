if(process.argv.length <3 || process.argv.length >4) {
  console.log("Usage : node enchantments_to_json.js <mc-data/pc/versionfolder> [<wikidate>]");
  process.exit(1);
}
var mcDataFolder=process.argv[2];
var date=process.argv[3] ? process.argv[3] : "2019-12-31T00:00:00Z";

var writeAllEnchantments=require("./../lib/enchantment_extractor").writeAllEnchantments;

writeAllEnchantments(mcDataFolder, date, function(err){
  if(err) {
    console.log(err.stack);
    return;
  }
  console.log("Enchantments extracted !");
});
