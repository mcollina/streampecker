'use string'

const pecker = require('./')
const tape = require('tape')
const concat = require('concat-stream')
const { Readable, Transform } = require('stream')

function uppercase (data, enc, cb) {
  cb(null, data.toString().toUpperCase())
}

tape('swap to uppercase', function (t) {
  const r = Readable.from([
    'hello\n',
    'world\n'
  ])
  const p = pecker(r, async function (data) {
    t.equal(data, 'hello')
    return new Transform({ transform: uppercase })
  })

  p.pipe(concat(function (data) {
    t.same(data.toString(), 'HELLO\nWORLD\n')
    t.end()
  }))
})

tape('error', function (t) {
  const r = Readable.from([
    'hello\n',
    'world\n'
  ])
  const p = pecker(r, async function (data) {
    throw new Error('kaboom')
  })

  p.on('error', function (err) {
    t.equal(err.message, 'kaboom')
    t.end()
  })
})

tape('swap to uppercase (no async)', function (t) {
  const r = Readable.from([
    'hello\n',
    'world\n'
  ])
  const p = pecker(r, function (data) {
    t.equal(data, 'hello')
    return new Transform({ transform: uppercase })
  })

  p.pipe(concat(function (data) {
    t.same(data.toString(), 'HELLO\nWORLD\n')
    t.end()
  }))
})

tape('error', function (t) {
  const r = Readable.from([
    'hello\n',
    'world\n'
  ])
  const p = pecker(r, function (data) {
    throw new Error('kaboom')
  })

  p.on('error', function (err) {
    t.equal(err.message, 'kaboom')
    t.end()
  })
})

tape('error in the original stream', function (t) {
  const r = new Readable({
    read () {
      this.destroy(new Error('kaboom'))
    }
  })
  const p = pecker(r, function (data) {
    t.fail('should not be called')
  })

  p.on('error', function (err) {
    t.equal(err.message, 'kaboom')
    t.end()
  })
  p.resume()
})

tape('maxBuffer (default)', function (t) {
  const r = new Readable({
    read () {
      this.push(Buffer.alloc(65535 + 1))
    }
  })
  const p = pecker(r, function (data) {
    t.fail('should not be called')
  })

  p.on('error', function (err) {
    t.equal(err.message, 'maximum buffer reached')
    t.end()
  })
  p.resume()
})

tape('maxBuffer (option)', function (t) {
  const r = new Readable({
    read () {
      this.push(Buffer.alloc(42 + 1))
    }
  })
  const p = pecker(r, { maxBuffer: 42 }, function (data) {
    t.fail('should not be called')
  })

  p.on('error', function (err) {
    t.equal(err.message, 'maximum buffer reached')
    t.end()
  })
  p.resume()
})
