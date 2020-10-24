module.exports = deepFind

function deepFind (o, k) {
  if (typeof o !== 'object') { return null }
  return Object.keys(o).reduce(function (acc, ke) {
    if (acc !== null) { return acc }
    if (ke === k) { return o[ke] }
    return deepFind(o[ke], k)
  }, null)
}
