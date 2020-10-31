module.exports = DvtParser

function DvtParser (wikiTextParser) {
  this.wikiTextParser = wikiTextParser
}

function getAllContentRec (sectionObject) {
  return Object.keys(sectionObject).reduce(function (t, key) {
    return t.concat(sectionObject[key] instanceof Array ? sectionObject[key] : getAllContentRec(sectionObject[key]))
  }, 'content' in sectionObject ? sectionObject.content : [])
}

function getAllDataValues (sectionObject) {
  const k = Object.keys(sectionObject).find(function (key) {
    return 'Data values' in sectionObject[key]
  })
  return ('Data values' in sectionObject ? getAllContentRec(sectionObject['Data values']) : [])
    .concat(k === null ? [] : getAllContentRec(sectionObject[k]['Data values']))
}

DvtParser.prototype.getVariations = function (page, id, sectionObject, date, cb) {
  let link
  if (page === 'Ink Sac') { link = 'Template:Dyes' } else {
    const linkObject = this.processDataValues(sectionObject)
    if (linkObject === null) {
      cb(null, null)
      return
    }
    if ('unknown' in linkObject) { link = linkObject.unknown } else if (id.toString() in linkObject) { link = linkObject[id.toString()] } else {
      if (id === 37) {
        cb(null, null) // dandelion : ok
        return
      }
      const msg = "didn't find the variations of " + page + ':' + id
      console.log(msg)
      cb(null, null)
      return
    }
    if (link === '') {
      console.log('empty link generated bug')
      console.log(sectionObject)
      cb(new Error('empty link generated bug'))
      return
    }
  }
  link = link[0] === '/' ? page + link : link
  this.getDataValue(link, date, cb)
}

DvtParser.prototype.processDataValues = function (sectionObject) {
  const data = getAllDataValues(sectionObject)
  if (!data.some(function (line) { return line.indexOf('DV') !== -1 })) { return null }
  let currentId = null
  let currentDV = null
  const linkObject = {}
  data.forEach(function (line) {
    const matches = line.match(/Block ([0-9]+(?: *\(.+?\))?)/)
    if (matches !== null) {
      if (currentId !== null && currentId.indexOf('Console Edition') === -1 && currentId.indexOf('Pi Edition') === -1 && currentId.indexOf('Pocket Edition') === -1 && currentDV !== null) { linkObject[currentId.split(' ')[0]] = currentDV }
      currentId = matches[1]
      currentDV = null
    }
    const matches2 = line.match(/^\{\{(.+?)\}\}$/)
    if (matches2 !== null && matches2[1].indexOf('DV') !== -1) { currentDV = matches2[1] }
  })
  if (currentId === null && currentDV !== null) { linkObject.unknown = currentDV }
  return linkObject
}

DvtParser.prototype.getDataValue = function (page, date, cb) {
  const self = this
  this.wikiTextParser.getFixedArticle(page, date, function (err, data) {
    if (err) {
      console.log(err)
      cb(null, null)
      return
    }
    if (data.indexOf('dvt') === -1) {
      cb(null, null)
      return
    }
    const table = self.parseDvt(data)
    cb(null, table.map(function (fields) {
      return {
        metadata: fields.dv,
        displayName: fields.description
      }
    }))
  })
}

DvtParser.prototype.parseDvt = function (text) {
  const self = this
  let dv = 0
  return text
    .split('\n')
    .filter(function (element) { return element !== '' && element.indexOf('{') !== -1 && element.indexOf('On ') === -1 && element.indexOf('dvt') !== -1 }) // get rid of the unrelated beginning and ending lines
    .map(function (element) {
      const r = self.wikiTextParser.parseTemplate(element)
      if (r === null || ['dvt'].indexOf(r.template) === -1) {
        console.log(r)
        console.log('problem with parsing dvt template ' + element)
        return null
      }
      return r
    })
    .filter(function (r) { return r !== null && r.simpleParts.length !== 0 && r.simpleParts[0] !== '' })
    .map(function (r) {
      dv = 'dv' in r.namedParts ? parseInt(r.namedParts.dv) : dv
      const re = {
        dv: dv,
        description: r.simpleParts[0].replace(/\[\[(?:.+?\|)?(.+?)\]\]/g, '$1'),
        spritetype: 'spritetype' in r.namedParts ? r.namedParts.spritetype : 'block',
        sprite: 'sprite' in r.namedParts ? r.namedParts.sprite : 'air'
      }
      dv++
      return re
    })
}
