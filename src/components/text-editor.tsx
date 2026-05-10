'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, FileText, Copy, Check, File } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TextEditorProps {
  text: string
  onChange: (text: string) => void
  onExportDocx: (fileName: string) => void
  onExportTxt: (fileName: string) => void
  isExporting?: boolean
  originalFileName?: string
}

export function TextEditor({
  text,
  onChange,
  onExportDocx,
  onExportTxt,
  isExporting,
  originalFileName,
}: TextEditorProps) {
  const [copied, setCopied] = useState(false)
  const [fileName, setFileName] = useState(
    originalFileName?.replace(/\.[^/.]+$/, '') || 'document'
  )

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])

  const handleExportDocx = () => {
    if (fileName.trim()) {
      onExportDocx(fileName.trim())
    }
  }

  const handleExportTxt = () => {
    if (fileName.trim()) {
      onExportTxt(fileName.trim())
    }
  }

  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const downloadDocxFile = async (content: string, filename: string) => {
    const blob = createDocxBlob(content)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.docx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="flex-1 max-w-[300px] px-3 py-1.5 text-sm font-medium bg-background rounded-md border focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Tên file"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Đã sao chép
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Sao chép
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="edit" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-background h-auto p-0">
          <TabsTrigger
            value="edit"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
          >
            Chỉnh sửa
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
          >
            Xem trước
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="flex-1 m-0">
          <textarea
            value={text}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full min-h-[400px] p-4 resize-none focus:outline-none font-mono text-sm"
            placeholder="Nội dung OCR sẽ hiển thị ở đây..."
          />
        </TabsContent>

        <TabsContent value="preview" className="flex-1 m-0 overflow-auto p-4">
          <div className="prose prose-sm max-w-none">
            {text.split('\n').map((line, i) => (
              <p key={i} className={cn('whitespace-pre-wrap', !line && 'h-4')}>
                {line || '\u00A0'}
              </p>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between p-4 border-t bg-muted/30">
        <p className="text-sm text-muted-foreground">
          {text.length} ký tự
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => downloadTextFile(text, fileName)}
            disabled={!text}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            Xuất TXT
          </Button>
          <Button
            onClick={() => downloadDocxFile(text, fileName)}
            disabled={!text || isExporting}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Đang xuất...
              </>
            ) : (
              <>
                <File className="w-4 h-4" />
                Xuất Word
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function createDocxBlob(text: string): Blob {
  const bodyXml = createDocumentBodyXml(text)
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`

  const files = [
    {
      path: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`,
    },
    {
      path: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    },
    {
      path: 'word/_rels/document.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      path: 'word/styles.xml',
      content: createStylesXml(),
    },
    {
      path: 'word/document.xml',
      content: documentXml,
    },
  ]

  const zipBytes = createZip(files)
  const zipBuffer = new ArrayBuffer(zipBytes.byteLength)
  new Uint8Array(zipBuffer).set(zipBytes)

  return new Blob([zipBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}

function createDocumentBodyXml(text: string): string {
  const lines = text.split(/\r?\n/)
  const blocks: string[] = []

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]

    if (isMarkdownTableStart(lines, index)) {
      const tableLines: string[] = [line]
      index += 2

      while (index < lines.length && isMarkdownTableRow(lines[index])) {
        tableLines.push(lines[index])
        index++
      }

      index--
      blocks.push(createTableXml(tableLines))
      continue
    }

    blocks.push(createParagraphXml(line))
  }

  return blocks.join('\n    ')
}

function createParagraphXml(line: string): string {
  const trimmed = line.trim()
  const heading = line.match(/^(#{1,6})\s+(.+)$/)
  if (heading) {
    return createTextParagraphXml(heading[2], {
      bold: true,
      size: heading[1].length === 1 ? 32 : 28,
      spacingAfter: 180,
      align: 'center',
    })
  }

  if (/^\s*[-*]\s+/.test(line)) {
    return createTextParagraphXml(line.replace(/^\s*[-*]\s+/, '- '), { spacingAfter: 80 })
  }

  return createTextParagraphXml(line, {
    spacingAfter: trimmed ? 80 : 0,
    align: shouldCenterParagraph(trimmed) ? 'center' : 'left',
    bold: shouldBoldCenteredParagraph(trimmed),
  })
}

function createTextParagraphXml(
  line: string,
  options: { bold?: boolean; size?: number; spacingAfter?: number; align?: 'left' | 'center' | 'right' } = {}
): string {
  const safeLine = escapeXml(line)
  const paragraphProps = options.spacingAfter !== undefined || options.align
    ? `<w:pPr>${options.align ? `<w:jc w:val="${options.align}"/>` : ''}${options.spacingAfter !== undefined ? `<w:spacing w:after="${options.spacingAfter}"/>` : ''}</w:pPr>`
    : ''
  const runProps = options.bold || options.size
    ? `<w:rPr>${createRunFontsXml()}${options.bold ? '<w:b/>' : ''}${options.size ? `<w:sz w:val="${options.size}"/>` : ''}</w:rPr>`
    : ''

  return `<w:p>${paragraphProps}<w:r>${runProps}<w:t xml:space="preserve">${safeLine || ' '}</w:t></w:r></w:p>`
}

function shouldCenterParagraph(line: string): boolean {
  if (!line) {
    return false
  }

  const upperLike = line === line.toLocaleUpperCase('vi-VN')
  const shortLine = line.length <= 70

  return shortLine && (
    upperLike ||
    /^H[oọ]c k[yỳ]|^N[aă]m h[oọ]c|^Kh[oó]a/i.test(line) ||
    /^(TRƯỜNG|THỦ|THU|VIỆN|CTĐT|PHIẾU|HỌC PHẦN)/i.test(line)
  )
}

function shouldBoldCenteredParagraph(line: string): boolean {
  return shouldCenterParagraph(line) && line.length <= 90
}

function isMarkdownTableStart(lines: string[], index: number): boolean {
  return isMarkdownTableRow(lines[index]) && isMarkdownTableSeparator(lines[index + 1] || '')
}

function isMarkdownTableRow(line: string): boolean {
  const normalizedLine = normalizeTableLine(line)
  return normalizedLine.includes('|') && normalizedLine.split('|').length >= 3
}

function isMarkdownTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(normalizeTableLine(line))
}

function createTableXml(tableLines: string[]): string {
  const rows = tableLines.map(parseMarkdownTableRow)
  const columnCount = Math.max(...rows.map((row) => row.length), 1)
  const gridColumns = Array.from({ length: columnCount }, () => '<w:gridCol w:w="2200"/>').join('')

  return `<w:tbl>
      <w:tblPr>
        <w:tblW w:w="0" w:type="auto"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="888888"/>
          <w:left w:val="single" w:sz="4" w:space="0" w:color="888888"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="888888"/>
          <w:right w:val="single" w:sz="4" w:space="0" w:color="888888"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="888888"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="888888"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tblGrid>${gridColumns}</w:tblGrid>
      ${rows.map((row, rowIndex) => createTableRowXml(row, columnCount, rowIndex === 0)).join('\n      ')}
    </w:tbl>`
}

function parseMarkdownTableRow(line: string): string[] {
  const trimmed = normalizeTableLine(line).trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split('|').map((cell) => cell.trim())
}

function normalizeTableLine(line: string): string {
  if (line.includes('|')) {
    return line
  }

  const trimmed = line.trim()
  if (/^l\s+.+\s+l$/.test(trimmed) && trimmed.includes(' l ')) {
    return trimmed
      .replace(/^l\s+/, '| ')
      .replace(/\s+l\s+/g, ' | ')
      .replace(/\s+l$/, ' |')
  }

  return line
}

function createTableRowXml(row: string[], columnCount: number, isHeader: boolean): string {
  const cells = Array.from({ length: columnCount }, (_, index) => row[index] || '')
  return `<w:tr>${cells.map((cell) => createTableCellXml(cell, isHeader)).join('')}</w:tr>`
}

function createTableCellXml(cell: string, isHeader: boolean): string {
  const fill = isHeader ? '<w:shd w:fill="EAF2FF"/>' : ''
  const bold = isHeader ? '<w:b/>' : ''

  return `<w:tc>
        <w:tcPr>
          <w:tcW w:w="2200" w:type="dxa"/>
          ${fill}
        </w:tcPr>
        <w:p>
          <w:pPr><w:spacing w:after="0"/></w:pPr>
          <w:r><w:rPr>${createRunFontsXml()}${bold}</w:rPr><w:t xml:space="preserve">${escapeXml(cell) || ' '}</w:t></w:r>
        </w:p>
      </w:tc>`
}

function createRunFontsXml(): string {
  return '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/>'
}

function createStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        ${createRunFontsXml()}
        <w:sz w:val="24"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="80" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:rPr>
      ${createRunFontsXml()}
      <w:sz w:val="24"/>
    </w:rPr>
  </w:style>
</w:styles>`
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
}

function createZip(files: Array<{ path: string; content: string }>): Uint8Array {
  const encoder = new TextEncoder()
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let offset = 0

  for (const file of files) {
    const nameBytes = encoder.encode(file.path)
    const data = encoder.encode(file.content)
    const crc = crc32(data)
    const localHeader = createLocalFileHeader(nameBytes, data, crc)
    const centralHeader = createCentralDirectoryHeader(nameBytes, data, crc, offset)

    localParts.push(localHeader, data)
    centralParts.push(centralHeader)
    offset += localHeader.length + data.length
  }

  const centralDirectoryOffset = offset
  const centralDirectorySize = centralParts.reduce((sum, part) => sum + part.length, 0)
  const endRecord = createEndOfCentralDirectory(files.length, centralDirectorySize, centralDirectoryOffset)

  return concatUint8Arrays([...localParts, ...centralParts, endRecord])
}

function createLocalFileHeader(nameBytes: Uint8Array, data: Uint8Array, crc: number): Uint8Array {
  const header = new Uint8Array(30 + nameBytes.length)
  const view = new DataView(header.buffer)
  view.setUint32(0, 0x04034b50, true)
  view.setUint16(4, 20, true)
  view.setUint16(6, 0x0800, true)
  view.setUint16(8, 0, true)
  view.setUint16(10, 0, true)
  view.setUint16(12, 0, true)
  view.setUint32(14, crc, true)
  view.setUint32(18, data.length, true)
  view.setUint32(22, data.length, true)
  view.setUint16(26, nameBytes.length, true)
  view.setUint16(28, 0, true)
  header.set(nameBytes, 30)
  return header
}

function createCentralDirectoryHeader(
  nameBytes: Uint8Array,
  data: Uint8Array,
  crc: number,
  offset: number
): Uint8Array {
  const header = new Uint8Array(46 + nameBytes.length)
  const view = new DataView(header.buffer)
  view.setUint32(0, 0x02014b50, true)
  view.setUint16(4, 20, true)
  view.setUint16(6, 20, true)
  view.setUint16(8, 0x0800, true)
  view.setUint16(10, 0, true)
  view.setUint16(12, 0, true)
  view.setUint16(14, 0, true)
  view.setUint32(16, crc, true)
  view.setUint32(20, data.length, true)
  view.setUint32(24, data.length, true)
  view.setUint16(28, nameBytes.length, true)
  view.setUint16(30, 0, true)
  view.setUint16(32, 0, true)
  view.setUint16(34, 0, true)
  view.setUint16(36, 0, true)
  view.setUint32(38, 0, true)
  view.setUint32(42, offset, true)
  header.set(nameBytes, 46)
  return header
}

function createEndOfCentralDirectory(fileCount: number, centralSize: number, centralOffset: number): Uint8Array {
  const header = new Uint8Array(22)
  const view = new DataView(header.buffer)
  view.setUint32(0, 0x06054b50, true)
  view.setUint16(4, 0, true)
  view.setUint16(6, 0, true)
  view.setUint16(8, fileCount, true)
  view.setUint16(10, fileCount, true)
  view.setUint32(12, centralSize, true)
  view.setUint32(16, centralOffset, true)
  view.setUint16(20, 0, true)
  return header
}

function concatUint8Arrays(parts: Uint8Array[]): Uint8Array {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0

  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }

  return result
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff

  for (let index = 0; index < data.length; index++) {
    const byte = data[index]
    crc ^= byte
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }

  return (crc ^ 0xffffffff) >>> 0
}
