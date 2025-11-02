import { useMusicStore, useSettingStore, useStatusStore } from "@/stores";
import { parsedLyricsData, parseTTMLToAMLL, parseTTMLToYrc, resetSongLyric, parseYrcData } from "../lyric";
import { songLyric, songLyricTTML } from "@/api/song";
import { getQQMusicLyricsAsNeteaseFormat, getQQMusicLyrics, convertToAppLyricFormat, isValidQQMusicLyricUrl, addQQMusicWordLyricParam } from "../qqmusic-lyrics";
import { parseTTML, parseYrc } from "@applemusic-like-lyrics/lyric";
import { LyricLine } from "@applemusic-like-lyrics/core";
import { LyricType } from "@/types/main";

/**
 * 获取歌词
 * @param id 歌曲id
 * @param songData 可选的歌曲数据，用于处理QQ音乐
 */
export const getLyricData = async (id: number, songData?: any) => {
  const musicStore = useMusicStore();
  const settingStore = useSettingStore();
  const statusStore = useStatusStore();

  if (!id) {
    statusStore.usingTTMLLyric = false;
    resetSongLyric();
    return;
  }

  try {
    // 检查是否为QQ音乐歌曲
    let lyricRes = "";
    let lyricLocal = false;
    let ttmlContent = "";
    let ttmlLocal = false;
    let lyricDataForParsing: any;

    if (songData && songData.source === "tencent" && songData.originalLrc) {
      console.log(`🎵 ${id} 尝试使用QQ音乐歌词`);
      try {
        // 验证QQ音乐歌词URL
        if (isValidQQMusicLyricUrl(songData.originalLrc)) {
          // 直接使用新的转换函数获取网易云格式的QQ音乐歌词
          const neteaseFormat = await getQQMusicLyricsAsNeteaseFormat(songData.originalLrc);

          if (neteaseFormat.success && neteaseFormat.lrcData.length > 0) {
            console.log(`✅ ${id} QQ音乐歌词转换成功 (${neteaseFormat.hasWordLyric ? '逐字歌词' : '普通歌词'})`);
            console.log(`🎼 歌词行数: LRC ${neteaseFormat.lrcData.length}, YRC ${neteaseFormat.yrcData.length}`);

            // 直接将网易云格式的数据设置到store
            musicStore.songLyric = {
              lrcData: neteaseFormat.lrcData,
              yrcData: neteaseFormat.yrcData,
              lrcAMData: neteaseFormat.lrcData.map((line, index, lines) => ({
                words: [{ startTime: line.time * 1000, endTime: 0, word: line.content }],
                startTime: line.time * 1000,
                endTime: lines[index + 1]?.time * 1000,
                translatedLyric: line.tran ?? "",
                romanLyric: line.roma ?? "",
                isBG: line.isBG ?? false,
                isDuet: line.isDuet ?? false,
              })),
              yrcAMData: neteaseFormat.yrcData.map((line, index, lines) => ({
                words: line.contents?.map(word => ({
                  word: word.content,
                  startTime: word.time * 1000,
                  endTime: word.endTime * 1000,
                })) || [{ startTime: line.time * 1000, endTime: line.endTime * 1000, word: line.content }],
                startTime: line.time * 1000,
                endTime: line.endTime * 1000,
                translatedLyric: line.tran ?? "",
                romanLyric: line.roma ?? "",
                isBG: line.isBG ?? false,
                isDuet: line.isDuet ?? false,
              })),
            };

            // 重置歌词索引
            statusStore.lyricIndex = -1;

            console.log(`🎵 ${id} QQ音乐歌词直接设置到store完成`);
            lyricDataForParsing = null; // 标记已处理完成
          } else {
            console.log(`⚠️ ${id} QQ音乐歌词转换失败: ${neteaseFormat.error}，回退到网易云`);
          }
        } else {
          console.log(`⚠️ ${id} QQ音乐歌词URL格式无效，回退到网易云`);
        }
      } catch (error) {
        console.error(`❌ QQ音乐歌词获取失败，回退到网易云:`, error);
      }
    }


    // 如果QQ音乐歌词已经处理完成，跳过网易云降级，但仍要处理TTML和最终状态
    if (lyricDataForParsing === null) {
      console.log(`🎵 ${id} QQ音乐歌词已处理完成，跳过网易云降级`);
      // 重置TTML状态
      statusStore.usingTTMLLyric = false;
    } else {
      // 网易云歌词降级处理
      console.log(`🔄 ${id} 启动网易云歌词降级处理`);
      try {
        const getLyric = getLyricFun(settingStore.localLyricPath, id);
        const [
          { lyric: neteaseLyricRes, isLocal: neteaseLyricLocal },
          { lyric: neteaseTtmlContent, isLocal: neteaseTtmlLocal },
        ] = await Promise.all([
          getLyric("lrc", songLyric),
          settingStore.enableTTMLLyric ? getLyric("ttml", songLyricTTML) : getLyric("ttml"),
        ]);

        if (neteaseLyricRes) {
          lyricRes = neteaseLyricRes || "";
          lyricLocal = neteaseLyricLocal;
          ttmlContent = neteaseTtmlContent || "";
          ttmlLocal = neteaseTtmlLocal;

          lyricDataForParsing = lyricRes;
          console.log(`✅ ${id} 网易云歌词降级成功`);
        } else {
          console.log(`❌ ${id} 网易云歌词降级失败，无可用歌词`);
        }
      } catch (error) {
        console.error(`❌ ${id} 网易云歌词降级异常:`, error);
      }

      // 最终解析歌词数据（仅对非QQ音乐歌词）
      if (lyricDataForParsing) {
        parsedLyricsData(lyricDataForParsing, lyricLocal && !settingStore.enableExcludeLocalLyrics);
      } else {
        console.log(`⚠️ ${id} 无可用歌词数据，重置歌词状态`);
        resetSongLyric();
      }
    }

    // 处理TTML歌词（对所有类型的歌词都检查）
    if (ttmlContent) {
      const parsedResult = parseTTML(ttmlContent);
      if (!parsedResult?.lines?.length) {
        statusStore.usingTTMLLyric = false;
      } else {
        const skipExcludeLocal = ttmlLocal && !settingStore.enableExcludeLocalLyrics;
        const skipExcludeTTML = !settingStore.enableTTMLLyric;
        const skipExclude = skipExcludeLocal || skipExcludeTTML;
        const ttmlLyric = parseTTMLToAMLL(parsedResult, skipExclude);
        const ttmlYrcLyric = parseTTMLToYrc(parsedResult, skipExclude);
        console.log("TTML lyrics:", ttmlLyric, ttmlYrcLyric);
        // 合并数据
        const updates: Partial<{ yrcAMData: LyricLine[]; yrcData: LyricType[] }> = {};
        if (ttmlLyric?.length) {
          updates.yrcAMData = ttmlLyric;
          console.log("✅ TTML AMLL lyrics success");
        }
        if (ttmlYrcLyric?.length) {
          updates.yrcData = ttmlYrcLyric;
          console.log("✅ TTML Yrc lyrics success");
        }
        if (Object.keys(updates).length) {
          musicStore.songLyric = {
            ...musicStore.songLyric,
            ...updates,
          };
          statusStore.usingTTMLLyric = true;
        } else {
          statusStore.usingTTMLLyric = false;
        }
      }
    } else if (lyricDataForParsing === null) {
      // QQ音乐歌词已处理，确保usingTTMLLyric为false
      statusStore.usingTTMLLyric = false;
    }
    if (ttmlContent) {
      const parsedResult = parseTTML(ttmlContent);
      if (!parsedResult?.lines?.length) {
        statusStore.usingTTMLLyric = false;
        return;
      }
      const skipExcludeLocal = ttmlLocal && !settingStore.enableExcludeLocalLyrics;
      const skipExcludeTTML = !settingStore.enableExcludeTTML;
      const skipExclude = skipExcludeLocal || skipExcludeTTML;
      const ttmlLyric = parseTTMLToAMLL(parsedResult, skipExclude);
      const ttmlYrcLyric = parseTTMLToYrc(parsedResult, skipExclude);
      console.log("TTML lyrics:", ttmlLyric, ttmlYrcLyric);
      // 合并数据
      const updates: Partial<{ yrcAMData: LyricLine[]; yrcData: LyricType[] }> = {};
      if (ttmlLyric?.length) {
        updates.yrcAMData = ttmlLyric;
        console.log("✅ TTML AMLL lyrics success");
      }
      if (ttmlYrcLyric?.length) {
        updates.yrcData = ttmlYrcLyric;
        console.log("✅ TTML Yrc lyrics success");
      }
      if (Object.keys(updates).length) {
        musicStore.songLyric = {
          ...musicStore.songLyric,
          ...updates,
        };
        statusStore.usingTTMLLyric = true;
      } else {
        statusStore.usingTTMLLyric = false;
      }
    } else {
      statusStore.usingTTMLLyric = false;
    }

    console.log("Lyrics: ", musicStore.songLyric);
  } catch (error) {
    console.error("❌ Error loading lyrics:", error);
    statusStore.usingTTMLLyric = false;
    resetSongLyric();
  }
};

/**
 * 获取歌词函数生成器
 * @param paths 本地歌词路径数组
 * @param id 歌曲ID
 * @returns 返回一个函数，该函数接受扩展名和在线获取函数作为参数
 */
const getLyricFun =
  (paths: string[], id: number) =>
  async (
    ext: string,
    getOnline?: (id: number) => Promise<string | null>,
  ): Promise<{ lyric: string | null; isLocal: boolean }> => {
    for (const path of paths) {
      const lyric = await window.electron.ipcRenderer.invoke("read-local-lyric", path, id, ext);
      if (lyric) return { lyric, isLocal: true };
    }
    return { lyric: getOnline ? await getOnline(id) : null, isLocal: false };
  };
