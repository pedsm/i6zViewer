import * as zip from '@zip.js/zip.js'

console.log('Initalizing')

const parser = new DOMParser()
const dropZone = document.getElementById('drop_zone')
const content = document.getElementById('content')


const linkText = '<link href="#iuclid6_style.css" rel="stylesheet" type="text/css">'


function parseAttachment(doc) {
  const att = {}
  const { children } = doc.activeElement
  for(const key of children) {
    console.log(key)
    if(key.nodeName != 'content') {
      att[key.nodeName] = key.innerHTML
    } else {
      att[key.nodeName] = key.attributes[0].nodeValue
    }
  }
  return att
}

async function getContent(entry) {
  console.debug(`Reading ${entry.filename}`)
  return entry.getData(
    new zip.TextWriter()
  )
}

async function getAsBlob(entry) {
  console.debug(`Reading blob ${entry.filename}`)
  return entry.getData(
    new zip.BlobWriter()
  )
}

async function parseXml(entry) {
  console.debug(`Parsing ${entry.filename}`)
  return parser.parseFromString(await getContent(entry), 'text/xml')
}

async function xmlToHtml(xml, xsl) {
  const processor = new XSLTProcessor()
  processor.importStylesheet(await parseXml(xsl))
  const doc = processor.transformToDocument(xml)
  const html = doc.documentElement.innerHTML
  return html.split('href="').join('href="#').replace(linkText,'')
}

function getXslName(doc) {
  if(doc.firstChild.data) {
    return doc.firstChild.data.split('href=')[1].replace(/"/g,'')
  } else {
    return null
  }
}

async function linkDocuments(html, documents, entries) {
  let newHtml = html;
  const docMap = {}
  for(const doc of documents) {
    const filename = doc.filename.split('.')[0]
    docMap[filename] = getXslName(await parseXml(doc))
  }
  console.log(docMap)
  console.log('Linking documents')
  for(const [uuid, label] of Object.entries(docMap)) {
    // if(uuid == null) {
    //   const att = parseAttachment(doc)
    //   const blob = await getAsBlob(entries.find(file => file.filename == att.content))
    //   const url = window.URL.createObjectURL(blob)
    //   console.log(`Generated attachment URL for blob at ${url}`)
    //   continue
    // }
    newHtml = newHtml.replaceAll(uuid.replace('_', '/'), `<a href="#${uuid}.i6d">${label}</a>`)
    console.log(`replacing ${uuid.replace('_', '/')}`)
  }
  return newHtml
}

async function dropHandler(e) {
  console.log('Starting reader logic')
  e.preventDefault();
  if(e.dataTransfer.items) {
    console.time('Render')
    const i6z = e.dataTransfer.items[0].getAsFile()
    console.log('Got file')
    const reader = new zip.ZipReader(new zip.BlobReader(i6z))
    const entries = await reader.getEntries()
    console.log(`Unzipped file, ${entries.length} items found`)
    console.log(entries)
    const manifest = entries.find(file => file.filename === 'manifest.xml')
    const manifestXsl = entries.find(file => file.filename === 'manifest.xsl')
    
    content.innerHTML = await xmlToHtml(await parseXml(manifest), manifestXsl)

    const documents = entries.filter(file => file.filename.includes('.i6d'))
    console.log(`Found ${documents.length} documents`)
    for(const rawDoc of documents) {
      const doc = await parseXml(rawDoc)
      const xsl = entries.find(file => file.filename == getXslName(doc))
      if(xsl == null) continue // Skip attachment files
      // if(xsl == null) {
      //   console.warn(`Skipping ${rawDoc.filename}`)
      //   const att = parseAttachment(doc)
      //   const blob = await getAsBlob(entries.find(file => file.filename == att.content))
      //   const url = window.URL.createObjectURL(blob)
      //   console.log(`Generated attachment URL for blob at ${url}`)
      //   continue
      // }
      content.innerHTML += `
      <div class='doc'>
        <h2 id="${rawDoc.filename}">${xsl.filename.split('.')[0]}</h2>
        ${await xmlToHtml(doc, xsl)}
      </div>`
    }
    content.innerHTML = await linkDocuments(content.innerHTML, documents, entries)
    console.timeEnd('Render')
  }
}

function dragOverHandler(e) {
  // console.log('File(s) in drop zone');
  // Prevent default behavior (Prevent file from being opened)
  e.preventDefault();
}

dropZone.addEventListener('drop', dropHandler)
dropZone.addEventListener('dragover', dragOverHandler)
