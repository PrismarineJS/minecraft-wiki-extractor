/* eslint-env mocha */

// blocks tests

const WikiTextParser = require('parse-wikitext')
const wikiTextParser = new WikiTextParser('minecraft.gamepedia.com')

const blockExtractor = require('./../lib/block_extractor.js')([], [])

describe('block_extractor', function () {
  this.timeout(10 * 1000)
  const date = '2017-12-28T00:00:00Z'
  it('extract nether brick fence infobox', function (done) {
    blockExtractor.blockInfobox('Nether Brick Fence', date, function (err, data) {
      if (err) {
        done(err)
        return
      }
      console.log(data)
      done()
    })
  })

  it('extract melon infobox', function (done) {
    blockExtractor.blockInfobox('Melon', date, function (err, data) {
      if (err) {
        done(err)
        return
      }
      console.log(data)
      done()
    })
  })

  it('extract stone infobox', function (done) {
    blockExtractor.blockInfobox('Stone', date, function (err, data) {
      if (err) {
        done(err)
        return
      }
      console.log(data)
      done()
    })
  })

  it('extract gravel infobox', function (done) {
    blockExtractor.blockInfobox('Gravel', date, function (err, data) {
      if (err) {
        done(err)
        return
      }
      console.log(data)
      done()
    })
  })

  it('extract air infobox', function (done) {
    blockExtractor.blockInfobox('Air', date, function (err, data) {
      if (err) {
        done(err)
        return
      }
      console.log(data)
      done()
    })
  })

  it('extract wheat infobox', function (done) {
    blockExtractor.blockInfobox('Wheat', date, function (err, data) {
      if (err) {
        done(err)
        return
      }
      console.log(data)
      done()
    })
  })

  it('extract End Portal infobox', function (done) {
    blockExtractor.blockInfobox('End Portal (block)', date, function (err, data) {
      if (err) {
        done(err)
        return
      }
      if (err) {
        return done(err)
      }
      console.log(data)
      done()
    })
  })

  it('extract Block of Redstone', function (done) {
    blockExtractor.blockInfobox('Block of Redstone', date, function (err, data) {
      if (err) {
        return done(err)
      }
      console.log(data)
      done()
    })
  })

  it('extract Ladder infobox', function (done) {
    blockExtractor.blockInfobox('Ladder', date, function (err, data) {
      if (err) {
        return done(err)
      }
      console.log(data)
      done()
    })
  })

  it('extract wood infobox', function (done) {
    wikiTextParser.getFixedArticle('Wood', date, function (err, data) {
      if (err) {
        done(err)
        return
      }
      const sectionObject = wikiTextParser.pageToSectionObject(data)

      const infoBox = wikiTextParser.parseInfoBox(sectionObject.content)
      const values = infoBox.values
      console.log(values)
      done()
    })
  })

  // starting with {{about
  it('extract pumkin infobox', function (done) {
    wikiTextParser.getFixedArticle('Pumpkin', date, function (err, data) {
      if (err) {
        done(err)
        return
      }
      const sectionObject = wikiTextParser.pageToSectionObject(data)

      console.log(sectionObject.content)
      const infoBox = wikiTextParser.parseInfoBox(sectionObject.content)
      const values = infoBox.values
      console.log(values)
      done()
    })
  })

  // starting with {{about
  it('extract carrot', function (done) {
    wikiTextParser.getFixedArticle('Carrot', date, function (err, data) {
      if (err) {
        done(err)
        return
      }
      const sectionObject = wikiTextParser.pageToSectionObject(data)

      console.log(sectionObject.content)
      const infoBox = wikiTextParser.parseInfoBox(sectionObject.content)
      const values = infoBox.values
      console.log(values)
      done()
    })
  })

  // starting with {{quote
  it('extract ladder', function (done) {
    wikiTextParser.getFixedArticle('Ladder', date, function (err, data) {
      if (err) {
        done(err)
        return
      }
      const sectionObject = wikiTextParser.pageToSectionObject(data)

      console.log(sectionObject.content)
      const infoBox = wikiTextParser.parseInfoBox(sectionObject.content)
      const values = infoBox.values
      console.log(values)
      done()
    })
  })

  // with templates on its own line
  it('extract gravel', function (done) {
    wikiTextParser.getFixedArticle('Gravel', date, function (err, data) {
      if (err) {
        done(err)
        return
      }
      const sectionObject = wikiTextParser.pageToSectionObject(data)

      console.log(sectionObject.content)
      const infoBox = wikiTextParser.parseInfoBox(sectionObject.content)
      const values = infoBox.values
      console.log(values)
      done()
    })
  })
})
