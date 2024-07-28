Configuration of MetaStatic's Builder module is performed when you instantiate its *MetaStatic* class.  You pass its constructor an *options* object as an argument.

The *options* object's properties are as follows:

- *tagLibraryPath*: the file path under which each of your Meta Tag Libraries are stored
- *inputPath*: the file path holding your *.meta* files which describe your Web Site's page(s)
- *outputPath*: the destination file path into which MetaStatic's Builder will output the generated HTML file
- *contentPath*: an object containing one or more key/value pairs, with each key/value pair describing the mapping of a *namespace* to a corresponding physical file path.  These are used by MetaStatic's Builder to locate Markdown content files that are referenced in Meta Tag attributes.

For example, the configuration used in your cloned repository is:

```javascript
const metaStatic = new MetaStatic({
  tagLibraryPath: './metaTagLibraries/',
  inputPath: './sites/',
  outputPath: './sites/',
  contentPath: {
    tutorial: './sites/tutorial/content'
  }
});
```


