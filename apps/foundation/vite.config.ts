import {defineConfig} from 'vitest/config';
export default defineConfig({server:{host:'127.0.0.1',port:4322,strictPort:true},build:{sourcemap:false,rollupOptions:{input:{preview:"index.html",account:"account.html"}}},test:{include:['tests/**/*.test.ts']}});
