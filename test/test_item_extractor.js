// items tests
var item_extractor = require("./../lib/item_extractor.js");


describe("item_extractor",function(){
  it("get arrow infobox",function(cb){
    item_extractor.itemInfobox("Arrow",function(err,data){
      console.log(data);
      cb();
    });
  });

  it("get wait disc infobox",function(cb){
    item_extractor.itemInfobox("Wait Disc",function(err,data){
      console.log(data);
      cb();
    });
  });

  it("get golden apple infobox",function(cb){
    item_extractor.itemInfobox("Golden Apple",function(err,data){
      console.log(data);
      cb();
    });
  });

  it("get Beetroot Seeds infobox",function(cb){
    item_extractor.itemInfobox("Beetroot Seeds",function(err,data){
      console.log(data);
      cb();
    });
  });
});