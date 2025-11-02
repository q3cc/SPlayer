/**
 * QQ音乐歌词处理工具
 * 支持普通歌词和逐字歌词的解析
 */

import { decodeDWQYRC } from "./decodeDWQYRC";

export interface QQMusicLyricLine {
  time: number;        // 时间戳（毫秒）
  content: string;     // 歌词内容
  translation?: string; // 翻译（可选）
  duration?: number;   // 持续时间
}

export interface QQMusicWordLyric {
  time: number;        // 开始时间
  duration: number;    // 持续时间
  content: string;     // 歌词内容
}

export interface QQMusicEnhancedLyricLine {
  startTime: number;   // 行开始时间
  duration: number;    // 行持续时间
  words: QQMusicWordLyric[]; // 逐字数组
  originalContent: string;   // 原始歌词内容
}

/**
 * 从QQ音乐URL提取歌曲ID
 * @param lyricUrl QQ音乐歌词URL
 * @returns 歌曲ID
 */
export const extractQQMusicId = (lyricUrl: string): string => {
  if (!lyricUrl) return "";
  const match = lyricUrl.match(/id=([^&]+)/);
  return match ? match[1] : "";
};

/**
 * 获取QQ音乐歌词内容
 * @param lyricUrl QQ音乐歌词URL
 * @returns 歌词文本
 */
export const fetchQQMusicLyric = async (lyricUrl: string): Promise<string | null> => {
  try {
    if (!lyricUrl) {
      console.warn("QQ音乐歌词URL为空");
      return null;
    }

    const response = await fetch(lyricUrl);
    if (!response.ok) {
      console.error(`QQ音乐歌词获取失败: ${response.status}`);
      return null;
    }

    const lyricText = await response.text();
    const trimmedLyric = lyricText.trim() || null;

  
    return trimmedLyric;
  } catch (error) {
    console.error("获取QQ音乐歌词时出错:", error);
    return null;
  }
};

/**
 * 解析QQ音乐普通歌词
 * @param lyricText 歌词文本
 * @returns 解析后的歌词行数组
 */
export const parseQQMusicLyric = (lyricText: string): QQMusicLyricLine[] => {
  if (!lyricText) return [];

  const lines: QQMusicLyricLine[] = [];
  const lyricLines = lyricText.split('\n');

  console.log(`🔍 开始解析QQ音乐普通歌词，共 ${lyricLines.length} 行`);

  for (const line of lyricLines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // 跳过元数据标签
    if (trimmedLine.match(/^\[(ti|ar|al|by|offset):\s*.*\]$/i)) {
      console.log(`⏭️ 跳过元数据行: ${trimmedLine}`);
      continue;
    }

    // 匹配时间标签格式 [00:12.34] 或 [00:12]
    const timeMatch = trimmedLine.match(/^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)$/);
    if (timeMatch) {
      const minutes = parseInt(timeMatch[1]);
      const seconds = parseInt(timeMatch[2]);
      const milliseconds = timeMatch[3] ? parseInt(timeMatch[3].padEnd(3, '0').substring(0, 3)) : 0;
      const content = timeMatch[4].trim();

      const timeInMs = (minutes * 60 + seconds) * 1000 + milliseconds;

      if (content) {
        // 提取翻译：匹配最后一个括号对，避免误匹配歌词中的括号
        let contentMain = content;
        let translation = '';

        // 匹配最外层的括号对 (中文翻译)
        const translationMatch = content.match(/^(.*)\s*\(([^()]*)\)\s*$/);
        if (translationMatch) {
          contentMain = translationMatch[1].trim();
          translation = translationMatch[2].trim();

          console.log(`🌐 检测到翻译: "${contentMain}" -> "${translation}"`);
        }

        lines.push({
          time: timeInMs,
          content: contentMain,
          translation: translation
        });
        console.log(`✅ 解析普通歌词行: [${timeInMs}ms] ${contentMain}${translation ? ` (${translation})` : ''}`);
      }
    } else {
      // 处理无时间标签的行（可能是歌曲信息等）
      console.log(`⚠️ 忽略无时间标签行: ${trimmedLine}`);
    }
  }

  console.log(`📊 普通歌词解析完成，共 ${lines.length} 行`);
  lines.sort((a, b) => a.time - b.time);
  return lines;
};

