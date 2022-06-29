'use strict'

const { PassThrough, pipeline } = require('stream')
const split = require('split2')
const cloneable = require('cloneable-readable')

function pecker (stream, opts, onpeek) {
  if (typeof opts === 'function') return pecker(stream, {}, opts)
  if (typeof onpeek !== 'function') throw new Error('onpeek must be set')

  const objectMode = stream.readableObjectMode
  const maxBuffer = typeof opts.maxBuffer === 'number' ? opts.maxBuffer : 65535

  stream = cloneable(stream)

  let splitter = split(undefined, undefined, { maxLength: maxBuffer })
  let errored = false

  const result = new PassThrough({ objectMode })

  pipeline(stream, splitter, () => {})
  splitter.on('error', onError)

  const secondClone = stream.clone()
  process.nextTick(() => {
    secondClone.pause()
  })

  secondClone.on('error', onError)

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
      secondClone.removeListener('error', onError)
      pipeline(secondClone, newStream, result, () => {})

      splitter.destroy()
      splitter = null
    }
  })

  return result

  function onError (err) {
    if (errored) {
      return
    }
    errored = true
    result.destroy(err)
  }
}

module.exports = pecker
