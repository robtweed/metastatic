import {MetaStatic} from 'metastatic';

let metaStatic = new MetaStatic({
  tagLibraryPath: './metaTagLibraries/',
  inputPath: './sites/demo/',
  outputPath: './sites/demo/',
  contentPath: {
    demo: './sites/mgateway/content'
  }
});

let inFile = process.argv[2] || 'index.meta';
let outFile = process.argv[3] || 'index.html';
if (inFile === '') {
  console.log('No input file defined');
}
else {
  await metaStatic.buildPage({
    inputFileName: inFile,
    outputFileName: outFile
  });
}
