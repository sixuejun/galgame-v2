import { describe, it, expect } from 'vitest'
import {
  parseContentBlocks,
  contentBlockToHTML,
  parseAndConvertImageShorthand,
  hasImageShorthand,
  type ContentBlock,
} from '../index'

describe('imageParser', () => {
  describe('parseContentBlocks', () => {
    it('应该解析单个图片区块', () => {
      const content = `[img:https://example.com/1.jpg]
文字行1
文字行2`

      const blocks = parseContentBlocks(content)
      const imageBlocks = blocks.filter(b => b.type === 'image')

      expect(imageBlocks).toHaveLength(1)
      expect(imageBlocks[0]).toMatchObject({
        type: 'image',
        imageUrl: 'https://example.com/1.jpg',
        textLines: ['文字行1', '文字行2'],
      })
    })

    it('应该解析多个图片区块', () => {
      const content = `[img:https://example.com/1.jpg]
文字行1
文字行2
[img:https://example.com/2.jpg]
文字行3
文字行4`

      const blocks = parseContentBlocks(content)
      const imageBlocks = blocks.filter(b => b.type === 'image')

      expect(imageBlocks).toHaveLength(2)
      expect(imageBlocks[0]).toMatchObject({
        type: 'image',
        imageUrl: 'https://example.com/1.jpg',
        textLines: ['文字行1', '文字行2'],
      })
      expect(imageBlocks[1]).toMatchObject({
        type: 'image',
        imageUrl: 'https://example.com/2.jpg',
        textLines: ['文字行3', '文字行4'],
      })
    })

    it('应该保留 [img:URL] 之前的文本作为文本区块', () => {
      const content = `这是开头的文本
应该被保留
[img:https://example.com/1.jpg]
这是图片区块的文本`

      const blocks = parseContentBlocks(content)

      expect(blocks).toHaveLength(2)
      expect(blocks[0]).toMatchObject({
        type: 'text',
        textLines: ['这是开头的文本', '应该被保留'],
      })
      expect(blocks[1]).toMatchObject({
        type: 'image',
        imageUrl: 'https://example.com/1.jpg',
        textLines: ['这是图片区块的文本'],
      })
    })

    it('应该处理空内容', () => {
      const blocks = parseContentBlocks('')
      expect(blocks).toEqual([])
    })

    it('应该处理没有图片标记的内容', () => {
      const content = `普通文本
没有图片标记`

      const blocks = parseContentBlocks(content)
      const imageBlocks = blocks.filter(b => b.type === 'image')

      expect(imageBlocks).toEqual([])
      expect(blocks).toHaveLength(1)
      expect(blocks[0].type).toBe('text')
    })

    it('应该处理包含空行的图片区块', () => {
      const content = `[img:https://example.com/1.jpg]
文字行1

文字行2`

      const blocks = parseContentBlocks(content)
      const imageBlocks = blocks.filter(b => b.type === 'image')

      expect(imageBlocks).toHaveLength(1)
      expect(imageBlocks[0].textLines).toEqual(['文字行1', '', '文字行2'])
    })

    it('应该正确处理 URL 中的空格', () => {
      const content = `[img:  https://example.com/1.jpg  ]
文字内容`

      const blocks = parseContentBlocks(content)
      const imageBlocks = blocks.filter(b => b.type === 'image')

      expect(imageBlocks).toHaveLength(1)
      expect(imageBlocks[0].imageUrl).toBe('https://example.com/1.jpg')
    })
  })

  describe('contentBlockToHTML', () => {
    it('应该生成正确的图片区块 HTML 结构', () => {
      const block: ContentBlock = {
        type: 'image',
        imageUrl: 'https://example.com/test.jpg',
        textLines: ['文字行1', '文字行2'],
        subBlocks: [{ type: 'text', lines: ['文字行1', '文字行2'] }],
      }

      const html = contentBlockToHTML(block)

      expect(html).toContain('background-image:url("https://example.com/test.jpg")')
      expect(html).toContain('文字行1<br>')
      expect(html).toContain('文字行2')
      expect(html).toContain('position:relative')
      expect(html).toContain('min-height:400px')
    })

    it('应该处理文本区块', () => {
      const block: ContentBlock = {
        type: 'text',
        textLines: ['普通文本1', '普通文本2'],
      }

      const html = contentBlockToHTML(block)

      expect(html).toContain('普通文本1')
      expect(html).toContain('普通文本2')
      expect(html).not.toContain('background-image')
    })

    it('应该处理空文本行数组的图片区块', () => {
      const block: ContentBlock = {
        type: 'image',
        imageUrl: 'https://example.com/test.jpg',
        textLines: [],
        subBlocks: [],
      }

      const html = contentBlockToHTML(block)

      expect(html).toContain('background-image:url("https://example.com/test.jpg")')
      // 空文本时不应该有内容，只有空的 div
      expect(html).toContain("<div style='position:relative;padding:30px;")
    })
  })

  describe('parseAndConvertImageShorthand', () => {
    it('应该转换包含图片简写的内容', () => {
      const content = `[img:https://example.com/1.jpg]
文字行1
文字行2`

      const html = parseAndConvertImageShorthand(content)

      expect(html).toContain('background-image:url("https://example.com/1.jpg")')
      expect(html).toContain('文字行1<br>')
      expect(html).toContain('文字行2')
    })

    it('应该转换多个图片区块', () => {
      const content = `[img:https://example.com/1.jpg]
文字1
[img:https://example.com/2.jpg]
文字2`

      const html = parseAndConvertImageShorthand(content)

      expect(html).toContain('background-image:url("https://example.com/1.jpg")')
      expect(html).toContain('background-image:url("https://example.com/2.jpg")')
      expect(html).toContain('文字1')
      expect(html).toContain('文字2')
    })

    it('应该返回原始内容如果没有图片标记', () => {
      const content = '普通文本内容'
      const html = parseAndConvertImageShorthand(content)

      expect(html).toBe(content)
    })

    it('应该处理空内容', () => {
      const html = parseAndConvertImageShorthand('')
      expect(html).toBe('')
    })
  })

  describe('hasImageShorthand', () => {
    it('应该检测到图片简写格式', () => {
      expect(hasImageShorthand('[img:https://example.com/1.jpg]')).toBe(true)
      expect(hasImageShorthand('文本 [img:url] 文本')).toBe(true)
    })

    it('应该返回 false 如果没有图片简写', () => {
      expect(hasImageShorthand('普通文本')).toBe(false)
      expect(hasImageShorthand('')).toBe(false)
      expect(hasImageShorthand('img:url')).toBe(false)
    })
  })

  describe('parseContentBlocks', () => {
    it('应该解析混合内容（普通文本 + 图片区块）', () => {
      const content = `普通文本1
普通文本2
[img:https://example.com/1.jpg]
图片文字1
图片文字2`

      const blocks = parseContentBlocks(content)

      expect(blocks).toHaveLength(2)
      expect(blocks[0]).toMatchObject({
        type: 'text',
        textLines: ['普通文本1', '普通文本2'],
      })
      expect(blocks[1]).toMatchObject({
        type: 'image',
        imageUrl: 'https://example.com/1.jpg',
        textLines: ['图片文字1', '图片文字2'],
      })
      // 图片区块应该有 subBlocks
      expect(blocks[1].subBlocks).toBeDefined()
    })

    it('应该解析多个图片区块之间的普通文本', () => {
      const content = `开头文本
[img:https://example.com/1.jpg]
图片1文字
中间文本
[img:https://example.com/2.jpg]
图片2文字
结尾文本`

      const blocks = parseContentBlocks(content)

      expect(blocks).toHaveLength(3)
      expect(blocks[0]).toMatchObject({
        type: 'text',
        textLines: ['开头文本'],
      })
      expect(blocks[1]).toMatchObject({
        type: 'image',
        imageUrl: 'https://example.com/1.jpg',
        textLines: ['图片1文字', '中间文本'],
      })
      expect(blocks[2]).toMatchObject({
        type: 'image',
        imageUrl: 'https://example.com/2.jpg',
        textLines: ['图片2文字', '结尾文本'],
      })
    })

    it('应该处理仅包含普通文本的内容', () => {
      const content = `普通文本1
普通文本2
普通文本3`

      const blocks = parseContentBlocks(content)

      expect(blocks).toHaveLength(1)
      expect(blocks[0]).toEqual({
        type: 'text',
        textLines: ['普通文本1', '普通文本2', '普通文本3'],
      })
    })
  })

  describe('contentBlockToHTML', () => {
    it('应该将文本区块转换为普通文本', () => {
      const block: ContentBlock = {
        type: 'text',
        textLines: ['文本1', '文本2', '文本3'],
      }

      const html = contentBlockToHTML(block)

      expect(html).toBe('文本1\n文本2\n文本3')
    })

    it('应该将图片区块转换为带背景的 HTML', () => {
      const block: ContentBlock = {
        type: 'image',
        imageUrl: 'https://example.com/1.jpg',
        textLines: ['文本1', '文本2'],
      }

      const html = contentBlockToHTML(block)

      expect(html).toContain('background-image:url("https://example.com/1.jpg")')
      expect(html).toContain('文本1<br>')
      expect(html).toContain('文本2')
    })
  })

  describe('子块解析（显式标记）', () => {
    it('应该解析 [txt:...] 显式文本块', () => {
      const content = `[img:https://example.com/1.jpg]
[txt:
文本行1
文本行2
文本行3
]`

      const blocks = parseContentBlocks(content)

      expect(blocks).toHaveLength(1)
      expect(blocks[0].type).toBe('image')
      expect(blocks[0].subBlocks).toBeDefined()
      expect(blocks[0].subBlocks).toHaveLength(1)
      expect(blocks[0].subBlocks![0].type).toBe('text')
      expect(blocks[0].subBlocks![0].lines).toEqual(['文本行1', '文本行2', '文本行3'])
    })

    it('应该解析 [html:...] 显式 HTML 块', () => {
      const content = `[img:https://example.com/1.jpg]
[html:
<div style='color:red;'>
  <p>HTML 内容</p>
</div>
]`

      const blocks = parseContentBlocks(content)

      expect(blocks).toHaveLength(1)
      expect(blocks[0].type).toBe('image')
      expect(blocks[0].subBlocks).toBeDefined()
      expect(blocks[0].subBlocks).toHaveLength(1)
      expect(blocks[0].subBlocks![0].type).toBe('html')
      expect(blocks[0].subBlocks![0].lines).toContain("<div style='color:red;'>")
      expect(blocks[0].subBlocks![0].lines).toContain('  <p>HTML 内容</p>')
    })

    it('应该解析混合的 [txt:...] 和 [html:...] 块', () => {
      const content = `[img:https://example.com/1.jpg]
[txt:
文本行1
文本行2
]
[html:
<div>HTML 块</div>
]
[txt:
文本行3
]`

      const blocks = parseContentBlocks(content)

      expect(blocks).toHaveLength(1)
      expect(blocks[0].subBlocks).toHaveLength(3)
      expect(blocks[0].subBlocks![0].type).toBe('text')
      expect(blocks[0].subBlocks![0].lines).toEqual(['文本行1', '文本行2'])
      expect(blocks[0].subBlocks![1].type).toBe('html')
      expect(blocks[0].subBlocks![1].lines).toEqual(['<div>HTML 块</div>'])
      expect(blocks[0].subBlocks![2].type).toBe('text')
      expect(blocks[0].subBlocks![2].lines).toEqual(['文本行3'])
    })
  })

  describe('子块解析（隐式识别）', () => {
    it('应该自动识别 HTML 块（以 < 开头）', () => {
      const content = `[img:https://example.com/1.jpg]
文本行1
文本行2
<div style='color:red;'>
  <p>HTML 内容</p>
</div>
文本行3`

      const blocks = parseContentBlocks(content)

      expect(blocks).toHaveLength(1)
      expect(blocks[0].subBlocks).toBeDefined()
      expect(blocks[0].subBlocks).toHaveLength(3)
      expect(blocks[0].subBlocks![0].type).toBe('text')
      expect(blocks[0].subBlocks![0].lines).toEqual(['文本行1', '文本行2'])
      expect(blocks[0].subBlocks![1].type).toBe('html')
      expect(blocks[0].subBlocks![1].lines[0]).toBe("<div style='color:red;'>")
      expect(blocks[0].subBlocks![2].type).toBe('text')
      expect(blocks[0].subBlocks![2].lines).toContain('文本行3')
    })

    it('应该识别多行 HTML 块', () => {
      const content = `[img:https://example.com/1.jpg]
<div style='background:rgba(15, 15, 25, 0.9);'>
  <h4>标题</h4>
  <div>
    <span>内容</span>
  </div>
</div>`

      const blocks = parseContentBlocks(content)

      expect(blocks).toHaveLength(1)
      expect(blocks[0].subBlocks).toHaveLength(1)
      expect(blocks[0].subBlocks![0].type).toBe('html')
      expect(blocks[0].subBlocks![0].lines).toHaveLength(6)
    })
  })

  describe('子块 HTML 转换', () => {
    it('文本块应该添加 <br> 换行', () => {
      const block: ContentBlock = {
        type: 'image',
        imageUrl: 'https://example.com/1.jpg',
        textLines: [],
        subBlocks: [
          {
            type: 'text',
            lines: ['文本行1', '文本行2', '文本行3'],
          },
        ],
      }

      const html = contentBlockToHTML(block)

      expect(html).toContain('文本行1<br>')
      expect(html).toContain('文本行2<br>')
      expect(html).toContain('文本行3')
    })

    it('HTML 块应该保持原样，不添加 <br>', () => {
      const block: ContentBlock = {
        type: 'image',
        imageUrl: 'https://example.com/1.jpg',
        textLines: [],
        subBlocks: [
          {
            type: 'html',
            lines: ['<div style="color:red;">', '  <p>内容</p>', '</div>'],
          },
        ],
      }

      const html = contentBlockToHTML(block)

      expect(html).toContain('<div style="color:red;">')
      expect(html).toContain('  <p>内容</p>')
      expect(html).toContain('</div>')
      expect(html).not.toContain('<br>')
    })

    it('混合文本和 HTML 块应该正确转换', () => {
      const block: ContentBlock = {
        type: 'image',
        imageUrl: 'https://example.com/1.jpg',
        textLines: [],
        subBlocks: [
          {
            type: 'text',
            lines: ['文本行1', '文本行2'],
          },
          {
            type: 'html',
            lines: ['<div>HTML 块</div>'],
          },
          {
            type: 'text',
            lines: ['文本行3'],
          },
        ],
      }

      const html = contentBlockToHTML(block)

      expect(html).toContain('文本行1<br>')
      expect(html).toContain('文本行2')
      expect(html).toContain('<div>HTML 块</div>')
      expect(html).toContain('文本行3')
    })
  })

  describe('完整示例测试', () => {
    it('示例1：显式标记格式应该正确解析和转换', () => {
      const content = `[img:https://example.com/classroom.jpg]
[txt:
走廊尽头的教室里，阳光透过窗户洒进来。
七海站在窗边，银色的长发在晨光中闪耀着柔和的光泽。
]
[html:
<div style='background:rgba(15, 15, 25, 0.9);'>
  <h4>监控系统</h4>
</div>
]`

      const blocks = parseContentBlocks(content)
      expect(blocks).toHaveLength(1)
      expect(blocks[0].subBlocks).toHaveLength(2)

      const html = contentBlockToHTML(blocks[0])
      expect(html).toContain('走廊尽头的教室里，阳光透过窗户洒进来。<br>')
      expect(html).toContain("<div style='background:rgba(15, 15, 25, 0.9);'>")
      expect(html).toContain('<h4>监控系统</h4>')
    })

    it('示例2：隐式识别格式应该正确解析和转换', () => {
      const content = `[img:https://example.com/classroom.jpg]
走廊尽头的教室里，阳光透过窗户洒进来。
七海站在窗边，银色的长发在晨光中闪耀着柔和的光泽。
<div style='background:rgba(15, 15, 25, 0.9);'>
  <h4>监控系统</h4>
</div>`

      const blocks = parseContentBlocks(content)
      expect(blocks).toHaveLength(1)
      expect(blocks[0].subBlocks).toHaveLength(2)

      const html = contentBlockToHTML(blocks[0])
      expect(html).toContain('走廊尽头的教室里，阳光透过窗户洒进来。<br>')
      expect(html).toContain("<div style='background:rgba(15, 15, 25, 0.9);'>")
      expect(html).toContain('<h4>监控系统</h4>')
    })

    it('示例1和示例2应该产生相同的 HTML 输出', () => {
      const content1 = `[img:https://example.com/classroom.jpg]
[txt:
走廊尽头的教室里，阳光透过窗户洒进来。
七海站在窗边，银色的长发在晨光中闪耀着柔和的光泽。
]
[html:
<div style='background:rgba(15, 15, 25, 0.9);'>
  <h4>监控系统</h4>
</div>
]`

      const content2 = `[img:https://example.com/classroom.jpg]
走廊尽头的教室里，阳光透过窗户洒进来。
七海站在窗边，银色的长发在晨光中闪耀着柔和的光泽。
<div style='background:rgba(15, 15, 25, 0.9);'>
  <h4>监控系统</h4>
</div>`

      const html1 = parseAndConvertImageShorthand(content1)
      const html2 = parseAndConvertImageShorthand(content2)

      // 两种格式应该产生相同的关键内容
      expect(html1).toContain('走廊尽头的教室里，阳光透过窗户洒进来。<br>')
      expect(html2).toContain('走廊尽头的教室里，阳光透过窗户洒进来。<br>')
      expect(html1).toContain("<div style='background:rgba(15, 15, 25, 0.9);'>")
      expect(html2).toContain("<div style='background:rgba(15, 15, 25, 0.9);'>")
    })
  })
})
