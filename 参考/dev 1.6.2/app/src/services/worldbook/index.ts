/**
 * 世界书服务统一导出
 *
 * 直接导出拆分后的服务，不再提供向后兼容的聚合类
 */

import {
  WorldbookConnectionService,
  WorldbookStatus,
  type CharacterBindingStatus,
  WORLDBOOK_NAME_PREFIX,
  ENTRY_NAME_SAVE,
  ENTRY_NAME_INIT,
} from './worldbookConnectionService'
import { WorldbookDataService, type WorldbookDataStatus } from './worldbookDataService'
import { WorldbookSaveService, type SaveInfo } from './worldbookSaveService'

// 导出所有服务、类型和常量
export {
  WorldbookConnectionService,
  WorldbookDataService,
  WorldbookSaveService,
  WorldbookStatus,
  WORLDBOOK_NAME_PREFIX,
  ENTRY_NAME_SAVE,
  ENTRY_NAME_INIT,
}

export type { CharacterBindingStatus, WorldbookDataStatus, SaveInfo }
