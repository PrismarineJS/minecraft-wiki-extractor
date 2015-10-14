module.exports=imp;

function dnt(dn)
{
  return dn.toLowerCase().replace(/ (facing|with).+$/,"");
}

var itemsByName;
var blocksByName;
var itemsVariationsByName;
var blocksVariationsByName;

function imp(existingItems,existingBlocks) {
  var items=existingItems;
  itemsByName=items.reduce(function(acc,item){acc[item["displayName"]]=item["id"];return acc;},{});
  var blocks=existingBlocks;
  blocksByName=blocks.reduce(function(acc,block){acc[block["displayName"]]=block["id"];return acc;},{});
  itemsVariationsByName=items.reduce(function(acc,item){
    if("variations" in item)
      return item["variations"].reduce(function(acc,variation){
        acc[dnt(variation["displayName"])]={"id":item["id"],"metadata":variation["metadata"]};
        return acc;
      },acc);
    else return acc;
  },{});
  blocksVariationsByName=blocks.reduce(function(acc,block){
    if("variations" in block)
      return block["variations"].reduce(function(acc,variation){
        acc[dnt(variation["displayName"])]={"id":block["id"],"metadata":variation["metadata"]};
        return acc;
      },acc);
    else return acc;
  },{});

  return {nameToId:nameToId};
}


function findItem(name)
{
  var itemVariation=itemsVariationsByName[name.toLowerCase()];
  return typeof itemVariation !== "undefined" ? itemVariation : itemsByName[name];
}

function findBlock(name)
{
  var blockVariation=blocksVariationsByName[name.toLowerCase()];
  return typeof blockVariation !== "undefined" ? blockVariation : blocksByName[name];
}

function nameToId(name)
{
  if(name == "")
    return null;
  var p=name.match(/^(.+) \((block|item)\)$/i);
  if(p!=null && p.length==3)
  {
    var itemP=findItem(p[1]);
    var blockP=findBlock(p[1]);
    if(p[2].toLowerCase()=="item" && typeof itemP !== 'undefined')
      return itemP;
    if(p[2].toLowerCase()=="block" && typeof blockP !== 'undefined')
      return blockP;
  }
  var item=findItem(name);
  var block=findBlock(name);
  if(typeof item !== 'undefined')
    return item;
  if(typeof block !== 'undefined')
    return block;
  return undefined;
}