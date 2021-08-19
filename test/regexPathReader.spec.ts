import { expect } from 'chai';
import fg from 'fast-glob';
import mock from 'mock-fs';
import { regexPathReader, regexPathsReader } from '../src/index';
import faker from 'faker';
import { DirectoryItem } from 'mock-fs/lib/filesystem';

type StreamOptions = {
  highWaterMark?: number;
};

describe('regexPathReader ', () => {
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
      expectedResult: boolean,
      streamOptions?: StreamOptions;
    };
    const testArgs: TestArg[] = [
      {
        filePath: '/tmp/streambyter/test-1.json',
        regex: /"b":(?<value>\d+).*?/,
        expectedResult: true
        // 65536
      },
      {
        filePath: '/tmp/streambyter/test-1.json',
        regex: /"b":(?<b>\d+).*?/,
        expectedResult: true,
        streamOptions: {
          highWaterMark: 1
        }
      },
      {
        filePath: '/tmp/streambyter/test-1.json',
        regex: /"a":(?<a>\d+).*?"b":(?<b>\d+).*?"c":(?<c>\d+).*?/,
        expectedResult: true,
      },
      {
        filePath: '/tmp/streambyter/test-1.json',
        regex: /"a":(?<a>\d+).*?"b":(?<b>\d+).*?"c":(?<c>\d+).*?/,
        expectedResult: true,
        streamOptions: {
          highWaterMark: 1
        }
      },
    ];

    testArgs.forEach((testArg) => {
      it(`read stream from ${testArg.filePath}, args: ${JSON.stringify(testArg)}`, async () => {
        const result = await regexPathReader({ path: testArg.filePath }, testArg.regex);
        console.log({ path: (result as any).path, result: result.result });
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

        const objs = paths.map((p) => ({ path: p }));
        const results = await regexPathsReader(objs, testArg.regex, testArg.streamOptions);

        const filteredResults = results.filter((r) => r);
        expect(filteredResults).to.have.length(testArg.expectedLength);
      });
    });
  });
});
