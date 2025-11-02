<template>
  <div :key="searchKeyword" class="search">
    <div class="title">
      <n-text class="keyword">{{ searchKeyword }}</n-text>
      <n-text depth="3">的相关搜索</n-text>
      <!-- 音乐源选择 -->
      <div class="source-selector">
        <n-radio-group v-model:value="musicSource" size="small" @update:value="sourceChange">
          <n-radio-button value="netease"> 网易云音乐 </n-radio-button>
          <n-radio-button value="tencent"> QQ音乐 </n-radio-button>
          <n-radio-button value="all"> 全部 </n-radio-button>
        </n-radio-group>
      </div>
    </div>
    <!-- 标签页 -->
    <n-tabs v-model:value="searchType" class="tabs" type="segment" @update:value="tabChange">
      <n-tab name="search-songs"> 单曲 </n-tab>
      <n-tab name="search-playlists"> 歌单 </n-tab>
      <n-tab name="search-artists"> 歌手 </n-tab>
      <n-tab name="search-albums"> 专辑 </n-tab>
      <n-tab name="search-videos"> 视频 </n-tab>
      <n-tab name="search-radios"> 播客 </n-tab>
    </n-tabs>
    <!-- 路由 -->
    <RouterView v-slot="{ Component }">
      <Transition :name="`router-${settingStore.routeAnimation}`" mode="out-in">
        <KeepAlive v-if="settingStore.useKeepAlive">
          <component :is="Component" :keyword="searchKeyword" class="router-view" />
        </KeepAlive>
        <component v-else :is="Component" :keyword="searchKeyword" class="router-view" />
      </Transition>
    </RouterView>
  </div>
</template>

<script setup lang="ts">
import { useSettingStore } from "@/stores";

const router = useRouter();
const settingStore = useSettingStore();

// 搜索关键词
const searchKeyword = computed(() => router.currentRoute.value.query.keyword as string);

// 搜索分类
const searchType = ref<string>((router.currentRoute.value?.name as string) || "search-songs");

// 音乐源选择 - 优先使用URL参数，否则默认为"all"
const musicSource = ref<string>((router.currentRoute.value.query.source as string) || "all");

// Tabs 改变
const tabChange = (value: string) => {
  router.push({
    name: value,
    query: {
      keyword: searchKeyword.value,
      source: musicSource.value,
    },
  });
};

// 音乐源改变
const sourceChange = (value: string) => {
  router.push({
    name: searchType.value,
    query: {
      keyword: searchKeyword.value,
      source: value,
    },
  });
};

onBeforeRouteUpdate((to) => {
  if (to.matched[0].name !== "search") return;
  searchType.value = to.name as string;
  musicSource.value = (to.query.source as string) || "all";
});
</script>

<style lang="scss" scoped>
.search {
  display: flex;
  flex-direction: column;
  height: 100%;
  .title {
    margin-top: 12px;
    margin-bottom: 12px;
    font-size: 22px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    .keyword {
      font-size: 36px;
      font-weight: bold;
      line-height: normal;
    }
    .n-text {
      display: inline-block;
    }
    .source-selector {
      display: flex;
      align-items: center;
    }
  }
  .router-view {
    flex: 1;
    overflow: hidden;
  }
}
</style>
