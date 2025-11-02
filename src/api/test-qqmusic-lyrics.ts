// QQ音乐歌词解析测试文件
import {
  tencentSearch,
} from "./meting";
import { getQQMusicLyrics, convertToAppLyricFormat, isValidQQMusicLyricUrl } from "../utils/qqmusic-lyrics";

// 测试QQ音乐歌词解析功能
export const testQQMusicLyrics = async () => {
  console.log("🎶 测试QQ音乐歌词解析功能");

  try {
    // 搜索QQ音乐歌曲
    const tencentResults = await tencentSearch("反方向的钟", 3);
    if (!tencentResults || tencentResults.length === 0) {
      console.log("❌ 无法获取QQ音乐歌曲数据");
      return false;
    }

    const testSong = tencentResults[0];
    console.log(`🎵 测试歌曲: ${testSong.name} - ${testSong.artist}`);

    if (!testSong.lrc) {
      console.log("❌ 歌曲没有歌词链接");
      return false;
    }

    // 验证歌词URL
    if (!isValidQQMusicLyricUrl(testSong.lrc)) {
      console.log("❌ QQ音乐歌词URL格式无效");
      console.log("歌词URL:", testSong.lrc);
      return false;
    }

    console.log("✅ 歌词URL格式验证通过");

    // 获取并解析歌词
    const qqLyrics = await getQQMusicLyrics(testSong.lrc);

    if (qqLyrics.enhancedLyrics.length === 0) {
      console.log("❌ 歌词解析结果为空");
      return false;
    }

    console.log(`✅ 歌词解析成功，类型: ${qqLyrics.type}`);
    console.log(`📝 歌词行数: ${qqLyrics.enhancedLyrics.length}`);
    console.log(`🎤 歌曲ID: ${qqLyrics.songId}`);

    // 显示前几行歌词
    console.log("\n🎼 歌词内容预览:");
    qqLyrics.enhancedLyrics.slice(0, 3).forEach((line, index) => {
      const time = new Date(line.startTime).toISOString().substr(14, 9);
      console.log(`${index + 1}. [${time}] ${line.originalContent}`);

      if (line.words.length > 1) {
        console.log(`   逐字: ${line.words.map(w => w.content).join('')}`);
      }
    });

    // 转换为应用格式
    const appLyrics = convertToAppLyricFormat(qqLyrics);
    console.log(`\n📱 应用格式转换完成`);
    console.log(`LRC长度: ${appLyrics.lrc.length} 字符`);
    console.log(`支持逐字: ${appLyrics.hasWordLyric ? '是' : '否'}`);

    if (appLyrics.yrc) {
      console.log(`YRC长度: ${appLyrics.yrc.length} 字符`);
    }

    return true;
  } catch (error) {
    console.error("❌ QQ音乐歌词解析测试失败:", error);
    return false;
  }
};

// 测试多首歌曲的歌词
export const testMultipleQQMusicLyrics = async () => {
  console.log("🎶 测试多首QQ音乐歌词解析");

  try {
    const keywords = ["反方向的钟", "晴天", "稻香"];
    let successCount = 0;
    let wordLyricCount = 0;

    for (const keyword of keywords) {
      console.log(`\n🔍 测试歌曲: ${keyword}`);

      const results = await tencentSearch(keyword, 1);
      if (!results || results.length === 0) {
        console.log(`❌ ${keyword}: 搜索失败`);
        continue;
      }

      const song = results[0];
      if (!song.lrc || !isValidQQMusicLyricUrl(song.lrc)) {
        console.log(`❌ ${keyword}: 歌词URL无效`);
        continue;
      }

      try {
        const qqLyrics = await getQQMusicLyrics(song.lrc);
        if (qqLyrics.enhancedLyrics.length > 0) {
          console.log(`✅ ${keyword}: 解析成功 (${qqLyrics.type})`);
          successCount++;
          if (qqLyrics.type === 'word') {
            wordLyricCount++;
          }
        } else {
          console.log(`❌ ${keyword}: 解析结果为空`);
        }
      } catch (error) {
        console.log(`❌ ${keyword}: 解析失败 - ${error}`);
      }
    }

    console.log(`\n📊 测试结果汇总:`);
    console.log(`成功解析: ${successCount}/${keywords.length}`);
    console.log(`逐字歌词: ${wordLyricCount}/${successCount}`);

    return successCount > 0;
  } catch (error) {
    console.error("❌ 多首歌曲歌词测试失败:", error);
    return false;
  }
};