/**
 * 解析QQ音乐逐字歌词
 * @param lyricText 歌词文本
 * @returns 解析后的逐字歌词数组
 */
export const parseQQMusicWordLyric = (lyricText: string): QQMusicEnhancedLyricLine[] => {
  if (!lyricText) return [];

  try {
    const decodedLines = decodeDWQYRC(lyricText);
    const enhancedLines: QQMusicEnhancedLyricLine[] = [];

    for (const [startTime, duration, words] of decodedLines) {
      const wordLyrics: QQMusicWordLyric[] = [];
      let originalContent = "";

      for (const [position, text] of words) {
        const wordStartTime = position[0];
        const wordDuration = position[1];
        // 清理文本：保留原有空格，移除&nbsp;占位符
        const cleanText = text.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

        // 不跳过空文本，因为可能是有意义的空白字符
        // if (!cleanText) continue;

        wordLyrics.push({
          time: wordStartTime,
          duration: wordDuration,
          content: cleanText
        });

        // 根据原始文本是否有空格来决定添加空格
        if (text.includes(' ') || text.includes('&nbsp;')) {
          originalContent += cleanText + ' ';
        } else {
          originalContent += cleanText;
        }
      }

      enhancedLines.push({
        startTime,
        duration,
        words: wordLyrics,
        originalContent: originalContent.trim()
      });
    }

    return enhancedLines.sort((a, b) => a.startTime - b.startTime);
  } catch (error) {
    console.warn("解析逐字歌词失败，尝试普通歌词解析:", error);
    // 如果逐字解析失败，回退到普通歌词
    const normalLyrics = parseQQMusicLyric(lyricText);
    return normalLyrics.map(line => ({
      startTime: line.time,
      duration: 0, // 普通歌词没有持续时间信息
      words: [{
        time: line.time,
        duration: 0,
        content: line.content
      }],
      originalContent: line.content
    }));
  }
};

/**
 * 直接解析QQ音乐原始逐字歌词格式（支持带时间标签的格式）
 * @param lyricText 歌词文本
 * @returns 解析后的逐字歌词数组
 */
