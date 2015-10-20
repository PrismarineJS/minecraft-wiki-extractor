// items tests
var item_extractor = require("./../lib/item_extractor.js");


describe("item_extractor",function(){
  var date="2015-05-07T00:00:00Z";
  it("get arrow infobox",function(cb){
    item_extractor.itemInfobox("Arrow",date,function(err,data){
      console.log(data);
      cb();
    });
  });

  it("get wait disc infobox",function(cb){
    item_extractor.itemInfobox("Wait Disc",date,function(err,data){
      console.log(data);
      cb();
    });
  });

  it("get golden apple infobox",function(cb){
    item_extractor.itemInfobox("Golden Apple",date,function(err,data){
      console.log(data);
      cb();
    });
  });

  it("get Beetroot Seeds infobox",function(cb){
    item_extractor.itemInfobox("Beetroot Seeds",date,function(err,data){
      console.log(data);
      cb();
    });
  });
});