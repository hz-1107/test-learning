/**
 * AI Controller - 處理 AI 相關請求 (Gemini API)
 */

// =====================
// Gemini API 設定
// =====================
// 請在此處填入您的 Gemini API Key
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * 生成學生評語
 * POST /api/ai/generate-comment
 */
exports.generateComment = async (req, res) => {
  try {
    const { studentName, traits, improvements, manualInput } = req.body;

    // 驗證必要參數
    if (!studentName) {
      return res.status(400).json({
        success: false,
        message: '缺少學生姓名'
      });
    }

    if (!traits || traits.length === 0) {
      return res.status(400).json({
        success: false,
        message: '請至少選擇一個正面特質'
      });
    }

    // 檢查 API Key 是否已設定
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      return res.status(500).json({
        success: false,
        message: 'Gemini API Key 尚未設定，請在 aiController.js 中設定您的 API Key'
      });
    }

    // 構建 prompt
    const prompt = buildCommentPrompt(studentName, traits, improvements, manualInput);

    // 呼叫 Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API 錯誤:', errorData);
      return res.status(500).json({
        success: false,
        message: 'AI 生成失敗，請稍後再試',
        error: errorData.error?.message || '未知錯誤'
      });
    }

    const data = await response.json();

    // 解析回應
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // 解析評語和分數
    const result = parseAIResponse(generatedText, traits);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('生成評語錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message
    });
  }
};

/**
 * 構建評語生成的 prompt
 */
function buildCommentPrompt(studentName, traits, improvements, manualInput) {
  let prompt = `你是一位專業的教育工作者，請根據以下資訊為學生撰寫一段個人化的課堂評語。

學生姓名：${studentName}

正面特質表現：${traits.join('、')}
`;

  if (improvements && improvements.length > 0) {
    prompt += `\n待改進項目：${improvements.join('、')}`;
  }

  if (manualInput && manualInput.trim()) {
    prompt += `\n\n補充說明：${manualInput}`;
  }

  prompt += `

請撰寫一段約100-150字的評語，要求：
1. 語氣正面積極，具有鼓勵性
2. 具體描述學生的表現和特質
3. 如有待改進項目，用正面的方式提出建議
4. 評語要自然流暢，像是老師親自撰寫的

另外，請根據學生的特質表現，給出以下五個面向的評分（1-5分）：
- 程式能力
- 除錯能力
- 創意表現
- 結構組織
- 團隊合作

請用以下格式回覆：
【評語】
(評語內容)

【分數】
程式：X
除錯：X
創意：X
結構：X
團隊合作：X`;

  return prompt;
}

/**
 * 解析 AI 回應
 */
function parseAIResponse(text, traits) {
  // 預設分數
  let scores = {
    programming: 4,
    debugging: 4,
    creativity: 4,
    structure: 4,
    teamwork: 4
  };

  let comment = text;

  // 嘗試解析分數
  const scorePatterns = {
    programming: /程式[：:]\s*(\d)/,
    debugging: /除錯[：:]\s*(\d)/,
    creativity: /創意[：:]\s*(\d)/,
    structure: /結構[：:]\s*(\d)/,
    teamwork: /團隊合作[：:]\s*(\d)/
  };

  for (const [key, pattern] of Object.entries(scorePatterns)) {
    const match = text.match(pattern);
    if (match) {
      scores[key] = Math.min(5, Math.max(1, parseInt(match[1])));
    }
  }

  // 嘗試提取評語部分
  const commentMatch = text.match(/【評語】\s*([\s\S]*?)(?=【分數】|$)/);
  if (commentMatch) {
    comment = commentMatch[1].trim();
  } else {
    // 如果沒有找到格式，移除分數部分
    comment = text.replace(/【分數】[\s\S]*$/, '').replace(/【評語】/, '').trim();
  }

  // 根據特質調整分數（作為備用邏輯）
  if (traits.includes('Debug大師') || traits.includes('Debug 大師')) {
    scores.debugging = Math.max(scores.debugging, 4);
  }
  if (traits.includes('思維邏輯靈活')) {
    scores.programming = Math.max(scores.programming, 4);
  }
  if (traits.includes('開創性十足')) {
    scores.creativity = Math.max(scores.creativity, 4);
  }
  if (traits.includes('同儕小老師')) {
    scores.teamwork = Math.max(scores.teamwork, 4);
  }

  return {
    comment,
    scores
  };
}