export const parseQQMusicRawWordLyric = (lyricText: string): QQMusicEnhancedLyricLine[] => {
  if (!lyricText) return [];

  const lines: QQMusicEnhancedLyricLine[] = [];
  const lyricLines = lyricText.split('\n');

  for (const line of lyricLines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // 匹配行格式 [startTime,duration]content
    const lineMatch = trimmedLine.match(/^\[(\d+),(\d+)\](.+)$/);
    if (lineMatch) {
      const startTime = parseInt(lineMatch[1]);
      const duration = parseInt(lineMatch[2]);
      const content = lineMatch[3];

      // 解析逐字内容
      const wordLyrics: QQMusicWordLyric[] = [];
      let originalContent = '';

      // 添加调试信息
      console.log(`🔧 解析行: [${startTime},${duration}]${content}`);

      // 匹配逐字格式 text(time,duration) 或 (time,duration)text
      // 使用更灵活的正则表达式来处理两种格式

      // 检查是否是 time-before-text 格式：(time,duration)text
      const isTimeBeforeText = /^\(\d+,\d+\)/.test(content);

      if (isTimeBeforeText) {
        // 时间在前格式: (time,duration)text
        const wordMatches = content.match(/\((\d+),(\d+)\)([^()]*)/g);
        console.log(`🔍 时间在前格式，匹配结果:`, wordMatches);

        if (wordMatches && wordMatches.length > 0) {
          for (const wordMatch of wordMatches) {
            const wordParts = wordMatch.match(/\((\d+),(\d+)\)(.+)/);
            if (wordParts) {
              const wordTime = parseInt(wordParts[1]);
              const wordDuration = parseInt(wordParts[2]);
              const wordText = wordParts[3];

              console.log(`📝 解析单词: 时间=${wordTime}, 持续=${wordDuration}, 内容="${wordText}"`);

              // 完全保持原样，包括所有空格和标点
              const processedText = wordText;

              wordLyrics.push({
                time: wordTime,
                duration: wordDuration,
                content: processedText
              });

              originalContent += processedText;
            }
          }
        }
      } else {
        // 文本在前格式: text(time,duration)
        const wordMatches = content.match(/([^\(]*)\((\d+),(\d+)\)/g);
        console.log(`🔍 文本在前格式，匹配结果:`, wordMatches);

        // 处理文本在前格式的特殊情况
        let remainingContent = content;
        let currentTime = startTime;

        // 首先检查开头是否有不带时间标签的文本
        const leadingTextMatch = content.match(/^([^\(]+)/);
        if (leadingTextMatch) {
          const leadingText = leadingTextMatch[1];
          if (leadingText.trim()) {
            console.log(`📝 处理开头文本: "${leadingText}"`);
            // 完全保持原样，包括所有空格和标点
            const processedText = leadingText;

            // 计算第一个有时间标签的单词的时间
            const firstTimeMatch = content.match(/\((\d+),(\d+)\)/);
            const leadingDuration = firstTimeMatch
              ? parseInt(firstTimeMatch[1]) - currentTime  // 从行开始到第一个单词的时间差
              : Math.min(200, duration / 2); // 如果没有后续单词，给一个合理的持续时间

            wordLyrics.push({
              time: currentTime,
              duration: Math.max(20, leadingDuration), // 确保至少20ms，避免太快
              content: processedText
            });
            originalContent += processedText;
            currentTime += leadingDuration; // 更新当前时间到开头文本结束
          }
          remainingContent = remainingContent.substring(leadingTextMatch[1].length);
        }

        // 处理剩余的 (time,duration)text 格式
        const timeBeforeTextMatches = remainingContent.match(/\((\d+),(\d+)\)([^()]*)/g);
        if (timeBeforeTextMatches) {
          for (const match of timeBeforeTextMatches) {
            const parts = match.match(/\((\d+),(\d+)\)(.+)/);
            if (parts) {
              const wordTime = parseInt(parts[1]);
              const wordDuration = parseInt(parts[2]);
              const wordText = parts[3];

              console.log(`📝 解析单词: 时间=${wordTime}, 持续=${wordDuration}, 内容="${wordText}"`);

              // 完全保持原样，包括所有空格和标点
              const processedText = wordText;

              wordLyrics.push({
                time: wordTime,
                duration: wordDuration,
                content: processedText
              });

              originalContent += processedText;
            }
          }
        }
      }

      console.log(`🎵 行解析完成: 原始内容="${originalContent.trim()}", 单词数量=${wordLyrics.length}`);

      // 如果没有解析到任何单词，回退到普通歌词
      if (wordLyrics.length === 0) {
        wordLyrics.push({
          time: startTime,
          duration: duration,
          content: content
        });
        originalContent = content;
      }

      lines.push({
        startTime,
        duration,
        words: wordLyrics,
        originalContent: originalContent.trim()
      });
    }
  }

  return lines.sort((a, b) => a.startTime - b.startTime);
};

/**
 * 智能解析QQ音乐歌词（自动判断是否为逐字歌词）
 * @param lyricText 歌词文本
 * @returns 解析结果和歌词类型
 */
export const smartParseQQMusicLyric = (lyricText: string): {
  lyrics: QQMusicEnhancedLyricLine[];
  type: 'word' | 'normal';
  originalLines: QQMusicLyricLine[];
} => {
  // 先解析普通歌词（用于调试）
  const normalLines = parseQQMusicLyric(lyricText);
  console.log(`📊 普通歌词解析结果: ${normalLines.length} 行`, normalLines.slice(0, 3));

  // 先检查歌词文本是否包含逐字歌词的特征
  const hasWordLyricPattern = /\(\d+,\d+\)/.test(lyricText);

  if (hasWordLyricPattern) {
    console.log("🔍 检测到可能的逐字歌词格式，尝试逐字解析");

    // 先显示原始歌词的前几行用于调试
    const previewLines = lyricText.split('\n').slice(0, 3);
    console.log(`📝 原始歌词预览:`, previewLines);

    // 尝试解析逐字歌词
    try {
      // 先尝试使用专门的逐字歌词解析（支持dwrc=true格式）
      let wordLines = parseQQMusicRawWordLyric(lyricText);

      console.log(`🔧 原始解析结果: ${wordLines.length} 行`);

      // 如果原始解析失败，尝试使用decodeDWQYRC
      if (wordLines.length === 0) {
        console.log("🔄 原始解析失败，尝试decodeDWQYRC");
        wordLines = parseQQMusicWordLyric(lyricText);
        console.log(`🔧 decodeDWQYRC解析结果: ${wordLines.length} 行`);
      }

      // 判断是否成功解析出逐字歌词
      const hasWordLyrics = wordLines.length > 0 &&
                           wordLines.some(line => line.words.length > 1) &&
                           wordLines.some(line => line.words.some(word => word.duration > 0));

      if (hasWordLyrics) {
        console.log(`🎵 ✅ 成功解析出QQ音乐逐字歌词，共 ${wordLines.length} 行`);
        console.log(`📝 第一行完整内容: "${wordLines[0]?.originalContent}"`);
        console.log(`📝 第一行逐字详情:`, wordLines[0]?.words?.map((w, i) => `${i}:${w.content}`));
        console.log(`📝 普通歌词示例: "${normalLines[0]?.content}"`);
        return {
          lyrics: wordLines,
          type: 'word',
          originalLines: normalLines
        };
      } else {
        console.log(`⚠️ 逐字歌词解析结果不符合逐字歌词标准，降级为普通歌词`);
        console.log(`📊 解析统计: 总行数=${wordLines.length}, 多字行数=${wordLines.filter(l => l.words.length > 1).length}, 有持续时间的=${wordLines.filter(l => l.words.some(w => w.duration > 0)).length}`);
      }
    } catch (error) {
      console.log("⚠️ 逐字歌词解析失败，降级为普通歌词:", error);
    }
  } else {
    console.log("🔍 未检测到逐字歌词格式，使用普通歌词");
  }

  // 转换普通歌词为统一格式
  const enhancedNormalLines = normalLines.map(line => ({
    startTime: line.time,
    duration: 0,
    words: [{
      time: line.time,
      duration: 0,
      content: line.content
    }],
    originalContent: line.content
  }));

  console.log(`🎵 解析出QQ音乐普通歌词，共 ${enhancedNormalLines.length} 行`);
  return {
    lyrics: enhancedNormalLines,
    type: 'normal',
    originalLines: normalLines
  };
};

/**
 * 获取QQ音乐歌词的完整处理流程
 * @param lyricUrl QQ音乐歌词URL
 * @returns 完整的歌词解析结果
 */
export const getQQMusicLyrics = async (lyricUrl: string): Promise<{
  enhancedLyrics: QQMusicEnhancedLyricLine[];
  type: 'word' | 'normal';
  originalLines: QQMusicLyricLine[];
  rawText: string | null;
  songId: string;
}> => {
  const songId = extractQQMusicId(lyricUrl);

  // 同时获取普通歌词（含翻译）和逐字歌词
  const normalUrl = lyricUrl.includes('dwrc=true')
    ? lyricUrl.replace('dwrc=true', '')
    : lyricUrl;

  console.log(`🌐 获取普通歌词: ${normalUrl}`);
  console.log(`🎵 获取逐字歌词: ${lyricUrl}`);

  const [rawText, normalRawText] = await Promise.all([
    fetchQQMusicLyric(lyricUrl),
    fetchQQMusicLyric(normalUrl)
  ]);

  // 解析普通歌词以提取翻译
  const originalLines = normalRawText ? parseQQMusicLyric(normalRawText) : [];
  console.log(`📊 解析出普通歌词（含翻译）: ${originalLines.length} 行`);

  if (!rawText) {
    return {
      enhancedLyrics: [],
      type: 'normal',
      originalLines,
      rawText: null,
      songId
    };
  }

  // 如果普通歌词包含翻译但逐字歌词为空，使用普通歌词
  if (!rawText || rawText.trim().length === 0) {
    console.log(`⚠️ 逐字歌词为空，使用普通歌词`);
    return {
      enhancedLyrics: [],
      type: 'normal',
      originalLines,
      rawText: normalRawText,
      songId
    };
  }

  const { lyrics, type } = smartParseQQMusicLyric(rawText);

  return {
    enhancedLyrics: lyrics,
    type,
    originalLines,
    rawText,
    songId
  };
};

/**
 * 将QQ音乐歌词转换为应用可用的格式
 * @param qqLyrics QQ音乐解析结果
 * @returns 应用歌词格式
 */
export const convertToAppLyricFormat = (qqLyrics: {
  enhancedLyrics: QQMusicEnhancedLyricLine[];
  type: 'word' | 'normal';
  originalLines: QQMusicLyricLine[];
}): {
  lrc: string;
  yrc?: string;
  hasWordLyric: boolean;
} => {
  // 生成标准LRC格式
  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}]`;
  };

  // 优先使用原始解析的普通歌词，如果为空则使用增强歌词的原始内容
  const lrcLines = qqLyrics.originalLines.length > 0
    ? qqLyrics.originalLines.map(line =>
        `${formatTime(line.time)}${line.content}`
      )
    : qqLyrics.enhancedLyrics.map(line =>
        `${formatTime(line.startTime)}${line.originalContent}`
      );

  const lrc = lrcLines.join('\n');

  let yrc: string | undefined;
  let hasWordLyric = false;

  // 如果是逐字歌词，生成YRC格式
  if (qqLyrics.type === 'word' && qqLyrics.enhancedLyrics.length > 0) {
    hasWordLyric = true;
    try {
      yrc = qqLyrics.enhancedLyrics.map(line => {
        const wordParts = line.words.map(word =>
          `(${word.time},${word.duration})${word.content}`
        ).join('');
        return `[${line.startTime},${line.duration}]${wordParts}`;
      }).join('\n');

      console.log(`✅ 成功生成QQ音乐逐字歌词YRC格式，共 ${qqLyrics.enhancedLyrics.length} 行`);
    } catch (error) {
      console.warn("⚠️ 生成QQ音乐逐字歌词YRC格式失败，降级为普通歌词:", error);
      hasWordLyric = false;
      yrc = undefined;
    }
  }

  console.log(`🎵 QQ音乐歌词转换完成 - LRC行数: ${lrcLines.length}, 逐字: ${hasWordLyric}`);

  return {
    lrc: lrc || '', // 确保LRC不为空
    yrc,
    hasWordLyric
  };
};

/**
 * 将QQ音乐逐字歌词转换为网易云应用的LyricType格式
 * @param qqLyrics QQ音乐解析结果
 * @returns 应用使用的LyricType格式歌词数据
 */
export const convertToNeteaseLyricFormat = (qqLyrics: {
  enhancedLyrics: QQMusicEnhancedLyricLine[];
  type: 'word' | 'normal';
  originalLines: QQMusicLyricLine[];
}): {
  lrcData: any[];
  yrcData: any[];
  hasWordLyric: boolean;
} => {
  const { enhancedLyrics, type, originalLines } = qqLyrics;

  // 毫秒转秒
  const msToS = (ms: number): number => ms / 1000;

  // 为逐字歌词查找对应翻译的辅助函数
  const findTranslationForLine = (lineStartTime: number, originalLines: QQMusicLyricLine[]): string => {
    // 寻找时间最接近的翻译行
    for (const originalLine of originalLines) {
      if (originalLine.translation && Math.abs(originalLine.time - lineStartTime) < 2000) { // 2秒容差
        return originalLine.translation;
      }
    }
    return '';
  };

  // 生成普通歌词数据 (LRC格式)
  const lrcData = originalLines.length > 0
    ? originalLines.map(line => ({
        time: msToS(line.time),
        content: line.content,
        tran: line.translation || '',
      }))
    : enhancedLyrics.map(line => ({
        time: msToS(line.startTime),
        content: line.originalContent,
        tran: '',
      }));

  // 调试信息
  if (lrcData.length > 0) {
    console.log(`🔍 LRC数据生成:`, {
      originalLines长度: originalLines.length,
      enhancedLyrics长度: enhancedLyrics.length,
      使用原始行: originalLines.length > 0,
      第一行LRC: lrcData[0],
      第一行内容: lrcData[0]?.content,
      第一行时间: lrcData[0]?.time
    });
  } else {
    console.log(`⚠️ LRC数据为空！`);
  }

  let yrcData: any[] = [];
  let hasWordLyric = false;

  // 如果是逐字歌词，生成逐字歌词数据
  if (type === 'word' && enhancedLyrics.length > 0) {
    hasWordLyric = true;
    yrcData = enhancedLyrics.map(line => {
      const words = line.words.map((word, index) => {
        // 修复第一个字时间问题：确保第一个字有正确的时间偏移
        let wordTime = word.time;
        let wordDuration = word.duration;

        // 如果第一个字时间等于行开始时间或为0，需要调整
        if (index === 0 && (wordTime === 0 || wordTime === line.startTime)) {
          wordTime = line.startTime + 5; // 给第一个字添加5ms延迟，确保它显示
          // 如果原持续时间为0，设置一个合理的默认值
          if (wordDuration === 0) {
            wordDuration = Math.min(100, line.duration / line.words.length); // 平均分配时间
          }
        }

        return {
          time: msToS(wordTime),
          endTime: msToS(wordTime + wordDuration),
          duration: msToS(wordDuration),
          content: word.content,
          endsWithSpace: /[\s\u00A0]$/.test(word.content), // 检测各种空格字符结尾
        };
      });

      const content = words
        .map(word => word.content + (word.endsWithSpace ? ' ' : ''))
        .join('');

      // 查找对应的翻译（基于时间匹配）
      const translation = findTranslationForLine(line.startTime, originalLines);

      return {
        time: msToS(line.startTime),
        endTime: msToS(line.startTime + line.duration),
        content: content,
        contents: words,
        tran: translation,
      };
    });

    // 添加调试信息
    if (yrcData.length > 0) {
      console.log(`🔍 逐字歌词调试 - 第一行详情:`, {
        行开始时间: yrcData[0].time.toFixed(3),
        行结束时间: yrcData[0].endTime.toFixed(3),
        完整内容: yrcData[0].content,
        逐字详情: yrcData[0].contents.map((w: any, i: number) => ({
          序号: i,
          内容: w.content,
          开始时间: w.time.toFixed(3),
          结束时间: w.endTime.toFixed(3),
          持续时间: w.duration.toFixed(3),
          时间间隔: i > 0 ? (w.time - yrcData[0].contents[i-1].time).toFixed(3) : '0.000'
        }))
      });
    }
  }

  console.log(`🎵 QQ音乐歌词转换为网易云格式完成 - LRC行数: ${lrcData.length}, YRC行数: ${yrcData.length}, 逐字: ${hasWordLyric}`);

  return {
    lrcData,
    yrcData,
    hasWordLyric,
  };
};

/**
 * 直接从QQ音乐歌词URL获取并转换为网易云格式
 * @param lyricUrl QQ音乐歌词URL（应该包含dwrc=true参数）
 * @returns 转换后的网易云格式歌词数据
 */
export const getQQMusicLyricsAsNeteaseFormat = async (lyricUrl: string): Promise<{
  lrcData: any[];
  yrcData: any[];
  hasWordLyric: boolean;
  success: boolean;
  error?: string;
}> => {
  try {
    console.log('🎵 开始获取QQ音乐歌词:', lyricUrl);

    // 确保URL包含逐字歌词参数
    const urlWithWordParam = lyricUrl.includes('dwrc=')
      ? lyricUrl
      : `${lyricUrl}${lyricUrl.includes('?') ? '&' : '?'}dwrc=true`;

    // 获取QQ音乐歌词
    const qqMusicResult = await getQQMusicLyrics(urlWithWordParam);

    if (!qqMusicResult.rawText) {
      return {
        lrcData: [],
        yrcData: [],
        hasWordLyric: false,
        success: false,
        error: 'QQ音乐歌词获取失败'
      };
    }

    // 转换为网易云格式
    const neteaseFormat = convertToNeteaseLyricFormat(qqMusicResult);

    console.log(`✅ QQ音乐歌词转换成功 - 歌曲ID: ${qqMusicResult.songId}`);

    return {
      ...neteaseFormat,
      success: true,
    };

  } catch (error) {
    console.error('❌ QQ音乐歌词转换失败:', error);
    return {
      lrcData: [],
      yrcData: [],
      hasWordLyric: false,
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
};

/**
 * 验证QQ音乐歌词URL
 * @param url 歌词URL
 * @returns 是否为有效的QQ音乐歌词URL
 */
export const isValidQQMusicLyricUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;

  return url.includes('metingapi.q3cc.top') &&
         url.includes('server=tencent') &&
         url.includes('type=lrc');
};

/**
 * 为QQ音乐歌词URL添加逐字歌词参数
 * @param url 原始歌词URL
 * @returns ���加了dwrc=true参数的URL
 */
export const addQQMusicWordLyricParam = (url: string): string => {
  if (!url || typeof url !== 'string') return url;

  // 检查是否已经有dwrc参数
  if (url.includes('dwrc=')) {
    return url;
  }

  // 添加dwrc=true参数
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}dwrc=true`;
};

