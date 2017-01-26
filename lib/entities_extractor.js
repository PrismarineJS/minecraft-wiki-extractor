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
    var currentLine="";
    entitiesText.reduce((acc,line) => {
        if(line.startsWith("|-")) {
          acc.push(currentLine);
          currentLine="| ";
        }
        else {
          currentLine+=line.replace(/^\| ?/,"")+ " || ";
        }
      return acc;
    },[])
      .forEach(function(line){
      if(line.startsWith("| ")) {
        if(line.startsWith("| colspan")) {
          currentType = line.split("|")[2].replace(/\|\|/, "").trim();
        }
        else
        {
          var values=line.split("||");
          var id=values[0].replace(/\| /g,"").trim();
          entities[id]={
            "id":parseInt(id),
            "displayName":getText(values[values.length==8 ? 5 : 4].split('<br />')[0]),
            "name":values[values.length==8 ? 6 : 5].trim(),
            "type":currentType,
            "networkId":values.length==8 ? parseInt(values[2]) : parseInt(id)
          };
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
