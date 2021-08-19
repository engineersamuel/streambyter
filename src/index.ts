import { createReadStream, ReadStream } from 'fs';

type RegexResult<T> = {
  result?: Record<string, string>;
} & T;

type BooleanResult<T> = {
  result?: boolean,
} & T;

type HasStream<T> = {
  stream: ReadStream | NodeJS.ReadableStream;
} & T;

type HasPath<T> = {
  path: string;
} & T;

type Options = {
  highWaterMark?: number;
};

/**
 * Given an object with a 'stream' variable returns the result of calling `regexStreamReaderHelper`
 * @param {HasStream<T>} obj - Object that container a `stream` variable.
 * @param {Regex} regex - Regex to test the cumulative chunks from the stream against.
 */
export const regexStreamReaderHelper = <T>(obj: HasStream<T>, regex: RegExp): Promise<BooleanResult<T>> => {
  return new Promise((resolve, reject) => {
    let content = '';
    let result = false;

    obj.stream.on('close', () => {
      resolve({
        result,
        ...obj
      });
    });

    obj.stream.on('data', (chunk: any) => {
      content += chunk;
      const matched = regex.test(content);
      if (matched) {
        result = true;
        try {
          (obj.stream as ReadStream).close();
        } catch (e) {
          // no-op
        }
      }
    });

    obj.stream.on('error', reject);
  });
};

/**
 * Given an object with a 'stream' variable returns the result of calling `regexStreamReaderHelper`
 * @param {HasStream<T>} obj - Object that container a `stream` variable.
 * @param {Regex} regex - Regex to test the cumulative chunks from the stream against.
 */
export const regexStreamReader = <T>(obj: HasStream<T>, regex: RegExp): Promise<BooleanResult<T>> => {
  return regexStreamReaderHelper(obj, regex);
};

/**
 * Constructs a stream from the path in the given object and calls the `regexStreamReaderHelper`
 * @param {HasPath<T>} obj - Object that container a `path` variable.
 * @param {Regex} regex - Regex to test the cumulative chunks from the stream against.
 */
export const regexPathReader = <T>(obj: HasPath<T>, regex: RegExp, options?: Options): Promise<BooleanResult<T>> => {
  const defaultOptions: Options = options || {
    highWaterMark: 512
  };

  const stream = createReadStream(obj.path, defaultOptions);
  return regexStreamReaderHelper({ ...obj, stream }, regex);
};

/**
 * Helper function to read the stream and match against the given regex
 * @param {HasPath<T>} obj - Object that container a `stream` variable.
 * @param {Regex} regex - Regex to test the cumulative chunks from the stream against.
 */
const regexGroupStreamReaderHelper = <T>(obj: HasStream<T>, regex: RegExp): Promise<RegexResult<T>> => {
  return new Promise((resolve, reject) => {
    let content = '';
    let result: Record<string, string>;

    obj.stream.on('close', () => {
      resolve({
        result,
        ...obj
      });
    });

    obj.stream.on('data', (chunk) => {
      content += chunk;

      const match = regex.exec(content);
      if (match?.groups) {
        result = match.groups;
        try {
          (obj.stream as ReadStream).close();
        } catch (e) {
          // no-op
        }
      }
    });

    obj.stream.on('error', reject);
  });
};

export const regexGroupStreamReader = <T>(obj: HasStream<T>, regex: RegExp): Promise<RegexResult<T>> => {
  return regexGroupStreamReaderHelper(obj, regex);
};

/**
 * Given an array of objects that have a `path` variable construct corresponding streams and execute the given regex against those streams returning the corresponding results.
 * @param {HasPath<T>} objs - Object that contains a `path` variable.
 * @param {Regex} regex - Regex to test the cumulative chunks from the stream against.
 * @param {Options} options - Options that influence the stream (Optional).
 */
export const regexGroupPathReader = <T>(obj: HasPath<T>, regex: RegExp, options?: Options): Promise<RegexResult<T>> => {
  const defaultOptions: Options = options || {
    highWaterMark: 512
  };

  const stream = createReadStream(obj.path, defaultOptions);
  return regexGroupStreamReaderHelper({ ...obj, stream }, regex);
};

/**
 * Given an array of objects that each have a `stream` variable execute the given regex against those streams returning the corresponding results.
 * @param {HasStream<T>[]} objs - Array of objects that each contains a `stream` variable.
 * @param {Regex} regex - Regex to test the cumulative chunks from the stream against.
 */
export const regexStreamsReader = async <T>(objs: HasStream<T>[], regex: RegExp): Promise<BooleanResult<T>[]> => {
  const streamPromises = objs.map((o) => regexStreamReader(o, regex));
  const results = await Promise.all(streamPromises);
  return results;
};

/**
 * Given an array of objects that each have a `stream` variable execute the given regex against those streams returning the corresponding results.
 * @param {HasStream<T>[]} objs - Array of objects that each contains a `stream` variable.
 * @param {Regex} regex - Regex to test the cumulative chunks from the stream against.
 */
export const regexGroupStreamsReader = async <T>(objs: HasStream<T>[], regex: RegExp): Promise<RegexResult<T>[]> => {
  const streamPromises = objs.map((o) => regexGroupStreamReader(o, regex));
  const results = await Promise.all(streamPromises);
  return results;
};

/**
 * Given an array of objects that have a `path` variable construct corresponding streams and execute the given regex against those streams returning the corresponding results.
 * @param {HasPath<T>[]} objs - Array of objects that each contains a `path` variable.
 * @param {Regex} regex - Regex to test the cumulative chunks from the stream against.
 * @param {Options} options - Options that influence the stream (Optional).
 */
export const regexGroupPathsReader = async <T>(objs: HasPath<T>[], regex: RegExp, options?: Options): Promise<RegexResult<T>[]> => {
  const streamPromises = objs.map((o) => regexGroupPathReader(o, regex, options));
  const results = await Promise.all(streamPromises);
  return results;
};

/**
 * Given an array of objects that have a `path` variable construct corresponding streams and execute the given regex against those streams returning the corresponding results.
 * @param {HasPath<T>[]} objs - Array of objects that each contains a `path` variable.
 * @param {Regex} regex - Regex to test the cumulative chunks from the stream against.
 * @param {Options} options - Options that influence the stream (Optional).
 */
export const regexPathsReader = async <T>(objs: HasPath<T>[], regex: RegExp, options?: Options): Promise<BooleanResult<T>[]> => {
  const streamPromises = objs.map((o) => regexPathReader(o, regex, options));
  const results = await Promise.all(streamPromises);
  return results;
};
