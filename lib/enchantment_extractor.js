var WikiTextParser = require('parse-wikitext');
var wikiTextParser = new WikiTextParser('minecraft.gamepedia.com');
var fs = require('fs');

module.exports = {
  getEntchantments:getEntchantments,
  writeAllEnchantments:writeAllEnchantments
};

function getEntchantments(folder, date, cb) {
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

    // we need the language.json to look for the itemName enchantment
    var languageFile = getLanguageData(folder);

    var enchantments = contentFirstTable
      .join('') // shift everything into one line
      .split('|-') // then split it again the table by lines, this gets rid of lines that do not have multiple colums already
      .filter(function(line) {
        return line.startsWith('| ');
      })
      .map(function(line, index) { // we map what we split and filtered above
            var values = line.split("| "); // we split the lines into fields

            // we filter the languagefile for the enchatnments display name to get the itemName
            var displayName = parseDisplayName(values[1], languageFile);

            // we need to check if we have a result in the language file. Otherwise the enchantment is invalid for the given version
            if (displayName) {

                if (displayName[0].search("protection") >= 0) { // let's assemble all protections
                    allProtections.push(displayName[0]);
                }

                return {
                    itemName: displayName[0],
                    displayName: displayName[1],
                    maxLevel: parseLevels(values[3]),
                    primaries: parseItems(values[4], languageFile),
                    secondaries: parseItems(values[5], languageFile),
                    excludes: parseExclusions(values[2], languageFile),
                    probability: Number(values[6]),
                };
            }
      });

    // since the .map might have failed on invalid displayName, there are NULL elements in the list, we remove them here
    var onlyValidEnchantments = enchantments.filter(function (el) {
        return el != null;
    });

    // make sure that the enchantment conflicts are fixed
    enchantmentsFixed = protectionsExclusiveFix(onlyValidEnchantments, allProtections);

    cb(null, enchantmentsFixed);
  });
}


// We need to get the minecraft-data language file so we cna use the proper minecraft:.. names instead of displaynames
// for enchantments and items
// path is the path to minecraft-data and the relevant version folder
function getLanguageData(folder) {
    var languagePath = folder + "/language.json";
    if (!fs.existsSync(languagePath)) {
        console.log("The path to the language.json file in mc-data/pc/version/ has not been found");
    }

    var languageFile = JSON.parse(fs.readFileSync(languagePath, 'utf8'));

    return Object.entries(languageFile);
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
function parseDisplayName(field, enchLanguageFile) {

    // strip [[ ]] first
    const regex = /\[\[(.*)\]\]/;
    const match = field.match(regex);
    if (match == null) {
        return false;
    }
    const fixedDisplayName = match[1];

    const itemNameMatch = enchLanguageFile.find(entry => entry[1] === fixedDisplayName);
    const itemName = itemNameMatch && itemNameMatch[0];
    // we need to check if we have a result in the language file. Otherwise the enchantment is invalid for the given version
    if (typeof itemName !== 'undefined') {
        // we need to strip "enchantment." form the itemName
        var fixedItemName = parseLanguagefileItem(itemName);
        // we return an array of the itemName and the displayName
        return [fixedItemName, fixedDisplayName];
    } else {
        console.log("NOTICE: could not find " + fixedDisplayName + " enchantment in language file! Wiki item is likely for next version.");
        return false;
    }
}

// we need to strip the first "enchantment" from the language file "enchantment.minecraft.sharpness"
// we do so by just getting everything after the first "."
function parseLanguagefileItem(field) {
    const regex = /[0-9a-zA-Z_]*\.([0-9a-zA-Z._]*)/;
    const match = field.match(regex);
    if (match == null) {
        console.log("ERROR: We could not parse the language file entry " + field);
        return false;
    }
    return match[1];
}

// this will extract the enchantments that are listed as "mutually exclusive" in the descritption
function parseExclusions(field, languageFile) {
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

                const itemNameMatch = languageFile.find(entry => entry[1] === match);
                const thisEnchName = itemNameMatch && itemNameMatch[0];
                // we need to check if we have a result in the language file. Otherwise the enchantment is invalid for the given version
                if (typeof thisEnchName !== 'undefined') {
                    fixedEnchantment = parseLanguagefileItem(thisEnchName);
                    results.push(fixedEnchantment);
                } else {
                    console.log("EROR: could not identify enchantment exclusion " + match);
                } 
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
        enchItemName = itemObject['itemName'];
        enchName = itemObject['displayName'];
        // let's look for the Protection string
        if (enchName.search("Protection") >= 0) {
            // we filter out the itemNAme of the current protection so that it does not look like 
            // as if the echantment excludes itself.
            var filtered = allProtections.filter(temp, enchItemName);
            data[index]['excludes'] = filtered;
        }
    });

    return data;
}

function temp(value) {
    return value != this;
}

// parse the items that can be enchanted. This gives the display name only which later needs to be converted to itemname
function parseItems(field, itemsFile) {
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
                const itemNameMatch = itemsFile.find(entry => entry[1] === match);
                const thisItemName = itemNameMatch && itemNameMatch[0];
                // we need to check if we have a result in the language file. Otherwise the enchantment is invalid for the given version
                if (typeof thisItemName !== 'undefined') {
                    fixedItemName = parseLanguagefileItem(thisItemName);
                    results.push(fixedItemName);
                } else {
                    console.log("NOTICE: could not find " + match + " item in language file! Wiki item is likely for next version.");
                }
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

function writeAllEnchantments(folder, date, cb)
{
  getEntchantments(folder, date,function(err,enchantments){
    if(err) {
      cb(err);
      return;
    }

    var file = folder + "/enchantments.json";

    fs.writeFile(file, JSON.stringify(enchantments,null,2), cb);
  })
}
