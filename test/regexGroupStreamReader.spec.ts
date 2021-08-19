import { expect } from 'chai';
import fg from 'fast-glob';
import { createReadStream } from 'fs';
import mock from 'mock-fs';
import { regexGroupStreamReader, regexGroupStreamsReader } from '../src/index';
import faker from 'faker';
import { DirectoryItem } from 'mock-fs/lib/filesystem';

type StreamOptions = {
  highWaterMark?: number;
};

describe('regexGroupStreamReader ', () => {
  //-----------------------------------------------------
  // Test matching groups with default high water mark
  // and 1 byte at a time
  //-----------------------------------------------------
  describe('group matches w/1 file', () => {
    beforeEach(() => {
      mock({
        '/tmp': {
          streambyter: {
            'test-1.json': mock.file({
              content: JSON.stringify({ a: 1, b: 2, c: 3 }),
              ctime: new Date(),
              mtime: new Date()
            }),
          }
        }
      });
    });

    afterEach(() => {
      mock.restore();
    });

    type TestArg = {
      filePath: string,
      regex: RegExp,
      expectedResult: object,
      streamOptions?: StreamOptions;
    };
    const testArgs: TestArg[] = [
      {
        filePath: '/tmp/streambyter/test-1.json',
        regex: /"b":(?<value>\d+).*?/,
        expectedResult: { value: '2' },
        // 65536
      },
      {
        filePath: '/tmp/streambyter/test-1.json',
        regex: /"b":(?<b>\d+).*?/,
        expectedResult: { b: '2' },
        streamOptions: {
          highWaterMark: 1
        }
      },
      {
        filePath: '/tmp/streambyter/test-1.json',
        regex: /"a":(?<a>\d+).*?"b":(?<b>\d+).*?"c":(?<c>\d+).*?/,
        expectedResult: { a: '1', b: '2', c: '3' },
      },
      {
        filePath: '/tmp/streambyter/test-1.json',
        regex: /"a":(?<a>\d+).*?"b":(?<b>\d+).*?"c":(?<c>\d+).*?/,
        expectedResult: { a: '1', b: '2', c: '3' },
        streamOptions: {
          highWaterMark: 1
        }
      },
    ];

    testArgs.forEach((testArg) => {
      it(`read stream from ${testArg.filePath}, args: ${JSON.stringify(testArg)}`, async () => {
        const stream = createReadStream(testArg.filePath, testArg.streamOptions);
        const result = await regexGroupStreamReader({ stream }, testArg.regex);
        expect(result.result).to.eql(testArg.expectedResult);
      });
    });
  });

  describe('group w/o matches w/1 file', () => {
    beforeEach(() => {
      mock({
        '/tmp': {
          streambyter: {
            'test-1.json': mock.file({
              content: JSON.stringify({ a: 1, b: 2, c: 3 }),
              ctime: new Date(),
              mtime: new Date()
            }),
          }
        }
      });
    });

    afterEach(() => {
      mock.restore();
    });

    type TestArg = {
      filePath: string,
      regex: RegExp,
      expectedResult: undefined,
      streamOptions?: StreamOptions;
    };
    const testArgs: TestArg[] = [
      {
        filePath: '/tmp/streambyter/test-1.json',
        regex: /"z":(?<value>\d+).*?/,
        expectedResult: undefined,
      },
    ];

    testArgs.forEach((testArg) => {
      it(`read stream from ${testArg.filePath}, args: ${JSON.stringify(testArg)}`, async () => {
        const stream = createReadStream(testArg.filePath, testArg.streamOptions);
        const result = await regexGroupStreamReader({ stream }, testArg.regex);
        expect(result.result).to.eql(testArg.expectedResult);
      });
    });
  });

  //-----------------------------------------------------
  // Test matching groups from 1k globbed files
  //-----------------------------------------------------
  describe('group matches w/many files', () => {
    const totalLength = 1000;
    const files: Record<string, () => File> = {};
    for (let i = 0; i < totalLength; i++) {
      files[`test-${i}.json`] = mock.file({
        content: JSON.stringify(faker.datatype.json()),
        ctime: new Date(),
        mtime: new Date()
      }) as unknown as () => File;
    }

    beforeEach(() => {
      mock({
        '/tmp': {
          streambyter: files as unknown as DirectoryItem
        }
      });
    });

    afterEach(() => {
      mock.restore();
    });

    type TestArg = {
      glob: string,
      regex: RegExp,
      expectedLength: number,
      streamOptions?: StreamOptions;
    };
    const testArgs: TestArg[] = [
      {
        glob: '/tmp/**/*.json',
        regex: /\\"foo\\":(?<value>.*?),/,
        expectedLength: totalLength
      },
      {
        glob: '/tmp/**/*.json',
        regex: /\\"foo\\":(?<value>.*?),/,
        expectedLength: totalLength,
        streamOptions: {
          highWaterMark: 1
        }
      },
    ];

    testArgs.forEach((testArg) => {
      it(`read stream from ${testArg.glob}, args: ${JSON.stringify(testArg)}`, async () => {
        const paths = await fg([testArg.glob]);
        const objs = paths.map((p) => ({ stream: createReadStream(p, testArg.streamOptions), path: p }));
        const results = await regexGroupStreamsReader(objs, testArg.regex);
        const filteredResults = results.filter((r) => r.result);
        expect(filteredResults).to.have.length(testArg.expectedLength);
      });
    });
  });

  describe('group w/o matches w/many files', () => {
    const totalLength = 1000;
    const files: Record<string, () => File> = {};
    for (let i = 0; i < totalLength; i++) {
      files[`test-${i}.json`] = mock.file({
        content: JSON.stringify(faker.datatype.json()),
        ctime: new Date(),
        mtime: new Date()
      }) as unknown as () => File;
    }

    beforeEach(() => {
      mock({
        '/tmp': {
          streambyter: files as unknown as DirectoryItem
        }
      });
    });

    afterEach(() => {
      mock.restore();
    });

    type TestArg = {
      glob: string,
      regex: RegExp,
      expectedLength: number,
      streamOptions?: StreamOptions;
    };
    const testArgs: TestArg[] = [
      {
        glob: '/tmp/**/*.json',
        regex: /\\"zed\\":(?<value>.*?),/,
        expectedLength: 0
      },
      {
        glob: '/tmp/**/*.json',
        regex: /\\"zed\\":(?<value>.*?),/,
        expectedLength: 0,
        streamOptions: {
          highWaterMark: 1
        }
      },
    ];

    testArgs.forEach((testArg) => {
      it(`read stream from ${testArg.glob}, args: ${JSON.stringify(testArg)}`, async () => {
        const paths = await fg([testArg.glob]);
        const objs = paths.map((p) => ({ stream: createReadStream(p, testArg.streamOptions), path: p }));
        const results = await regexGroupStreamsReader(objs, testArg.regex);
        const filteredResults = results.filter((r) => r.result);
        expect(filteredResults).to.have.length(testArg.expectedLength);
      });
    });
  });
});
