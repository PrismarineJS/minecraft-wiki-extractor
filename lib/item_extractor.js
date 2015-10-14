var WikiTextParser = require('parse-wikitext');
var async=require('async');
var fs = require('fs');

var wikiTextParser = new WikiTextParser('minecraft.gamepedia.com');
var id_table_parser=require('./common/id_table_template_parser.js');
var DvtParser=require('./common/dvt_template_parser.js');

var dvtParser=new DvtParser(wikiTextParser);
var infobox_field_parser=require('./common/infobox_field_parser.js');

module.exports = {
  itemInfobox:itemInfobox,
  writeAllItems:writeAllItems
};

function writeAllItems(file, cb)
{
  async.waterfall([
      function(cb){id_table_parser.parseDataValues("Data_values/Item_IDs",cb)},
      //function(items,cb){console.log(JSON.stringify(items,null,2));cb(null,items);}
      itemsToFullItems
    ],
    function(err,fullItems){
      if(err)
        return cb(err);
      fs.writeFile(file, JSON.stringify(fullItems,null,2), cb);
    }
  );
}

// http://minecraft.gamepedia.com/Template:Item
function itemInfobox(page,cb)
{
  wikiTextParser.getArticle(page,function(err,data){
    var sectionObject=wikiTextParser.pageToSectionObject(data);

    cb(null,parseItemInfobox(page,sectionObject["content"]))
  });
}

function parseItemInfobox(page,content)
{
  var infoBox=wikiTextParser.parseInfoBox(content);
  var values=infoBox["values"];

  return {
    "id":parseInt(values["data"]),
    "displayName":page,
    "stackSize":infobox_field_parser.parseStackable(values["stackable"]),
    "name":page.toLowerCase()
  };
}

function itemsToFullItems(items,cb)
{
  async.map(items,function(item,cb){
    async.waterfall([
      function(cb){
        wikiTextParser.getArticle(item["link"]=="Dye" ? "Ink Sac" : item["link"],function(err,pageData,title){
          if(err)
          {
            cb(err);
            return;
          }
          var sectionObject=wikiTextParser.pageToSectionObject(pageData);
          cb(err,sectionObject,title);
        });
      },
      function(sectionObject,title,cb){
        dvtParser.getVariations(title,item["id"],sectionObject,function(err,vara){
          cb(err,sectionObject,vara);
        })},
      function(sectionObject,vara,cb) {
        var data=parseItemInfobox(item["link"],sectionObject["content"]);

        cb(null,{
          "id":item["id"],
          "displayName":item["displayName"],
          "stackSize":data!=null && "stackSize" in data ? data["stackSize"] : null,
          "name":item["name"],
          "variations":vara!=null ? vara : undefined
        });
      }
    ],cb);
  },cb);
}