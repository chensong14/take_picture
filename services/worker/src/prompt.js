const styleInstructions = {
  natural: '保持自然写实的摄影质感、真实肤色与合理光影。',
  cinematic: '使用电影级光影、克制的色彩分级和具有叙事感的构图。',
  illustration: '转换为精致插画风格，同时保留主体身份特征和画面结构。'
}

function buildImagePrompt(prompt, style) {
  const styleInstruction = styleInstructions[style] || styleInstructions.natural
  return [
    prompt.trim(),
    styleInstruction,
    '基于输入图片进行编辑，保留人物的核心面部特征，避免畸形五官、额外肢体、模糊和低清晰度。'
  ].join('\n')
}

module.exports = { buildImagePrompt }
