import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion, getLanguageInstruction } from '@/lib/ai/openai-client';

/**
 * 分析聊天记录截图，提取人物特征
 *
 * 接收：图片URL（已上传）或文本对话内容
 * 返回：personality, coreBelief, dialogueStyle, expertise 建议
 *
 * 该接口供 AgentForm 的"聊天记录分析"功能调用，
 * 帮助用户通过上传两人对话截图，由 AI 推断对方性格特征，
 * 自动填充 Agent 创建表单字段。
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, chatText, locale } = body;

    if (!imageUrl && !chatText) {
      return NextResponse.json(
        { error: '请提供聊天记录截图或文本' },
        { status: 400 }
      );
    }

    const systemPrompt = `你是一位专业的性格分析师和人物建模专家。用户会上传一段两人对话的截图或文本，你需要分析其中一方（用户指定的人）的性格特征、说话风格、思维方式和核心理念。

请以 JSON 格式返回分析结果，包含以下字段：
{
  "personality": "性格描述，100-200字，包括性格特点、情绪倾向、社交风格等",
  "coreBelief": "核心理念，20-100字，这个人的价值观和人生信条",
  "dialogueStyle": "对话风格，从以下选项中选择一个：formal(正式)/casual(轻松)/humorous(幽默)/serious(严肃)",
  "expertise": "专业领域，从以下选项中选择一个：business(商业)/tech(科技)/psychology(心理)/philosophy(哲学)/literature(文学)/art(艺术)/career(职业)/life(生活)/other(其他)",
  "suggestedName": "建议的Agent名称，2-20字",
  "analysisSummary": "分析摘要，50字以内，说明你是如何从对话中推断出这些特征的"
}

注意：
- 只分析对话中用户想要建模的那个人（通常是对方）
- 基于对话内容客观分析，不要过度推断
- 如果对话内容不足以分析某些字段，给出合理推测
${getLanguageInstruction(typeof locale === 'string' ? locale : 'zh')}`;

    const userMessage = imageUrl
      ? `请分析这张聊天记录截图中对方（非用户本人）的性格特征。图片URL: ${imageUrl}`
      : `请分析以下聊天记录中对方（非用户本人）的性格特征：\n\n${chatText}`;

    const result = await chatCompletion({
      systemPrompt,
      userMessage,
      model: 'deepseek-chat',
      temperature: 0.7,
    });

    // chatCompletion 返回 ChatCompletionResult，实际文本在 content 字段
    const content = result.content;

    // 解析 JSON 结果
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      // 尝试从返回文本中提取 JSON 片段
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('AI返回格式异常');
      }
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('Analyze chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '分析失败，请重试',
        analysis: {
          personality: '无法分析性格特征，请手动填写',
          coreBelief: '无法分析核心理念，请手动填写',
          dialogueStyle: 'casual',
          expertise: 'other',
          suggestedName: '',
          analysisSummary: 'AI分析失败',
        },
      },
      { status: 500 }
    );
  }
}
