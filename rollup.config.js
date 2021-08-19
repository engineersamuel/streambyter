import typescript from '@rollup/plugin-typescript';

export default {
  input: './dist/index.js',
  output: [
    {
      format: 'commonjs',
      name: 'streambyter',
      dir: 'dist',
      exports: 'named',
    },
  ],
  plugins: [typescript()],
};
