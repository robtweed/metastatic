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

 23 August 2024

 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const jsdom = require("jsdom");
const collapse = require('collapse-whitespace');
const beautify = require('js-beautify').html;
const kwx = require('keyword-extractor');
const pluralise = require('pluralize');
const { JSDOM } = jsdom;
import { readFile, writeFile } from 'fs/promises';
import {marked} from 'marked';
import {readdirSync} from 'fs';

import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

let uid=0;
let templateUid;
let wait;

function sortArr(arr) {

  function compare( a, b ) {
    if ( a < b ){
      return -1;
    }
    if ( a > b ){
      return 1;
    }
    return 0;
  }

  arr.sort(compare);
}

function hasChildElements(element) {     
  for (let child of element.childNodes) {
    if (child.nodeType === 1) return true;
  }
  return false;
}

function getChildElements(element) {
  let children = [];
  for (let child of element.childNodes) {
    if (child.nodeType === 1) children.push(child);
  }
  return children;
}

function isMetaTag(element) {
  return element.localName.includes('-');
}

function elementString(element) {
  let str = '<' + element.localName;
  for (let attr of element.attributes) {
    str = str + ' ' + attr.name + '="' + attr.value + '"';
  }
  return str + '>';
}

class MetaStatic {

  constructor(options) {
    options = options || {};
    this.debug = false;
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
    this.indexContent = options.indexContent || false;
    this.wordToFileIndex = {};
  }

  stringToId(string) {
    if (string.startsWith('#')) string = string.slice(1);
    string = string.replaceAll("'", '');
    string = string.replace(/\W/g, '-').toLowerCase();
    return string.replaceAll('--', '-');
  }
  
  async fetchMetaTag(tagName) {
    let path = this.tagLibraryPath + tagName.split('-')[0] + '/' + tagName + '.' + this.metaTagFileExtension;
    let error = false;
    let xml;
    try {
      xml = await readFile(path, this.encoding);
    }
    catch(err) {
      error = err;
      console.log('Unable to process MetaTag ' + tagName);
      throw new Error('Unable to read MetaTag source file: ' + path);
    }
    xml = this.precompile(xml);
    let metaDom = new JSDOM(xml, {contentType: this.contentType});
    let templateEls = metaDom.window.document.getElementsByTagName('template');
    let scriptTags = metaDom.window.document.getElementsByTagName('script');
    let firstChild = metaDom.window.document.firstChild;
    return {
      templateEls: templateEls,
      scriptTags: scriptTags
    };
  }
  
