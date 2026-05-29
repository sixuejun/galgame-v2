/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  parseAndConvertImageShorthandAsync,
  parseAndConvertImageShorthandAsyncWithCallback,
} from '../imageService'
import * as stChatu8Service from '@/services/stChatu8ImageService'
import * as imageCacheService from '@/services/imageCacheService'
import * as parser from '../parser'
import * as renderer from '../renderer'

// Mock 依赖
vi.mock('@/services/stChatu8ImageService')
vi.mock('@/services/imageCacheService')
vi.mock('../parser')
vi.mock('../renderer')
vi.mock('@/composables/ui/useToast', () => ({
  useToast: () => ({
    error: vi.fn(),
  }),
}))
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

describe('imageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('parseAndConvertImageShorthandAsync', () => {
    it('应该处理空内容', async () => {
      const result = await parseAndConvertImageShorthandAsync('')
      expect(result).toBe('')
    })

    it('应该处理没有图片区块的内容', async () => {
      const mockBlocks = [{ type: 'text', textLines: ['普通文本'], id: 'block-1' }]
      vi.mocked(parser.parseContentBlocks).mockReturnValue(mockBlocks as any)
      vi.mocked(renderer.contentBlockToHTML).mockReturnValue('<p>普通文本</p>')

      const result = await parseAndConvertImageShorthandAsync('普通文本')
      expect(result).toBe('<p>普通文本</p>')
    })

    it('应该返回原始内容当没有区块时', async () => {
      vi.mocked(parser.parseContentBlocks).mockReturnValue([])

      const result = await parseAndConvertImageShorthandAsync('test content')
      expect(result).toBe('test content')
    })

    it('应该处理 pollinations 服务的图片', async () => {
      const mockBlocks = [
        {
          type: 'image',
          imageUrl: 'a beautiful sunset',
          textLines: ['图片描述'],
          id: 'block-1',
        },
      ]
      vi.mocked(parser.parseContentBlocks).mockReturnValue(mockBlocks as any)
      vi.mocked(renderer.contentBlockToHTML).mockReturnValue('<div>图片</div>')

      const result = await parseAndConvertImageShorthandAsync(
        '[img:a beautiful sunset]',
        'pollinations'
      )

      expect(result).toBe('<div>图片</div>')
      expect(renderer.contentBlockToHTML).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: expect.stringContaining('pollinations.ai'),
        })
      )
    })

    it('应该处理已经是完整 URL 的图片', async () => {
      const mockBlocks = [
        {
          type: 'image',
          imageUrl: 'https://example.com/image.jpg',
          textLines: [],
          id: 'block-1',
        },
      ]
      vi.mocked(parser.parseContentBlocks).mockReturnValue(mockBlocks as any)
      vi.mocked(renderer.contentBlockToHTML).mockReturnValue('<div>图片</div>')

      const result = await parseAndConvertImageShorthandAsync(
        '[img:https://example.com/image.jpg]',
        'pollinations'
      )

      expect(result).toBe('<div>图片</div>')
      expect(renderer.contentBlockToHTML).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: 'https://example.com/image.jpg',
        })
      )
    })

    it('应该处理 data URL 的图片', async () => {
      const mockBlocks = [
        {
          type: 'image',
          imageUrl: 'data:image/png;base64,abc123',
          textLines: [],
          id: 'block-1',
        },
      ]
      vi.mocked(parser.parseContentBlocks).mockReturnValue(mockBlocks as any)
      vi.mocked(renderer.contentBlockToHTML).mockReturnValue('<div>图片</div>')

      const result = await parseAndConvertImageShorthandAsync(
        '[img:data:image/png;base64,abc123]',
        'pollinations'
      )

      expect(result).toBe('<div>图片</div>')
      expect(renderer.contentBlockToHTML).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: 'data:image/png;base64,abc123',
        })
      )
    })

    it('应该处理 st-chatu8 服务的缓存命中', async () => {
      const mockBlocks = [
        {
          type: 'image',
          imageUrl: 'test prompt',
          textLines: [],
          id: 'block-1',
        },
      ]
      vi.mocked(parser.parseContentBlocks).mockReturnValue(mockBlocks as any)
      vi.mocked(imageCacheService.ImageCacheService.getImage).mockResolvedValue(
        'data:image/png;base64,cached'
      )
      vi.mocked(renderer.contentBlockToHTML).mockReturnValue('<div>图片</div>')

      const result = await parseAndConvertImageShorthandAsync('[img:test prompt]', 'st-chatu8')

      expect(result).toBe('<div>图片</div>')
      expect(imageCacheService.ImageCacheService.getImage).toHaveBeenCalledWith('test prompt')
      expect(stChatu8Service.generateImageWithStChatu8).not.toHaveBeenCalled()
    })

    it('应该处理 st-chatu8 服务的缓存未命中', async () => {
      const mockBlocks = [
        {
          type: 'image',
          imageUrl: 'test prompt',
          textLines: [],
          id: 'block-1',
        },
      ]
      vi.mocked(parser.parseContentBlocks).mockReturnValue(mockBlocks as any)
      vi.mocked(imageCacheService.ImageCacheService.getImage).mockResolvedValue(null)
      vi.mocked(stChatu8Service.generateImageWithStChatu8).mockResolvedValue('base64data')
      vi.mocked(stChatu8Service.base64ToDataUrl).mockReturnValue('data:image/png;base64,generated')
      vi.mocked(imageCacheService.ImageCacheService.setImage).mockResolvedValue(true)
      vi.mocked(renderer.contentBlockToHTML).mockReturnValue('<div>图片</div>')

      const result = await parseAndConvertImageShorthandAsync('[img:test prompt]', 'st-chatu8')

      expect(result).toBe('<div>图片</div>')
      expect(stChatu8Service.generateImageWithStChatu8).toHaveBeenCalledWith(
        'test prompt',
        undefined
      )
      expect(imageCacheService.ImageCacheService.setImage).toHaveBeenCalled()
    })

    it('应该处理 st-chatu8 服务的超时参数', async () => {
      const mockBlocks = [
        {
          type: 'image',
          imageUrl: 'test prompt',
          textLines: [],
          id: 'block-1',
        },
      ]
      vi.mocked(parser.parseContentBlocks).mockReturnValue(mockBlocks as any)
      vi.mocked(imageCacheService.ImageCacheService.getImage).mockResolvedValue(null)
      vi.mocked(stChatu8Service.generateImageWithStChatu8).mockResolvedValue('base64data')
      vi.mocked(stChatu8Service.base64ToDataUrl).mockReturnValue('data:image/png;base64,generated')
      vi.mocked(imageCacheService.ImageCacheService.setImage).mockResolvedValue(true)
      vi.mocked(renderer.contentBlockToHTML).mockReturnValue('<div>图片</div>')

      await parseAndConvertImageShorthandAsync('[img:test prompt]', 'st-chatu8', 5000)

      expect(stChatu8Service.generateImageWithStChatu8).toHaveBeenCalledWith('test prompt', 5000)
    })

    it('应该处理图片生成失败 - ImageGenerationError', async () => {
      const mockError = new stChatu8Service.ImageGenerationError(
        'Timeout',
        stChatu8Service.ImageGenerationErrorType.TIMEOUT
      )
      // Mock getUserFriendlyMessage 方法
      mockError.getUserFriendlyMessage = vi.fn().mockReturnValue('⏱️ 图片生成超时')

      const mockBlocks = [
        {
          type: 'image',
          imageUrl: 'test prompt',
          textLines: [],
          id: 'block-1',
        },
      ]
      vi.mocked(parser.parseContentBlocks).mockReturnValue(mockBlocks as any)
      vi.mocked(imageCacheService.ImageCacheService.getImage).mockResolvedValue(null)
      vi.mocked(stChatu8Service.generateImageWithStChatu8).mockRejectedValue(mockError)
      vi.mocked(renderer.contentBlockToHTML).mockReturnValue('<div>错误</div>')

      const result = await parseAndConvertImageShorthandAsync('[img:test prompt]', 'st-chatu8')

      expect(result).toBe('<div>错误</div>')
      expect(renderer.contentBlockToHTML).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: '',
          textLines: expect.arrayContaining(['⏱️ 图片生成超时']),
        })
      )
    })

    it('应该处理图片生成失败 - 普通 Error', async () => {
      const mockBlocks = [
        {
          type: 'image',
          imageUrl: 'test prompt',
          textLines: [],
          id: 'block-1',
        },
      ]
      vi.mocked(parser.parseContentBlocks).mockReturnValue(mockBlocks as any)
      vi.mocked(imageCacheService.ImageCacheService.getImage).mockResolvedValue(null)
      vi.mocked(stChatu8Service.generateImageWithStChatu8).mockRejectedValue(
        new Error('Network error')
      )
      vi.mocked(renderer.contentBlockToHTML).mockReturnValue('<div>错误</div>')

      const result = await parseAndConvertImageShorthandAsync('[img:test prompt]', 'st-chatu8')

      expect(result).toBe('<div>错误</div>')
      expect(renderer.contentBlockToHTML).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: '',
          textLines: expect.arrayContaining([expect.stringContaining('Network error')]),
        })
      )
    })

    it('应该处理缓存保存失败', async () => {
      const mockBlocks = [
        {
          type: 'image',
          imageUrl: 'test prompt',
          textLines: [],
          id: 'block-1',
        },
      ]
      vi.mocked(parser.parseContentBlocks).mockReturnValue(mockBlocks as any)
      vi.mocked(imageCacheService.ImageCacheService.getImage).mockResolvedValue(null)
      vi.mocked(stChatu8Service.generateImageWithStChatu8).mockResolvedValue('base64data')
      vi.mocked(stChatu8Service.base64ToDataUrl).mockReturnValue('data:image/png;base64,generated')
      vi.mocked(imageCacheService.ImageCacheService.setImage).mockRejectedValue(
        new Error('Cache error')
      )
      vi.mocked(renderer.contentBlockToHTML).mockReturnValue('<div>图片</div>')

      // 缓存保存失败不应该影响图片返回
      const result = await parseAndConvertImageShorthandAsync('[img:test prompt]', 'st-chatu8')

      expect(result).toBe('<div>图片</div>')
    })

    it('应该处理多个图片区块', async () => {
      const mockBlocks = [
        {
          type: 'image',
          imageUrl: 'prompt1',
          textLines: [],
          id: 'block-1',
        },
        {
          type: 'text',
          textLines: ['文本'],
          id: 'block-2',
        },
        {
          type: 'image',
          imageUrl: 'prompt2',
          textLines: [],
          id: 'block-3',
        },
      ]
      vi.mocked(parser.parseContentBlocks).mockReturnValue(mockBlocks as any)
      vi.mocked(renderer.contentBlockToHTML)
        .mockReturnValueOnce('<div>图片1</div>')
        .mockReturnValueOnce('<p>文本</p>')
        .mockReturnValueOnce('<div>图片2</div>')

      const result = await parseAndConvertImageShorthandAsync('content', 'pollinations')

      expect(result).toBe('<div>图片1</div>\n<p>文本</p>\n<div>图片2</div>')
    })
  })

  describe('parseAndConvertImageShorthandAsyncWithCallback', () => {
    it('应该处理空内容', () => {
      const result = parseAndConvertImageShorthandAsyncWithCallback('')
      expect(result).toBe('')
    })

    it('应该返回原始内容当没有区块时', () => {
      vi.mocked(parser.parseContentBlocks).mockReturnValue([])

      const result = parseAndConvertImageShorthandAsyncWithCallback('test content')
      expect(result).toBe('test content')
    })

    it('应该立即返回带占位符的 HTML', () => {
      const mockBlocks = [
        {
          type: 'image',
          imageUrl: 'test prompt',
          textLines: [],
          id: 'block-1',
        },
      ]
      vi.mocked(parser.parseContentBlocks).mockReturnValue(mockBlocks as any)
      vi.mocked(renderer.contentBlockToHTMLWithPlaceholder).mockReturnValue('<div>占位符</div>')

      const result = parseAndConvertImageShorthandAsyncWithCallback(
        '[img:test prompt]',
        'pollinations'
      )

      expect(result).toBe('<div>占位符</div>')
      expect(renderer.contentBlockToHTMLWithPlaceholder).toHaveBeenCalled()
    })

    it('应该在图片加载完成后调用回调', async () => {
      const mockCallback = vi.fn()
      const mockBlocks = [
        {
          type: 'image',
          imageUrl: 'test prompt',
          textLines: [],
          id: 'block-1',
        },
      ]
      vi.mocked(parser.parseContentBlocks).mockReturnValue(mockBlocks as any)
      vi.mocked(renderer.contentBlockToHTMLWithPlaceholder).mockReturnValue('<div>占位符</div>')
      vi.mocked(imageCacheService.ImageCacheService.getImage).mockResolvedValue(null)
      vi.mocked(stChatu8Service.generateImageWithStChatu8).mockResolvedValue('base64data')
      vi.mocked(stChatu8Service.base64ToDataUrl).mockReturnValue('data:image/png;base64,generated')
      vi.mocked(imageCacheService.ImageCacheService.setImage).mockResolvedValue(true)

      parseAndConvertImageShorthandAsyncWithCallback('[img:test prompt]', 'st-chatu8', mockCallback)

      // 等待异步操作完成
      await vi.waitFor(() => {
        expect(mockCallback).toHaveBeenCalledWith('block-1', 'data:image/png;base64,generated')
      })
    })

    it('应该处理没有回调函数的情况', async () => {
      const mockBlocks = [
        {
          type: 'image',
          imageUrl: 'test prompt',
          textLines: [],
          id: 'block-1',
        },
      ]
      vi.mocked(parser.parseContentBlocks).mockReturnValue(mockBlocks as any)
      vi.mocked(renderer.contentBlockToHTMLWithPlaceholder).mockReturnValue('<div>占位符</div>')
      vi.mocked(imageCacheService.ImageCacheService.getImage).mockResolvedValue(
        'data:image/png;base64,cached'
      )

      const result = parseAndConvertImageShorthandAsyncWithCallback(
        '[img:test prompt]',
        'st-chatu8'
      )

      expect(result).toBe('<div>占位符</div>')
    })

    it('应该处理图片加载失败并显示 Toast', async () => {
      const mockCallback = vi.fn()
      const mockError = new stChatu8Service.ImageGenerationError(
        'Timeout',
        stChatu8Service.ImageGenerationErrorType.TIMEOUT
      )
      const mockBlocks = [
        {
          type: 'image',
          imageUrl: 'test prompt',
          textLines: [],
          id: 'block-1',
        },
      ]
      vi.mocked(parser.parseContentBlocks).mockReturnValue(mockBlocks as any)
      vi.mocked(renderer.contentBlockToHTMLWithPlaceholder).mockReturnValue('<div>占位符</div>')
      vi.mocked(imageCacheService.ImageCacheService.getImage).mockResolvedValue(null)
      vi.mocked(stChatu8Service.generateImageWithStChatu8).mockRejectedValue(mockError)

      parseAndConvertImageShorthandAsyncWithCallback('[img:test prompt]', 'st-chatu8', mockCallback)

      // 等待异步操作完成
      await vi.waitFor(() => {
        expect(mockCallback).not.toHaveBeenCalled()
      })
    })

    it('应该处理文本区块', () => {
      const mockBlocks = [
        {
          type: 'text',
          textLines: ['普通文本'],
          id: 'block-1',
        },
      ]
      vi.mocked(parser.parseContentBlocks).mockReturnValue(mockBlocks as any)
      vi.mocked(renderer.contentBlockToHTML).mockReturnValue('<p>普通文本</p>')

      const result = parseAndConvertImageShorthandAsyncWithCallback('普通文本')

      expect(result).toBe('<p>普通文本</p>')
      expect(renderer.contentBlockToHTML).toHaveBeenCalled()
      expect(renderer.contentBlockToHTMLWithPlaceholder).not.toHaveBeenCalled()
    })

    it('应该处理混合内容', () => {
      const mockBlocks = [
        {
          type: 'text',
          textLines: ['文本1'],
          id: 'block-1',
        },
        {
          type: 'image',
          imageUrl: 'prompt',
          textLines: [],
          id: 'block-2',
        },
        {
          type: 'text',
          textLines: ['文本2'],
          id: 'block-3',
        },
      ]
      vi.mocked(parser.parseContentBlocks).mockReturnValue(mockBlocks as any)
      vi.mocked(renderer.contentBlockToHTML)
        .mockReturnValueOnce('<p>文本1</p>')
        .mockReturnValueOnce('<p>文本2</p>')
      vi.mocked(renderer.contentBlockToHTMLWithPlaceholder).mockReturnValue('<div>占位符</div>')

      const result = parseAndConvertImageShorthandAsyncWithCallback('content')

      expect(result).toBe('<p>文本1</p>\n<div>占位符</div>\n<p>文本2</p>')
    })

    it('应该处理没有 ID 的图片区块', async () => {
      const mockCallback = vi.fn()
      const mockBlocks = [
        {
          type: 'image',
          imageUrl: 'test prompt',
          textLines: [],
          // 没有 id
        },
      ]
      vi.mocked(parser.parseContentBlocks).mockReturnValue(mockBlocks as any)
      vi.mocked(renderer.contentBlockToHTMLWithPlaceholder).mockReturnValue('<div>占位符</div>')
      vi.mocked(imageCacheService.ImageCacheService.getImage).mockResolvedValue(
        'data:image/png;base64,cached'
      )

      parseAndConvertImageShorthandAsyncWithCallback('[img:test prompt]', 'st-chatu8', mockCallback)

      // 等待一段时间确保异步操作完成
      await new Promise(resolve => setTimeout(resolve, 100))

      // 没有 ID 时不应该调用回调
      expect(mockCallback).not.toHaveBeenCalled()
    })
  })
})
