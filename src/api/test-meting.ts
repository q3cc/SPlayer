// Meting API 测试文件
import {
  tencentSearch,
  neteaseSearch,
  tencentSong,
  neteaseSong,
  searchMusic,
  MetingServer,
  MetingYrc
} from "./meting";

// 测试QQ音乐搜索
export const testTencentSearch = async (keyword: string = "反方向的钟") => {
  console.log(`测试QQ音乐搜索: ${keyword}`);
  try {
    const result = await tencentSearch(keyword, 20, MetingYrc.Open);
    console.log("QQ音乐搜索结果:", result);
    if (result && result.length > 0) {
      console.log(`找到 ${result.length} 首歌曲`);
      result.forEach((song, index) => {
        console.log(`${index + 1}. ${song.name} - ${song.artist}`);
      });
    } else {
      console.log("未找到搜索结果");
    }
    return result;
  } catch (error) {
    console.error("QQ音乐搜索失败:", error);
    return null;
  }
};

// 测试网易云音乐搜索
export const testNeteaseSearch = async (keyword: string = "反方向的钟") => {
  console.log(`测试网易云音乐搜索: ${keyword}`);
  try {
    const result = await neteaseSearch(keyword, 20, MetingYrc.Open);
    console.log("网易云搜索结果:", result);
    if (result && result.length > 0) {
      console.log(`找到 ${result.length} 首歌曲`);
      result.forEach((song, index) => {
        console.log(`${index + 1}. ${song.name} - ${song.artist}`);
      });
    } else {
      console.log("未找到搜索结果");
    }
    return result;
  } catch (error) {
    console.error("网易云搜索失败:", error);
    return null;
  }
};

// 测试通用搜索
export const testSearchMusic = async (keyword: string = "周杰伦") => {
  console.log(`测试通用搜索: ${keyword}`);

  // 测试QQ音乐搜索
  console.log("\n=== QQ音乐搜索 ===");
  const tencentResult = await searchMusic(keyword, MetingServer.Tencent);

  // 测试网易云搜索
  console.log("\n=== 网易云音乐搜索 ===");
  const neteaseResult = await searchMusic(keyword, MetingServer.NetEase);

  return {
    tencent: tencentResult,
    netease: neteaseResult
  };
};

// 测试获取歌曲详情
export const testGetSongDetail = async (songId: string, server: MetingServer) => {
  console.log(`测试获取歌曲详情: ${songId} from ${server}`);
  try {
    const result = await (server === MetingServer.Tencent ? tencentSong : neteaseSong)(
      songId,
      undefined,
      MetingYrc.Open
    );
    console.log("歌曲详情:", result);
    return result;
  } catch (error) {
    console.error("获取歌曲详情失败:", error);
    return null;
  }
};

// 完整测试函数
export const runAllTests = async () => {
  console.log("开始 Meting API 完整测试...");

  // 测试1: QQ音乐搜索
  console.log("\n🎵 测试1: QQ音乐搜索");
  const tencentSearchResult = await testTencentSearch("反方向的钟");

  // 测试2: 网易云音乐搜索
  console.log("\n🎵 测试2: 网易云音乐搜索");
  const neteaseSearchResult = await testNeteaseSearch("反方向的钟");

  // 测试3: 通用搜索
  console.log("\n🎵 测试3: 通用搜索");
  const searchResults = await testSearchMusic("周杰伦");

  // 测试4: 获取歌曲详情（如果有搜索结果）
  if (tencentSearchResult && tencentSearchResult.length > 0) {
    console.log("\n🎵 测试4: 获取QQ音乐歌曲详情");
    const tencentId = tencentSearchResult[0].url?.split("id=")[1]?.split("&")[0];
    if (tencentId) {
      await testGetSongDetail(tencentId, MetingServer.Tencent);
    }
  }

  if (neteaseSearchResult && neteaseSearchResult.length > 0) {
    console.log("\n🎵 测试5: 获取网易云歌曲详情");
    const neteaseId = neteaseSearchResult[0].url?.split("id=")[1]?.split("&")[0];
    if (neteaseId) {
      await testGetSongDetail(neteaseId, MetingServer.NetEase);
    }
  }

  console.log("\n✅ Meting API 测试完成");
  return {
    tencentSearch: tencentSearchResult,
    neteaseSearch: neteaseSearchResult,
    generalSearch: searchResults
  };
};

