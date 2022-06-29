# streampecker

Transform stream that lets you peek the first line before deciding how to parse it.

```
npm install streampecker
```

This module was forked from [`peak-stream`](https://github.com/mafintosh/peak-stream) at version v1.1.3.

## Usage

```js
const pecker = require('streampecker')
const ldjson = require('ldjson-stream')
const csv = require('csv-parser')
const { Readable } = require('stream')

const isCSV = function (data) {
  return data.toString().indexOf(',') > -1
}

const isJSON = function (data) {
  try {
    JSON.parse(data)
    return true
  } catch (err) {
    return false
  }
}

const parser = function (stream) {
  return pecker(stream, function (data) {
    // maybe it is JSON?
    if (isJSON(data)) return ldjson()

    // maybe it is CSV?
    if (isCSV(data)) return csv()

    // we do not know - bail
    throw new Error('No parser available')
  })
}

let parse

parse = parser(Readable.from('{"hello":"world"}\n{"hello":"another"}\n'))

parse.on('data', function (data) {
  console.log('from ldj:', data)
})

parse = parser(Readable.from('test,header\nvalue-1,value-2\n'))

parse.on('data', function (data) {
  console.log('from csv:', data)
})
```

## License

MIT
