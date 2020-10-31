/* eslint-env mocha */

// items tests
const itemExtractor = require('./../lib/item_extractor.js')

describe('item_extractor', function () {
  const date = '2015-05-07T00:00:00Z'
  it('get arrow infobox', function (cb) {
    itemExtractor.itemInfobox('Arrow', date, function (err, data) {
      if (err) {
        cb(err)
        return
      }
      console.log(data)
      cb()
    })
  })

  it('get wait disc infobox', function (cb) {
    itemExtractor.itemInfobox('Wait Disc', date, function (err, data) {
      if (err) {
        cb(err)
        return
      }
      console.log(data)
      cb()
    })
  })

  it('get golden apple infobox', function (cb) {
    itemExtractor.itemInfobox('Golden Apple', date, function (err, data) {
      if (err) {
        cb(err)
        return
      }
      console.log(data)
      cb()
    })
  })

  it('get Beetroot Seeds infobox', function (cb) {
    itemExtractor.itemInfobox('Beetroot Seeds', date, function (err, data) {
      if (err) {
        cb(err)
        return
      }
      console.log(data)
      cb()
    })
  })
})