// 测试修复后的功能
export const testFixedFeatures = async () => {
  console.log("开始测试修复后的功能...");

  try {
    // 测试QQ音乐搜索
    console.log("\n🎵 测试QQ音乐搜索功能");
    const tencentResults = await tencentSearch("反方向的钟", 5);
    if (tencentResults && tencentResults.length > 0) {
      console.log("✅ QQ音乐搜索成功");
      console.log("找到的歌曲:", tencentResults.map(s => `${s.name} - ${s.artist}`));

      // 测试第一个歌曲的格式化
      const testSong = tencentResults[0];
      console.log("\n🔧 测试数据格式化");
      console.log("原始数据:", testSong);

      // 验证关键数据
      if (testSong.name && testSong.artist && testSong.album && testSong.url && testSong.pic) {
        console.log("✅ 基本数据完整");
        console.log(`歌名: ${testSong.name}`);
        console.log(`歌手: ${testSong.artist}`);
        console.log(`专辑: ${testSong.album}`);
        console.log(`播放链接: ${testSong.url}`);
        console.log(`封面链接: ${testSong.pic}`);
      } else {
        console.log("❌ 数据不完整");
      }
    } else {
      console.log("❌ QQ音乐搜索失败");
    }

    // 测试歌词获取
    console.log("\n🎶 测试歌词获取");
    if (tencentResults && tencentResults.length > 0) {
      const songId = tencentResults[0].url?.split("id=")[1]?.split("&")[0];
      if (songId) {
        const lyricData = await tencentSong(songId);
        if (lyricData && lyricData.length > 0 && lyricData[0].lrc) {
          console.log("✅ QQ音乐歌词获取成功");
          console.log("歌词前100字符:", lyricData[0].lrc.substring(0, 100));
        } else {
          console.log("❌ QQ音乐歌词获取失败");
        }
      }
    }

    console.log("\n✅ 修复功能测试完成");
    return true;
  } catch (error) {
    console.error("❌ 测试失败:", error);
    return false;
  }
};

// 快速验证功能
export const quickVerify = async () => {
  console.log("🚀 快速验证QQ音乐集成功能");

  try {
    // 1. 搜索测试
    const results = await tencentSearch("反方向的钟", 3);
    if (!results || results.length === 0) {
      throw new Error("搜索失败");
    }
    console.log("✅ 搜索功能正常");

    // 2. 数据验证
    const song = results[0];
    const requiredFields = ["name", "artist", "album", "url", "pic"];
    const missingFields = requiredFields.filter(field => !song[field]);

    if (missingFields.length > 0) {
      throw new Error(`缺少必要字段: ${missingFields.join(", ")}`);
    }
    console.log("✅ 数据格式正确");

    // 3. URL格式验证
    const urlPattern = /^https:\/\/metingapi\.q3cc\.top\/.*server=tencent.*type=url.*id=.+/;
    if (!urlPattern.test(song.url)) {
      throw new Error("播放链接格式不正确");
    }
    console.log("✅ 播放链接格式正确");

    console.log("🎉 所有功能验证通过！");
    return results;
  } catch (error) {
    console.error("❌ 验证失败:", error);
    return null;
  }
};

// 如果在浏览器环境中，将测试函数暴露到全局
if (typeof window !== "undefined") {
  (window as any).metingApiTest = {
    testTencentSearch,
    testNeteaseSearch,
    testSearchMusic,
    testGetSongDetail,
    runAllTests,
    testFixedFeatures,
    quickVerify
  };
  console.log("Meting API 测试函数已暴露到全局 window.metingApiTest");
}