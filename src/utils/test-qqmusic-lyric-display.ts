/**
 * QQ音乐逐字歌词显示测试工具
 * 用于验证逐字歌词是否正确显示
 */

import { getQQMusicLyrics, convertToAppLyricFormat, isValidQQMusicLyricUrl } from "./qqmusic-lyrics";
import { parseYrc } from "@applemusic-like-lyrics/lyric";
import { useMusicStore } from "@/stores";

/**
 * 测试QQ音乐逐字歌词完整流程
 */
export const testQQMusicLyricDisplay = async (songData: any) => {
  console.log("🎵 开始测试QQ音乐逐字歌词显示");

  if (!songData || songData.source !== "tencent") {
    console.log("❌ 非QQ音乐歌曲，跳过测试");
    return false;
  }

  if (!songData.originalLrc) {
    console.log("❌ 歌曲没有歌词链接");
    return false;
  }

  try {
    // 1. 验证歌词URL
    if (!isValidQQMusicLyricUrl(songData.originalLrc)) {
      console.log("❌ QQ音乐歌词URL格式无效");
      return false;
    }

    console.log("✅ QQ音乐歌词URL格式验证通过");

    // 2. 获取歌词
    const qqLyrics = await getQQMusicLyrics(songData.originalLrc);
    if (!qqLyrics.enhancedLyrics.length) {
      console.log("❌ QQ音乐歌词解析为空");
      return false;
    }

    console.log(`✅ QQ音乐歌词获取成功，类型: ${qqLyrics.type}`);
    console.log(`📝 歌词行数: ${qqLyrics.enhancedLyrics.length}`);

    // 3. 转换格式
    const appLyrics = convertToAppLyricFormat(qqLyrics);
    console.log(`🔄 应用格式转换完成`);
    console.log(`📄 LRC长度: ${appLyrics.lrc.length} 字符`);
    console.log(`🎭 支持逐字: ${appLyrics.hasWordLyric ? '是' : '否'}`);

    if (!appLyrics.hasWordLyric || !appLyrics.yrc) {
      console.log("⚠️ 歌词不是逐字歌词或YRC格式为空");
      return false;
    }

    console.log(`🎶 YRC长度: ${appLyrics.yrc.length} 字符`);

    // 4. 测试YRC解析
    const yrcParsed = parseYrc(appLyrics.yrc);
    if (!yrcParsed || !yrcParsed.length) {
      console.log("❌ YRC格式解析失败");
      return false;
    }

    console.log(`✅ YRC格式解析成功，共 ${yrcParsed.length} 行`);

    // 5. 显示YRC示例
    console.log("\n🎼 YRC格式示例:");
    const yrcLines = appLyrics.yrc.split('\n').slice(0, 3);
    yrcLines.forEach((line, index) => console.log(`${index + 1}. ${line}`));

    // 6. 显示解析后的逐字歌词示例
    console.log("\n🎭 解析后逐字歌词示例:");
    yrcParsed.slice(0, 2).forEach((line, index) => {
      console.log(`${index + 1}. 时间: ${(line as any).time}ms, 结束: ${(line as any).endTime}ms`);
      console.log(`   内容: ${(line as any).words.map((w: any) => (w as any).content).join('')}`);
      if ((line as any).words.length > 1) {
        console.log(`   逐字: ${(line as any).words.map((w: any) => `[${(w as any).startTime}-${(w as any).endTime}]${(w as any).content}`).join(' ')}`);
      }
    });

    // 7. 检查store状态
    const musicStore = useMusicStore();
    console.log(`\n🎯 Store状态检查:`);
    console.log(`   yrcData长度: ${musicStore.songLyric.yrcData.length}`);
    console.log(`   isHasYrc: ${musicStore.isHasYrc}`);

    if (musicStore.songLyric.yrcData.length > 0) {
      console.log(`✅ 逐字歌词已正确加载到store`);
      console.log(`   第一行示例:`, musicStore.songLyric.yrcData[0]);
    } else {
      console.log(`⚠️ 逐字歌词未加载到store或为空`);
    }

    console.log("\n🎉 QQ音乐逐字歌词显示测试完成");
    return true;

  } catch (error) {
    console.error("❌ QQ音乐逐字歌词显示测试失败:", error);
    return false;
  }
};

/**
 * 强制刷新QQ音乐歌词显示
 */
export const forceRefreshQQMusicLyrics = async (songData: any) => {
  console.log("🔄 强制刷新QQ音乐歌词显示");

  try {
    const success = await testQQMusicLyricDisplay(songData);
    if (success) {
      console.log("✅ QQ音乐歌词刷新成功");
      return true;
    } else {
      console.log("❌ QQ音乐歌词刷新失败");
      return false;
    }
  } catch (error) {
    console.error("❌ 强制刷新QQ音乐歌词失败:", error);
    return false;
  }
};

/**
 * 获取当前播放歌曲的歌词状态信息
 */
export const getCurrentLyricStatus = () => {
  const musicStore = useMusicStore();

  return {
    hasLrc: musicStore.isHasLrc,
    hasYrc: musicStore.isHasYrc,
    lrcDataLength: musicStore.songLyric.lrcData.length,
    yrcDataLength: musicStore.songLyric.yrcData.length,
    lrcAMDataLength: musicStore.songLyric.lrcAMData.length,
    yrcAMDataLength: musicStore.songLyric.yrcAMData.length,
    currentSong: {
      id: musicStore.playSong.id,
      name: musicStore.playSong.name,
      source: (musicStore.playSong as any).source
    }
  };
};

// 暴露到全局（开发环境）
if (typeof window !== "undefined" && import.meta.env.DEV) {
  (window as any).qqMusicLyricDisplay = {
    testQQMusicLyricDisplay,
    forceRefreshQQMusicLyrics,
    getCurrentLyricStatus
  };
  console.log("QQ音乐逐字歌词显示测试工具已暴露到全局 window.qqMusicLyricDisplay");
}