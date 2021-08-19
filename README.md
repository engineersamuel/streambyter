<div align="center">
  <h1>
    <br/>
    <img src="./images/stream.svg"/>
    <br />
    Take a byte out of Streams!
    <br />
    <br />
  </h1>
  <sup>
    <br />
    <a href="https://www.npmjs.com/package/streambyter">
       <img src="https://img.shields.io/npm/v/streambyter.svg" alt="npm package" />
    </a>
    <a href="https://github.com/engineersamuel/streambyter/issues">
      <img src="https://img.shields.io/github/issues/engineersamuel/streambyter" alt="github issues" />
    </a>
    <a href="https://www.npmjs.com/package/streambyter">
      <img src="https://img.shields.io/npm/dm/streambyter.svg" alt="npm downloads" />
    </a>
  </sup>
  <br />
  <pre>npm i -s <a href="https://www.npmjs.com/package/streambyter">streambyter</a></pre>
  <br />
  Zero dependency micro-library (3.3Kb)
  <br />
</div>

# Table of Contents

- [Table of Contents](#table-of-contents)
  - [Why](#why)
  - [Install](#install)
  - [Usage](#usage)
  - [Testing](#testing)
  - [Contributing](#contributing)
  - [Publishing](#publishing)
  - [License](#license)

## Why

The primary functionality of the `streambyter` library is to efficiently iterate and execute regex against a large number of files/streams.  I created this library out of a need to quickly iterate thousands of large json files and extract out a single piece of text.  Out of the box the brute force way to do this is to download each json or text file, run a regex on each file, then return results.  The problems with this approach are:

- Each file must be downloaded fully (Speed, bandwidth, and memory cost)
- The regex is run against the full file (Speed cost)

And this is where `streambyter` comes in.  You can use this library to efficient execute regex (testing or matching groups) against many files locally or in the cloud.  This library doesn't care where the stream is located, just as long as it's a stream.

## Install

`$ npm i -s streambyter`

## Usage

In the below example a file path can be provided with a regex with named matching groups to extract those groups out as a dictionary.

```javascript
import { regexGroupPathReader } from 'streambyter';

// Assume there is a `file` with contents: '{"foo":"Hello","bar":"World", /* more content */}'

const filePath = '/path/to/some.json';
const regex = /"foo":"(?<foo>.*?)","bar":"(?<bar>.*?)"/;
const result = await regexGroupPathReader({ path: filePath }, regex);

console.log(result); // prints { path: '/path/to/some.json', result: { foo: "Hello", bar: "World" }}
```

In this example a stream can be provided with a regex with named matching groups to extract those groups out as a dictionary.  Note that here you have to create the stream yourself, but the benefit is you have full control over the options of that stream, like manually changing the `highWaterMark`.  Why might you want to do this?  Maybe you know for a fact that the data you want is in the first 100 bytes of the json, then you'd want to set the `highWaterMark` to `100` since the `streambyter` library will close the stream after the first match.  Note that in the above `regexGroupPathReader` the stream is created with `{ highWaterMark: 512 }` by default.

```javascript
import { regexGroupStreamReader } from 'streambyter';
import { createReadStream } from 'fs';

// Assume there is a `file` with contents: '{"foo":"Hello","bar":"World", /* more content */}'

const filePath = '/path/to/some.json';
const regex = /"foo":"(?<foo>.*?)","bar":"(?<bar>.*?)"/;
const result = await regexGroupPathReader({ stream: createReadStream(filePath, { highWaterMark: 100 }) }, regex);

console.log(result); // prints { path: '/path/to/some.json', result: { foo: "Hello", bar: "World" }}
```

In this example an array of file paths can be provided along with a regex with named matching groups to extract those groups out as an array of dictionaries.

```javascript
import { regexGroupPathsReader } from 'streambyter';

// Assume there are an array of `files` with contents: '{"foo":"Hello1","bar":"World1", /* more content */}'
const filePaths = ['/path/to/some1.json', '/path/to/some2.json'];
const regex = /"foo":"(?<foo>.*?)","bar":"(?<bar>.*?)"/;

const objs = filePaths.map((p) => ({ path: p }));
const results = await regexGroupPathsReader(objs, regex);

console.log(results); // prints [{ path: '/path/to/some1.json', result: { foo: "Hello1", bar: "World1" }}, { path: '/path/to/some2.json', result: { foo: "Hello2", bar: "World2" }}]
```

In this example an array of streams can be provided along with a regex with named matching groups to extract those groups out as an array of dictionaries.

```javascript
import { regexGroupStreamsReader } from 'streambyter';
import { createReadStream } from 'fs';

// Assume there are an array of `files` with contents: '{"foo":"Hello1","bar":"World1", /* more content */}'
const filePaths = ['/path/to/some1.json', '/path/to/some2.json'];
const regex = /"foo":"(?<foo>.*?)","bar":"(?<bar>.*?)"/;

const objs = filePaths.map((p) => ({ stream: createReadStream(p, { highWaterMark: 100 }) }));
const results = await regexGroupStreamsReader(objs, regex);

console.log(results); // prints [{ path: '/path/to/some1.json', result: { foo: "Hello1", bar: "World1" }}, { path: '/path/to/some2.json', results: { foo: "Hello2", bar: "World2" }}]
```

You'll notice that objects are being passed instead of just the `path` or the `stream` alone, why?  The reason is so you can map back individual results.  For example if you had `await regexGroupPathsReader([{ path: '/path/to/a.txt', path: '/path/to/b.txt'}], regex)` that might result in: `[{ path: '/path/to/a.txt', result: { someMatch: '1' }}, {path: '/path/to/b/txt', result: { someMatch: '2' }}]`

See the `*.spec.ts` files in the [./test](https://github.com/engineersamuel/streambyter/tree/master/test) directory for a great reference on using the library.

Note that the library is built with [rollup.js](https://rollupjs.org/) and targets commonjs and is intended to be used with nodejs.

## Testing

`npm run test`

```text
30 passing (3s)

----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files |     100 |      100 |     100 |     100 |
 index.ts |     100 |      100 |     100 |     100 |
----------|---------|----------|---------|---------|-------------------
```

## Contributing

- `npm i`
- _make code changes_
- `npm run test`
- `npm run lint`
- `npm run build`

## Publishing

- Bump the [package.json](package.json) version
- `npm publish --access public`
- `git tag vx.y.z`
- `git push origin --tags`

## License

[MIT](./LICENSE)
