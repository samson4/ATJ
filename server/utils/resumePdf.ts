import PDFDocument from 'pdfkit'
import type { ResumeDocument, ResumeSectionKey, ResumeTemplateKey } from '~~/shared/types/resume'
import { formatResumeDate, formatResumeDateRange, resumeHasSectionContent, sanitizeRichText } from '~~/shared/utils/resume'

const TEXT_COLOR = '#000000'

const sectionTitles: Record<ResumeSectionKey, string> = {
  summary: 'Professional Summary', experience: 'Experience', education: 'Education', skills: 'Skills',
  projects: 'Projects', certifications: 'Certifications', languages: 'Languages', links: 'Links'
}

const resumeNoSectionTitles: Partial<Record<ResumeSectionKey, string>> = {
  summary: 'Summary',
  projects: 'Personal Projects'
}

type TemplateStyle = 'classic' | 'minimal' | 'centered' | 'executive' | 'compact' | 'structured' | 'editor' | 'career' | 'resume-no'

export type ResumeTemplateLayout = {
  pageMargin: number
  bodySize: number
  rowTitleSize: number
  nameSize: number
  headlineSize: number
  detailsIndent: number
  richLineGap: number
  rowGap: number
  style: TemplateStyle
  contactSeparator: string
  metaAlign: 'left' | 'right'
}

export const resumeTemplateLayouts: Record<ResumeTemplateKey, ResumeTemplateLayout> = {
  'ats-classic': {
    pageMargin: 44, bodySize: 9, rowTitleSize: 10, nameSize: 22, headlineSize: 11,
    detailsIndent: 8, richLineGap: 1, rowGap: 0.35, style: 'classic',
    contactSeparator: '  •  ', metaAlign: 'left'
  },
  'modern-minimal': {
    pageMargin: 52, bodySize: 9.5, rowTitleSize: 10.5, nameSize: 28, headlineSize: 11,
    detailsIndent: 0, richLineGap: 1.8, rowGap: 0.65, style: 'minimal',
    contactSeparator: '   |   ', metaAlign: 'left'
  },
  'centered-professional': {
    pageMargin: 48, bodySize: 9, rowTitleSize: 10, nameSize: 24, headlineSize: 10.5,
    detailsIndent: 8, richLineGap: 1.2, rowGap: 0.45, style: 'centered',
    contactSeparator: '   •   ', metaAlign: 'left'
  },
  executive: {
    pageMargin: 46, bodySize: 9, rowTitleSize: 10.5, nameSize: 24, headlineSize: 10,
    detailsIndent: 8, richLineGap: 1.1, rowGap: 0.5, style: 'executive',
    contactSeparator: '  |  ', metaAlign: 'right'
  },
  compact: {
    pageMargin: 36, bodySize: 8, rowTitleSize: 9, nameSize: 20, headlineSize: 9.5,
    detailsIndent: 6, richLineGap: 0.4, rowGap: 0.15, style: 'compact',
    contactSeparator: ' • ', metaAlign: 'left'
  },
  structured: {
    pageMargin: 44, bodySize: 8.8, rowTitleSize: 10, nameSize: 22, headlineSize: 10.5,
    detailsIndent: 8, richLineGap: 1, rowGap: 0.4, style: 'structured',
    contactSeparator: '  •  ', metaAlign: 'left'
  },
  'editorial-air': {
    pageMargin: 58,
    bodySize: 9.25,
    rowTitleSize: 10.6,
    nameSize: 30,
    headlineSize: 11,
    detailsIndent: 0,
    richLineGap: 1.4,
    rowGap: 0.7,
    style: 'editor',
    contactSeparator: '   /   ',
    metaAlign: 'left'
  },

  'career-ledger': {
    pageMargin: 40,
    bodySize: 9.1,
    rowTitleSize: 10.8,
    nameSize: 23,
    headlineSize: 10,
    detailsIndent: 12,
    richLineGap: 1.15,
    rowGap: 0.5,
    style: 'career',
    contactSeparator: '   ·   ',
    metaAlign: 'right'
  },

  'resume-no': {
    pageMargin: 36,
    bodySize: 9.25,
    rowTitleSize: 10,
    nameSize: 16,
    headlineSize: 10.5,
    detailsIndent: 17,
    richLineGap: 1.5,
    rowGap: 0.42,
    style: 'resume-no',
    contactSeparator: '  |  ',
    metaAlign: 'left'
  }
}

