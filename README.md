# i6zViewer

i6z viewer is a web app designed to display the content of [Iuclid 6 files](https://iuclid6.echa.europa.eu/format).

## How it works

Simply visit the webpage [here](https://i6z-viewer.vercel.app/) and drag and drop an `.i6z` file on your browser window. 
This will generate a web view with a representation of all contents in the file.

## Why was this built?

[IUCLID](https://iuclid6.echa.europa.eu/) as expected provides extensive tooling to create, view and manipulate i6z files. 
There is also other third party software that is capable of doing the same. The problem is that those tools are ofter incredibly heavyweight tools designed for in-depth edits.

i6zViewer runs entirely on the browser (without the need to talk to any other web services, and without sending your data anywhere), 
and it's designed simply to provide a fast way to view the content of the files. While working with multiple `.i6z` files the official Iuclid app was too slow
to boot up unless I kept it constantly running on my machine for something as simple as taking a quick look. Because of that i6zViewer was built, it is a reader that focuses
on being fast and easy to use.

## Features

- 100% in-browser execution, your data is not sent anywhere
- Fast. Dossiers with 300+ documents load almost instantly with linking (generation of hyperlinks in between documents, and attachments) happening in the background
- Ability to download attachments directly from the web page
- Rendering of image attachments
