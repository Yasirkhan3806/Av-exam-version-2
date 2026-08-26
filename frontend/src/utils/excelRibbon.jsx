/**
 * excelRibbon.jsx
 * -----------------
 * Regroups Univer's *existing* toolbar buttons into an Excel-style tabbed
 * ribbon (File / Home / Insert / Page Layout / Formulas / Data / Review /
 * View / Automate / Help), with the Home tab's buttons clustered into
 * labeled groups (Clipboard / Font / Alignment / Number / Other) the way
 * Excel does.
 *
 * This introduces ZERO new spreadsheet functionality — every button
 * rendered here is Univer's own `<ToolbarItem>` component bound to a
 * command that already exists in the app today. Only "Home" is populated:
 * the rest of the tabs are disabled placeholders because this app doesn't
 * currently install the Univer plugins that would back them (no
 * sheets-filter/sheets-sort for Data, no sheets-drawing for Insert, no
 * sheets-conditional-formatting for Styles, etc.) — wiring those up would
 * be adding new features, which was explicitly out of scope.
 *
 * How it's mounted (see PracticeSheet.jsx):
 *   const injector = univer.__getInjector()
 *   const uiPartsService = injector.get(IUIPartsService)
 *   uiPartsService.registerComponent(BuiltInUIPart.TOOLBAR, () => createExcelRibbon(injector))
 *
 * `IUIPartsService.registerComponent` is Univer's own documented extension
 * point for injecting custom React components into its layout — components
 * registered this way render inside Univer's existing dependency-injection
 * context, so `<ToolbarItem>` (also Univer's own component) can resolve
 * ICommandService/IMenuManagerService etc. correctly without us having to
 * fake that wiring ourselves.
 *
 * Univer's own stock single-row toolbar keeps rendering alongside this one
 * (registerComponent supports multiple components per slot) — it's hidden
 * purely via CSS in univerExcelSkin.css (`[data-u-comp="ribbon-toolbar"]`),
 * so if that selector ever stops matching in a future Univer version, you
 * get a duplicate toolbar rather than a blank one.
 */
import { useMemo, useState } from 'react'
import { IMenuManagerService, RibbonPosition, ToolbarItem } from '@univerjs/ui'

const EXCEL_TABS = [
  'File', 'Home', 'Insert', 'Page Layout', 'Formulas',
  'Data', 'Review', 'View', 'Automate', 'Help',
]

// Match on `item.title`, which is a stable locale-key path (e.g. "toolbar.bold")
// rather than the internal command id, which is more likely to change between
// Univer versions.
const GROUP_RULES = [
  { name: 'Clipboard', test: (title) => /\.(undo|redo|formatPainter)$/.test(title) },
  { name: 'Font', test: (title) => /\.(font|fontSize|bold|italic|underline|strikethrough|subscript|superscript|textColor|fillColor|border|resetColor)$/.test(title) },
  { name: 'Alignment', test: (title) => /\.(horizontalAlignMode|verticalAlignMode|textWrapMode|textRotateMode|mergeCell)$/.test(title) },
  { name: 'Number', test: (title) => /numfmt|addDecimal|subtractDecimal/i.test(title) },
]
const GROUP_ORDER = ['Clipboard', 'Font', 'Alignment', 'Number', 'Other']

function groupHomeItems(flatSchema) {
  const buckets = new Map(GROUP_ORDER.map((name) => [name, []]))

  flatSchema.forEach((schema) => {
    const item = schema?.item
    if (!item) return
    const title = item.title || ''
    const rule = GROUP_RULES.find((r) => r.test(title))
    buckets.get(rule ? rule.name : 'Other').push(item)
  })

  return GROUP_ORDER
    .map((name) => ({ name, items: buckets.get(name) }))
    .filter((group) => group.items.length > 0)
}

/**
 * @param {import('@wendellhu/redi').Injector} injector
 * @returns {React.ComponentType} a component suitable for IUIPartsService.registerComponent
 */
export function createExcelRibbon(injector) {
  return function ExcelRibbon() {
    const [activeTab, setActiveTab] = useState('Home')

    const homeGroups = useMemo(() => {
      try {
        const menuManagerService = injector.get(IMenuManagerService)
        const flatSchema = menuManagerService.getFlatMenuByPositionKey(RibbonPosition.START)
        return groupHomeItems(flatSchema || [])
      } catch (err) {
        console.warn('[ExcelRibbon] Could not read Univer toolbar menu schema:', err)
        return []
      }
    }, [])

    return (
      <div className="excel-ribbon">
        <div className="excel-ribbon-tabs" role="tablist" aria-label="Ribbon tabs">
          {EXCEL_TABS.map((tab) => {
            const isHome = tab === 'Home'
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-disabled={!isHome}
                disabled={!isHome}
                className={`excel-ribbon-tab${isActive ? ' is-active' : ''}`}
                onClick={() => isHome && setActiveTab(tab)}
                title={isHome ? undefined : `${tab} isn't wired up yet`}
              >
                {tab}
              </button>
            )
          })}
        </div>

        {activeTab === 'Home' && (
          <div className="excel-ribbon-groups">
            {homeGroups.map((group) => (
              <div className="excel-ribbon-group" key={group.name}>
                <div className="excel-ribbon-group-items">
                  {group.items.map((item, idx) => (
                    <ToolbarItem key={`${item.id}-${item.subId || idx}`} {...item} />
                  ))}
                </div>
                <div className="excel-ribbon-group-label">{group.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
}

export default createExcelRibbon
