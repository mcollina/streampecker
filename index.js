'use strict'

const { PassThrough, pipeline } = require('stream')
const split = require('split2')
const cloneable = require('cloneable-readable')

function pecker (stream, opts, onpeek) {
  if (typeof opts === 'function') return pecker(stream, {}, opts)
  if (typeof onpeek !== 'function') throw new Error('onpeek must be set')

  const objectMode = stream.readableObjectMode

  stream = cloneable(stream)

  let splitter = split()

  const result = new PassThrough({ objectMode })

  stream.pipe(splitter)

  const secondClone = stream.clone()
  process.nextTick(() => {
    secondClone.pause()
  })

  secondClone.resume()

  splitter.once('readable', function () {
    const line = splitter.read()
    try {
      const p = onpeek(line)
      if (typeof p.then === 'function') {
        p.then(onStream, onError)
      } else {
        onStream(p)
      }
    } catch (err) {
      onError(err)
    }

    function onStream (newStream) {
      pipeline(secondClone, newStream, result, () => {})

      splitter.destroy()
      splitter = null
    }

    function onError (err) {
      result.destroy(err)
    }
  })

  return result
}

module.exports = pecker
