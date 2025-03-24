import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import { obfuscator } from 'rollup-obfuscator';
import dts from 'rollup-plugin-dts';

const globals = {
  Cesium: 'Cesium',
  cesium: 'Cesium',
};

const plugins = [
  resolve(),
  typescript({
    tsconfigOverride: {
      tsconfig: './tsconfig.json',
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        compilerOptions: {
          target: 'ES6',
          module: 'ES6',
          sourceMap: false,
          declaration: true,
          declarationMap: false,
          forceConsistentCasingInFileNames: true,
        },
        include: ['src/**/*'],
      },
    },
  }),
  nodeResolve(),
  obfuscator({
    options: {
      // 压缩代码
      compact: true,
      // 是否启用控制流扁平化(降低1.5倍的运行速度)
      controlFlowFlattening: true,
      // 应用概率;在较大的代码库中，建议降低此值，因为大量的控制流转换可能会增加代码的大小并降低代码的速度。
      controlFlowFlatteningThreshold: 1,
      // 随机的死代码块(增加了混淆代码的大小)
      deadCodeInjection: true,
      // 死代码块的影响概率
      deadCodeInjectionThreshold: 1,
      // 此选项几乎不可能使用开发者工具的控制台选项卡
      debugProtection: true,
      // 如果选中，则会在“控制台”选项卡上使用间隔强制调试模式，从而更难使用“开发人员工具”的其他功能。
      debugProtectionInterval: true,
      // 通过用空函数替换它们来禁用console.log，console.info，console.error和console.warn。这使得调试器的使用更加困难。
      disableConsoleOutput: true,
      // 标识符的混淆方式 hexadecimal(十六进制) mangled(短标识符)
      identifierNamesGenerator: 'hexadecimal',
      log: false,
      // 是否启用全局变量和函数名称的混淆
      renameGlobals: true,
      // 通过固定和随机（在代码混淆时生成）的位置移动数组。这使得将删除的字符串的顺序与其原始位置相匹配变得更加困难。如果原始源代码不小，建议使用此选项，因为辅助函数可以引起注意。
      rotateStringArray: true,
      // 混淆后的代码,不能使用代码美化,同时需要配置 cpmpat:true;
      selfDefending: true,
      // 删除字符串文字并将它们放在一个特殊的数组中
      stringArray: true,
      stringArrayEncoding: 'rc4',
      stringArrayThreshold: 1,
      // 允许启用/禁用字符串转换为unicode转义序列。Unicode转义序列大大增加了代码大小，并且可以轻松地将字符串恢复为原始视图。建议仅对小型源代码启用此选项。
      transformObjectKeys: true,
      unicodeEscapeSequence: false,
    },
  }),
];
export default [
  {
    input: './src/index.ts',
    output: {
      file: './dist/index.esm.js',
      format: 'esm',
    },
    external: ['cesium'],
    plugins,
  },
  {
    input: './src/index.ts',
    output: [{ file: './dist/index.d.ts', format: 'esm' }],
    context: 'window',
    external: ['cesium'],
    plugins: [dts({ rollupTypes: true })],
  },
  {
    input: './src/index.ts',
    output: {
      name: 'isosurface',
      exports: 'named',
      file: 'dist/isosurface.main.js',
      format: 'umd',
      sourcemap: false,
      globals,
    },
    external: ['cesium'],
    plugins,
  },
];
