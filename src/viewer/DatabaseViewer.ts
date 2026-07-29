import type { AcDbDatabase, AcDbFileType } from '@mlightcad/data-model'
import { collectStats, type DrawingStats } from './collectStats'
import { CenterPane } from './CenterPane'
import { NavTree } from './NavTree'
import { PreviewPane } from './PreviewPane'
import { PropertyPanel } from './PropertyPanel'
import { StatsPane } from './StatsPane'
import type { NavSelection } from './types'

export class DatabaseViewer {
  readonly root: HTMLElement
  private preview = new PreviewPane()
  private statsPane = new StatsPane()
  private navTree: NavTree
  private center: CenterPane
  private props = new PropertyPanel()
  private database: AcDbDatabase | null = null
  private stats: DrawingStats | null = null

  constructor(host: HTMLElement) {
    this.root = host
    this.root.innerHTML = ''

    this.navTree = new NavTree(selection => this.onNavSelect(selection))
    this.center = new CenterPane(selection => this.props.show(selection))

    const left = document.createElement('aside')
    left.className = 'pane left-pane'
    const leftHeader = document.createElement('div')
    leftHeader.className = 'pane-header'
    leftHeader.textContent = 'Drawing'
    left.appendChild(leftHeader)
    left.appendChild(this.preview.root)
    left.appendChild(this.statsPane.root)
    left.appendChild(this.navTree.root)

    this.root.appendChild(left)
    this.root.appendChild(this.center.root)
    this.root.appendChild(this.props.root)
  }

  clear() {
    this.database = null
    this.stats = null
    this.preview.clear()
    this.statsPane.clear()
    this.navTree.render(null, null)
    this.center.setDatabase(null, null)
    this.props.setDatabase(null)
  }

  load(options: {
    database: AcDbDatabase
    fileName: string
    fileType: AcDbFileType
    fileSize: number
    durationMs: number
  }) {
    this.database = options.database
    this.stats = collectStats(options.database, {
      fileName: options.fileName,
      fileType: options.fileType,
      fileSize: options.fileSize,
      durationMs: options.durationMs
    })

    this.preview.render(this.database)
    this.statsPane.render(this.stats)
    this.navTree.render(this.database, this.stats)
    this.center.setDatabase(this.database, this.stats)
    this.props.setDatabase(this.database)
  }

  private onNavSelect(selection: NavSelection) {
    this.center.showNav(selection)
  }
}
