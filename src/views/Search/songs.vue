<template>
  <div class="search-type">
    <Transition name="fade" mode="out-in">
      <SongList
        v-if="searchCount > 0"
        :data="searchResultData"
        :loading="loading"
        loadMore
        disabledSort
        @reachBottom="reachBottom"
      />
      <n-empty
        v-else
        :description="`很抱歉，未能找到与 ${keyword} 相关的任何歌曲`"
        style="margin-top: 60px"
        size="large"
      >
        <template #icon>
          <SvgIcon name="SearchOff" />
        </template>
      </n-empty>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { SongType } from "@/types/main";
import type { MetaData } from "@/types/main";
import { searchResult } from "@/api/search";
import { searchMusic, MetingServer } from "@/api/meting";
import { formatSongsList } from "@/utils/format";

const props = defineProps<{
  keyword: string;
}>();

const router = useRouter();

// 搜索数据
const hasMore = ref<boolean>(true);
const loading = ref<boolean>(true);
const searchOffset = ref<number>(0);
const searchCount = ref<number>(1);
const searchResultData = ref<SongType[]>([]);

// 获取当前音乐源
const musicSource = computed(() => (router.currentRoute.value.query.source as string) || "netease");

// 格式化Meting数据为SongType
const formatMetingData = (metingSongs: any[]): SongType[] => {
  return metingSongs.map((song) => {
    try {
      // 安全提取歌曲ID（从URL中提取）
      const extractSongId = (url: string): string => {
        if (!url) return Math.random().toString(36).substr(2, 9);
        const match = url.match(/id=([^&]+)/);
        return match ? match[1] : Math.random().toString(36).substr(2, 9);
      };

      const songId = extractSongId(song.url || "");
      const parsedId = parseInt(songId) || Math.floor(Math.random() * 1000000);

      // 安全格式化歌曲名
      const safeSongName = (song.name || "未知歌曲").toString().trim();
      const finalSongName = song.source === "tencent" ? `[QQ] ${safeSongName}` : safeSongName;

      // 安全格式化艺术家数据为MetaData[]或string格式
      let formattedArtists: MetaData[] | string;
      const artistName = (song.artist || "未知歌手").toString().trim();
      if (artistName) {
        const artistNames = artistName.split(/\s*[,，/]\s*/).filter(name => name.trim());
        if (artistNames.length === 1) {
          formattedArtists = artistNames[0];
        } else {
          formattedArtists = artistNames.map(name => ({
            id: Math.floor(Math.random() * 1000000),
            name: name.trim(),
            cover: song.pic || "",
            alias: []
          }));
        }
      } else {
        formattedArtists = "未知歌手";
      }

      // 安全格式化专辑数据
      let formattedAlbum: MetaData | string;
      const albumName = (song.album || "未知专辑").toString().trim();
      if (albumName) {
        formattedAlbum = {
          id: Math.floor(Math.random() * 1000000),
          name: albumName,
          cover: song.pic || "",
          alias: []
        };
      } else {
        formattedAlbum = "未知专辑";
      }

      // 安全的图片URL
      const safePicUrl = song.pic || "";

      return {
        id: parsedId,
        name: finalSongName,
        artists: formattedArtists,
        album: formattedAlbum,
        dj: undefined,
        cover: safePicUrl,
        coverSize: undefined,
        duration: 0, // Meting API 不提供时长信息，暂时设为0
        originCoverType: undefined,
        alia: undefined,
        free: 0 as const,
        mv: null,
        path: undefined,
        pc: false,
        size: undefined,
        quality: undefined,
        createTime: undefined,
        updateTime: undefined,
        playCount: 0,
        type: "song" as const,
        // QQ音乐扩展字段
        source: song.source === "tencent" ? "tencent" : "netease",
        originalUrl: song.url || "",
        originalLrc: song.lrc || "",
        originalPic: safePicUrl,
      };
    } catch (error) {
      console.error("格式化QQ音乐歌曲数据时出错:", error, song);
      // 返回一个安全的默认歌曲对象
      return {
        id: Math.floor(Math.random() * 1000000),
        name: `[QQ] 格式化失败的歌曲`,
        artists: "未知歌手",
        album: "未知专辑",
        dj: undefined,
        cover: "",
        coverSize: undefined,
        duration: 0,
        originCoverType: undefined,
        alia: undefined,
        free: 0 as const,
        mv: null,
        path: undefined,
        pc: false,
        size: undefined,
        quality: undefined,
        createTime: undefined,
        updateTime: undefined,
        playCount: 0,
        type: "song" as const,
        source: "tencent",
        originalUrl: "",
        originalLrc: "",
        originalPic: "",
      };
    }
  });
};

