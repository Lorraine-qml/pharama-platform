/** 演示：各维度评分依据文案 */
export function dimBasisText(key: string, score: number): string {
  const k = key.replace(/度$/, '')
  const templates: Record<string, string> = {
    产业匹配: `属于重点招商赛道，与园区「${score >= 85 ? '高度' : '较为'}契合」产业规划（${score}分）。`,
    技术创新: `拥有核心专利与可验证的技术路线，创新性${score >= 85 ? '突出' : '良好'}（${score}分）。`,
    团队能力: `核心团队具备产业与科研复合背景，执行力${score >= 85 ? '强' : '较好'}（${score}分）。`,
    市场潜力: `目标市场规模${score >= 85 ? '大' : '可观'}，竞争格局需持续关注（${score}分）。`,
    合规风险: score < 75 ? `伦理/毒理等材料尚需补强，合规风险需重点跟踪（${score}分）。` : `合规材料较完整，风险可控（${score}分）。`,
    资源适配: `所需实验、中试等资源与园区供给匹配度高（${score}分）。`,
  }
  for (const [prefix, text] of Object.entries(templates)) {
    if (k.includes(prefix) || key.includes(prefix)) return text
  }
  return `综合材料与公开信息评估，当前维度得分 ${score} 分。`
}