// 测试歌词格式转换
export const testLyricFormatConversion = async () => {
  console.log("🔄 测试歌词格式转换");

  try {
    // 获取一首歌的歌词
    const results = await tencentSearch("反方向的钟", 1);
    if (!results || results.length === 0) {
      console.log("❌ 无法获取测试歌曲");
      return false;
    }

    const song = results[0];
    if (!song.lrc) {
      console.log("❌ 测试歌曲没有歌词");
      return false;
    }

    const qqLyrics = await getQQMusicLyrics(song.lrc);
    if (qqLyrics.enhancedLyrics.length === 0) {
      console.log("❌ 无法解析歌词");
      return false;
    }

    // 转换格式
    const appLyrics = convertToAppLyricFormat(qqLyrics);

    console.log("✅ 格式转换成功");
    console.log(`📝 LRC格式行数: ${appLyrics.lrc.split('\n').length}`);
    console.log(`🎵 支持逐字: ${appLyrics.hasWordLyric}`);

    if (appLyrics.yrc) {
      console.log(`🎶 YRC格式行数: ${appLyrics.yrc.split('\n').length}`);
    }

    // 显示LRC示例
    console.log("\n📄 LRC格式示例:");
    const lrcLines = appLyrics.lrc.split('\n').slice(0, 3);
    lrcLines.forEach(line => console.log(line));

    // 显示YRC示例（��果有）
    if (appLyrics.yrc) {
      console.log("\n🎭 YRC格式示例:");
      const yrcLines = appLyrics.yrc.split('\n').slice(0, 2);
      yrcLines.forEach(line => console.log(line));
    }

    return true;
  } catch (error) {
    console.error("❌ 格式转换测试失败:", error);
    return false;
  }
};

// 完整的QQ音乐歌词测试套件
export const runQQMusicLyricTests = async () => {
  console.log("🚀 开始QQ音乐歌词完整测试套件");

  const tests = [
    { name: "基础歌词解析", fn: testQQMusicLyrics },
    { name: "多首歌曲歌词", fn: testMultipleQQMusicLyrics },
    { name: "格式转换", fn: testLyricFormatConversion },
  ];

  let passedTests = 0;
  const totalTests = tests.length;

  for (const test of tests) {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`🧪 执行测试: ${test.name}`);
    console.log(`${"=".repeat(50)}`);

    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
        console.log(`✅ ${test.name} - 通过`);
      } else {
        console.log(`❌ ${test.name} - 失败`);
      }
    } catch (error) {
      console.error(`💥 ${test.name} - 异常:`, error);
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`📊 测试结果汇总: ${passedTests}/${totalTests} 通过`);
  console.log(`${"=".repeat(50)}`);

  if (passedTests === totalTests) {
    console.log("🎉 所有QQ音乐歌词测试通过！");
  } else {
    console.log("⚠️ 部分测试失败，请检查上述日志");
  }

  return passedTests === totalTests;
};

// 暴露到全局
if (typeof window !== "undefined") {
  (window as any).qqMusicLyricTests = {
    testQQMusicLyrics,
    testMultipleQQMusicLyrics,
    testLyricFormatConversion,
    runQQMusicLyricTests
  };
  console.log("QQ音乐歌词测试函数已暴露到全局 window.qqMusicLyricTests");
}