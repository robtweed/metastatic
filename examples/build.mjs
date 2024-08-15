/*

Typical use:

- Node.js:

  node build.mjs demo

  node build.mjs tutorial

- Bun.js

  bun build.mjs demo

  bun build.mjs tutorial


By default, the builder will look for an input file named index.meta
and create an output file named index.html

*/

import {MetaStatic} from 'metastatic';

let metaStatic = new MetaStatic({
  tagLibraryPath: './metaTagLibraries/',
  inputPath: './sites/',
  outputPath: './sites/',
  contentPath: {
    tutorial: './sites/tutorial/content'
  }
});

let site = process.argv[2];
site = site + '/';
let inFile = 'index.meta';
let outFile = 'index.html';
let debug = false;
let p3 = process.argv[3]; // || 'index.meta';
let p4 = process.argv[4]; // || 'index.html';
let p5 = process.argv[5];
if (typeof p3 !== 'undefined') {
  if (p3 === 'true' || p3 === 'false') {
    debug = p3 === 'true';
    console.log(99999);
    if (typeof p4 !== 'undefined') inFile = p4;
    if (typeof p5 !== 'undefined') outFile = p5;
  }
  else {
    inFile = p3;
    if (typeof p4 !== 'undefined') outFile = p4;
  }
}
if (inFile === '') {
  console.log('No input file defined');
}
else {
  await metaStatic.buildPage({
    inputFileName: site + inFile,
    outputFileName: site + outFile,
    debug: debug
  });
}
