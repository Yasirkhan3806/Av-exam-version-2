/**
 * excelTheme.js
 * --------------
 * Recolors Univer's canvas-rendered grid (gridlines, header highlight,
 * selection outline) and the DOM chrome that derives from the same
 * palette (toolbar accent, active states, focus rings) to match
 * Excel's signature green instead of Univer's default blue.
 *
 * This is passed straight into `new Univer({ theme: excelTheme })` — the
 * shape must match `Theme` from '@univerjs/themes' exactly (each key is a
 * 50–900 shade ramp), since both the render engine (canvas) and the UI
 * components (DOM) read colors from this same object via ThemeService.
 *
 * `gray` is swapped for Fluent UI's neutral ramp (the same grays Excel /
 * Office use for headers, borders and secondary text) — this is what
 * actually changes the look of the row/column header bar and gridlines,
 * not just the accent color.
 */
import { defaultTheme } from '@univerjs/themes'

const excelGreen = {
  50: '#E6F4EA',
  100: '#C3E6CB',
  200: '#9AD5A8',
  300: '#6EC080',
  400: '#48AC63',
  500: '#217346', // Excel's signature green
  600: '#1C6B3F',
  700: '#185C37', // Excel's darker accent green
  800: '#134A2C',
  900: '#0F3D22',
}

const officeGray = {
  50: '#FAF9F8',
  100: '#F3F2F1',
  200: '#EDEBE9',
  300: '#E1DFDD',
  400: '#D2D0CE',
  500: '#C8C6C4',
  600: '#A19F9D',
  700: '#605E5C',
  800: '#3B3A39',
  900: '#201F1E',
}

export const excelTheme = {
  ...defaultTheme,
  primary: excelGreen,
  gray: officeGray,
}

export default excelTheme
