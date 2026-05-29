import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'

// 读取 package.json 获取版本号
const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
)

// 生成构建时间戳
const buildTimestamp = new Date().toLocaleString('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
})

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    // 在构建时注入版本号和构建时间
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __BUILD_TIME__: JSON.stringify(buildTimestamp),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Vitest 测试配置
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/types.ts',
      ],
    },
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 启用 Vue 编译器优化以提升性能
          hoistStatic: true, // 启用静态提升，减少渲染开销
          cacheHandlers: true, // 启用事件处理器缓存，减少内存占用
        }
      }
    }),
    viteSingleFile()
  ],
  server: {
    host: 'localhost', // 使用 localhost 避免权限问题
    port: 5000, // 更换为常用的 5000 端口
    strictPort: false, // 如果端口被占用,自动尝试下一个可用端口
  },
  build: {
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    // 目标设置为现代浏览器（与 tsconfig.json 保持一致）
    target: 'es2022',
    // 使用 terser 压缩,提供更好的兼容性
    // terser 比 esbuild 更成熟,在 iframe 沙盒环境中兼容性更好
    minify: 'terser',
    // 启用源码映射以便调试（生产环境可设为 false）
    sourcemap: false,
    // 启用 CSS 压缩
    cssMinify: true,
    terserOptions: {
      compress: {
        // 启用安全的压缩优化，平衡性能和兼容性
        arrows: true, // 转换箭头函数（ES2015+支持）
        collapse_vars: true, // 合并变量声明
        comparisons: true, // 优化比较运算
        computed_props: true, // 优化计算属性
        hoist_funs: false, // 不提升函数声明（保持兼容性）
        hoist_props: true, // 提升常量属性
        hoist_vars: false, // 不提升变量（避免作用域问题）
        inline: 2, // 内联简单函数（2=激进内联）
        loops: true, // 优化循环
        negate_iife: true, // 优化 IIFE
        properties: true, // 优化属性访问
        reduce_funcs: true, // 优化函数
        reduce_vars: true, // 优化变量
        switches: true, // 优化 switch 语句
        toplevel: false, // 不优化顶层作用域（保持全局变量）
        typeofs: true, // 优化 typeof
        booleans: true, // 优化布尔值
        if_return: true, // 优化 if-return
        sequences: true, // 优化序列
        unused: true, // 移除未使用代码
        conditionals: true, // 优化条件语句
        dead_code: true, // 移除死代码
        evaluate: true, // 计算常量表达式
        join_vars: true, // 合并连续的 var 声明
        keep_fargs: false, // 移除未使用的函数参数
        side_effects: true, // 移除无副作用的语句
      },
      mangle: {
        // 启用变量名混淆以减小文件大小
        safari10: true, // 兼容 Safari 10
      },
      format: {
        // 输出格式配置
        comments: false, // 移除注释
        ecma: 2020, // terser 5.44.0 最高支持 ES2020
        safari10: true, // 兼容 Safari 10
        webkit: true, // 兼容 WebKit
      },
    },
    rollupOptions: {
      external: ['vue', 'pinia', 'js-yaml', 'dompurify', 'marked'],
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        manualChunks: undefined,
        // 使用更兼容的代码生成选项
        generatedCode: {
          constBindings: false, // 不使用 const 绑定
          objectShorthand: false, // 不使用对象简写
          reservedNamesAsProps: true, // 保留属性名
          symbols: false, // 不使用 Symbol
        },
        // 确保全局变量正确映射
        globals: {
          vue: 'Vue',
          pinia: 'Pinia',
          'js-yaml': 'jsyaml',
          dompurify: 'DOMPurify',
          marked: 'marked'
        }
      }
    }
  }
})

