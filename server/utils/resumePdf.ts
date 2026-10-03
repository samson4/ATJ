import PDFDocument from 'pdfkit'
import type { ResumeDocument, ResumeSectionKey, ResumeTemplateKey } from '~~/shared/types/resume'
import { formatResumeDate, formatResumeDateRange, resumeHasSectionContent, sanitizeRichText } from '~~/shared/utils/resume'

const TEXT_COLOR = '#000000'

const sectionTitles: Record<ResumeSectionKey, string> = {
  summary: 'Professional Summary', experience: 'Experience', education: 'Education', skills: 'Skills',
  projects: 'Projects', certifications: 'Certifications', languages: 'Languages', links: 'Links'
}

type TemplateStyle = 'classic' | 'minimal' | 'centered' | 'executive' | 'compact' | 'structured'

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
  const drawRule = (y: number, start = contentLeft(), end = contentRight(), width = 0.7) => {
    pdf.strokeColor(TEXT_COLOR).lineWidth(width).moveTo(start, y).lineTo(end, y).stroke()
  }
  const drawRichText = (content: string, indent = layout.detailsIndent) => {
    const segments = richTextSegments(content)
    if (!segments.length) return
    pdf.fontSize(layout.bodySize).fillColor(TEXT_COLOR)
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

  const heading = (label: string) => {
    ensureSpace(layout.style === 'structured' ? 46 : 38)
    pdf.fillColor(TEXT_COLOR)
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
    ensureSpace(details ? 54 : 32)
    pdf.fontSize(layout.rowTitleSize).fillColor(TEXT_COLOR)
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
    } else {
      text(primary || secondary, { continued: Boolean(primary && secondary) }, true)
      if (primary && secondary) {
        pdf.fontSize(layout.bodySize)
        text(layout.style === 'minimal' ? `  —  ${secondary}` : `  |  ${secondary}`)
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
    }
    pdf.moveDown(layout.rowGap)
  }

  const basics = document.basics
  const contact = [basics.email, basics.phone, basics.location].filter(Boolean).join(layout.contactSeparator)
  pdf.fillColor(TEXT_COLOR)
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
    if (!resumeHasSectionContent(document, section)) continue
    if (section === 'summary') {
      heading(sectionTitles[section])
      drawRichText(basics.summary, layout.style === 'minimal' ? 0 : layout.detailsIndent)
    } else if (section === 'experience') {
      heading(sectionTitles[section])
      document.experience.forEach(item => row(
        item.title, item.company,
        [item.location, formatResumeDateRange(item.startDate, item.endDate, item.current)].filter(Boolean).join(' • '),
        item.bullets
      ))
    } else if (section === 'education') {
      const details = (item: ResumeDocument['education'][number]) => [item.field !== item.degree ? item.field : '', item.location, formatResumeDateRange(item.startDate, item.endDate, item.current)].filter(Boolean).join(' • ')
      heading(sectionTitles[section])
      document.education.forEach(item => row(item.degree || item.field, item.institution, details(item)))
    } else if (section === 'skills') {
      heading(sectionTitles[section])
      document.skillGroups.forEach(item => row(item.name, item.items.join(', '), ''))
    } else if (section === 'projects') {
      const meta = (item: ResumeDocument['projects'][number]) => [item.url, formatResumeDateRange(item.startDate, item.endDate)].filter(Boolean).join(' • ')
      heading(sectionTitles[section])
      document.projects.forEach(item => row(item.name, item.role, meta(item), item.bullets))
    } else if (section === 'certifications') {
      const meta = (item: ResumeDocument['certifications'][number]) => [formatResumeDate(item.issueDate), item.credentialUrl].filter(Boolean).join(' • ')
      heading(sectionTitles[section])
      document.certifications.forEach(item => row(item.name, item.issuer, meta(item)))
    } else if (section === 'languages') {
      heading(sectionTitles[section])
      document.languages.forEach(item => row(item.name, item.proficiency, ''))
    } else if (section === 'links') {
      heading(sectionTitles[section])
      document.links.forEach(item => row(item.label, item.url, ''))
    }
  }

  pdf.end()
  return completed
}
