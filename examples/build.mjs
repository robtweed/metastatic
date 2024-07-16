/*

Typical use:

- Node.js:

  node build.mjs demo

  node build.mjs sbadmin

- Bun.js

  bun build.mjs demo

  bun build.mjs sbadmin


By default, the builder will look for an input file named index.meta
and create an output file named index.html

*/

import {MetaStatic} from 'metastatic';

let metaStatic = new MetaStatic({
  tagLibraryPath: './metaTagLibraries/',
  inputPath: './sites/',
  outputPath: './sites/',
  contentPath: {
    demo: './sites/demo/content',
    mgw: './sites/mgateway/content'
  }
});

let site = process.argv[2];
site = site + '/';
let inFile = process.argv[3] || 'index.meta';
let outFile = process.argv[4] || 'index.html';
if (inFile === '') {
  console.log('No input file defined');
}
else {
  await metaStatic.buildPage({
    inputFileName: site + inFile,
    outputFileName: site + outFile
  });
}
