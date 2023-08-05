module.exports = { parseStackable }

function parseStackable (stackable) {
  if (stackable === undefined) return null
  if (stackable.indexOf('N/A') !== -1) return 0
  if (stackable.indexOf('No') !== -1) return 1
  let result = stackable.match(/'Yes,? \\(([0-9]+)\\)/)
  if (result === null) {
    result = stackable.match(/Yes, ([0-9]+)/)
    if (result === null) { return null }
  }
  return parseInt(result[1])
}