type RichTextSegment = {
  text: string
  bold: boolean
  oblique: boolean
  underline: boolean
  strike: boolean
}

const hasEthiopic = (text: string) => /[\u1200-\u137F]/.test(text)

function decodeHtmlEntities(input: string) {
  const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
  return input.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity, code: string) => {
    if (code[0] !== '#') return named[code.toLowerCase()] ?? entity
    const decoded = code[1]?.toLowerCase() === 'x' ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10)
    return Number.isFinite(decoded) ? String.fromCodePoint(decoded) : entity
  })
}

function richTextSegments(content: string) {
  const tokens = sanitizeRichText(content).split(/(<\/?(?:p|br|strong|b|em|i|u|s|strike|ul|ol|li|blockquote)>)/gi)
  const segments: RichTextSegment[] = []
  const state = { bold: false, oblique: false, underline: false, strike: false }
  const lists: Array<{ ordered: boolean, index: number }> = []

  const append = (text: string) => {
    if (!text) return
    const previous = segments.at(-1)
    if (previous && previous.bold === state.bold && previous.oblique === state.oblique
      && previous.underline === state.underline && previous.strike === state.strike) previous.text += text
    else segments.push({ text, ...state })
  }
  const newline = () => {
    if (segments.length && !segments.at(-1)?.text.endsWith('\n')) append('\n')
  }

  for (const token of tokens) {
    if (!token) continue
    if (!token.startsWith('<')) {
      append(decodeHtmlEntities(token))
      continue
    }
    const closing = token.startsWith('</')
    const tag = token.replace(/[</>]/g, '').toLowerCase()
    if (tag === 'strong' || tag === 'b') state.bold = !closing
    else if (tag === 'em' || tag === 'i') state.oblique = !closing
    else if (tag === 'u') state.underline = !closing
    else if (tag === 's' || tag === 'strike') state.strike = !closing
    else if ((tag === 'ul' || tag === 'ol') && !closing) lists.push({ ordered: tag === 'ol', index: 0 })
    else if ((tag === 'ul' || tag === 'ol') && closing) { lists.pop(); newline() }
    else if (tag === 'li' && !closing) {
      const list = lists.at(-1)
      if (list) append(list.ordered ? `${++list.index}.  ` : '•  ')
    } else if ((tag === 'li' || tag === 'p' || tag === 'blockquote') && closing) newline()
    else if (tag === 'br') newline()
    else if (tag === 'blockquote' && !closing) append('│  ')
  }

  while (segments.at(-1)?.text.endsWith('\n')) {
    const last = segments.at(-1)
    if (!last) break
    last.text = last.text.replace(/\n+$/, '')
    if (!last.text) segments.pop()
  }
  return segments
}

