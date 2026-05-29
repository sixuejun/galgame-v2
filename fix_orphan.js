const fs = require('fs');
let content = fs.readFileSync('c:/Users/31705/Desktop/galgame-v2/src/galgame/store.ts', 'utf8');

// The file uses smart/curly quotes (U+201C/201D) - not ASCII quotes
const SQ_OPEN = '\u201C'; // "
const SQ_CLOSE = '\u201D'; // "

const old1 = `  // 切换卡牌显示到舞台，并设置 manualOverride
  function switchToImageCard(cardId: string) {
    const card = getImageCardById(cardId);
    if (!card) return;

    // 再次点击同一张卡：如果它正处于${SQ_OPEN}临时收回${SQ_CLOSE}状态，则恢复到舞台
    if (hiddenByOverrideCardId.value === cardId) {
      restoreImageCardToStage(cardId);
      return;
    }

    // 如果已经是当前覆盖卡，再点一次则将其收回，露出原舞台图
    if (manualOverrideCardId.value === cardId) {
      manualOverrideCardId.value = null;
      hiddenByOverrideCardId.value = cardId;
      console.info('[ImageGen] 临时收回卡牌:', cardId, card.title);
      return;
    }

    // 切换到新的覆盖卡，并记住之前是否有旧覆盖状态
    manualOverrideCardId.value = cardId;
    hiddenByOverrideCardId.value = null;

    // 更新显示
    if (card.type === 'background') stageBackgroundImage.value = card.imageData;
    else stageCgImage.value = card.imageData;
    console.info('[ImageGen] 设置 manualOverride:', cardId, card.title);
  }

  // 清空卡牌队列
  function clearImageCardQueue() {
    imageCardQueue.value = [];
    manualOverrideCardId.value = null;
    hiddenByOverrideCardId.value = null;
    stageBackgroundImage.value = null;
    stageCgImage.value = null;
  }`;

const new1 = `  // 将卡牌绑定到当前场景并展示到舞台
  function switchToImageCard(cardId: string) {
    const card = getImageCardById(cardId);
    if (!card) return;

    const scene = (currentBlock.value?.scene || '').trim();
    if (!scene) {
      showToast('当前无场景，无法绑定');
      return;
    }

    // 清除当前场景的旧绑定
    if (sceneImageBindings.value[scene]) {
      unbindSceneImage(scene);
      console.info('[ImageGen] 清除旧绑定:', scene);
    }

    // 更新卡牌的 title
    card.title = scene;

    // 写入绑定存储
    bindSceneImage(scene, card.imageData, card.type);

    // 更新舞台显示
    if (card.type === 'background') stageBackgroundImage.value = card.imageData;
    else stageCgImage.value = card.imageData;

    console.info('[ImageGen] 绑定场景:', scene, 'cardId=', cardId);
  }

  // 清空卡牌队列
  function clearImageCardQueue() {
    imageCardQueue.value = [];
    stageBackgroundImage.value = null;
    stageCgImage.value = null;
  }`;

if (content.includes(old1)) {
  content = content.replace(old1, new1);
  console.log('Replaced functions OK');
} else {
  console.log('ERROR: old1 not found');
  const lines = content.split('\n');
  for (let i = 2020; i < 2058; i++) {
    console.log('File line', i + 1, ':', JSON.stringify(lines[i]));
  }
  process.exit(1);
}

// Remove items from return block
const lines = content.split('\n');
const result = [];
let inReturnBlock = false;
let braceCount = 0;
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.trim() === 'return {') {
    inReturnBlock = true;
    braceCount = 0;
  }
  if (inReturnBlock) {
    braceCount += (l.match(/{/g) || []).length;
    braceCount -= (l.match(/}/g) || []).length;
    if (braceCount === 0 && l.includes('}')) {
      inReturnBlock = false;
    }
  }
  if (inReturnBlock) {
    const trimmed = l.trim();
    if (trimmed === 'isCardForceHidden,' ||
        trimmed === 'manualOverrideCardId,' ||
        trimmed === 'clearManualOverride,') {
      console.log('Removing: ' + trimmed);
      continue;
    }
  }
  result.push(l);
}
content = result.join('\n');
fs.writeFileSync('c:/Users/31705/Desktop/galgame-v2/src/galgame/store.ts', content, 'utf8');
console.log('Done');