  async substitute(child, templateEl, fragment, document) {
  
    let subs = {};
    let wordlist = [];
    let subNames = [];
    let attrs = templateEl.attributes;
    this.log('template attributes:');
    for (let attr of attrs) {
      this.log(attr.name + ': ' + attr.value);
      let value;
      if (attr.value === '<uid') {
        value = templateUid;
      }
      else if (attr.value.startsWith('=>')) {
        value = attr.value.split('=>')[1];
        // substitute any existing variable attributes
        for (let name in subs) {
          value = value.replace(name, subs[name]);
        }
        value = eval(value) || '';
      }
      else if (attr.value.startsWith('^')) {
        this.log('parent attribute value: ');
        let pattr = attr.value.slice(1);
        this.log('1 pattr = ' + pattr);
        let dflt = '';
        if (pattr.includes('|')) {
          let pcs = pattr.split('|');
          pattr = pcs[0];
          dflt = pcs[1];
        }
        this.log('2 pattr = ' + pattr);
        value = child.getAttribute(pattr);
        if ((!value || value === '') && child.hasAttribute(pattr)) {
          value = pattr;
        }
          
        if (!value || value === '') {
          value = dflt;
          this.log('3 value = ' + value);
        }
        if (value === '*<empty>*') value = '';
      }
      this.log(value);
      subs[attr.name] = value;
      subNames.push(attr.name);
    }
    this.log('substitution:');
    this.log({subs});
    subNames.sort((a, b) => b.length - a.length);
    this.log(subNames);
  
    let tags = fragment.querySelectorAll('*');
    for (let tag of tags) {
      this.log('substituting values in ' + tag.localName);
      // substitute attribute values
      let attrs = [];
      for (let attr of tag.attributes) {
        attrs.push(attr);
      }
      for (let attr of attrs) {
        this.log('attribute: ' + attr.name);
        let isEmpty = false;
        let value = attr.value;
        if (!value) {
          isEmpty = true;
          value = attr.name;
          tag.setAttribute(attr.name, attr.name);
        }
        this.log('175: attr value = ' + value);
        if (value !== '') {
          for (let name of subNames) {
            let subVal = subs[name];
            this.log('replace ' + name + ' with ' + subVal);
            value = value.replace(name, subVal);
          }
          tag.setAttribute(attr.name, value);
        }
        else {
          if (subNames.includes(attr.name)) {
            for (let name of subNames) {
              this.log('217: name = ' + name);
              if (name === attr.name) {
                let subVal = subs[name];
                this.log('subVal = ' + subVal);
                if (subVal !== '') {
                  if (isEmpty) value = subVal;
                  tag.setAttribute(subVal, value);
                }
                this.log('210');
                tag.removeAttribute(attr.name);
              }
            }
          }
        }
      }
      // substitute markdown text nodes
      // find only those elements that have a single child of type 3
      this.log(219);
      let cnodes = tag.childNodes;
      if (cnodes.length === 1 && cnodes[0].nodeType === 3) {
        let textContent = tag.textContent;
        let changed = false;
        for (let name of subNames) {
          let val = subs[name];
          if (textContent && textContent.includes(name)) {
            textContent = textContent.replaceAll(name, val);
            if (textContent.startsWith('markdown:')) {
              let filename = textContent.split('markdown:')[1];
              let app = filename.split('.')[0];
              filename = filename.split(app + '.')[1];
              let section;
              if (filename.includes('#')) {
                let pcs = filename.split('#');
                filename = pcs[0];
                section = pcs[1];
              }
              let filepath = this.contentPath[app] + filename;
              try {
                textContent = await readFile(filepath, this.encoding);
              }
              catch(err) {
                console.log('Error processing markdown content file');
                throw new Error('Unable to read ' + filename);
              }
              if (this.indexContent) {
                let str = textContent.replace(/[^\w\s\']|_/g, " ").replace(/\s+/g, " ");
                wordlist = kwx.extract(str, {
                  language: 'english',
                  remove_digits: true,
                  return_changed_case: true,
                  remove_duplicates: true
                });
                let words = {};
                for (let word of wordlist) {
                  word = word.replace("'","");
                  word = pluralise.singular(word);
                  words[word] = true;
                }
                wordlist = [];
                let hash = filename.split('.md')[0];
                for (let word in words) {
                  if (word.length > 1) {
                    if (!this.wordToFileIndex[word]) this.wordToFileIndex[word] = {};
                    this.wordToFileIndex[word][hash] = '';
                  }
                }
              }
              textContent = marked.parse(textContent);
              if (section) {
                let temp = document.createElement('div');
                temp.innerHTML = textContent;
                let header = temp.getElementsByTagName('h1')[0];
                if (section === 'header') {
                  if (header) {
                    textContent = header.textContent;
                  }
                  else {
                    textContent = '';
                  }
                }
                if (section === 'body' && header) {
                  header.parentNode.removeChild(header);
                  textContent = temp.innerHTML;
                }
              }
            }
            changed = true;
          }
        }
        if (changed) {
          if (tag.localName === 'style') {
            let arr = textContent.split('\n');
            let arr2 = [];
            for (let line of arr) {
              if (!(line.includes(': ;') || line.includes(':;'))) {
                arr2.push(line);
              }
            }
            textContent = arr2.join('\n');
          }
          tag.innerHTML = textContent;
        }
      }
    }
    return {
      fragment: fragment,
      wordlist: wordlist
    };
  }

  precompile(content) {
    return content.replaceAll(/<(.*?) .*?\/>/gm, (match, tagName) => {
      return `${match.slice(0, -2)}></${tagName}>`;
    });
  }

  async buildPage(args) {
    args = args || {};
    this.debug = args.debug || false;
    if (this.debug) wait = readline.createInterface({ input, output });
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
  
  async pause(n) {
    if (this.debug) {
      await wait.question('*** <= ' + n + ' continue?');
    }
  }
  
  log(text) {
    if (this.debug) console.log(text);
  }
  
  async parse(input, outFile) {
    let xml = this.precompile(input);
    const dom = new JSDOM(xml, {contentType: this.contentType});

    let _this = this;
    let scripts = {};
    let onloadFns = [];
    
    let slotsByMetaTag = {};
    let metaTagsBySlot = {};
    
    let document = dom.window.document;
    //document.body.setAttribute('onload', 'init()');
    let scriptEl = document.createElement('script');

    function isEmpty(obj) {
      for (let name in obj) {
        return false;
      }
      return true;
    }
    
    function isMetaTag(element) {
      return element.localName.includes('-');
    }
    
    function addToBeSlotted(toBeSlotted, slot, element) {
      if (!toBeSlotted[slot]) toBeSlotted[slot] = [];
      toBeSlotted[slot].push(element);
    }
    
    function appendToSlot(toBeSlotted, slotName, parentNode) {
      if (slotName && slotName !== '' && toBeSlotted[slotName]) {
        for (let frag of toBeSlotted[slotName]) {
          parentNode.appendChild(frag);
        }
        delete toBeSlotted[slotName];
      }
    }
    
    function dump(toBeSlotted) {
      console.log('++++++++++++++++++++++++++++++++++++++++++++++++');
      for (let slot in toBeSlotted) {
        console.log(slot);
        for (let el of toBeSlotted[slot]) {
          console.log(el.outerHTML);
          console.log('-----');
        }
        console.log('oooo');
      }
      console.log('++++++++++++++++++++++++++++++++++++++++++++++++');
    }

    async function getChildren(element, parents, toBeSlotted) {
      let tbs_original = Object.assign({}, toBeSlotted);
      uid++;
      let elementName = element.localName;
      _this.log('getChildren called for ' + elementString(element));
      _this.log('parents:');
      _this.log({parents});
      _this.log(element.outerHTML);
      //if (!isEmpty(parentSlots)) _this.log({parentSlots});
      let children = getChildElements(element);

      let childNo = 0;
      for (let child of children) {
        childNo++;
        let parentsArr = parents.slice(0);
        let tagName = child.localName;
        _this.log('child of : ' + elementString(element) + ': ' + elementString(child)); 
        await _this.pause(407);
        
        if (isMetaTag(child)) {
          //locate slots within Meta Tags
          // overwrite any existing slots in current copy of toBeSlotted
          //  note: done here to be before any children using these slots are processed

          let meta = await _this.fetchMetaTag(tagName);
          let templateEls = meta.templateEls;
          let count = 0;
          for (let template of templateEls) {
            let slots = template.content.querySelectorAll('slot');
            for (let slot of slots) {
              count++;
              let slotName = slot.getAttribute('name');
              toBeSlotted[slotName] = [];
            }
          }
          await _this.pause(425);
        }

        if (tagName === 'slot') {
          let slotName = child.getAttribute('name');
          if (slotName && slotName !== '') {
            _this.log('about to append fragment(s) to slot ' + slotName);
            _this.log({toBeSlotted});
            appendToSlot(toBeSlotted, slotName, child, parents);
            _this.log('pending slotted elements appended to ' + elementString(child));
            _this.log(child.outerHTML);
            await _this.pause(436);
          }
        }
        
        else if (tagName === 'foreach') {
          let type = child.getAttribute('type') || 'filename';
          if (type === 'filename') {
            let namespace = child.getAttribute('namespace');
            let filepath = _this.contentPath[namespace];
            let prefix = child.getAttribute('prefix');
              
            let files = readdirSync(filepath);
            let fileArr = [];
            for (const filename of files) {
              if (filename.startsWith(prefix)) {
                fileArr.push(filename);
              }
            }
            sortArr(fileArr);
            let ix = -1;
            for (let name of fileArr) {
              ix++;
              let cchild = child.cloneNode(true);
              let tags = cchild.querySelectorAll('*');
              for (let tag of tags) {
                // substitute attribute values
                let attrs = [];
                for (let attr of tag.attributes) {
                  attrs.push(attr);
                }
                for (let attr of attrs) {
                  let value = attr.value;
                  if (value !== '') {
                    if (value.includes('<index')) {
                      value = value.replace('<index', ix);
                    }
                    if (value.includes('<iterator')) {
                      value = value.replace('<iterator', name);
                    }
                    if (value.startsWith('=>')) {
                      value = value.slice(2);
                      value = eval(value) || '*<empty>*';
                    }
                    tag.setAttribute(attr.name, value);
                  }
                }
                
              }
               
              let parr = parentsArr.slice(0);
              parr.push(cchild.localName);
              let tbsClone = Object.assign({}, toBeSlotted);
              await getChildren(cchild, parr, tbsClone);
            }
          }
        }
        // end of foreach processing
        
        else {
          if (hasChildElements(child)) {
            _this.log(elementString(child) + ' has children so will begin processing them');
            await _this.pause(497);
            let parr = parents.slice(0);
            parr.push(child.localName);
            let tbsClone = Object.assign({}, toBeSlotted);
            await getChildren(child, parr, tbsClone);
            _this.log('1.1 all children of ' + tagName + ' processed');
            _this.log(child.outerHTML);
            _this.log('1.1 ******');
          }
        }
        _this.log('All children of ' + elementString(child) + ' processed');
        await _this.pause(508);
        let slotOverride;
        if (child.hasAttribute('slot')) {
          let slot = child.getAttribute('slot');
          child.removeAttribute('slot');
          if (!isMetaTag(child)) {
            addToBeSlotted(toBeSlotted, slot, child);
            _this.log(elementString(child) + ' to be added to slot: ' + slot);
            _this.log('parents: ' + parents.toString());
            await _this.pause(517);
          }
          slotOverride = slot;
        }

        
        if (isMetaTag(child)) {
          _this.log(elementString(child) + ' is a meta tag so start to expand it');

          await _this.pause(526);
          _this.log('fetching source for ' + tagName);
           
          let meta = await _this.fetchMetaTag(tagName); 
          let templateEls = meta.templateEls;
          let buildFn;
          let wordlist;

          let tno = 0;
          templateUid = uid;
          //****
          parentsArr.push(child.localName);
          let templateDoms = [];
          for (let templateEl of templateEls) {
            tno++;
            _this.log('Processing template ' + tno + ' of ' + templateEls.length + ': ' + tagName);
            await _this.pause(542);
            
            let slotName = templateEl.getAttribute('slot');
            if (slotOverride) {
              _this.log('template slot ' + slotName + ' overridden with calling element slot ' + slotOverride);
              slotName = slotOverride;
            }
            if (slotName) {
              _this.log('4.0 slot found for template: ' + slotName);
              await _this.pause(551);
            }
            else {
              slotName = '*' + elementName;
              _this.log('4.0 no slot so set to ' + slotName);
              await _this.pause(556);
            }
            let metaDom = document.createElement('section');
            metaDom.setAttribute('class', 'metastatic');
            let fragment = templateEl.content.cloneNode(true);
            
            let res = await _this.substitute(child, templateEl, fragment, document);
            fragment = res.fragment;
            wordlist = res.wordlist;

            let childNo = 0;
            let fragmentChildren = getChildElements(fragment);
            // pre-process - are any 1st-level children meta Tags? if so insert a span
            for (let fChild of fragmentChildren) {
              childNo++;
              if (childNo === 1) {
                let onload = fChild.getAttribute('onload');
                if (onload) {
                  onloadFns.push(onload);
                }
                fChild.removeAttribute('onload');
              }
              if (isMetaTag(fChild)) {
                let parentNode = fChild.parentNode;
                let fxChild = parentNode.removeChild(fChild);
                let span = document.createElement('span');
                parentNode.appendChild(span);
                span.appendChild(fxChild);
              }
            }
            
            fragmentChildren = getChildElements(fragment);
            
            for (let fChild of fragmentChildren) {
              let fTagName = fChild.localName;
              _this.log('fragmentChild: ' + elementString(fChild));
              
              if (hasChildElements(fChild)) {
                _this.log('583 about to process children of fragment ' + elementString(fChild));
                await _this.pause(584);
                let parr = parentsArr.slice(0);
                parr.push(fChild.localName);
                let tbsClone = Object.assign({}, toBeSlotted);
                await getChildren(fChild, parr, tbsClone);
                _this.log('4.1 all children of ' + fTagName + ' processed');
                _this.log('appending ' + elementString(fChild) + ' to metaDom:');
                _this.log(fChild.outerHTML);
                _this.log('4.1 ****');
                metaDom.appendChild(fChild);
                await _this.pause(594);
              }
              else {
                _this.log('4.15 ****');
                _this.log('fragment child ' + elementString(fChild) + ' has no children');
                _this.log('so append it to metaDom:');
                metaDom.appendChild(fChild);
                _this.log(metaDom.outerHTML);
                await _this.pause(602);
              }
            }
            _this.log('processing of fragment children completed');
            _this.log('4.2 Final MetaDom for fragment is:');
            _this.log(metaDom.outerHTML);
            await _this.pause(608);
            
            if (toBeSlotted['*' + tagName]) {
              // append any pending child metaDom that is assigned by default to this metaTag's metaDom
              appendToSlot(toBeSlotted, '*' + tagName, metaDom.firstChild);
            }
            
            _this.log('destination slot for this metaDom: ' + slotName);
            await _this.pause(616);

            _this.log('4.3 slotName: ' + slotName);
            _this.log('metaDom set aside for insertion into slot ' + slotName);
            //addToBeSlotted(toBeSlotted, slotName, metaDom);
            addToBeSlotted(tbs_original, slotName, metaDom);
            templateDoms.push(metaDom);
            _this.log(metaDom.outerHTML);
            await _this.pause(623);
          }

          _this.log('432 all templates processed for metatag: ' + elementString(child));
          _this.log('moving on to processing any script tags it might have');
          await _this.pause(628);

          // now process any script tags
          
          for (let scriptTag of meta.scriptTags) {
            if (scriptTag.hasAttribute('type')) {
              if (scriptTag.getAttribute('type') === 'build') {
                buildFn = scriptTag.textContent;
                _this.log('execute build function');
                eval('(function (Templates, MetaStatic, WordList) {' + buildFn + '}(templateDoms, _this, wordlist));');
              }
            }
            else {
              if (!scripts[tagName]) {
                let text = scriptTag.textContent;
                text = text.replaceAll('<uid', templateUid);
                scriptEl.textContent += '\n' + text;
                scripts[tagName] = true;
              }
            }
          }
          
          _this.log('651 end of meta tag processing for ' + child.localName);
          _this.log('Now delete it from page DOM');
          let parentNode = child.parentNode;
          let childTag = elementString(child);
          let parentTag = elementString(parentNode);
          parentNode.removeChild(child);
          _this.log('***deleted ' + childTag + ' from ' + parentTag);
          _this.log(parentTag.outerHTML);
          await _this.pause(659);
        }
        
        // end of meta tag
        
        _this.log('664 processing of child ' + child.localName + ' completed');
        await _this.pause(665);    
      }
      _this.log('9 processing of element ' + element.localName + ' completed');
      
      _this.log(element.outerHTML);
      _this.log('9 *****');
      _this.log('9.1 toBeSlotted:');
      _this.log({toBeSlotted});
      await _this.pause(673); 
    }

    // start recursion

    let toBeSlotted = {
      '*head': [],
      '*body': []
    };
    await getChildren(document.documentElement, [], toBeSlotted);
    _this.log('document children all processed');
    
    appendToSlot(toBeSlotted, '*head', document.head);
    appendToSlot(toBeSlotted, '*body', document.body);
    
    // add script tag and text
    
    let scriptText = scriptEl.textContent;
    let init = '\nfunction init() {\n';
    for (let fn of onloadFns) {
      init = init + fn + ';\n';
    }
    init = init + '}\n';
    scriptText = init + scriptText;

    scriptText = scriptText + "\ndocument.addEventListener('DOMContentLoaded', function() {init();});";

    scriptText = '(function () {\n' + scriptText + '\n})();'

    scriptEl.textContent = scriptText;
          
    document.body.appendChild(scriptEl);

    // remove any added span tags with xslot attribute and shift their contents

    // remove section tags

    let stags = document.documentElement.querySelectorAll('section.metastatic');
    let stagsArr = [];
    for (let stag of stags) {
      stagsArr.push(stag);
    }
    for (let stag of stagsArr) {
      let childArr = [];
      for (let child of stag.children) {
        childArr.push(child);
      }
      for (let child of childArr) {
        let xdom = stag.removeChild(child);
        stag.parentNode.insertBefore(xdom, stag);
      }
      stag.parentNode.removeChild(stag);
    }
    
    stags = document.documentElement.querySelectorAll('slot');
    stagsArr = [];
    for (let stag of stags) {
      stagsArr.push(stag);
    }
    for (let stag of stagsArr) {
      let childArr = [];
      for (let child of stag.children) {
        childArr.push(child);
      }
      for (let child of childArr) {
        let xdom = stag.removeChild(child);
        stag.parentNode.insertBefore(xdom, stag);
      }
      stag.parentNode.removeChild(stag);
    }

    // remove white space if configured
    //  then output generated static page

    if (wait) wait.close();
    _this.log('------------');
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
    let comment1 = '<!-- Generated by MetaStatic: ' + new Date().toUTCString() + ' -->';
    let comment2 = '<!-- https://github.com/robtweed/metastatic -->';
    html = '<!DOCTYPE html>\n' + comment1 + '\n' + comment2 + '\n' + html;
    console.log(html);
    console.log('Writing to ' + outFile);
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



