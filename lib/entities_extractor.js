var WikiTextParser = require('parse-wikitext');
var fs = require('fs');

var wikiTextParser = new WikiTextParser('minecraft.gamepedia.com');

function getText(rawText)
{
  return rawText
    .replace(/\[\[(?:.+?\|)?(.+?)\]\]/g,"$1") // remove links
    .replace(/\(.+\)/g,"") // remove text in parenthesis
    .replace(/^(.+)<br \/>.+$/,"$1") // keep only the first line if two lines
    .trim();
}

module.exports={writeAllEntities:writeAllEntities,getEntities:getEntities};

function getEntities(date,cb)
{
  wikiTextParser.getFixedArticle("Data_values/Entity_IDs",date,function(err,data){
    var sectionObject=wikiTextParser.pageToSectionObject(data);

    var entitiesText=sectionObject["content"];
    var entities={};
    var currentType="";
    entitiesText.forEach(function(line){
      if(line.startsWith("| ")) {
        if(line.startsWith("| colspan"))
          currentType=line.split(" | ")[1];
        else
        {
          var values=line.split("||");
          var id=values[0].replace(/\| /g,"").trim();
          entities[id]={
            "id":parseInt(id),
            "displayName":getText(values[4].split('<br />')[0]),
            "name":values[5].trim(),
            "type":currentType};
        }
      }
    });
    cb(null,Object.keys(entities).map(function(key){return entities[key];}));
  });
}

function writeAllEntities(file,date , cb)
{
  getEntities(date,function(err,entities){
    fs.writeFile(file, JSON.stringify(entities,null,2), cb);
  })
}
