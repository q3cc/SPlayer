# QQ音乐API集成说明

本项目已集成[Meting-API](https://github.com/metowolf/Meting)，支持QQ音乐搜索和播放功能。

## 功能特性

### 🎵 支持的音乐源
- **网易云音乐** (原有功能)
- **QQ音乐** (新增功能)
- **双源搜索** (同时搜索两个平台)

### 🔍 搜索功能
- 在搜索页面可以选择音乐源
- QQ音乐歌曲会在歌名前添加 `[QQ]` 前缀
- 支持切换不同音乐源进行搜索

## API 接口

### Meting API 配置
- **基础URL**: `https://metingapi.q3cc.top`
- **支持的参数**:
  - `server`: 数据源 (`netease` | `tencent`)
  - `type`: 请求类型 (`search` | `song` | `url` | `lrc` | `pic` | `playlist`)
  - `id`: 歌曲ID或歌单ID
  - `keyword`: 搜索关键词
  - `yrc`: 逐字歌词支持 (`false` | `true` | `open`)

### 主要API函数

#### 搜索相关
```typescript
// QQ音乐搜索
import { tencentSearch } from "@/api/meting";
const results = await tencentSearch("反方向的钟", 20, "open");

// 网易云搜索
import { neteaseSearch } from "@/api/meting";
const results = await neteaseSearch("反方向的钟", 20, "open");

// 通用搜索
import { searchMusic, MetingServer } from "@/api/meting";
const results = await searchMusic("反方向的钟", MetingServer.Tencent);
```

#### 歌曲详情
```typescript
// 获取QQ音乐歌曲详情
import { tencentSong } from "@/api/meting";
const song = await tencentSong("0017K7gL4WYnw2", "320", "open");

// 获取网易云歌曲详情
import { neteaseSong } from "@/api/meting";
const song = await neteaseSong("416892104", "320", "open");
```

## 文件结构

### 新增文件
```
src/
├── api/
│   ├── meting.ts          # Meting API 接口封装
│   └── test-meting.ts     # API 测试工具
├── components/Debug/
│   └── MetingTest.vue     # 开发调试组件
└── views/Search/
    ├── layout.vue         # 添加音乐源选择器
    └── songs.vue          # 支持多源搜索
```

### 修改文件
```
src/
├── App.vue                # 添加调试组件
```

## 使用方法

### 1. 搜索页面使用
1. 进入搜索页面 (`/search`)
2. 在搜索框上方选择音乐源：
   - **网易云音乐**: 仅搜索网易云
   - **QQ音乐**: 仅搜索QQ音乐
   - **全部**: 同时搜索两个平台
3. 输入关键词进行搜索
4. QQ音乐歌曲会显示 `[QQ]` 前缀

### 2. 开发调试
在开发环境中，右下角会显示"Meting API 测试工具"，可以：
- 测试各平台的搜索功能
- 查看API返回的原始数据
- 对比不同平台的结果
- 查看请求日志

### 3. 编程使用

```typescript
import {
  searchMusic,
  tencentSong,
  tencentLyric,
  MetingServer,
  MetingYrc
} from "@/api/meting";

// 搜索歌曲
const searchResults = await searchMusic("周杰伦", MetingServer.Tencent);

// 获取歌曲播放链接
const songDetail = await tencentSong("歌曲ID");

// 获取歌词
const lyricData = await tencentLyric("歌曲ID");
```

## 数据格式

### 搜索结果格式
```typescript
interface MetingSong {
  name: string;        // 歌曲名
  artist: string;      // 歌手
  album: string;       // 专辑
  url: string;         // 播放链接
  pic: string;         // 封面图片
  lrc: string;         // 歌词链接
  source: string;      // 数据源 ("tencent" | "netease")
  auth?: string;       // 认证参数
}
```

### 应用内SongType格式
QQ音乐的歌曲在应用内会被转换为标准的 `SongType` 格式，并添加 `[QQ]` 前缀：

```typescript
interface SongType {
  id: string | number;
  name: string;              // 会被格式化为 "[QQ] 歌曲名"
  artist: string;
  album: string;
  picUrl: string;
  source: "tencent" | "netease";
  // ... 其他字段
}
```

## 测试

### 使用测试工具
1. 启动开发服务器
2. 在右下角找到"Meting API 测试工具"
3. 点击"显示"打开调试面板
4. 输入搜索关键词进行测试

### 命令行测试
```typescript
// 在浏览器控制台中
import { runAllTests } from "@/api/test-meting";
await runAllTests();
```

## 注意事项

### 1. API限制
- Meting API 为第三方服务，可能存在访问限制
- 建议在生产环境中添加错误处理和重试机制

### 2. 播放链接
- QQ音乐的播放链接包含认证参数，有一定时效性
- 建议在播放前重新获取最新的播放链接

### 3. 歌词格式
- Meting API 支持逐字歌词 (`yrc: "open"`)
- 如果没有逐字歌词，会返回标准格式的歌词

### 4. 错误处理
- 如果QQ音乐搜索失败，会自动回退到网易云搜索
- 所有API调用都包含错误处理，保证应用稳定性

## 配置选项

### 音质设置
```typescript
export enum MetingBr {
  Standard = "128",    // 标准音质
  High = "192",        // 高音质
  Higher = "320",      // 超高音质
  Lossless = "999",    // 无损音质
}
```

### 逐字歌词设置
```typescript
export enum MetingYrc {
  False = "false",     // 禁用逐字歌词
  True = "true",       // 启用逐字歌词
  Open = "open",       // 备用启用模式
}
```

## 更新日志

### v1.0.0 (2024-XX-XX)
- ✅ 添加Meting API支持
- ✅ 集成QQ音乐搜索功能
- ✅ 添加音乐源选择器
- ✅ 支持双源搜索
- ✅ 添加开发调试工具
- ✅ QQ音乐歌曲添加[QQ]前缀
- ✅ 支持逐字歌词

## 贡献

如需添加其他音乐平台支持，请参考 `src/api/meting.ts` 中的实现模式。