export async function renderResumePdf(document: ResumeDocument, templateKey: ResumeTemplateKey): Promise<Buffer> {
  const layout = resumeTemplateLayouts[templateKey]
  if (!layout) throw new Error(`Unsupported resume template: ${templateKey}`)
  const numericLayoutKeys: Array<keyof Pick<ResumeTemplateLayout,
    'pageMargin' | 'bodySize' | 'rowTitleSize' | 'nameSize' | 'headlineSize' | 'detailsIndent' | 'richLineGap' | 'rowGap'
  >> = ['pageMargin', 'bodySize', 'rowTitleSize', 'nameSize', 'headlineSize', 'detailsIndent', 'richLineGap', 'rowGap']
  const invalidLayoutKeys = numericLayoutKeys.filter(key => !Number.isFinite(layout[key]))
  if (invalidLayoutKeys.length) {
    throw new Error(`Invalid numeric layout value(s) for ${templateKey}: ${invalidLayoutKeys.join(', ')}`)
  }
  const isResumeNo = layout.style === 'resume-no'
  const inkColor = isResumeNo ? '#252525' : TEXT_COLOR
  const mutedColor = isResumeNo ? '#555555' : TEXT_COLOR
  const ruleColor = isResumeNo ? '#B8B8B8' : TEXT_COLOR

  const fontStorage = useStorage('assets:resume-fonts')
  const [latinFont, latinBoldFont, ethiopicFont, ethiopicBoldFont] = await Promise.all([
    fontStorage.getItemRaw('noto-sans-ethiopic-latin-400-normal.woff'),
    fontStorage.getItemRaw('noto-sans-ethiopic-latin-700-normal.woff'),
    fontStorage.getItemRaw('noto-sans-ethiopic-ethiopic-400-normal.woff'),
    fontStorage.getItemRaw('noto-sans-ethiopic-ethiopic-700-normal.woff')
  ])
  if (!latinFont || !latinBoldFont || !ethiopicFont || !ethiopicBoldFont) throw new Error('Resume PDF fonts are unavailable')

  const pdf = new PDFDocument({
    size: 'A4', margin: layout.pageMargin,
    info: { Title: `${document.basics.fullName || 'Resume'} Resume` }
  })
  const chunks: Buffer[] = []
  pdf.on('data', chunk => chunks.push(Buffer.from(chunk)))
  const completed = new Promise<Buffer>((resolve, reject) => {
    pdf.on('end', () => resolve(Buffer.concat(chunks)))
    pdf.on('error', reject)
  })

  pdf.registerFont('Noto', Buffer.from(latinFont))
  pdf.registerFont('NotoBold', Buffer.from(latinBoldFont))
  pdf.registerFont('NotoEthiopic', Buffer.from(ethiopicFont))
  pdf.registerFont('NotoEthiopicBold', Buffer.from(ethiopicBoldFont))

  const contentLeft = () => pdf.page.margins.left
  const contentRight = () => pdf.page.width - pdf.page.margins.right
  const contentWidth = () => contentRight() - contentLeft()
  const ensureSpace = (height: number) => {
    if (pdf.y + height > pdf.page.height - pdf.page.margins.bottom) pdf.addPage()
  }
  const font = (value: string, bold = false) => {
    pdf.font(hasEthiopic(value) ? (bold ? 'NotoEthiopicBold' : 'NotoEthiopic') : (bold ? 'NotoBold' : 'Noto'))
  }
  const text = (value: string, options: PDFKit.Mixins.TextOptions = {}, bold = false) => {
    font(value, bold)
    pdf.text(value, options)
  }
  const drawRule = (y: number, start = contentLeft(), end = contentRight(), width = 0.7, color = TEXT_COLOR) => {
    pdf.strokeColor(color).lineWidth(width).moveTo(start, y).lineTo(end, y).stroke()
  }
  const drawRichSegments = (segments: RichTextSegment[], indent = layout.detailsIndent) => {
    if (!segments.length) return
    pdf.fontSize(layout.bodySize).fillColor(inkColor)
    segments.forEach((segment, index) => {
      font(segment.text, segment.bold)
      pdf.text(segment.text, index === 0 ? {
        width: contentWidth(), indent, paragraphGap: 2, lineGap: layout.richLineGap,
        oblique: segment.oblique, underline: segment.underline, strike: segment.strike,
        continued: index < segments.length - 1
      } : {
        oblique: segment.oblique, underline: segment.underline, strike: segment.strike,
        continued: index < segments.length - 1
      })
    })
  }
  const drawResumeNoListItem = (content: string, marker: string, indent: number) => {
    const segments = richTextSegments(content)
    if (!segments.length) return

    const markerX = contentLeft() + indent
    pdf.fontSize(layout.bodySize)
    font(marker || '•')
    const markerWidth = marker ? pdf.widthOfString(marker) : layout.bodySize * 0.65
    const textX = markerX + markerWidth + 6
    const textWidth = Math.max(1, contentRight() - textX)
    const plainText = segments.map(segment => segment.text).join('')
    pdf.fontSize(layout.bodySize)
    font(plainText)
    const estimatedHeight = pdf.heightOfString(plainText, {
      width: textWidth,
      lineGap: layout.richLineGap
    }) + 4
    ensureSpace(estimatedHeight)

    const startY = pdf.y
    if (/^\d+\.$/.test(marker)) {
      pdf.fontSize(layout.bodySize).fillColor(inkColor)
      font(marker)
      pdf.text(marker, markerX, startY, { lineBreak: false })
    } else {
      pdf.circle(markerX + 2, startY + layout.bodySize * 0.55, 1.25).fill(inkColor)
    }

    pdf.fontSize(layout.bodySize).fillColor(inkColor)
    segments.forEach((segment, index) => {
      font(segment.text, segment.bold)
      const options = {
        oblique: segment.oblique,
        underline: segment.underline,
        strike: segment.strike,
        continued: index < segments.length - 1
      }

      if (index === 0) {
        pdf.text(segment.text, textX, startY, {
          ...options,
          width: textWidth,
          lineGap: layout.richLineGap
        })
      } else {
        pdf.text(segment.text, options)
      }
    })

    pdf.x = contentLeft()
    pdf.moveDown(0.12)
  }
  const drawRichText = (content: string, indent = layout.detailsIndent) => {
    if (layout.style !== 'resume-no') {
      drawRichSegments(richTextSegments(content), indent)
      return
    }

    const sanitized = sanitizeRichText(content)
    const listPattern = /<(ul|ol)>([\s\S]*?)<\/\1>/gi
    let cursor = 0
    let match: RegExpExecArray | null

    while ((match = listPattern.exec(sanitized))) {
      const precedingText = sanitized.slice(cursor, match.index)
      if (precedingText) drawRichSegments(richTextSegments(precedingText), indent)

      const ordered = match[1]?.toLowerCase() === 'ol'
      const itemPattern = /<li>([\s\S]*?)<\/li>/gi
      let itemMatch: RegExpExecArray | null
      let itemNumber = 0
      while ((itemMatch = itemPattern.exec(match[2] || ''))) {
        itemNumber += 1
        const marker = ordered ? `${itemNumber}.` : ''
        drawResumeNoListItem(itemMatch[1] || '', marker, indent)
      }

      cursor = listPattern.lastIndex
    }

    const remainingText = sanitized.slice(cursor)
    if (remainingText) drawRichSegments(richTextSegments(remainingText), indent)
  }

  const heading = (label: string) => {
    const headingSpace = layout.style === 'structured' || layout.style === 'career'
      ? 46
      : layout.style === 'editor'
        ? 42
        : 38
    ensureSpace(headingSpace)
    pdf.fillColor(inkColor)
    if (layout.style === 'classic') {
      pdf.moveDown(0.75).fontSize(layout.rowTitleSize)
      text(label.toUpperCase(), { characterSpacing: 1 }, true)
      pdf.moveDown(0.2)
      drawRule(pdf.y)
      pdf.moveDown(0.35)
    } else if (layout.style === 'minimal') {
      pdf.moveDown(1.1).fontSize(12)
      text(label, {}, true)
      pdf.moveDown(0.45)
    } else if (layout.style === 'centered') {
      pdf.moveDown(0.9).fontSize(10)
      font(label, true)
      const top = pdf.y
      const labelWidth = pdf.widthOfString(label) + 22
      const sideWidth = Math.max(0, (contentWidth() - labelWidth) / 2)
      drawRule(top + 6, contentLeft(), contentLeft() + sideWidth, 0.6)
      drawRule(top + 6, contentRight() - sideWidth, contentRight(), 0.6)
      text(label, { align: 'center' }, true)
      pdf.moveDown(0.4)
    } else if (layout.style === 'executive') {
      pdf.moveDown(0.8)
      drawRule(pdf.y, contentLeft(), contentRight(), 1)
      drawRule(pdf.y + 3, contentLeft(), contentRight(), 0.35)
      pdf.y += 8
      pdf.fontSize(10.5)
      text(label.toUpperCase(), { characterSpacing: 1.4 }, true)
      pdf.moveDown(0.28)
    } else if (layout.style === 'compact') {
      pdf.moveDown(0.45).fontSize(9)
      text(label.toUpperCase(), { characterSpacing: 0.7 }, true)
      drawRule(pdf.y - 1, contentLeft(), contentLeft() + pdf.widthOfString(label.toUpperCase()), 0.8)
      pdf.moveDown(0.18)
    } else if (layout.style === 'resume-no') {
      pdf.moveDown(0.55).fontSize(layout.rowTitleSize).fillColor(inkColor)
      text(label.toUpperCase(), { characterSpacing: 0.35 }, true)
      pdf.moveDown(0.2)
      drawRule(pdf.y, contentLeft(), contentRight(), 0.55, ruleColor)
      pdf.moveDown(0.3)
    } else if (layout.style === 'editor') {
      pdf.moveDown(1.05).fontSize(layout.rowTitleSize)
      const headingLabel = label.toUpperCase()
      const headingY = pdf.y
      text(headingLabel, { characterSpacing: 1.05 }, true)
      const labelWidth = pdf.widthOfString(headingLabel, { characterSpacing: 1.05 })
      const ruleStart = contentLeft() + labelWidth + 12
      if (ruleStart < contentRight() - 12) {
        drawRule(headingY + layout.rowTitleSize * 0.65, ruleStart, contentRight(), 0.45)
      }
      pdf.moveDown(0.55)
    } else if (layout.style === 'career') {
      pdf.moveDown(0.85).fontSize(layout.rowTitleSize)
      text(label.toUpperCase(), { align: 'right', characterSpacing: 1.1 }, true)
      pdf.moveDown(0.25)
      drawRule(pdf.y, contentLeft(), contentRight(), 0.7)
      pdf.moveDown(0.35)
    } else {
      pdf.moveDown(0.75)
      const top = pdf.y
      const height = 19
      pdf.lineWidth(0.8).strokeColor(TEXT_COLOR).rect(contentLeft(), top, contentWidth(), height).stroke()
      font(label, true)
      pdf.fontSize(9.5).text(label.toUpperCase(), contentLeft() + 7, top + 4, {
        width: contentWidth() - 14, characterSpacing: 0.8
      })
      pdf.y = top + height + 5
    }
  }

  const row = (primary: string, secondary: string, meta: string, details = '') => {
    const estimatedHeight = details
      ? (layout.style === 'career' ? 64 : layout.style === 'resume-no' ? 62 : 54)
      : (layout.style === 'career' ? 42 : layout.style === 'resume-no' ? 40 : 32)
    ensureSpace(estimatedHeight)
    pdf.fontSize(layout.rowTitleSize).fillColor(inkColor)
    if (layout.style === 'executive' && meta) {
      const top = pdf.y
      pdf.fontSize(layout.bodySize)
      font(meta)
      const metaWidth = Math.min(
        contentWidth() * 0.46,
        Math.max(contentWidth() * 0.32, pdf.widthOfString(meta) + 6)
      )
      const columnGap = 12
      const titleWidth = contentWidth() - metaWidth - columnGap

      pdf.fontSize(layout.rowTitleSize)
      font(primary || secondary, true)
      pdf.text(primary || secondary, contentLeft(), top, {
        width: titleWidth,
        continued: Boolean(primary && secondary)
      })
      if (primary && secondary) {
        pdf.fontSize(layout.bodySize)
        text(`  |  ${secondary}`)
      }
      const titleBottom = pdf.y

      pdf.fontSize(layout.bodySize).fillColor(TEXT_COLOR)
      font(meta)
      pdf.text(meta, contentLeft() + titleWidth + columnGap, top, {
        width: metaWidth,
        align: 'right',
        oblique: true
      })
      pdf.y = Math.max(titleBottom, pdf.y)
      pdf.x = contentLeft()
    } else if (layout.style === 'resume-no') {
      const inlineLabel = Boolean(primary && secondary && !meta && !details)
      if (inlineLabel) {
        text(primary, { continued: true }, true)
        pdf.fontSize(layout.bodySize).fillColor(inkColor)
        text(`: ${secondary}`)
      } else {
        if (primary && secondary) {
          text(primary, { continued: true }, true)
          text(`  —  ${secondary}`, {}, true)
        } else {
          text(primary || secondary, {}, true)
        }

        if (meta) {
          for (const line of meta.split(/\r?\n/).map(value => value.trim()).filter(Boolean)) {
            pdf.moveDown(0.08).fontSize(layout.bodySize).fillColor(mutedColor)
            text(line, { oblique: true })
          }
          pdf.fillColor(inkColor)
        }
      }
    } else if (layout.style === 'career') {
      const top = pdf.y
      const hasMeta = Boolean(meta)
      const columnGap = 14
      if (hasMeta) {
        pdf.fontSize(layout.bodySize)
        font(meta)
      }
      const metaWidth = hasMeta
        ? Math.min(contentWidth() * 0.38, Math.max(contentWidth() * 0.28, pdf.widthOfString(meta) + 4))
        : 0
      const titleWidth = contentWidth() - (hasMeta ? metaWidth + columnGap : 0)
      const title = primary || secondary

      pdf.fontSize(layout.rowTitleSize)
      text(title, { width: titleWidth }, true)
      if (primary && secondary) {
        pdf.fontSize(layout.bodySize)
        text(secondary, { width: titleWidth })
      }
      const titleBottom = pdf.y

      if (hasMeta) {
        pdf.fontSize(layout.bodySize)
        font(meta)
        pdf.text(meta, contentLeft() + titleWidth + columnGap, top, {
          width: metaWidth,
          align: 'right',
          oblique: true
        })
      }

      pdf.y = Math.max(titleBottom, pdf.y)
      pdf.x = contentLeft()
    } else {
      text(primary || secondary, { continued: Boolean(primary && secondary) }, true)
      if (primary && secondary) {
        pdf.fontSize(layout.bodySize)
        const separator = layout.style === 'minimal' || layout.style === 'editor' ? '  —  ' : '  |  '
        text(`${separator}${secondary}`)
      }
      if (meta) {
        pdf.fontSize(layout.bodySize).fillColor(TEXT_COLOR)
        text(meta, { oblique: true, align: layout.metaAlign })
      }
    }
    drawRichText(details)
    if (layout.style === 'structured') {
      pdf.moveDown(0.25)
      drawRule(pdf.y, contentLeft(), contentRight(), 0.35)
    } else if (layout.style === 'career') {
      pdf.moveDown(0.2)
      drawRule(pdf.y, contentLeft(), contentRight(), 0.3)
    }
    pdf.moveDown(layout.rowGap)
  }

  const safePdfLink = (rawUrl: string) => {
    let candidate = rawUrl.trim().replace(/[),.;]+$/g, '')
    if (!candidate) return undefined
    if (/^www\./i.test(candidate) || /^[\w.-]+\.[a-z]{2,}(?:\/|$)/i.test(candidate)) {
      candidate = `https://${candidate}`
    }
    try {
      const parsed = new URL(candidate)
      return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? parsed.toString() : undefined
    } catch {
      return undefined
    }
  }

  const drawHeaderLinks = () => {
    const links = document.links
      .map(item => ({
        label: typeof item.label === 'string' ? item.label.trim() : '',
        url: typeof item.url === 'string' ? safePdfLink(item.url) : undefined
      }))
      .filter(item => item.label)
    if (!links.length) return

    const separator = '   |   '
    pdf.font('Noto').fontSize(layout.bodySize)
    const measureText = (value: string) => {
      const measured = pdf.widthOfString(value)
      return Number.isFinite(measured) && measured >= 0
        ? measured
        : Array.from(value).length * layout.bodySize * 0.52
    }
    const totalWidth = links.reduce((width, item, index) => {
      return width + measureText(item.label) + (index < links.length - 1 ? measureText(separator) : 0)
    }, 0)
    const availableWidth = contentWidth()
    const left = contentLeft()
    const y = pdf.y
    let x = left + Math.max(0, (availableWidth - totalWidth) / 2)
    if (![totalWidth, availableWidth, left, y, x].every(Number.isFinite)) {
      throw new Error('Invalid PDF layout coordinates while drawing resume header links')
    }

    pdf.fillColor(mutedColor)
    links.forEach((item, index) => {
      const width = measureText(item.label)
      pdf.text(item.label, x, y, {
        lineBreak: false
      })
      // PDFKit's underline text option can generate a NaN line segment with
      // the registered WOFF fonts. Draw the underline explicitly instead.
      if (item.url && width > 0) {
        const underlineY = y + layout.bodySize + 1
        if ([x, underlineY, width].every(Number.isFinite)) {
          drawRule(underlineY, x, x + width, 0.45, mutedColor)
        }
      }
      // Avoid PDFKit's inferred link rectangle for positioned text; use an
      // explicit finite annotation rectangle.
      if (item.url && width > 0) {
        const linkX = x
        const linkY = y - 1
        const linkWidth = Math.max(width, 1)
        const linkHeight = Math.max(layout.bodySize + 4, 12)
        if ([linkX, linkY, linkWidth, linkHeight].every(Number.isFinite)) {
          pdf.link(linkX, linkY, linkWidth, linkHeight, item.url)
        }
      }
      x += width
      if (index < links.length - 1) {
        pdf.text(separator, x, y, { lineBreak: false })
        x += measureText(separator)
      }
    })

    pdf.x = contentLeft()
    pdf.y = y + layout.bodySize + 4
  }

  const basics = document.basics
  const contactItems = isResumeNo
    ? [basics.location, basics.phone, basics.email]
    : [basics.email, basics.phone, basics.location]
  const contact = contactItems.filter(Boolean).join(layout.contactSeparator)
  pdf.fillColor(inkColor)
  if (layout.style === 'centered') {
    pdf.fontSize(layout.nameSize)
    text(basics.fullName || 'Your Name', { align: 'center' }, true)
    if (basics.headline) {
      pdf.fontSize(layout.headlineSize)
      text(basics.headline, { align: 'center' })
    }
    if (contact) {
      pdf.moveDown(0.3).fontSize(layout.bodySize)
      text(contact, { align: 'center' })
    }
  } else if (layout.style === 'executive') {
    pdf.fontSize(layout.nameSize)
    text((basics.fullName || 'Your Name').toUpperCase(), { characterSpacing: 1.3 }, true)
    if (basics.headline) {
      pdf.fontSize(layout.headlineSize)
      text(basics.headline.toUpperCase(), { characterSpacing: 0.7 })
    }
    if (contact) {
      pdf.moveDown(0.25).fontSize(layout.bodySize)
      text(contact)
    }
    pdf.moveDown(0.45)
    drawRule(pdf.y, contentLeft(), contentRight(), 1.2)
    drawRule(pdf.y + 3, contentLeft(), contentRight(), 0.4)
    pdf.y += 5
  } else if (layout.style === 'editor') {
    pdf.fontSize(layout.nameSize)
    text(basics.fullName || 'Your Name', {}, true)
    if (basics.headline) {
      pdf.moveDown(0.12).fontSize(layout.headlineSize)
      text(basics.headline)
    }
    if (contact) {
      pdf.moveDown(0.35).fontSize(layout.bodySize)
      text(contact)
    }
    pdf.moveDown(0.65)
    drawRule(pdf.y, contentLeft(), contentRight(), 0.45)
    pdf.moveDown(0.35)
  } else if (layout.style === 'career') {
    pdf.fontSize(layout.nameSize)
    text(basics.fullName || 'Your Name', {}, true)
    if (basics.headline) {
      pdf.moveDown(0.12).fontSize(layout.headlineSize)
      text(basics.headline)
    }
    if (contact) {
      pdf.moveDown(0.4).fontSize(layout.bodySize)
      text(contact, { align: 'right' })
    }
    pdf.moveDown(0.45)
    drawRule(pdf.y, contentLeft(), contentRight(), 0.8)
    pdf.moveDown(0.35)
  } else if (layout.style === 'resume-no') {
    pdf.fontSize(layout.nameSize).fillColor(inkColor)
    text(basics.fullName || 'Your Name', { align: 'center' }, true)
    if (basics.headline) {
      pdf.moveDown(0.12).fontSize(layout.headlineSize)
      text(basics.headline, { align: 'center' })
    }
    if (contact) {
      pdf.moveDown(0.18).fontSize(layout.bodySize).fillColor(mutedColor)
      text(contact, { align: 'center' })
    }
    if (document.links.length) {
      pdf.moveDown(0.12)
      drawHeaderLinks()
    }
    pdf.moveDown(0.55)
    drawRule(pdf.y, contentLeft(), contentRight(), 0.75, ruleColor)
    pdf.moveDown(0.4)
  } else {
    pdf.fontSize(layout.nameSize)
    text(basics.fullName || 'Your Name', {}, true)
    if (basics.headline) {
      pdf.fontSize(layout.headlineSize)
      text(basics.headline)
    }
    if (contact) {
      pdf.moveDown(layout.style === 'minimal' ? 0.45 : 0.25).fontSize(layout.bodySize)
      text(contact)
    }
    if (layout.style === 'structured') {
      pdf.moveDown(0.4)
      drawRule(pdf.y, contentLeft(), contentRight(), 1)
    }
  }

  for (const section of document.sectionOrder) {
    if (layout.style === 'resume-no' && section === 'links') continue
    if (!resumeHasSectionContent(document, section)) continue
    if (section === 'summary') {
      heading(layout.style === 'resume-no' ? (resumeNoSectionTitles[section] || sectionTitles[section]) : sectionTitles[section])
      drawRichText(basics.summary, layout.style === 'minimal' || layout.style === 'resume-no' ? 0 : layout.detailsIndent)
    } else if (section === 'experience') {
      heading(layout.style === 'resume-no' ? (resumeNoSectionTitles[section] || sectionTitles[section]) : sectionTitles[section])
      document.experience.forEach(item => row(
        item.title, item.company,
        layout.style === 'resume-no'
          ? [formatResumeDateRange(item.startDate, item.endDate, item.current), item.location].filter(Boolean).join('\n')
          : [item.location, formatResumeDateRange(item.startDate, item.endDate, item.current)].filter(Boolean).join(' • '),
        item.bullets
      ))
    } else if (section === 'education') {
      const details = (item: ResumeDocument['education'][number]) => [item.field !== item.degree ? item.field : '', item.location, formatResumeDateRange(item.startDate, item.endDate, item.current)].filter(Boolean).join(' • ')
      heading(layout.style === 'resume-no' ? (resumeNoSectionTitles[section] || sectionTitles[section]) : sectionTitles[section])
      document.education.forEach(item => {
        if (layout.style === 'resume-no') {
          const qualification = item.degree || item.field
          const institution = [item.institution, item.location].filter(Boolean).join(', ')
          const educationLine = [qualification, item.field && item.field !== qualification ? item.field : '', institution]
            .filter(Boolean)
            .join(' — ')
          ensureSpace(34)
          pdf.fontSize(layout.bodySize).fillColor(inkColor)
          text(educationLine)
          const dateRange = formatResumeDateRange(item.startDate, item.endDate, item.current)
          if (dateRange) {
            pdf.fontSize(layout.bodySize).fillColor(mutedColor)
            text(dateRange)
            pdf.fillColor(inkColor)
          }
          pdf.moveDown(layout.rowGap)
        } else {
          row(item.degree || item.field, item.institution, details(item))
        }
      })
    } else if (section === 'skills') {
      heading(layout.style === 'resume-no' ? (resumeNoSectionTitles[section] || sectionTitles[section]) : sectionTitles[section])
      document.skillGroups.forEach(item => row(item.name, item.items.join(', '), ''))
    } else if (section === 'projects') {
      const meta = (item: ResumeDocument['projects'][number]) => [item.url, formatResumeDateRange(item.startDate, item.endDate)].filter(Boolean).join(' • ')
      heading(layout.style === 'resume-no' ? (resumeNoSectionTitles[section] || sectionTitles[section]) : sectionTitles[section])
      document.projects.forEach(item => row(item.name, item.role, meta(item), item.bullets))
    } else if (section === 'certifications') {
      const meta = (item: ResumeDocument['certifications'][number]) => [formatResumeDate(item.issueDate), item.credentialUrl].filter(Boolean).join(' • ')
      heading(layout.style === 'resume-no' ? (resumeNoSectionTitles[section] || sectionTitles[section]) : sectionTitles[section])
      document.certifications.forEach(item => row(item.name, item.issuer, meta(item)))
    } else if (section === 'languages') {
      heading(layout.style === 'resume-no' ? (resumeNoSectionTitles[section] || sectionTitles[section]) : sectionTitles[section])
      document.languages.forEach(item => row(item.name, item.proficiency, ''))
    } else if (section === 'links') {
      heading(sectionTitles[section])
      document.links.forEach(item => row(item.label, item.url, ''))
    }
  }

  pdf.end()
  return completed
}