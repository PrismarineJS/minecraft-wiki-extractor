// blocks tests

var WikiTextParser = require('parse-wikitext');
var wikiTextParser = new WikiTextParser('minecraft.gamepedia.com');

var block_extractor = require("./../lib/block_extractor.js")([],[]);

describe("block_extractor",function(){
  var date="2015-05-07T00:00:00Z";
  it("extract nether brick fence infobox",function(done){
    block_extractor.blockInfobox("Nether Brick Fence",date,function(err,data){
      console.log(data);
      done();
    });
  });

  it("extract melon infobox",function(done){
    block_extractor.blockInfobox("Melon",date,function(err,data){
      console.log(data);
      done();
    });
  });

  it("extract stone infobox",function(done){
    block_extractor.blockInfobox("Stone",date,function(err,data){
      console.log(data);
      done();
    });
  });

  it("extract gravel infobox",function(done){
    block_extractor.blockInfobox("Gravel",date,function(err,data){
      console.log(data);
      done();
    });
  });

  it("extract air infobox",function(done){
    block_extractor.blockInfobox("Air",date,function(err,data){
      console.log(data);
      done();
    });
  });

  it("extract wheat infobox",function(done){
    block_extractor.blockInfobox("Wheat",date,function(err,data){
      console.log(data);
      done();
    });
  });

  it("extract End Portal infobox",function(done){
    block_extractor.blockInfobox("End Portal (block)",date,function(err,data){
      if(err) {
        return done(err);
      }
      console.log(data);
      done();
    });
  });

  it("extract wood infobox",function(done){
    wikiTextParser.getFixedArticle("Wood",date, function (err, data) {
      var sectionObject = wikiTextParser.pageToSectionObject(data);

      var infoBox = wikiTextParser.parseInfoBox(sectionObject["content"]);
      var values = infoBox["values"];
      console.log(values);
      done();
    });
  });

// starting with {{about
  it("extract pumkin infobox",function(done){
    wikiTextParser.getFixedArticle("Pumpkin",date, function (err, data) {
      var sectionObject = wikiTextParser.pageToSectionObject(data);

      console.log(sectionObject["content"]);
      var infoBox = wikiTextParser.parseInfoBox(sectionObject["content"]);
      var values = infoBox["values"];
      console.log(values);
      done();
    });
  });

// starting with {{about
  it("extract carrot",function(done){
    wikiTextParser.getFixedArticle("Carrot",date, function (err, data) {
      var sectionObject = wikiTextParser.pageToSectionObject(data);

      console.log(sectionObject["content"]);
      var infoBox = wikiTextParser.parseInfoBox(sectionObject["content"]);
      var values = infoBox["values"];
      console.log(values);
      done();
    });
  });
});


