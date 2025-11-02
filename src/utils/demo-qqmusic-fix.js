/**
 * QQ音乐逐字歌词修复演示
 * 直接在浏览器控制台运行此脚本来验证修复效果
 */

// 模拟QQ音乐逐字歌词数据
const qqMusicLyric = `[ti:麦恩莉]
[ar:方大同]
[al:]
[by:]
[offset:0]
[0,270]麦(0,18)恩(18,18)莉(36,18) (54,18)-(72,18) (90,18)方(108,18)大(126,18)同(144,18) (162,18)((180,18)Khalil(198,18) (216,18)Fong(234,18))(252,18)
[1371,2130]曾(1371,70)经(1441,0)受(1441,60)过(1501,190)一(1691,240)些(1931,320)伤(2251,370)害(2621,880)`;

console.log('🎵 QQ音乐逐字歌词修复演示');
console.log('=====================================');

// 1. 显示原始QQ音乐歌词格式
console.log('\n📝 原始QQ音乐歌词格式:');
console.log(qqMusicLyric);

// 2. 模拟解析过程
function parseQQMusicLyric(lyricText) {
  const lines = lyricText.trim().split('\n');
  const enhancedLines = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('[') && !trimmedLine.match(/^\[\d+,\d+\]/)) {
      continue;
    }

    const lineMatch = trimmedLine.match(/^\[(\d+),(\d+)\](.+)$/);
    if (lineMatch) {
      const startTime = parseInt(lineMatch[1]);
      const duration = parseInt(lineMatch[2]);
      const content = lineMatch[3];

      // 解析逐字内容
      const wordLyrics = [];
      let originalContent = '';

      // 匹配逐字格式 (time,duration)text
      const wordMatches = content.match(/\((\d+),(\d+)\)([^()]*)/g);

      if (wordMatches && wordMatches.length > 0) {
        for (const wordMatch of wordMatches) {
          const wordParts = wordMatch.match(/\((\d+),(\d+)\)(.+)/);
          if (wordParts) {
            const wordTime = parseInt(wordParts[1]);
            const wordDuration = parseInt(wordParts[2]);
            const wordText = wordParts[3];

            wordLyrics.push({
              time: wordTime,
              duration: wordDuration,
              content: wordText
            });

            originalContent += wordText;
          }
        }
      }

      if (wordLyrics.length > 0) {
        enhancedLines.push({
          startTime,
          duration,
          words: wordLyrics,
          originalContent: originalContent.trim()
        });
      }
    }
  }

  return enhancedLines;
}

// 3. 转换为网易云格式
function convertToNeteaseFormat(qqLines) {
  const msToS = (ms) => ms / 1000;

  // 生成普通歌词数据
  const lrcData = qqLines.map(line => ({
    time: msToS(line.startTime),
    content: line.originalContent,
  }));

  // 生成逐字歌词数据
  const yrcData = qqLines.map(line => {
    const words = line.words.map(word => ({
      time: msToS(word.time),
      endTime: msToS(word.time + word.duration),
      duration: msToS(word.duration),
      content: word.content,
      endsWithSpace: word.content.endsWith(' '),
    }));

    const content = words
      .map(word => word.content + (word.endsWithSpace ? ' ' : ''))
      .join('');

    return {
      time: msToS(line.startTime),
      endTime: msToS(line.startTime + line.duration),
      content: content,
      contents: words,
    };
  });

  return { lrcData, yrcData };
}

// 4. 执行解析和转换
console.log('\n🔍 步骤1: 解析QQ音乐逐字歌词');
const qqParsed = parseQQMusicLyric(qqMusicLyric);
console.log(`解析出 ${qqParsed.length} 行逐字歌词`);

console.log('\n🔍 步骤2: 转换为网易云格式');
const neteaseFormat = convertToNeteaseFormat(qqParsed);

console.log('\n📊 转换结果统计:');
console.log(`- LRC歌词行数: ${neteaseFormat.lrcData.length}`);
console.log(`- YRC歌词行数: ${neteaseFormat.yrcData.length}`);
console.log(`- 包含逐字歌词: ${neteaseFormat.yrcData.length > 0}`);

console.log('\n🎵 转换后的网易云格式歌词:');

// 显示LRC格式
console.log('\n📝 LRC格式 (普通歌词):');
neteaseFormat.lrcData.forEach((line, index) => {
  const minutes = Math.floor(line.time / 60);
  const seconds = Math.floor(line.time % 60);
  const milliseconds = Math.floor((line.time % 1) * 100);
  const timeStr = `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}]`;
  console.log(`${index + 1}. ${timeStr} ${line.content}`);
});

// 显示YRC格式 (逐字歌词)
if (neteaseFormat.yrcData.length > 0) {
  console.log('\n🎭 YRC格式 (逐字歌词):');
  neteaseFormat.yrcData.forEach((line, index) => {
    const minutes = Math.floor(line.time / 60);
    const seconds = Math.floor(line.time % 60);
    const milliseconds = Math.floor((line.time % 1) * 100);
    const timeStr = `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}]`;

    console.log(`${index + 1}. ${timeStr} ${line.content}`);

    if (line.contents && line.contents.length > 0) {
      const wordDetails = line.contents.map(word =>
        `[${word.time.toFixed(2)}s-${word.endTime.toFixed(2)}s]${word.content}`
      ).join(' ');
      console.log(`   逐字: ${wordDetails}`);
    }
  });
}

console.log('\n✅ QQ音乐逐字歌词修复演示完成!');
console.log('\n💡 修复要点:');
console.log('1. 正确解析QQ音乐逐字歌词格式 [startTime,duration](wordTime,wordDuration)text');
console.log('2. 转换时间为应用期望的秒级格式');
console.log('3. 生成符合网易云格式的LRC和YRC数据结构');
console.log('4. 保持逐字时间的连续性和准确性');