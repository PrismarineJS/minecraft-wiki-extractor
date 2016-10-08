var WikiTextParser = require('parse-wikitext');
var wikiTextParser = new WikiTextParser('minecraft.gamepedia.com');
var fs = require('fs');

module.exports = {
  getEntchantments:getEntchantments,
  writeAllEnchantments:writeAllEnchantments
};

function getEntchantments(date, cb) {
  wikiTextParser.getFixedArticle('Enchanting/ID', date, function(err, data) {
    if(err) {
      cb(err);
      return;
    }
    var content = wikiTextParser.pageToSectionObject(data).content;
    var entchantments = content
      .join('')
      .split('|-')
      .filter(function(line) {
        return line.startsWith('| ');
      })
      .map(function(line) {
        var values = line.split('|');
        return {
          id: Number(values[3].trim()),
          name: values[2].replace(/<(\/)?code>/g, '').trim(),
          displayName: values[1].trim()
        };
      });
    cb(null,entchantments);
  });
}

function writeAllEnchantments(file,date , cb)
{
  getEntchantments(date,function(err,enchantments){
    if(err) {
      cb(err);
      return;
    }
    fs.writeFile(file, JSON.stringify(enchantments,null,2), cb);
  })
}
