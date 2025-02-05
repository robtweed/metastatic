# Breaking Down Templates into Building Blocks

The thinking behind *MetaStatic* is: what if it was possible for a technically skilled developer to break down such templates into a hierarchy of high-level building blocks - Meta Tags - that represent the individual elements or components (eg the backdrop, the menus, tab controls, carousels etc) from which that template is constructed?  Armed with a library of such Meta Tags, a relatively unskilled Web Site maintainer could then define their own spefically-customised version that conforms to the template, but containing their own content and using a much simpler and intuitive shorthand description summarising the bulding blocks and content needed for their specific site.

The idea would be to process such a high-level Meta Tag description and generate a user-specific version of the template HTML that could be loaded into the browser.  If any changes were made to the Meta Tag description, simply re-running the build process would create an updated version of the HTML file needed for the Web Server.

The technical expertise required to build a Meta Tag library for a particular template would be a one-off expert task.  However, the resulting Tag Library could then be used repeatedly and easily by any number of Web Site maintainers who would not require particularly detailed technical skills.
