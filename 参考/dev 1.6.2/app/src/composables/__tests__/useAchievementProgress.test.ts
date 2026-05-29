// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useAchievementProgress } from '../achievement/useAchievementProgress'
import type { GameData, Achievement } from '../../types'

describe('useAchievementProgress', () => {
  let gameData: ReturnType<typeof ref<GameData>>
  let achievement: ReturnType<typeof ref<Achievement>>

  beforeEach(() => {
    gameData = ref<GameData>({
      config: {
        version: '1.0.0',
        phase: 'test',
        home: {
          title: 'Test Game',
          subtitle: 'Test Subtitle',
        },
      },
      characters: {
        user: {
          level: 5,
          exp: 100,
        },
      },
      storage: {
        inventory: {},
      },
    })

    achievement = ref<Achievement>({
      id: 'test-achievement',
      name: '测试成就',
      desc: '测试描述',
      icon: '🎯',
      unlocked: false,
      rarity: 'common',
    })
  })

  describe('无进度条件的成就', () => {
    it('应该返回默认进度信息', () => {
      const { progress } = useAchievementProgress(gameData, achievement)

      expect(progress.value.hasSchedule).toBe(false)
      expect(progress.value.isSingleCondition).toBe(false)
      expect(progress.value.conditions).toEqual([])
      expect(progress.value.completedCount).toBe(0)
      expect(progress.value.totalCount).toBe(0)
      expect(progress.value.overallPercentage).toBe(0)
      expect(progress.value.isCompleted).toBe(false)
    })

    it('已解锁的成就应该标记为完成', () => {
      achievement.value.unlocked = true
      const { progress } = useAchievementProgress(gameData, achievement)

      expect(progress.value.isCompleted).toBe(true)
    })

    it('应该返回空的进度文本', () => {
      const { progressText } = useAchievementProgress(gameData, achievement)

      expect(progressText.value).toBe('')
    })
  })

  describe('单条件成就（旧格式：数字）', () => {
    beforeEach(() => {
      achievement.value.schedule = {
        'characters.user.level': 10,
      }
    })

    it('应该正确计算单条件进度', () => {
      const { progress } = useAchievementProgress(gameData, achievement)

      expect(progress.value.hasSchedule).toBe(true)
      expect(progress.value.isSingleCondition).toBe(true)
      expect(progress.value.conditions).toHaveLength(1)
      expect(progress.value.totalCount).toBe(1)
    })

    it('应该正确计算条件进度', () => {
      const { progress } = useAchievementProgress(gameData, achievement)
      const condition = progress.value.conditions[0]

      expect(condition.path).toBe('characters.user.level')
      expect(condition.desc).toBe('level')
      expect(condition.current).toBe(5)
      expect(condition.target).toBe(10)
      expect(condition.completed).toBe(false)
      expect(condition.percentage).toBe(50)
    })

    it('应该正确计算总体百分比', () => {
      const { progress } = useAchievementProgress(gameData, achievement)

      expect(progress.value.overallPercentage).toBe(50)
    })

    it('应该返回正确的进度文本', () => {
      const { progressText } = useAchievementProgress(gameData, achievement)

      expect(progressText.value).toBe('5/10')
    })

    it('当达到目标时应该标记为完成', () => {
      gameData.value.characters!.user.level = 10
      const { progress } = useAchievementProgress(gameData, achievement)

      expect(progress.value.conditions[0].completed).toBe(true)
      expect(progress.value.completedCount).toBe(1)
      expect(progress.value.isCompleted).toBe(true)
      expect(progress.value.overallPercentage).toBe(100)
    })

    it('当超过目标时百分比应该限制在100', () => {
      gameData.value.characters!.user.level = 15
      const { progress } = useAchievementProgress(gameData, achievement)

      expect(progress.value.conditions[0].percentage).toBe(100)
      expect(progress.value.overallPercentage).toBe(100)
    })
  })

  describe('单条件成就（新格式：对象）', () => {
    beforeEach(() => {
      achievement.value.schedule = {
        'characters.user.exp': {
          desc: '经验值',
          target: 200,
        },
      }
    })

    it('应该使用自定义描述', () => {
      const { progress } = useAchievementProgress(gameData, achievement)
      const condition = progress.value.conditions[0]

      expect(condition.desc).toBe('经验值')
      expect(condition.target).toBe(200)
    })

    it('应该正确计算进度', () => {
      const { progress } = useAchievementProgress(gameData, achievement)
      const condition = progress.value.conditions[0]

      expect(condition.current).toBe(100)
      expect(condition.percentage).toBe(50)
    })
  })

  describe('多条件成就', () => {
    beforeEach(() => {
      achievement.value.schedule = {
        'characters.user.level': 10,
        'characters.user.exp': 200,
      }
    })

    it('应该正确识别为多条件', () => {
      const { progress } = useAchievementProgress(gameData, achievement)

      expect(progress.value.isSingleCondition).toBe(false)
      expect(progress.value.totalCount).toBe(2)
    })

    it('应该计算所有条件的进度', () => {
      const { progress } = useAchievementProgress(gameData, achievement)

      expect(progress.value.conditions).toHaveLength(2)
      expect(progress.value.conditions[0].path).toBe('characters.user.level')
      expect(progress.value.conditions[1].path).toBe('characters.user.exp')
    })

    it('应该正确计算已完成条件数', () => {
      const { progress } = useAchievementProgress(gameData, achievement)

      expect(progress.value.completedCount).toBe(0)
    })

    it('应该使用已完成条件数计算总体百分比', () => {
      gameData.value.characters!.user.level = 10 // 完成第一个条件
      const { progress } = useAchievementProgress(gameData, achievement)

      expect(progress.value.completedCount).toBe(1)
      expect(progress.value.overallPercentage).toBe(50)
    })

    it('应该返回正确的进度文本', () => {
      gameData.value.characters!.user.level = 10
      const { progressText } = useAchievementProgress(gameData, achievement)

      expect(progressText.value).toBe('1/2')
    })

    it('当所有条件完成时应该标记为完成', () => {
      gameData.value.characters!.user.level = 10
      gameData.value.characters!.user.exp = 200
      const { progress } = useAchievementProgress(gameData, achievement)

      expect(progress.value.completedCount).toBe(2)
      expect(progress.value.isCompleted).toBe(true)
      expect(progress.value.overallPercentage).toBe(100)
    })
  })

  describe('边界情况', () => {
    it('应该处理不存在的路径', () => {
      achievement.value.schedule = {
        'nonexistent.path': 100,
      }
      const { progress } = useAchievementProgress(gameData, achievement)
      const condition = progress.value.conditions[0]

      expect(condition.current).toBe(0)
      expect(condition.completed).toBe(false)
    })

    it('应该处理目标为0的情况', () => {
      achievement.value.schedule = {
        'characters.user.level': 0,
      }
      const { progress } = useAchievementProgress(gameData, achievement)
      const condition = progress.value.conditions[0]

      expect(condition.percentage).toBe(0)
    })

    it('应该处理非数字的当前值', () => {
      gameData.value.characters = {
        user: {
          level: 'invalid' as unknown as number,
        },
      }
      achievement.value.schedule = {
        'characters.user.level': 10,
      }
      const { progress } = useAchievementProgress(gameData, achievement)
      const condition = progress.value.conditions[0]

      expect(condition.current).toBe(0)
    })
  })

  describe('进度条样式类名', () => {
    it('应该返回基于稀有度的类名', () => {
      achievement.value.rarity = 'legendary'
      const { progressBarClass } = useAchievementProgress(gameData, achievement)

      expect(progressBarClass.value).toBe('progress-bar-legendary')
    })

    it('应该处理大写稀有度', () => {
      achievement.value.rarity = 'RARE' as 'rare'
      const { progressBarClass } = useAchievementProgress(gameData, achievement)

      expect(progressBarClass.value).toBe('progress-bar-rare')
    })

    it('没有稀有度时应该使用默认值', () => {
      achievement.value.rarity = undefined
      const { progressBarClass } = useAchievementProgress(gameData, achievement)

      expect(progressBarClass.value).toBe('progress-bar-common')
    })
  })

  describe('响应式更新', () => {
    it('当游戏数据变化时应该更新进度', () => {
      achievement.value.schedule = {
        'characters.user.level': 10,
      }
      const { progress } = useAchievementProgress(gameData, achievement)

      expect(progress.value.conditions[0].current).toBe(5)

      // 更新游戏数据
      gameData.value.characters!.user.level = 8

      expect(progress.value.conditions[0].current).toBe(8)
      expect(progress.value.conditions[0].percentage).toBe(80)
    })

    it('当成就数据变化时应该更新进度', () => {
      achievement.value.schedule = {
        'characters.user.level': 10,
      }
      const { progress } = useAchievementProgress(gameData, achievement)

      expect(progress.value.totalCount).toBe(1)

      // 更新成就数据
      achievement.value.schedule = {
        'characters.user.level': 10,
        'characters.user.exp': 200,
      }

      expect(progress.value.totalCount).toBe(2)
    })
  })
})
