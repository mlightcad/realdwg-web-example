import {
  acdbThumbnailImageToDataUrl,
  type AcDbDatabase
} from '@mlightcad/data-model'
import { createCollapsibleSection } from './collapsible'

export class PreviewPane {
  readonly root: HTMLElement
  private box: HTMLElement

  constructor() {
    const section = createCollapsibleSection({
      title: 'Preview',
      className: 'preview-box',
      storageKey: 'sidebar.preview'
    })
    this.root = section.root
    this.box = document.createElement('div')
    this.box.className = 'preview-content'
    section.body.appendChild(this.box)
    this.clear()
  }

  clear() {
    this.box.innerHTML = ''
    const empty = document.createElement('div')
    empty.className = 'preview-empty'
    empty.textContent = 'No preview'
    this.box.appendChild(empty)
  }

  render(database: AcDbDatabase | null) {
    this.box.innerHTML = ''
    if (!database?.thumbnailImage?.length) {
      this.clear()
      return
    }

    const dataUrl = acdbThumbnailImageToDataUrl(database.thumbnailImage)
    if (!dataUrl) {
      this.clear()
      return
    }

    const img = document.createElement('img')
    img.src = dataUrl
    img.alt = 'Drawing thumbnail preview'
    this.box.appendChild(img)
  }
}
