var WikiTextParser = require('parse-wikitext');
var wikiTextParser = new WikiTextParser('minecraft.gamepedia.com');
var fs = require('fs');

module.exports = {
  getEntchantments:getEntchantments,
  writeAllEnchantments:writeAllEnchantments
};

function getEntchantments(date, cb) {
  wikiTextParser.getFixedArticle('Enchanting', date, function(err, data) {
    if(err) {
      cb(err);
      return;
    }

    // parse the whole page into sections
    var sections =  wikiTextParser.pageToSectionObject(data);
    // get the section with the enchatment table
    var ourSection = sections['Summary of enchantments'];
    // get that sections' contents
    var content = ourSection.content;

    var quit= false;
    // parse that content

    // since there are several tables, we need to make sure we take only the first one
    contentFirstTable = findFirstTable(content);

    const allProtections = [];

    var enchantments = contentFirstTable
      .join('') // shift everything into one line
      .split('|-') // then split it again the table by lines, this gets rid of lines that do not have multiple colums already
      .filter(function(line) {
        return line.startsWith('| ');
      })
      .map(function(line, index) { // we map what we split and filtered above
            var values = line.split("| "); // we split the lines into fields
            if (values[1].search("Protection") >= 0) { // let's assemble all protections
                allProtections.push(parseDisplayName(values[1]));
            }

            return {
                displayName: parseDisplayName(values[1]),
                maxLevel: parseLevels(values[3]),
                primaries: parseItems(values[4]),
                secondaries: parseItems(values[5]),
                excludes: parseExclusions(values[2]),
                probability: Number(values[6]),
            };
      });

    enchantmentsFixed = protectionsExclusiveFix(enchantments, allProtections);
    cb(null, enchantments);
  });
}

// we filter the first table here
function findFirstTable(content) {
    // this is the start of the table we need
    const startIndex = content.indexOf('|+Summary of enchantments');
    // this is the end of the first table
    const endIndex = content.indexOf('|}');
    const newContent = [];
    content.forEach((field, index) => {
        // we make a new array that has only the elements of the first table
        if (index > startIndex && index < endIndex) {
            newContent.push(field);
        }
    });
    return newContent;
}

// the displayname has [[ ]] around it and possibly more after that we need to strip out. 
// This gives the display name only which later needs to be converted to itemname
function parseDisplayName(field) {
    const regex = /\[\[(.*)\]\]/;
    const match = field.match(regex);
    if (match == null) {
        return false;
    }

    return match[1];
}

// this will extract the enchantments that are listed as "mutually exclusive" in the descritption
function parseExclusions(field) {
    const exclusionRegex = /Mutually exclusive with (.*)/;
    const exclusionMatch = field.match(exclusionRegex);
    if (exclusionMatch == null) {
        return [];
    }

    const newField = exclusionMatch[1];

    const regex = /\[\[(.*?)\]\]/g;
    let m;
    var results = [];
    while ((m = regex.exec(newField)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            if (groupIndex == 1) { // we take only the (...) match instead of the whole thing
                results.push(match);
            }
        });
    }
    return results;
}

// we need to add all protectsions as excluded from anything that has protection in the name
// since we have only at the end the list of all protections, we need to do this at the end on all data
function protectionsExclusiveFix(data, allProtections) {

    // we iterate all items 
    data.forEach(function (itemObject, index) {
        enchName = itemObject['displayName'];
        // let's look for the Protection string
        if (enchName.search("Protection") >= 0) {
            var filtered = allProtections.filter(temp, enchName);
            data[index]['excludes'] = filtered;
        }
    });

    return data;
}

function temp(value) {
    return value != this;
}

// parse the items that can be enchanted. This gives the display name only which later needs to be converted to itemname
function parseItems(field) {
    const regex = /\{\{ItemSprite\|([a-zA-Z ]*?)\|link=[a-zA-Z ]*?\}\}/g;
    let m;
    var results = [];
    while ((m = regex.exec(field)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
    
        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            if (groupIndex == 1) { // we take only the (...) match instead of the whole thing
                results.push(match);
            }
        });
    }
    return results;
}

// parse roman numerals for the max level enchant
function parseLevels(field) {
    romans = new Array("X", "IX", "VIII", "VII", "VI", "V", "IV", "III", "II", "I");
    arabics = new Array(10, 9, 8, 7, 6, 5, 4, 3, 2, 1);
    if (field === undefined) {
        return false;
    }

    for (var i = 0; i < romans.length; i++) {
        while(field.indexOf(romans[i]) !== -1){
            return arabics[i];
        }
    }
    // in case there is nothing, it's 1
    return 1;
}

function writeAllEnchantments(file, date, cb)
{
  getEntchantments(date,function(err,enchantments){
    if(err) {
      cb(err);
      return;
    }
    fs.writeFile(file, JSON.stringify(enchantments,null,2), cb);
  })
}
