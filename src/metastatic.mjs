/*

 ----------------------------------------------------------------------------
 | MetaStatic: Static Site Generator using Meta Tags                         |
 |                                                                           |
 | Copyright (c) 2024 MGateway Ltd,                                          |
 | Redhill, Surrey UK.                                                       |
 | All rights reserved.                                                      |
 |                                                                           |
 | https://www.mgateway.com                                                  |
 | Email: rtweed@mgateway.com                                                |
 |                                                                           |
 |                                                                           |
 | Licensed under the Apache License, Version 2.0 (the "License");           |
 | you may not use this file except in compliance with the License.          |
 | You may obtain a copy of the License at                                   |
 |                                                                           |
 |     http://www.apache.org/licenses/LICENSE-2.0                            |
 |                                                                           |
 | Unless required by applicable law or agreed to in writing, software       |
 | distributed under the License is distributed on an "AS IS" BASIS,         |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  |
 | See the License for the specific language governing permissions and       |
 |  limitations under the License.                                           |
 ----------------------------------------------------------------------------

 15 July 2024

 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const jsdom = require("jsdom");
const collapse = require('collapse-whitespace');
const beautify = require('js-beautify').html;
const { JSDOM } = jsdom;
import { readFile, writeFile } from 'fs/promises';
import {marked} from 'marked';

let uid=0;

class MetaStatic {

  constructor(options) {
    options = options || {};
    this.contentType = options.contentType || 'text/html';
    this.compress = options.compress || false;
    this.tagLibraryPath = options.tagLibraryPath || './';
    if (this.tagLibraryPath.slice(-1) !== '/') this.tagLibraryPath+= '/';
    this.metaTagFileExtension = options.metaTagFileExtension || 'mst';
    this.inputPath = options.inputPath || './';
    if (this.inputPath.slice(-1) !== '/') this.inputPath+= '/';
    this.contentPath = options.contentPath || {};
    for (let app in this.contentPath) {
      let path = this.contentPath[app];
      if (path.slice(-1) !== '/') this.contentPath[app] += '/';
    }
    this.outputPath = options.outputPath || './';
    if (this.outputPath.slice(-1) !== '/') this.outputPath+= '/';
    this.encoding = options.encoding || 'utf8';
  }

  precompile(content) {
    return content.replaceAll(/<(.*?) .*?\/>/gm, (match, tagName) => {
      return `${match.slice(0, -2)}></${tagName}>`;
    });
  }

  async buildPage(args) {
    args = args || {};
    let inputFileName = args.inputFileName || 'design.html';
    let inFile = this.inputPath + inputFileName;

    let outputFileName = args.outputFileName || 'index.html';
    let outFile = this.outputPath + outputFileName;
    try {
      let xml = await readFile(inFile, this.encoding);
      await this.parse(xml, outFile);
    }
    catch(err) {
      console.log('Error attempting to read input file at ' + inFile);
      console.log(err);
    }
  }

  async parse(input, outFile) {
    let xml = this.precompile(input);
    const dom = new JSDOM(xml, {contentType: this.contentType});

    let _this = this;
    let scripts = {};
    let scriptEl;
    let onloadFns = [];
    let document = dom.window.document;

    function isEmpty(obj) {
      for (let name in obj) {
        return false;
      }
      return true;
    }

    //async function getChildren(element, pSlots) {
      //let parentSlots = Object.assign({}, pSlots) || {};

    async function getChildren(element, parentSlots) {
      //console.log('getChildren called for ' + element.localName);
      //if (!isEmpty(parentSlots)) console.log({parentSlots});
      let children = [];
      let addToSlot = [];
      for (let child of element.childNodes) {
        children.push(child);
      }

      let childNo = 0;
      for (let child of children) {
        let slots = {};
        if (child.nodeType === 1) {
          childNo++;
          uid++;
          //console.log('child: ' + child.localName);

          // standard HTML tag without a slot attribute
          // and parentSlots has a * slot defined - this meant the
          // parent template had no defined slots, so its firstChild
          // element will be used instead
          //  mark them as to be appended to the * element

          if (!child.localName.includes('-')) {
            if (child.hasAttribute('slot')) {
              /*
              let slotName = child.getAttribute('slot');
              if (parentSlots[slotName]) {
                addToSlot.push({
                  element: child,
                  appendTo: parentSlots[slotName].element
                });
              }
              child.removeAttribute('slot');
              */
            }
            else {
              if (parentSlots['*']) {
                addToSlot.push({
                  element: child,
                  appendTo: parentSlots['*'].element
                });
              }
            }
          }

          // process temporary xslot tags - move contents

          if (child.hasAttribute('xslot')) {
            let id = child.getAttribute('xslot');
            if (parentSlots[id]) {
              //console.log(parentSlots['menu'].element.outerHTML);
              //console.log('--------');
              let el = child.parentNode.removeChild(child);
              parentSlots[id].element.appendChild(el);
            }
            //console.log(parentSlots['menu'].element.outerHTML);
          }

          if (child.localName === 'body') {
            child.setAttribute('onload', 'init()');
            scriptEl = child.getElementsByTagName('script')[0];
            if (!scriptEl) {
              scriptEl = document.createElement('script');
              child.appendChild(scriptEl);
            }
          }

          for (let attr of child.attributes) {
            if (attr.value === '') attr.value = attr.name;
          }

          // process meta tag

          if (child.localName.includes('-')) {

            console.log('fetch source for ' + child.localName);

            let path = _this.tagLibraryPath + child.localName.split('-')[0] + '/' + child.localName + '.' + _this.metaTagFileExtension;
            let xml = await readFile(path, _this.encoding);
            xml = _this.precompile(xml);
            let metaDom = new JSDOM(xml, {contentType: _this.contentType});
            let templateEls = metaDom.window.document.getElementsByTagName('template');
            let scriptTags = metaDom.window.document.getElementsByTagName('script');

            // handle the script tags in the metaTag definition...

            let buildFn;
            for (let scriptTag of scriptTags) {
              if (scriptTag.getAttribute('type') === 'build') {
                buildFn = scriptTag.textContent;
              }
              else {
                if (!scripts[child.localName]) {
                  let scriptContent = scriptEl.textContent;
                  scriptContent = scriptContent + '\n' + scriptTag.textContent;
                  scriptEl.textContent = scriptContent;
                }
                scripts[child.localName] = true;
              }
            }
            let templateUid = uid;

            for (let templateEl of templateEls) {

              // map template parameter attributes

              let params = {};
              let slot;

              let ok = true;
              let firstChild = templateEl.content.firstChild;
              do {
                if (firstChild.nodeType === 1) {
                  ok = false;
                }
                else {
                  firstChild = firstChild.nextSibling;
                }
              }
              while (ok);

              // set up appribute value mapping
              for (let attr of templateEl.attributes) {

                if (attr.name === 'slot') {
                  slot = attr.value;
                }

                if (attr.name.startsWith(':')) {
                  let value = attr.value;

                  if (value.startsWith('=>')) {
                    value = value.split('=>')[1];
                    // substitute any existing variable attributes
                    for (let name in params) {
                      value = value.replace(name, params[name]);
                    }
                    value = eval(value) || '';
                  }

                  else if (value.startsWith('^')) {
                    // get value from corresponding parent attribute
                    let dflt = '';
                    if (value.includes('|')) {
                      let pcs = value.split('|');
                      value = pcs[0];
                      dflt = pcs[1];
                    }
                    let pval = child.getAttribute(value.slice(1));
                    if (pval && pval !== '') {
                      value = pval;
                    }
                    else {
                      value = dflt;
                    }
                  }

                  // variable attribute value passed from slot

                  else if (value.startsWith('_')) {
                    //console.log(JSON.stringify(parentSlots, null, 2));
                    if (slot) {
                      //console.log('slot: ' + slot);
                      //console.log('value: ' + value);
                      value = parentSlots[slot].args[value.slice(1)];
                    }
                  }
                  params[attr.name] = value;
                }
              }
              params['<instanceNo'] = childNo;
              params['<uid'] = +templateUid;
              //console.log({params});


              // now map these parameter values into template attributes

              let tags = templateEl.content.querySelectorAll('*');
              for (let tag of tags) {
                // substitute attribute values
                for (let attr of tag.attributes) {
                  let value = attr.value;
                  for (let name in params) {
                    value = value.replace(name, params[name]);
                  }
                  tag.setAttribute(attr.name, value);
                }
                // substitute markdown text nodes
                // find only those elements that have a single child of type 3
                let cnodes = tag.childNodes;

                if (cnodes.length === 1 && cnodes[0].nodeType === 3) {
                  let textContent = tag.textContent;
                  let changed = false;
                  for (let name in params) {
                    if (textContent && textContent.includes(name)) {
                      textContent = textContent.replace(name, params[name]);
                      if (textContent.startsWith('markdown:')) {
                        let filename = textContent.split('markdown:')[1];
                        let app = filename.split('.')[0];
                        filename = filename.split(app + '.')[1];
                        filename = _this.contentPath[app] + filename;
                        textContent = await readFile(filename, _this.encoding);
                        textContent = marked.parse(textContent);
                        //console.log('textContent:');
                        //console.log(textContent);
                      }
                      changed = true;
                    }
                  }
                  if (changed) tag.innerHTML = textContent;
                }
              }

              let onLoad = firstChild.getAttribute('onload');
              console.log('onLoad = ' + onLoad);
              if (onLoad) {
                onloadFns.push(onLoad);
                firstChild.removeAttribute('onload');
              }

              // create slot mapping for any child tags applied to this meta-tag

              let slotTags = templateEl.content.querySelectorAll('slot');
              //console.log('no of slotTags: ' + slotTags.length);
              let tagsToRemove = [];

              // if no slots defined, then children will be appended to the outer (first) tag
              if (slotTags.length === 0) {
                slots['*'] = {
                  element: firstChild,
                  args: {}
                };
              }
              else {
                // children will be appended to the slot tag's parent
                for (let slotTag of slotTags) {         
                  let id = slotTag.getAttribute('name');
                  let el = slotTag.parentNode;
                  if (slotTag.parentNode.localName.includes('-')) {
                    let spanEl = document.createElement('span');
                    spanEl.setAttribute('slot', id);
                    spanEl.setAttribute('xslot', id);
                    slotTag.parentNode.insertBefore(spanEl, slotTag);
                    el = spanEl;
                  }
                  slots[id] = {
                    element: el,
                    args: {}
                  };
                  for (let attr of slotTag.attributes) {
                    if (attr.name.startsWith('_')) {
                      slots[id].args[attr.name.slice(1)] = attr.value;
                    }
                  }
                  tagsToRemove.push(slotTag);
                }
              }
              for (let slotTag of tagsToRemove) {
                slotTag.parentNode.removeChild(slotTag);
              }

              // recurse through the template's tags to process any meta tags within it

              await getChildren(templateEl.content, {});

              // now determine where to append the meta-tag's content

              // slot is where you'd expect to append instances of this meta tag
              //  but can be overridden by an explicit slot attribute in the
              //  specific instance

              if (child.hasAttribute('slot')) {
                let id = child.getAttribute('slot');
                if (parentSlots[id]) {
                  parentSlots[id].element.appendChild(templateEl.content);
                }
              }

              else if (slot) {
                if (slot.startsWith('*')) {
                  document.getElementsByTagName(slot.slice(1))[0].appendChild(templateEl.content);
                }
                else {
                  console.log('slot = ' + slot);
                  console.log({parentSlots});
                  if (parentSlots[slot]) {
                    parentSlots[slot].element.appendChild(templateEl.content);
                  }
                }
              }
              else {
                if (parentSlots['*']) {
                  parentSlots['*'].element.appendChild(templateEl.content);
                }
                // simply insert content before parent
                child.parentNode.insertBefore(templateEl.content, child);
              }
            }

            if (buildFn) {
              //console.log('execute build function');
              eval('(function () {' + buildFn + '}());');
            }

          }
          
          if (child.hasChildNodes()) {
            //console.log('*** slots: ****');
            //console.log(slots);

            // append current slots to any existing parent slots

            let pslots = Object.assign({}, parentSlots);
            for (let name in slots) {
              pslots[name] = slots[name];
            }

            await getChildren(child, pslots);
          }
          
        }
      }

      // for meta tags with standard HTML tags as children
      for (let obj of addToSlot) {
        obj.appendTo.appendChild(obj.element);
      }

      // remove the now processed meta tags
      for (let child of children) {
        if (child.nodeType === 1 && child.localName.includes('-')) {
          //console.log('remove child: ' + child.localName);
          child.parentNode.removeChild(child);
        }
      }


    }

    // start recursion

    await getChildren(document.documentElement, {});

    // remove any added span tags with xslot attribute and shift their contents

    let spanTags = document.querySelectorAll('span');
    for (let spanTag of spanTags) {
      if (spanTag.hasAttribute('xslot')) {
        let scs = spanTag.children;
        for (let sc of scs) {
          let c = sc.parentNode.removeChild(sc);
          spanTag.parentNode.insertBefore(c, spanTag);
        }
        spanTag.parentNode.removeChild(spanTag);
      }
    }

    // add the init() script and add any onload handlers from templates

    let scriptText = scriptEl.textContent;
    let init = '\nfunction init() {\n';
    for (let fn of onloadFns) {
      init = init + fn + ';\n';
    }
    init = init + '}\n';
    scriptEl.textContent = init + scriptText;


    // remove white space if configured
    //  then output generated static page

    console.log('------------');
    let html;
    if (this.compress) {
      collapse(document.documentElement);
      html = document.documentElement.outerHTML;
    }
    else {
      html = beautify(document.documentElement.outerHTML, {
        indent_size: 2,
        preserve_newlines: false,
        indent_inner_html: true
      });
    }
    console.log(html);
    try {
      await writeFile(outFile, html, 'utf8');
    }
    catch(err) {
      console.log('Error writing output to ' + outFile);
      console.log(err);
    }
  }


};

export {MetaStatic};


