<template>
  <div class="meting-test">
    <n-card title="Meting API 测试工具" size="small">
      <template #header-extra>
        <n-button size="small" @click="toggleDebug">
          {{ showDebug ? "隐藏" : "显示" }}
        </n-button>
      </template>

      <div v-show="showDebug">
        <!-- 搜索关键词输入 -->
        <div class="search-section">
          <n-input-group>
            <n-input
              v-model:value="searchKeyword"
              placeholder="输入搜索关键词"
              style="width: 200px"
              @keyup.enter="runSearch"
            />
            <n-button @click="runSearch" :loading="loading">
              搜索
            </n-button>
            <n-button @click="runAllTests" :loading="loading">
              完整测试
            </n-button>
          </n-input-group>
        </div>

        <!-- 测试结果 -->
        <div class="results-section" v-if="results">
          <n-tabs type="segment" size="small">
            <n-tab-pane name="tencent" tab="QQ音乐结果">
              <div v-if="results.tencent?.length">
                <n-list>
                  <n-list-item v-for="(song, index) in results.tencent" :key="index">
                    <div class="song-item">
                      <n-thing>
                        <template #header>{{ song.name }}</template>
                        <template #description>{{ song.artist }} - {{ song.album }}</template>
                        <div class="song-info">
                          <n-tag size="tiny" type="info">QQ音乐</n-tag>
                          <span class="url-info">{{ song.url?.substring(0, 50) }}...</span>
                        </div>
                      </n-thing>
                    </div>
                  </n-list-item>
                </n-list>
              </div>
              <n-empty v-else description="无结果" />
            </n-tab-pane>

            <n-tab-pane name="netease" tab="网易云结果">
              <div v-if="results.netease?.length">
                <n-list>
                  <n-list-item v-for="(song, index) in results.netease" :key="index">
                    <div class="song-item">
                      <n-thing>
                        <template #header>{{ song.name }}</template>
                        <template #description>{{ song.artist }} - {{ song.album }}</template>
                        <div class="song-info">
                          <n-tag size="tiny" type="success">网易云</n-tag>
                          <span class="url-info">{{ song.url?.substring(0, 50) }}...</span>
                        </div>
                      </n-thing>
                    </div>
                  </n-list-item>
                </n-list>
              </div>
              <n-empty v-else description="无结果" />
            </n-tab-pane>

            <n-tab-pane name="logs" tab="控制台日志">
              <div class="logs-section">
                <n-scrollbar style="max-height: 300px">
                  <pre>{{ logs }}</pre>
                </n-scrollbar>
              </div>
            </n-tab-pane>
          </n-tabs>
        </div>

        <!-- 快捷操作 -->
        <div class="quick-actions">
          <n-space>
            <n-button size="small" @click="testTencentOnly">
              测试QQ音乐
            </n-button>
            <n-button size="small" @click="testNeteaseOnly">
              测试网易云
            </n-button>
            <n-button size="small" @click="testFixedFeatures">
              测试修复功能
            </n-button>
            <n-button size="small" @click="testQQMusicLyrics">
              测试QQ音乐歌词
            </n-button>
            <n-button size="small" @click="testLyricsProcessing">
              测试歌词处理
            </n-button>
            <n-button size="small" @click="testWordLyricSongs">
              测试逐字歌曲
            </n-button>
            <n-button size="small" @click="quickVerify">
              快速验证
            </n-button>
            <n-button size="small" @click="clearResults">
              清空结果
            </n-button>
          </n-space>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { runAllTests as runMetingTests, testTencentSearch, testNeteaseSearch, testFixedFeatures, quickVerify } from "@/api/test-meting";
import { runQQMusicLyricTests } from "@/api/test-qqmusic-lyrics";
import { searchMusic, MetingServer } from "@/api/meting";
import { getQQMusicLyrics, convertToAppLyricFormat, isValidQQMusicLyricUrl } from "@/utils/qqmusic-lyrics";

// 状态
const showDebug = ref(false);
const loading = ref(false);
const searchKeyword = ref("反方向的钟");
const results = ref<any>(null);
const logs = ref("");

// 记录日志
const log = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `[${timestamp}] ${message}\n`;
  logs.value += logMessage;
  console.log(message);
};

// 切换调试面板
const toggleDebug = () => {
  showDebug.value = !showDebug.value;
  if (showDebug.value) {
    log("调试面板已打开");
  }
};