// 智能合并搜索结果
const smartCombineSearchResults = (
  keyword: string,
  neteaseSongs: SongType[],
  tencentSongs: SongType[],
  _offset: number
): SongType[] => {
  // 计算匹配分数
  const calculateMatchScore = (song: SongType): number => {
    const songName = typeof song.name === 'string' ? song.name.replace(/\[.*?\]\s*/g, '') : song.name;
    const artistName = typeof song.artists === 'string'
      ? song.artists
      : song.artists?.map(a => a.name).join(', ') || '';

    const keywordLower = keyword.toLowerCase();
    const songNameLower = songName.toLowerCase();
    const artistNameLower = artistName.toLowerCase();

    let score = 0;

    // 歌名完全匹配
    if (songNameLower === keywordLower) score += 100;
    // 歌名包含完整关键词
    else if (songNameLower.includes(keywordLower)) score += 80;
    // 歌名包含关键词的一部分
    else if (keywordLower.split(' ').some(word => songNameLower.includes(word))) score += 40;

    // 歌手匹配
    if (artistNameLower === keywordLower) score += 60;
    else if (artistNameLower.includes(keywordLower)) score += 30;

    // QQ音乐源优先级加成（因为用户可能专门搜索QQ音乐内容）
    if (song.source === 'tencent') score += 10;

    return score;
  };

  // 去重处理（基于歌名和歌手）
  const deduplicateSongs = (songs: SongType[]): Map<string, SongType> => {
    const songMap = new Map<string, SongType>();

    songs.forEach(song => {
      const songName = typeof song.name === 'string' ? song.name.replace(/\[.*?\]\s*/g, '') : song.name;
      const artistName = typeof song.artists === 'string'
        ? song.artists
        : song.artists?.map(a => a.name).join(', ') || '';

      const key = `${songName.toLowerCase()}-${artistName.toLowerCase()}`;

      // 如果已存在相同歌曲，选择质量更高的版本
      if (!songMap.has(key) || (song.source === 'tencent' && songMap.get(key)?.source !== 'tencent')) {
        songMap.set(key, song);
      }
    });

    return songMap;
  };

  // 合并所有歌曲
  const allSongs = [...neteaseSongs, ...tencentSongs];

  // 去重
  const uniqueSongs = Array.from(deduplicateSongs(allSongs).values());

  // 计算匹配分数并排序
  const scoredSongs = uniqueSongs.map(song => ({
    song,
    score: calculateMatchScore(song)
  }));

  // 按分数降序排序
  scoredSongs.sort((a, b) => b.score - a.score);

  // 直接返回按分数排序的结果，让最匹配的歌曲排在前面
  return scoredSongs.map(item => item.song);
};

// 获取搜索结果
const getSearchResult = async () => {
  // 获取数据
  loading.value = true;

  try {
    if (musicSource.value === "tencent") {
      // 仅搜索QQ音乐
      const result = await searchMusic(props.keyword, MetingServer.Tencent);
      if (result && result.length > 0) {
        const songData = formatMetingData(result);
        searchResultData.value = searchResultData.value.concat(songData);
        searchCount.value = result.length;
        hasMore.value = false; // Meting API 一次返回所有结果
      } else {
        searchCount.value = 0;
      }
    } else if (musicSource.value === "all") {
      // 搜索网易云和QQ音乐
      const [neteaseResult, tencentResult] = await Promise.all([
        searchResult(props.keyword, 25, searchOffset.value, 1),
        searchMusic(props.keyword, MetingServer.Tencent),
      ]);

      let neteaseSongs: SongType[] = [];
      let tencentSongs: SongType[] = [];

      // 处理网易云音乐结果
      if (neteaseResult?.result?.songs) {
        neteaseSongs = formatSongsList(neteaseResult.result.songs);
      }

      // 处理QQ音乐结果
      if (tencentResult && tencentResult.length > 0) {
        tencentSongs = formatMetingData(tencentResult);
      }

      // 智能排序和合并结果
      const combinedSongs = smartCombineSearchResults(
        props.keyword,
        neteaseSongs,
        tencentSongs,
        searchOffset.value
      );

      // 更新搜索结果
      if (searchOffset.value === 0) {
        searchResultData.value = combinedSongs;
      } else {
        searchResultData.value = searchResultData.value.concat(combinedSongs);
      }

      searchCount.value = neteaseSongs.length + tencentSongs.length;
      hasMore.value = neteaseResult?.result?.hasMore || false;
    } else {
      // 默认搜索网易云音乐
      const result = await searchResult(props.keyword, 50, searchOffset.value, 1);
      // 是否还有
      hasMore.value = result.result?.hasMore || result.result?.songCount > searchOffset.value + 50;
      // 搜索总数
      searchCount.value = result.result?.songCount;
      // 处理数据
      const songData = formatSongsList(result.result.songs);
      searchResultData.value = searchResultData.value.concat(songData);
    }
  } catch (error) {
    console.error("搜索失败:", error);
    // 如果QQ音乐搜索失败，回退到网易云搜索
    if (musicSource.value === "tencent") {
      const result = await searchResult(props.keyword, 50, searchOffset.value, 1);
      hasMore.value = result.result?.hasMore || result.result?.songCount > searchOffset.value + 50;
      searchCount.value = result.result?.songCount;
      const songData = formatSongsList(result.result.songs);
      searchResultData.value = searchResultData.value.concat(songData);
    }
  }

  loading.value = false;
};

// 列表触底
const reachBottom = () => {
  if (hasMore.value && musicSource.value !== "tencent") {
    console.log("加载");
    searchOffset.value += 50;
    getSearchResult();
  } else {
    loading.value = false;
  }
};

// 监听音乐源变化
watch(musicSource, () => {
  // 重置搜索数据
  searchResultData.value = [];
  searchOffset.value = 0;
  hasMore.value = true;
  searchCount.value = 1;
  getSearchResult();
});

onMounted(() => {
  getSearchResult();
});
</script>
