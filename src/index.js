import * as zip from '@zip.js/zip.js'
import { notify, timedNotification } from './notification'

console.log('Initalizing')

const parser = new DOMParser()
const dropZone = document.getElementById('drop_zone')
const content = document.getElementById('content')

const linkText = '<link href="#iuclid6_style.css" rel="stylesheet" type="text/css">'

function parseAttachment(doc) {
  const att = {}
  const { children } = doc.activeElement
  for(const key of children) {
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

async function linkDocuments(html, docMap, entries) {
  let newHtml = html;
  console.log(docMap)
  console.log('Linking documents')
  for(const {reference, url, label, att, mime} of docMap) {
    if(att) {
      if(mime.includes('image')) {
        newHtml = newHtml.replaceAll(reference.replace('_', '/'), `<br>
        <div class="imgContainer">
          <a target="_blank" href=${url}>
            <img src=${url} alt=${label}/>
          </a>
        </div>
        `)
      } else {
        newHtml = newHtml.replaceAll(reference.replace('_', '/'), `<br><a target="_blank" href="${url}">${label}</a>`)
      }
    } else {
      newHtml = newHtml.replaceAll(reference.replace('_', '/'), `<a href="${url}">${label}</a>`)
    }
  }
  return newHtml
} 

async function dropHandler(e) {
  console.log('Starting reader logic')
  document.body.classList.remove('hover')
  e.preventDefault();
  if(e.dataTransfer.items) {
    console.time('Render')
    const startTime = Date.now()
    const i6z = e.dataTransfer.items[0].getAsFile()
    console.log('Got file')
    const reader = new zip.ZipReader(new zip.BlobReader(i6z))
    const entries = await reader.getEntries()
    console.log(`Unzipped file, ${entries.length} items found`)
    notify(`Reading 0/${entries.length} files...`)
    console.log(entries)
    const manifest = entries.find(file => file.filename === 'manifest.xml')
    const manifestXsl = entries.find(file => file.filename === 'manifest.xsl')
    
    content.innerHTML = await xmlToHtml(await parseXml(manifest), manifestXsl)

    const docMap = []
    const documents = entries.filter(file => file.filename.includes('.i6d'))
    console.log(`Found ${documents.length} documents`)
    for(const rawDoc of documents) {
      notify(`Initial read complete <br>Linking ${docMap.length}/${entries.length} files... <br> You can have a look around while we prepare links and attachments`)
      const doc = await parseXml(rawDoc)
      const xslName = getXslName(doc)
      const xsl = entries.find(file => file.filename == xslName)
      if(xsl == null) {
        const att = parseAttachment(doc)
        const blob = await getAsBlob(entries.find(file => file.filename == att.content))
        const url = window.URL.createObjectURL(blob)
        console.log(`Generated attachment URL for blob at ${url}`)
        x = att
        docMap.push({
          reference: att.documentKey,
          url,
          label: att.name,
          att: true,
          mime: att.mimetype
        })
        continue
      } else {
        const filename = rawDoc.filename.split('.')[0]
        docMap.push({
          reference: filename,
          url: `#${filename}.i6d`,
          label: xslName
        })
      } 


      console.log(rawDoc)
      content.innerHTML += `
      <div class='doc'>
        <h2 id="${rawDoc.filename}">${xsl.filename.split('.')[0]}</h2>
        ${await xmlToHtml(doc, xsl)}
      </div>`
    }
    content.innerHTML = await linkDocuments(content.innerHTML, docMap)
    console.timeEnd('Render')
    timedNotification(`Finished reading file in ${Date.now() - startTime}ms`, 3000)
  }
}

function dragOverHandler(e) {
  document.body.classList.add('hover')
  e.preventDefault();
}


dropZone.addEventListener('drop', async (e) => {
  try {
    await dropHandler(e)
  } catch(e) {
    console.error(e)
    timedNotification('Sorry, something went wrong and we have no idea how to fix it 🙃<br>You can try again if you like', 5000)
  }
})

dropZone.addEventListener('dragover', dragOverHandler)
// dropZone.addEventListener('dragleave', dragLeaveHandler)