// 运行搜索
const runSearch = async () => {
  if (!searchKeyword.value.trim()) return;

  loading.value = true;
  logs.value = "";
  log(`开始搜索: ${searchKeyword.value}`);

  try {
    const [tencentResult, neteaseResult] = await Promise.all([
      searchMusic(searchKeyword.value, MetingServer.Tencent),
      searchMusic(searchKeyword.value, MetingServer.NetEase)
    ]);

    results.value = {
      tencent: tencentResult,
      netease: neteaseResult
    };

    log(`QQ音乐找到 ${tencentResult?.length || 0} 首歌曲`);
    log(`网易云找到 ${neteaseResult?.length || 0} 首歌曲`);
  } catch (error) {
    log(`搜索失败: ${error}`);
  } finally {
    loading.value = false;
  }
};

// 只测试QQ音乐
const testTencentOnly = async () => {
  loading.value = true;
  logs.value = "";
  log("开始测试QQ音乐搜索");

  try {
    const result = await testTencentSearch(searchKeyword.value);
    results.value = {
      tencent: result,
      netease: null
    };
    log(`QQ音乐搜索完成，找到 ${result?.length || 0} 首歌曲`);
  } catch (error) {
    log(`QQ音乐搜索失败: ${error}`);
  } finally {
    loading.value = false;
  }
};

// 只测试网易云
const testNeteaseOnly = async () => {
  loading.value = true;
  logs.value = "";
  log("开始测试网易云搜索");

  try {
    const result = await testNeteaseSearch(searchKeyword.value);
    results.value = {
      tencent: null,
      netease: result
    };
    log(`网易云搜索完成，找到 ${result?.length || 0} 首歌曲`);
  } catch (error) {
    log(`网易云搜索失败: ${error}`);
  } finally {
    loading.value = false;
  }
};

// 运行完整测试
const runAllTests = async () => {
  loading.value = true;
  logs.value = "";
  log("开始完整API测试");

  try {
    const testResults = await runMetingTests();
    results.value = {
      tencent: testResults.tencentSearch,
      netease: testResults.neteaseSearch
    };
    log("完整测试完成");
  } catch (error) {
    log(`完整测试失败: ${error}`);
  } finally {
    loading.value = false;
  }
};

// 测试QQ音乐歌词
const testQQMusicLyrics = async () => {
  loading.value = true;
  logs.value = "";
  log("开始QQ音乐歌词测试");

  try {
    const success = await runQQMusicLyricTests();
    if (success) {
      log("✅ QQ音乐歌词测试全部通过");
    } else {
      log("❌ QQ音乐歌词测试部分失败");
    }
  } catch (error) {
    log(`QQ音乐歌词测试异常: ${error}`);
  } finally {
    loading.value = false;
  }
};

// 测试歌词处理
const testLyricsProcessing = async () => {
  loading.value = true;
  logs.value = "";
  log("开始测试歌词处理功能");

  try {
    // 搜索QQ音乐歌曲
    const tencentResults = await testTencentSearch(searchKeyword.value);
    if (!tencentResults || tencentResults.length === 0) {
      log("❌ 无法获取QQ音乐歌曲数据");
      return;
    }

    const testSong = tencentResults[0];
    log(`🎵 测试歌曲: ${testSong.name} - ${testSong.artist}`);

    if (!testSong.lrc) {
      log("❌ 歌曲没有歌词链接");
      return;
    }

    // 测试歌词处理流程
    log(`🎶 歌词URL: ${testSong.lrc}`);

    // 1. 测试QQ音乐歌词获取
    if (isValidQQMusicLyricUrl(testSong.lrc)) {
      const qqLyrics = await getQQMusicLyrics(testSong.lrc);
      log(`✅ QQ音乐歌词获取成功，类型: ${qqLyrics.type}`);
      log(`📝 歌词行数: ${qqLyrics.enhancedLyrics.length}`);

      // 2. 测试格式转换
      const appLyrics = convertToAppLyricFormat(qqLyrics);
      log(`🔄 应用格式转换完成`);
      log(`📄 LRC长度: ${appLyrics.lrc.length} 字符`);
      log(`🎭 支持逐字: ${appLyrics.hasWordLyric ? '是' : '否'}`);

      if (appLyrics.yrc) {
        log(`🎶 YRC长度: ${appLyrics.yrc.length} 字符`);
        log(`🎼 YRC示例: ${appLyrics.yrc.substring(0, 100)}...`);
      }

      // 3. 测试歌词数据包装
      const lyricDataForParsing: any = {
        code: 200,
        lrc: {
          lyric: appLyrics.lrc
        }
      };

      if (appLyrics.yrc) {
        lyricDataForParsing.yrc = {
          lyric: appLyrics.yrc
        };
        log(`✅ 歌词数据包装完成，包含逐字歌词`);
      } else {
        log(`✅ 歌词数据包装完成，仅包含普通歌词`);
      }

      // 显示LRC示例
      log(`\n📄 LRC格式示例:`);
      const lrcLines = appLyrics.lrc.split('\n').slice(0, 3);
      lrcLines.forEach((line: string) => log(line));

    } else {
      log("❌ QQ音乐歌词URL格式无效");
    }

    log("\n✅ 歌词处理测试完成");
  } catch (error) {
    log(`❌ 歌词处理测试失败: ${error}`);
  } finally {
    loading.value = false;
  }
};

