import PDFDocument from 'pdfkit'
import type { ResumeDocument, ResumeSectionKey } from '~~/shared/types/resume'
import { formatResumeDate, formatResumeDateRange, resumeHasSectionContent, sanitizeRichText } from '~~/shared/utils/resume'

const PAGE_MARGIN = 44
const BODY_SIZE = 9
const ROW_TITLE_SIZE = 10
const TEXT_COLOR = '#000000'

const sectionTitles: Record<ResumeSectionKey, string> = {
  summary: 'Professional Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  languages: 'Languages',
  links: 'Links'
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
      && previous.underline === state.underline && previous.strike === state.strike) {
      previous.text += text
    } else {
      segments.push({ text, ...state })
    }
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

export async function renderResumePdf(document: ResumeDocument): Promise<Buffer> {
  const fontStorage = useStorage('assets:resume-fonts')
  const [latinFont, latinBoldFont, ethiopicFont, ethiopicBoldFont] = await Promise.all([
    fontStorage.getItemRaw('noto-sans-ethiopic-latin-400-normal.woff'),
    fontStorage.getItemRaw('noto-sans-ethiopic-latin-700-normal.woff'),
    fontStorage.getItemRaw('noto-sans-ethiopic-ethiopic-400-normal.woff'),
    fontStorage.getItemRaw('noto-sans-ethiopic-ethiopic-700-normal.woff')
  ])
  if (!latinFont || !latinBoldFont || !ethiopicFont || !ethiopicBoldFont) {
    throw new Error('Resume PDF fonts are unavailable')
  }

  const pdf = new PDFDocument({
    size: 'A4',
    margin: PAGE_MARGIN,
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

  const contentWidth = () => pdf.page.width - pdf.page.margins.left - pdf.page.margins.right
  const font = (value: string, bold = false) => {
    pdf.font(hasEthiopic(value) ? (bold ? 'NotoEthiopicBold' : 'NotoEthiopic') : (bold ? 'NotoBold' : 'Noto'))
  }
  const text = (value: string, options: PDFKit.Mixins.TextOptions = {}, bold = false) => {
    font(value, bold)
    pdf.text(value, options)
  }
  const drawRichText = (content: string, indent = 0) => {
    const segments = richTextSegments(content)
    if (!segments.length) return
    pdf.fontSize(BODY_SIZE).fillColor(TEXT_COLOR)
    segments.forEach((segment, index) => {
      font(segment.text, segment.bold)
      pdf.text(segment.text, index === 0 ? {
        width: contentWidth(), indent, paragraphGap: 2, lineGap: 1,
        oblique: segment.oblique, underline: segment.underline, strike: segment.strike,
        continued: index < segments.length - 1
      } : {
        oblique: segment.oblique, underline: segment.underline, strike: segment.strike,
        continued: index < segments.length - 1
      })
    })
  }
  const heading = (label: string) => {
    pdf.moveDown(0.75).fillColor(TEXT_COLOR).fontSize(ROW_TITLE_SIZE)
    text(label.toUpperCase(), { characterSpacing: 1 }, true)
    pdf.moveDown(0.2).strokeColor(TEXT_COLOR).lineWidth(0.7)
      .moveTo(pdf.page.margins.left, pdf.y).lineTo(pdf.page.width - pdf.page.margins.right, pdf.y).stroke()
    pdf.moveDown(0.35).fillColor(TEXT_COLOR)
  }
  const row = (primary: string, secondary: string, meta: string, details = '') => {
    pdf.fontSize(ROW_TITLE_SIZE).fillColor(TEXT_COLOR)
    text(primary || secondary, { continued: Boolean(primary && secondary) }, true)
    if (primary && secondary) {
      pdf.fontSize(BODY_SIZE)
      text(`  |  ${secondary}`)
    }
    if (meta) {
      pdf.fontSize(BODY_SIZE).fillColor(TEXT_COLOR)
      text(meta, { oblique: true })
    }
    drawRichText(details, 8)
    pdf.moveDown(0.35)
  }

  const basics = document.basics
  pdf.fillColor(TEXT_COLOR).fontSize(22)
  text(basics.fullName || 'Your Name', {}, true)
  if (basics.headline) {
    pdf.fontSize(11).fillColor(TEXT_COLOR)
    text(basics.headline)
  }
  const contact = [basics.email, basics.phone, basics.location].filter(Boolean).join('  •  ')
  if (contact) {
    pdf.moveDown(0.25).fontSize(BODY_SIZE).fillColor(TEXT_COLOR)
    text(contact)
  }

  for (const section of document.sectionOrder) {
    if (!resumeHasSectionContent(document, section)) continue

    if (section === 'summary') {
      heading(sectionTitles[section])
      drawRichText(basics.summary)
    } else if (section === 'experience') {
      heading(sectionTitles[section])
      document.experience.forEach(item => row(
        item.title,
        item.company,
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
