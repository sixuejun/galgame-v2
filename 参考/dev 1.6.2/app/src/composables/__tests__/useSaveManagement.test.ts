import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, type Ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useSaveManagement, type LoadGamePageExposed } from '../save/useSaveManagement'
import { WorldbookSaveService } from '../../services/worldbook'

// Mock WorldbookSaveService
vi.mock('../../services/worldbook', () => ({
  WorldbookSaveService: {
    manualSave: vi.fn(),
    loadSave: vi.fn(),
    deleteSave: vi.fn(),
    clearAllSaves: vi.fn(),
  },
}))

// Mock js-yaml
vi.mock('js-yaml', () => ({
  default: {
    load: vi.fn(),
  },
  load: vi.fn(),
}))

describe('useSaveManagement', () => {
  let loadGamePageRef: Ref<LoadGamePageExposed | null>
  let showConfirm: ReturnType<typeof vi.fn>
  let showSuccessToast: ReturnType<typeof vi.fn>
  let showErrorToast: ReturnType<typeof vi.fn>
  let navigateTo: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // 创建 mock 的 loadGamePageRef
    loadGamePageRef = ref<LoadGamePageExposed | null>({
      loadSaves: vi.fn(),
      setOperating: vi.fn(),
    }) as Ref<LoadGamePageExposed | null>

    showConfirm = vi.fn()
    showSuccessToast = vi.fn()
    showErrorToast = vi.fn()
    navigateTo = vi.fn()
  })

  describe('handleManualSave', () => {
    it('应该成功保存游戏', async () => {
      const saveName = 'manual_save_1'
      vi.mocked(WorldbookSaveService.manualSave).mockResolvedValue(saveName)

      const { handleManualSave } = useSaveManagement({
        loadGamePageRef,
        showConfirm,
        showSuccessToast,
        showErrorToast,
        navigateTo,
      })

      await handleManualSave()

      expect(WorldbookSaveService.manualSave).toHaveBeenCalled()
      expect(showSuccessToast).toHaveBeenCalledWith(`✅ 存档成功: ${saveName}`)
    })

    it('保存成功后应该刷新存档列表', async () => {
      vi.mocked(WorldbookSaveService.manualSave).mockResolvedValue('save_1')

      const { handleManualSave } = useSaveManagement({
        loadGamePageRef,
        showConfirm,
        showSuccessToast,
        showErrorToast,
        navigateTo,
      })

      await handleManualSave()

      expect(loadGamePageRef.value?.loadSaves).toHaveBeenCalled()
    })

    it('保存失败时应该显示错误提示', async () => {
      const errorMsg = 'Save failed'
      vi.mocked(WorldbookSaveService.manualSave).mockRejectedValue(new Error(errorMsg))

      const { handleManualSave } = useSaveManagement({
        loadGamePageRef,
        showConfirm,
        showSuccessToast,
        showErrorToast,
        navigateTo,
      })

      await handleManualSave()

      expect(showErrorToast).toHaveBeenCalledWith(`存档失败: ${errorMsg}`)
    })
  })

  describe('handleLoadSave', () => {
    it('应该成功加载存档', async () => {
      const saveName = 'save_1'
      const mockData = { characters: { player: { name: 'Test' } } }
      vi.mocked(WorldbookSaveService.loadSave).mockResolvedValue(mockData)

      const { handleLoadSave } = useSaveManagement({
        loadGamePageRef,
        showConfirm,
        showSuccessToast,
        showErrorToast,
        navigateTo,
      })

      await handleLoadSave(saveName)

      expect(WorldbookSaveService.loadSave).toHaveBeenCalledWith(saveName)
      expect(showSuccessToast).toHaveBeenCalledWith(`✅ 读档成功: ${saveName}`)
    })

    it('加载时应该设置操作状态', async () => {
      const mockData = { characters: { player: { name: 'Test' } } }
      vi.mocked(WorldbookSaveService.loadSave).mockResolvedValue(mockData)

      const { handleLoadSave } = useSaveManagement({
        loadGamePageRef,
        showConfirm,
        showSuccessToast,
        showErrorToast,
        navigateTo,
      })

      await handleLoadSave('save_1')

      expect(loadGamePageRef.value?.setOperating).toHaveBeenCalledWith(true)
      expect(loadGamePageRef.value?.setOperating).toHaveBeenCalledWith(false)
    })

    it('加载失败时应该显示错误提示', async () => {
      const errorMsg = 'Load failed'
      vi.mocked(WorldbookSaveService.loadSave).mockRejectedValue(new Error(errorMsg))

      const { handleLoadSave } = useSaveManagement({
        loadGamePageRef,
        showConfirm,
        showSuccessToast,
        showErrorToast,
        navigateTo,
      })

      await handleLoadSave('save_1')

      expect(showErrorToast).toHaveBeenCalledWith(`读档失败: ${errorMsg}`)
    })

    it('当 loadGamePageRef 为 null 时应该提前返回', async () => {
      loadGamePageRef.value = null

      const { handleLoadSave } = useSaveManagement({
        loadGamePageRef,
        showConfirm,
        showSuccessToast,
        showErrorToast,
        navigateTo,
      })

      await handleLoadSave('save_1')

      expect(WorldbookSaveService.loadSave).not.toHaveBeenCalled()
    })
  })

  describe('handleDeleteSave', () => {
    it('用户确认后应该删除存档', async () => {
      showConfirm.mockResolvedValue(true)
      vi.mocked(WorldbookSaveService.deleteSave).mockResolvedValue(undefined)

      const { handleDeleteSave } = useSaveManagement({
        loadGamePageRef,
        showConfirm,
        showSuccessToast,
        showErrorToast,
        navigateTo,
      })

      await handleDeleteSave('save_1')

      expect(showConfirm).toHaveBeenCalled()
      expect(WorldbookSaveService.deleteSave).toHaveBeenCalledWith('save_1')
      expect(showSuccessToast).toHaveBeenCalledWith('✅ 存档已删除: save_1')
    })

    it('用户取消时不应该删除存档', async () => {
      showConfirm.mockResolvedValue(false)

      const { handleDeleteSave } = useSaveManagement({
        loadGamePageRef,
        showConfirm,
        showSuccessToast,
        showErrorToast,
        navigateTo,
      })

      await handleDeleteSave('save_1')

      expect(WorldbookSaveService.deleteSave).not.toHaveBeenCalled()
    })

    it('删除成功后应该刷新存档列表', async () => {
      showConfirm.mockResolvedValue(true)
      vi.mocked(WorldbookSaveService.deleteSave).mockResolvedValue(undefined)

      const { handleDeleteSave } = useSaveManagement({
        loadGamePageRef,
        showConfirm,
        showSuccessToast,
        showErrorToast,
        navigateTo,
      })

      await handleDeleteSave('save_1')

      expect(loadGamePageRef.value?.loadSaves).toHaveBeenCalled()
    })

    it('删除失败时应该显示错误提示', async () => {
      showConfirm.mockResolvedValue(true)
      const errorMsg = 'Delete failed'
      vi.mocked(WorldbookSaveService.deleteSave).mockRejectedValue(new Error(errorMsg))

      const { handleDeleteSave } = useSaveManagement({
        loadGamePageRef,
        showConfirm,
        showSuccessToast,
        showErrorToast,
        navigateTo,
      })

      await handleDeleteSave('save_1')

      expect(showErrorToast).toHaveBeenCalledWith(`删除存档失败: ${errorMsg}`)
    })
  })

  describe('handleImportSave', () => {
    it('应该成功导入存档', async () => {
      const yamlContent = 'gameData:\n  player:\n    name: Test'
      const mockData = { gameData: { player: { name: 'Test' } } }

      const yaml = await import('js-yaml')
      vi.mocked(yaml.load).mockReturnValue(mockData)

      const { handleImportSave } = useSaveManagement({
        loadGamePageRef,
        showConfirm,
        showSuccessToast,
        showErrorToast,
        navigateTo,
      })

      await handleImportSave(yamlContent)

      expect(showSuccessToast).toHaveBeenCalledWith('✅ 存档导入成功')
    })

    it('导入失败时应该显示错误提示', async () => {
      const yamlContent = 'invalid yaml'
      const errorMsg = 'Parse failed'

      const yaml = await import('js-yaml')
      vi.mocked(yaml.load).mockImplementation(() => {
        throw new Error(errorMsg)
      })

      const { handleImportSave } = useSaveManagement({
        loadGamePageRef,
        showConfirm,
        showSuccessToast,
        showErrorToast,
        navigateTo,
      })

      await handleImportSave(yamlContent)

      expect(showErrorToast).toHaveBeenCalledWith(`导入存档失败: ${errorMsg}`)
    })
  })

  describe('handleClearAllSaves', () => {
    it('用户确认后应该清空所有存档', async () => {
      showConfirm.mockResolvedValue(true)
      vi.mocked(WorldbookSaveService.clearAllSaves).mockResolvedValue(undefined)

      const { handleClearAllSaves } = useSaveManagement({
        loadGamePageRef,
        showConfirm,
        showSuccessToast,
        showErrorToast,
        navigateTo,
      })

      await handleClearAllSaves()

      expect(showConfirm).toHaveBeenCalled()
      expect(WorldbookSaveService.clearAllSaves).toHaveBeenCalled()
      expect(showSuccessToast).toHaveBeenCalledWith('✅ 所有存档已清空')
    })

    it('用户取消时不应该清空存档', async () => {
      showConfirm.mockResolvedValue(false)

      const { handleClearAllSaves } = useSaveManagement({
        loadGamePageRef,
        showConfirm,
        showSuccessToast,
        showErrorToast,
        navigateTo,
      })

      await handleClearAllSaves()

      expect(WorldbookSaveService.clearAllSaves).not.toHaveBeenCalled()
    })

    it('清空成功后应该重置游戏数据并跳转到主页', async () => {
      showConfirm.mockResolvedValue(true)
      vi.mocked(WorldbookSaveService.clearAllSaves).mockResolvedValue(undefined)

      const { handleClearAllSaves } = useSaveManagement({
        loadGamePageRef,
        showConfirm,
        showSuccessToast,
        showErrorToast,
        navigateTo,
      })

      await handleClearAllSaves()

      expect(navigateTo).toHaveBeenCalledWith('home')
    })

    it('清空失败时应该显示错误提示', async () => {
      showConfirm.mockResolvedValue(true)
      const errorMsg = 'Clear failed'
      vi.mocked(WorldbookSaveService.clearAllSaves).mockRejectedValue(new Error(errorMsg))

      const { handleClearAllSaves } = useSaveManagement({
        loadGamePageRef,
        showConfirm,
        showSuccessToast,
        showErrorToast,
        navigateTo,
      })

      await handleClearAllSaves()

      expect(showErrorToast).toHaveBeenCalledWith(`清空存档失败: ${errorMsg}`)
    })
  })
})