// 测试逐字歌词歌曲
const testWordLyricSongs = async () => {
  loading.value = true;
  logs.value = "";
  log("开始测试逐字歌词歌曲");

  // 这些歌曲通常有逐字歌词
  const wordLyricSongs = [
    "晴天 周杰伦",
    "稻香 周杰伦",
    "青花瓷 周杰伦",
    "告白气球 周杰伦",
    "夜曲 周杰伦"
  ];

  for (const songKeyword of wordLyricSongs) {
    log(`\n🔍 测试歌曲: ${songKeyword}`);

    try {
      const results = await searchMusic(songKeyword, MetingServer.Tencent);
      if (!results || results.length === 0) {
        log(`❌ ${songKeyword}: 搜索失败`);
        continue;
      }

      const song = results[0];
      log(`🎵 找到歌曲: ${song.name} - ${song.artist}`);

      if (!song.lrc) {
        log(`❌ ${songKeyword}: 没有歌词链接`);
        continue;
      }

      // 检查歌词内容
      const qqLyrics = await getQQMusicLyrics(song.lrc);
      if (qqLyrics.enhancedLyrics.length > 0) {
        log(`✅ ${songKeyword}: 歌词解析成功`);
        log(`📝 类型: ${qqLyrics.type === 'word' ? '逐字歌词' : '普通歌词'}`);
        log(`🎼 行数: ${qqLyrics.enhancedLyrics.length}`);

        if (qqLyrics.type === 'word') {
          log(`🎭 ${songKeyword}: 找到逐字歌词！`);

          // 显示逐字歌词示例
          if (qqLyrics.enhancedLyrics.length > 0) {
            const firstLine = qqLyrics.enhancedLyrics[0];
            log(`   第一行: ${firstLine.originalContent}`);
            log(`   逐字: ${firstLine.words.map(w => `[${w.time}-${w.time + w.duration}]${w.content}`).join(' ')}`);
          }

          // 如果这是第一首找到的逐字歌词，可以用来测试播放
          return;
        }
      } else {
        log(`❌ ${songKeyword}: 歌词解析失败`);
      }
    } catch (error) {
      log(`❌ ${songKeyword}: 测试失败 - ${error}`);
    }
  }

  log("\n⚠️ 未找到包含逐字歌词的歌曲");
};

// 清空结果
const clearResults = () => {
  results.value = null;
  logs.value = "";
  log("结果已清空");
};

// 初始化
onMounted(() => {
  log("Meting API 测试工具已加载");
});
</script>

<style lang="scss" scoped>
.meting-test {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  width: 500px;
  max-width: 90vw;

  .search-section {
    margin-bottom: 16px;
  }

  .results-section {
    margin: 16px 0;
    max-height: 400px;
    overflow: hidden;

    .song-item {
      .song-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;

        .url-info {
          font-size: 12px;
          color: var(--n-text-color-3);
          font-family: monospace;
        }
      }
    }
  }

  .logs-section {
    pre {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }

  .quick-actions {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--n-border-color);
  }
}

// 移动端适配
@media (max-width: 768px) {
  .meting-test {
    width: 95vw;
    right: 2.5vw;
    left: 2.5vw;
  }
}
</style>