# MetaStatic: Static Site Generator using Meta Tags
 
Rob Tweed <rtweed@mgateway.com>  
15 July 2024, MGateway  Ltd [https://www.mgateway.com](https://www.mgateway.com)  

Twitter: @rtweed

Google Group for discussions, support, advice etc: [http://groups.google.co.uk/group/enterprise-web-developer-community](http://groups.google.co.uk/group/enterprise-web-developer-community)

# What is MetaStatic?

*MetaStatic* is a JavaScript tool that allows you to build and maintain a static web site using:

- high-level tags that we call *Meta Tags* and that represent and encapsulate a particular set of user interface (UI) features and behaviours
- optionally, a simple text file-based Content Management System, with your content written using Markdown syntax

*MetatStatic* can be used with either Node.js or Bun.js.

Using *MetaStatic*, a Web Site maintainer can quickly and easily define and maintain a complex static web site that has a modern responsive user interface, using a few simple Meta Tags and without the need for complex JavaScript frameworks.

*MetaStatic* allows a Web Site to be described/defined completely declaratively, requiring no programming knowledge or expertise.

However, technical developers can create libraries of re-usable *MetaStatic* Meta Tags that encapsulate any amount of markup and JavaScript logic, to whatever degree of complexity is required.  These can then be used by a Web Site maintainer as building-blocks that describe the Web Site.

The file containing the Meta Tag-based definition of a web site is then used as the input to the *MetaStatic* module which converts it to a corresponding HTML file that can be run in a browser.

----

# Installation

```code
npm install metastatic
```

# Running the MetaStatic Builder

## Import the MetaStatic Class

``` javascript
import {MetaStatic} from 'metastatic';
```

## Create an Instance

Create an instance of the MetaStatic class, defining file paths that it will use to locate the resources needed during the build process, eg:

``` javascript
const metaStatic = new MetaStatic({
  tagLibraryPath: './metaTagLibraries/',
  inputPath: './sites/demo/',
  outputPath: './sites/demo/',
  contentPath: {
    demo: './sites/demo/content/'
  }
});
```

## Run the Builder

```javascript
await metaStatic.buildPage({
  inputFileName: 'index.meta',
  outputFileName: 'index.html'
});
```

----
# Inspiration for MetaStatic

## JavaScript Frameworks

Many people these days are using complex and cumbersome JavaScript frameworks such as React, Vue or Angular, to create what are actually just static Web Sites where the content is largely fixed and only occasionally updated.

This isn't perhaps so much of an issue if the maintainer of such a Web Site is technically well-versed in such a framework, but, more often than not, the maintainer is someone else in the organisation who has little or no detailed technical or programming expertise, but is more focused on ensuring that the content required for the site is accurate and kept up to date.  Such a Web Site maintainer will find it difficult to learn and understand the complexities involved when changes need to be made, and, nine times out of ten will need to go back to the original developer (if they are still available!) in order to make the change.

In any case, the use of such frameworks to create such Web Sites is often an unnecessary "sledgehammer to crack a nut".

Furthermore, such a site will typically  be slow to load and start for users, because it will require potentially huge files of JavaScript to be loaded into the browser before anything can begin to be rendered.

And just to add insult to injury, Web Sites developed using JavaScript frameworks that dynamically build the markup by manipulating the page DOM can be difficult for web crawlers to properly and fully process and index the content for search engines to use, resulting in sub-optimal Search Engine Optimisation (SEO).

## Content Management Systems

For Web Sites that require maintenance of a lot of content that can change over time, the usual solution is to use a Content Management System (CMS).  This requires specific technical skills and a potentially steep learning curve,  and often the cost of a license for the CMS and/or associated database.  The latter database may also need technical maintenance (eg backup, restore etc), again requiring specific technical expertise.

As a result, many Web Site maintainers turn to commercial packaged solutions such as Wordpress, Wix, Squarespace etc, most of which incur licensing or subscription costs and/or remote/cloud hosting, and potentially constraining the look and feel of the Web Site.  Migrating between such services can also be problematic, so vendor lock-in is a real risk of such a solution.

## CSS/JavaScript Templates

Meanwhile, there are a great many pre-built templates that can be used to create complex, modern, responsive user interfaces for static web sites, with the entire content and functionality delivered as a single HTML page.  See for example:

- the [W3 Schools W3.CSS Templates](https://www.w3schools.com/css/css_rwd_templates.asp)
- the [SB Admin Dashboard Template](https://startbootstrap.com/theme/sb-admin-2)

Templates such as these  don't require anything other than their own pre-defined CSS stylesheets and some behaviour-specific JavaScript files.  They don't require React, Vue, Angular or any other build and runtime framework.  As a result they are incredibly fast to load and run, and, being static HTML files, can be crawled and indexed completely for use by all search engines.

Whilst impressive in terms of their look and feel and functionality, tailoring such templates for a specific use case is, however, time-consuming, error-prone and fiddly, and requires a good understanding of HTML and JavaScript.  For a full web site, the page would be huge, and making content changes would require scanning or searching the HTML page and editing in situ.  More complex modifications, such as adding or changing new menu options, tabbed panels or content sections would probably be beyond the skills of a basic Web Site maintainer and would be a cumbersome task.

## Breaking Down Templates into Building Blocks

The thinking behind *MetaStatic* is: what if it was possible for a technically skilled developer to break down such templates into a hierarchy of high-level building blocks - Meta Tags - that represent the individual elements or components (eg the backdrop, the menus, tab controls, carousels etc) from which that template is constructed?  Armed with a library of such Meta Tags, a relatively unskilled Web Site maintainer could then define their own spefically-customised version that conforms to the template, but containing their own content and using a much simpler and intuitive shorthand description summarising the bulding blocks and content needed for their specific site.

The idea would be to process such a high-level Meta Tag description and generate a user-specific version of the template HTML that could be loaded into the browser.  If any changes were made to the Meta Tag description, simply re-running the build process would create an updated version of the HTML file needed for the Web Server.

The technical expertise required to build a Meta Tag library for a particular template would be a one-off expert task.  However, the resulting Tag Library could then be used repeatedly and easily by any number of Web Site maintainers who would not require particularly detailed technical skills.

## Content Management

Furthermore, if the text content of the Web Site could be held separately, maintained in simple text files in a directory, using the now widely used and easily understood Markdown syntax (using any convenient editor from *nano* upwards!), then this content could be pulled in at build time for inclusion in the final template file.  All this would require is a simple file naming convention and the ability to reference the corresponding file name in a Meta Tag that made use of that content.

No database would be needed, and no license or subscription fees needed.  All that would be needed would be a basic understanding of a server's directory structure and the ability to use a text editor and devise a simple file nomeclature convention.

## Ergo MetaStatic

So these are the underlying ideas and concepts behind *MetaStatic*: a new and deceptively simple way to create and maintain static Web Sites of any size and complexity, without the need for any complex JavaScript frameworks, CMS, database or build chain.


# Simple Example

With *MetaStatic, I could define a simple "Hello World" WebSite with just two Meta Tags as follows:

```html
<demo-background title="MetaStatic Demo">
  <demo-helloworld name="Rob" />
</demo-background>
```

All I need to provide, as the Web Site maintainer, is two values that are defined using standard tag attributes: *title* and *name*.

I would, of course, need the two Meta Tags that I've used above to have been defined for me.  Here's what the technical developer might have created to define them:


## *demo-background*

This creates the underlying backdrop for my web site, using two templates that populate the *head* and *body* sections respectively:


```html
<template slot="*head" :title="^title">
  <title>:title</title>
  <style>
    h1 {
      color: red;
    }
    h3 {
      color: blue;
      text-decoration: underline;
    }
    h3:hover {
      cursor: pointer;
    }
  </style>
</template>

<template :title="^title">
  <h1>:title</h1>
  <hr />
  <h3>
    <slot name="content" />
  </h3>
</template>
```

Note the &lt;template> tag's attributes that are prefixed with a colon (:) character.  These define variable values that can be used anywhere within the template's content and which are substituted at build time.  Values prefixed with a caret (^) character denote that the build-time value will come from the corresponding attribute in the instance of the Meta Tag. 

## demo-helloworld

This template will populate the *content* slot of the *demo-background* body template.  Note how it can include a &lt;script> tag:

```html
<template slot="content" :name="^name">
  <div onclick="hello(':name')">Click Me!</div>
</template>

<script>
function hello(name) {
  alert('Hello ' + name);
}
</script>
```

Running the *MetaStatic* builder module would then create the following static HTML file (*index.html*) which could be loaded directly fromm my Web Site to a browser:

```html
<html>

  <head>
    <title>MetaStatic Demo</title>
    <style>
      h1 {
        color: red;
      }

      h3 {
        color: blue;
        text-decoration: underline;
      }

      h3:hover {
        cursor: pointer;
      }
    </style>
  </head>

  <body onload="init()">
    <h1>MetaStatic Demo</h1>
    <hr>
    <h3>
      <div onclick="hello('Rob')">Click Me!</div>
    </h3>
    <script>
      function init() {}

      function hello(name) {
        alert('Hello ' + name);
      }
    </script>
  </body>

</html>
```

We now have a single HTML file that can be loaded into our Web Server and fetched by any browser.

You can hopefully see how the specific values for the *title* and *name* attributes that I used in my Meta Tag definition of the site have been used to populate the final run-time HTML file by the *MetaStatic* builder.


# What Are MetaStatic Meta Tags?

*MetaStatic* allows a developer to define high-level tags that we call *Meta Tags*.

Meta Tags use a simple HTML/XML-based syntax to describe the actual HTML tags that they will be converted to at build time.

Meta Tags can be used by a Web Site maintainer instead of standard HTML tags.

Just like HTML Tags, Meta Tags are designed to be capable of being nested inside each other, allowing the construction of high-level building blocks for easy Web Site maintenance.

## Meta Tag Contents

Meta Tags can contain:

- one or more *Templates* (defined using the &lt;template> tag)
- optionally a &lt;script> tag that contains any JavaScript that is needed by the Meta Tag to control its run-time behaviour

## Meta Tags versus WebComponents

Those of you familiar with WebComponents will have noticed that MetaStatic's Meta Tags borrow some of the syntax used in WebComponents:

- Meta Tags must include at least one hyphen
- Meta Tags make use of the &lt;template> and &lt;slot tags

However, MetaStatic's Meta Tags are **not** WebComponents: they aren't sent to the browser for instantiation and invocation.  Instead, MetaStatic's build module substitutes them for the low-level HTML tags defined in each Meta Tag's template(s), and the browser only receives and render those generated HTML tags.

## Meta Tag Naming Convention

Meta Tag names:

- must be hyphenated
- must also be all in lower case.
- the first part the hyphenated name represents the tag library name to which they belong - think of it as a namespace.

MetaStatic's build module will expect to find all the Meta Tag definitions for a given library in a directory specific to that library.

The second (and optionally subsequent) hyphentated part of the Meta Tag's name is up to you.

### Examples

- Demo Application Tag Library:

  - demo-background
  - demo-helloworld

- SB Admin Tag Library:

  - sbadmin-root
  - sbadmin-sidebar-menu
  - sbadmin-sidebar-menu-item

## Meta Tag Definition Files and Directories

Each Meta Tag definition is held in its own text file that should have a file extension of *.mst* (shorthand for **m**eta**s**tatic **t**emplate)

The Meta Tag definition files for each Tag Library must reside in a directory specific to that library.  For example:

- the SB Admin Tag Library (namespace: *sbadmin*) directory might be *~/metatstatic/tagLibraries/sbadmin/*
- each Meta Tag within this directory would start with *sbadmin-* and have a file extension of *.mst*, eg:

  - sbadmin-root.mst
  - sbadmin-sidebar-menu.mst 


## Meta Tag Templates

### Template Basics

A Meta Tag must contain at least one template, but can contain as many as needed.

A Template is defined using a *&lt;template>* tag, which wraps a set of HTML tags and/or other Meta Tags that *MetaStatic*'s build module will use to substitute for the actual Meta Tag.

### Slots

A Template can contain one or more *&lt;slot>* tags.  Slots are used to define the insertion points for other (child) Meta Tags that are expected to be nested within the Meta Tag.

Each Template can specify the default Slot of the parent Meta Tag to which it should be appended, but this can be over-ridden if required.

#### Simple Example of Slots

Suppose we have a *&lt;demo-title>* Meta Tag that is defined as follows:

```html
<template slot="main" :title="^title">
  <h1>:title</h1>
  <hr />
  <h3>
    <slot name="content" />
  </h3>
</template>
```

Instances of the &lt;demo-title> tag would be inserted into a slot named *main* that was provided by one of its parent ancestry Meta Tags.  Let's imagine we have a *&lt;demo-main> Meta Tag that provides this slot.

The *&lt;slot name="content" />* tag represents where any child Meta Tags would be expected to be inserted: these child tags must specify this slot within their *&lt;template>* tag.  So, for example, we might have a *&lt;demo-text>* Meta Tag:

```html
<template slot="content" :text="^text">
  <div>:text</div>
</template>
```

We could then use these as follows:

```html
<demo-main>
  <demo-title title="My Demo">
    <demo-text text="Hello World" />
  </demo-title>
</demo-main>
```

The result (inside whatever &lt;demo-main> produced) would be:

```html
  <h1>My Demo</h1>
  <hr />
  <h3>
    <div>Hello World</div>
  </h3>
```


### Template Variables

#### Basics

A Template can define variables based on the attributes that will be applied to the Meta Tag.  Those variables can be used within the Template's HTML contents (within attribute and textContent values) and are substituted at build time.  As a result, the appearance and/or behaviour of an instance of a Meta Tag's can be controlled by the Web Site maintainer via the Meta Tag's attributes.

Variables are defined as attributes of the &lt;template> tag, and must be prefixed with a colon (:) character.  The value specifies where the value is to be picked up and/or how it is to be assigned by MetaStatic's build module.

#### Value Conventions

- A value with a caret (^) character as its prefix denotes that the value is to come from the corresponding attribute in the instance of the Meta Tag.

- A value with a less-that (<) character as its prefix denotes that the value is a reserved one provided by MetaStatic's build module.  There is currently just one such value you can use:

  - *<uid*  This is a unique identification value that is automatically assigned by the build module for each Meta Tag being processed.  This is useful for constructing unique id attributes within the template's HTML whenever you use multiple instances of the same Meta Tag.

#### Example


For example, let's imagine a simple demo-div Meta Tag:

```html
<template slot="content" :flag="^flag" :text="^text">
  <div class="disp-:flag">Hello :text!</div>
</template>
```

This could be used as follows:

```html
<demo-div text="World" flag="on" />
```

and MetaStatic's build module would convert this to:

```html
<div class="disp-on">Hello World!</div>
```

whilst:

```html
<demo-div text="Again" flag="off" />
```

would be converted to:

```html
<div class="disp-off">Hello Again!</div>
```


----
# License

 Copyright (c) 2024 MGateway Ltd,                           
 Redhill, Surrey UK.                                                      
 All rights reserved.                                                     
                                                                           
  https://www.mgateway.com                                                  
  Email: rtweed@mgateway.com                                               
                                                                           
                                                                           
  Licensed under the Apache License, Version 2.0 (the "License");          
  you may not use this file except in compliance with the License.         
  You may obtain a copy of the License at                                  
                                                                           
      http://www.apache.org/licenses/LICENSE-2.0                           
                                                                           
  Unless required by applicable law or agreed to in writing, software      
  distributed under the License is distributed on an "AS IS" BASIS,        
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
  See the License for the specific language governing permissions and      
   limitations under the License.      
