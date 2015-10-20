var WikiTextParser = require('parse-wikitext');
var wikiTextParser = new WikiTextParser('minecraft.gamepedia.com');

var DvtParser = require("./../lib/common/dvt_template_parser.js");


var dvtParser=new DvtParser(wikiTextParser);


describe("dvt parser",function(){
  var date="2015-05-07T00:00:00Z";
// testing : several data value in the page
  it("get data value of slabs",function(cb){
    dvtParser.wikiTextParser.getFixedArticle("Slabs",date, function (err, data) {
      var sectionObject = dvtParser.wikiTextParser.pageToSectionObject(data);

      console.log(dvtParser.processDataValues(sectionObject));
      cb();
    });
  });

  // testing : different kind of section where the data value is
  it("get data of cobble stone wall",function(cb){
    dvtParser.wikiTextParser.getFixedArticle("Cobblestone Wall",date, function (err, data) {
      var sectionObject = dvtParser.wikiTextParser.pageToSectionObject(data);

      console.log(dvtParser.processDataValues(sectionObject));
      cb();
    });
  });

  it("get variations of cobblestone call",function(cb){
    dvtParser.wikiTextParser.getFixedArticle("Cobblestone Wall", date,function (err, data) {
      var sectionObject = dvtParser.wikiTextParser.pageToSectionObject(data);

      dvtParser.getVariations("Cobblestone Wall",139,sectionObject,date,function(err,variation){
        if(err) console.log("error");
        console.log(variation);
        cb();
      });
    });
  });

  it("get variations of stone",function(cb){
    dvtParser.wikiTextParser.getFixedArticle("Stone",date, function (err, data) {
      var sectionObject = dvtParser.wikiTextParser.pageToSectionObject(data);

      dvtParser.getVariations("Stone",1,sectionObject,date,function(err,variation){
        if(err) console.log("error");
        console.log(variation);
        cb();
      });
    });
  });

  it("get variations of slabs",function(cb){
    dvtParser.wikiTextParser.getFixedArticle("Slabs",date, function (err, data) {
      if(err) console.log("error getting slab page "+err);
      var sectionObject = dvtParser.wikiTextParser.pageToSectionObject(data);

      dvtParser.getVariations("Slabs",125,sectionObject,date,function(err,variation){
        if(err) console.log("error getting dv page "+err);
        console.log(variation);
        cb();
      });
    });
  });

  it("get variations of flowers",function(cb){
    dvtParser.wikiTextParser.getFixedArticle("Flowers",date, function (err, data,title) {
      if(err) console.log("error getting Flower page "+err);
      var sectionObject = dvtParser.wikiTextParser.pageToSectionObject(data);

      dvtParser.getVariations(title,175,sectionObject,date,function(err,variation){
        if(err) console.log("error getting dv page "+err);
        console.log(variation);
        cb();
      });
    });
  });

  it("get variations of dye",function(cb){
    dvtParser.wikiTextParser.getFixedArticle("Ink Sac", date,function (err, data,title) {
      if(err) console.log("error getting Dye page "+err);
      var sectionObject = dvtParser.wikiTextParser.pageToSectionObject(data);

      dvtParser.getVariations(title,351,sectionObject,date,function(err,variation){
        if(err) console.log("error getting dv page "+err);
        console.log(variation);
        cb();
      });
    });
  });

  it("get variations of carpet",function(cb){
    dvtParser.wikiTextParser.getFixedArticle("Carpet",date, function (err, data,title) {
      if(err) console.log("error getting Carpet page "+err);
      var sectionObject = dvtParser.wikiTextParser.pageToSectionObject(data);
      dvtParser.getVariations(title,171,sectionObject,date,function(err,variation){
        if(err) console.log("error getting dv page "+err);
        console.log(variation);
        cb();
      });
    });
  });
});
