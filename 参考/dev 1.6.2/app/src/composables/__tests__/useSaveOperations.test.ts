import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSaveOperations } from '../save/useSaveOperations'
import * as yaml from 'js-yaml'

// Mock WorldbookSaveService
vi.mock('../../services/worldbook', () => ({
  WorldbookSaveService: {
    loadSave: vi.fn(),
  },
}))

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

// 在测试环境中，global、File、HTMLAnchorElement 等是由测试框架提供的全局对象

describe('useSaveOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 清除 DOM
    document.body.innerHTML = ''
  })

  describe('初始状态', () => {
    it('应该初始化为非操作状态', () => {
      const { isOperating, errorMessage } = useSaveOperations()

      expect(isOperating.value).toBe(false)
      expect(errorMessage.value).toBe('')
    })

    it('fileInputRef 应该初始化为 null', () => {
      const { fileInputRef } = useSaveOperations()

      expect(fileInputRef.value).toBeNull()
    })
  })

  describe('exportSave', () => {
    it('应该成功导出存档', async () => {
      const mockSaveData = {
        config: { title: '测试游戏', subtitle: '测试副标题', version: '1.0.0', phase: 'test' },
        story: { content: '测试故事' },
      }
      const { WorldbookSaveService } = await import('../../services/worldbook')
      vi.mocked(WorldbookSaveService.loadSave).mockResolvedValue(mockSaveData)

      // Mock URL.createObjectURL 和 URL.revokeObjectURL
      const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
      const mockRevokeObjectURL = vi.fn()
      globalThis.URL.createObjectURL = mockCreateObjectURL
      globalThis.URL.revokeObjectURL = mockRevokeObjectURL

      // Mock document.createElement 和 link.click
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }
      const originalCreateElement = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return mockLink as unknown as HTMLAnchorElement
        }
        return originalCreateElement(tagName)
      })

      const { exportSave, isOperating } = useSaveOperations()

      await exportSave('test-save')

      // 验证加载存档
      expect(WorldbookSaveService.loadSave).toHaveBeenCalledWith('test-save')

      // 验证创建下载链接
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockLink.click).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')

      // 验证文件名包含存档名称和时间戳
      expect(mockLink.download).toMatch(/^test-save-\d+\.yaml$/)

      // 验证操作状态
      expect(isOperating.value).toBe(false)
    })

    it('存档数据为空时应该抛出错误', async () => {
      const { WorldbookSaveService } = await import('../../services/worldbook')
      vi.mocked(WorldbookSaveService.loadSave).mockResolvedValue(null)

      const { exportSave, errorMessage } = useSaveOperations()

      await exportSave('test-save')

      expect(errorMessage.value).toBe('存档数据为空')
    })

    it('加载失败时应该设置错误消息', async () => {
      const { WorldbookSaveService } = await import('../../services/worldbook')
      vi.mocked(WorldbookSaveService.loadSave).mockRejectedValue(new Error('Load failed'))

      const { exportSave, errorMessage } = useSaveOperations()

      await exportSave('test-save')

      expect(errorMessage.value).toBe('Load failed')
    })

    it('应该调用 onOperationComplete 回调', async () => {
      const mockSaveData = {
        config: { title: '测试游戏', subtitle: '测试副标题', version: '1.0.0', phase: 'test' },
      }
      const { WorldbookSaveService } = await import('../../services/worldbook')
      vi.mocked(WorldbookSaveService.loadSave).mockResolvedValue(mockSaveData)

      // Mock URL 和 link
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
      globalThis.URL.revokeObjectURL = vi.fn()
      const mockLink = { href: '', download: '', click: vi.fn() }
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement)

      const onOperationComplete = vi.fn()
      const { exportSave } = useSaveOperations({ onOperationComplete })

      await exportSave('test-save')

      expect(onOperationComplete).toHaveBeenCalled()
    })

    it('导出的 YAML 应该包含正确的结构', async () => {
      const mockSaveData = {
        config: { title: '测试游戏', subtitle: '测试副标题', version: '1.0.0', phase: 'test' },
        story: { content: '测试故事' },
      }
      const { WorldbookSaveService } = await import('../../services/worldbook')
      vi.mocked(WorldbookSaveService.loadSave).mockResolvedValue(mockSaveData)

      let capturedBlob: Blob | null = null
      globalThis.URL.createObjectURL = vi.fn((blob: Blob) => {
        capturedBlob = blob
        return 'blob:mock-url'
      })
      globalThis.URL.revokeObjectURL = vi.fn()
      const mockLink = { href: '', download: '', click: vi.fn() }
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement)

      const { exportSave } = useSaveOperations()

      await exportSave('test-save')

      // 验证 Blob 内容
      expect(capturedBlob).not.toBeNull()
      const yamlContent = await capturedBlob!.text()
      const parsedData = yaml.load(yamlContent) as Record<string, unknown>

      expect(parsedData).toHaveProperty('gameData')
      expect(parsedData).toHaveProperty('exportInfo')
      expect(parsedData.gameData).toEqual(mockSaveData)
      expect(parsedData.exportInfo).toMatchObject({
        type: '伊甸园存档导出',
        saveName: 'test-save',
      })
    })
  })

  describe('handleImportClick', () => {
    it('应该触发文件输入点击', () => {
      const { handleImportClick, fileInputRef } = useSaveOperations()

      const mockInput = {
        click: vi.fn(),
      }
      fileInputRef.value = mockInput as unknown as HTMLInputElement

      handleImportClick()

      expect(mockInput.click).toHaveBeenCalled()
    })

    it('fileInputRef 为 null 时不应该报错', () => {
      const { handleImportClick, fileInputRef } = useSaveOperations()

      fileInputRef.value = null

      expect(() => handleImportClick()).not.toThrow()
    })
  })

  describe('handleFileSelect', () => {
    it('应该成功读取并验证 YAML 文件', async () => {
      const yamlContent = yaml.dump({
        gameData: {
          config: { title: '测试游戏' },
        },
        exportInfo: {
          type: '伊甸园存档导出',
          saveName: 'test-save',
        },
      })

      const mockFile = new File([yamlContent], 'test-save.yaml', { type: 'application/x-yaml' })
      const mockEvent = {
        target: {
          files: [mockFile],
          value: 'test-save.yaml',
        },
      } as unknown as Event

      const onImport = vi.fn()
      const { handleFileSelect, isOperating } = useSaveOperations()

      await handleFileSelect(mockEvent, onImport)

      expect(onImport).toHaveBeenCalledWith(yamlContent)
      expect(isOperating.value).toBe(false)
    })

    it('没有选择文件时应该提前返回', async () => {
      const mockEvent = {
        target: {
          files: [],
        },
      } as unknown as Event

      const onImport = vi.fn()
      const { handleFileSelect } = useSaveOperations()

      await handleFileSelect(mockEvent, onImport)

      expect(onImport).not.toHaveBeenCalled()
    })

    it('YAML 格式错误时应该设置错误消息', async () => {
      const invalidYaml = 'invalid: yaml: content: ['
      const mockFile = new File([invalidYaml], 'invalid.yaml', { type: 'application/x-yaml' })
      const mockEvent = {
        target: {
          files: [mockFile],
          value: 'invalid.yaml',
        },
      } as unknown as Event

      const onImport = vi.fn()
      const { handleFileSelect, errorMessage } = useSaveOperations()

      await handleFileSelect(mockEvent, onImport)

      expect(errorMessage.value).toContain('文件格式错误')
      expect(onImport).not.toHaveBeenCalled()
    })

    it('缺少 gameData 字段时应该设置错误消息', async () => {
      const yamlContent = yaml.dump({
        exportInfo: {
          type: '伊甸园存档导出',
        },
      })

      const mockFile = new File([yamlContent], 'test.yaml', { type: 'application/x-yaml' })
      const mockEvent = {
        target: {
          files: [mockFile],
          value: 'test.yaml',
        },
      } as unknown as Event

      const onImport = vi.fn()
      const { handleFileSelect, errorMessage } = useSaveOperations()

      await handleFileSelect(mockEvent, onImport)

      // 实际实现中，缺少 gameData 字段会被 catch 捕获并显示通用错误消息
      expect(errorMessage.value).toContain('文件格式错误')
      expect(onImport).not.toHaveBeenCalled()
    })

    it('应该清空文件输入以允许重复选择', async () => {
      const yamlContent = yaml.dump({
        gameData: { config: { title: '测试游戏' } },
      })

      const mockFile = new File([yamlContent], 'test.yaml', { type: 'application/x-yaml' })
      const mockTarget = {
        files: [mockFile],
        value: 'test.yaml',
      }
      const mockEvent = {
        target: mockTarget,
      } as unknown as Event

      const onImport = vi.fn()
      const { handleFileSelect } = useSaveOperations()

      await handleFileSelect(mockEvent, onImport)

      expect(mockTarget.value).toBe('')
    })

    it('应该调用 onOperationComplete 回调', async () => {
      const yamlContent = yaml.dump({
        gameData: { config: { title: '测试游戏' } },
      })

      const mockFile = new File([yamlContent], 'test.yaml', { type: 'application/x-yaml' })
      const mockEvent = {
        target: {
          files: [mockFile],
          value: 'test.yaml',
        },
      } as unknown as Event

      const onImport = vi.fn()
      const onOperationComplete = vi.fn()
      const { handleFileSelect } = useSaveOperations({ onOperationComplete })

      await handleFileSelect(mockEvent, onImport)

      expect(onOperationComplete).toHaveBeenCalled()
    })
  })

  describe('setOperating', () => {
    it('应该设置操作状态', () => {
      const { setOperating, isOperating } = useSaveOperations()

      setOperating(true)
      expect(isOperating.value).toBe(true)

      setOperating(false)
      expect(isOperating.value).toBe(false)
    })
  })

  describe('clearError', () => {
    it('应该清除错误消息', () => {
      const { clearError, errorMessage } = useSaveOperations()

      errorMessage.value = '测试错误'
      clearError()

      expect(errorMessage.value).toBe('')
    })
  })
})
