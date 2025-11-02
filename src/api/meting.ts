import axios from "axios";

// Meting API 基础配置
const METING_API_BASE = "https://metingapi.q3cc.top";

// Meting API 数据源类型
export enum MetingServer {
  NetEase = "netease",
  Tencent = "tencent",
}

// Meting API 请求类型
export enum MetingType {
  Name = "name",
  Artist = "artist",
  Url = "url",
  Pic = "pic",
  Lrc = "lrc",
  Song = "song",
  Playlist = "playlist",
  Search = "search",
}

// Meting API 音质选项
export enum MetingBr {
  Standard = "128",
  High = "192",
  Higher = "320",
  Lossless = "999",
}

// Meting API 逐字歌词选项
export enum MetingYrc {
  False = "false",
  True = "true",
  Open = "open",
}

// Meting API 请求参数接口
export interface MetingParams {
  server: MetingServer;
  type: MetingType;
  id: string | number;
  picsize?: number;
  keyword?: string;
  br?: MetingBr;
  yrc?: MetingYrc;
}

// Meting API 响应数据接口
export interface MetingSong {
  name: string;
  artist: string;
  album: string;
  url: string;
  pic: string;
  lrc: string;
  source: string;
  auth?: string;
}

// 基础请求函数
const metingRequest = async (params: MetingParams): Promise<MetingSong[] | null> => {
  try {
    const response = await axios.get(`${METING_API_BASE}/`, {
      params,
      timeout: 15000,
    });

    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error("Meting API 请求失败:", error);
    return null;
  }
};

// QQ音乐搜索
export const tencentSearch = async (
  keyword: string,
  _limit: number = 50,
  yrc: MetingYrc = MetingYrc.Open
): Promise<MetingSong[] | null> => {
  return metingRequest({
    server: MetingServer.Tencent,
    type: MetingType.Search,
    id: 0,
    keyword,
    yrc,
  });
};

// 网易云音乐搜索
export const neteaseSearch = async (
  keyword: string,
  _limit: number = 50,
  yrc: MetingYrc = MetingYrc.Open
): Promise<MetingSong[] | null> => {
  return metingRequest({
    server: MetingServer.NetEase,
    type: MetingType.Search,
    id: 0,
    keyword,
    yrc,
  });
};

// 获取QQ音乐歌曲URL
export const tencentSongUrl = async (
  id: string,
  br: MetingBr = MetingBr.Higher
): Promise<MetingSong[] | null> => {
  return metingRequest({
    server: MetingServer.Tencent,
    type: MetingType.Url,
    id,
    br,
  });
};

// 获取网易云音乐歌曲URL
export const neteaseSongUrl = async (
  id: string,
  br: MetingBr = MetingBr.Higher
): Promise<MetingSong[] | null> => {
  return metingRequest({
    server: MetingServer.NetEase,
    type: MetingType.Url,
    id,
    br,
  });
};

// 获取QQ音乐歌词
export const tencentLyric = async (id: string): Promise<MetingSong[] | null> => {
  return metingRequest({
    server: MetingServer.Tencent,
    type: MetingType.Lrc,
    id,
  });
};

// 获取网易云音乐歌词
export const neteaseLyric = async (id: string): Promise<MetingSong[] | null> => {
  return metingRequest({
    server: MetingServer.NetEase,
    type: MetingType.Lrc,
    id,
  });
};

// 获取QQ音乐封面
export const tencentCover = async (
  id: string,
  size: number = 300
): Promise<MetingSong[] | null> => {
  return metingRequest({
    server: MetingServer.Tencent,
    type: MetingType.Pic,
    id,
    picsize: size,
  });
};

// 获取网易云音乐封面
export const neteaseCover = async (
  id: string,
  size: number = 300
): Promise<MetingSong[] | null> => {
  return metingRequest({
    server: MetingServer.NetEase,
    type: MetingType.Pic,
    id,
    picsize: size,
  });
};

// 获取QQ音乐单曲详情
export const tencentSong = async (
  id: string,
  br: MetingBr = MetingBr.Higher,
  yrc: MetingYrc = MetingYrc.Open
): Promise<MetingSong[] | null> => {
  return metingRequest({
    server: MetingServer.Tencent,
    type: MetingType.Song,
    id,
    br,
    yrc,
  });
};

// 获取网易云音乐单曲详情
export const neteaseSong = async (
  id: string,
  br: MetingBr = MetingBr.Higher,
  yrc: MetingYrc = MetingYrc.Open
): Promise<MetingSong[] | null> => {
  return metingRequest({
    server: MetingServer.NetEase,
    type: MetingType.Song,
    id,
    br,
    yrc,
  });
};

// 获取QQ音乐歌单
export const tencentPlaylist = async (
  id: string,
  yrc: MetingYrc = MetingYrc.Open
): Promise<MetingSong[] | null> => {
  return metingRequest({
    server: MetingServer.Tencent,
    type: MetingType.Playlist,
    id,
    yrc,
  });
};

// 获取网易云音乐歌单
export const neteasePlaylist = async (
  id: string,
  yrc: MetingYrc = MetingYrc.Open
): Promise<MetingSong[] | null> => {
  return metingRequest({
    server: MetingServer.NetEase,
    type: MetingType.Playlist,
    id,
    yrc,
  });
};

// 通用搜索函数
export const searchMusic = async (
  keyword: string,
  server: MetingServer = MetingServer.NetEase,
  yrc: MetingYrc = MetingYrc.Open
): Promise<MetingSong[] | null> => {
  if (server === MetingServer.Tencent) {
    return tencentSearch(keyword, 50, yrc);
  } else {
    return neteaseSearch(keyword, 50, yrc);
  }
};

// 通用获取歌曲详情函数
export const getSongDetail = async (
  id: string,
  server: MetingServer,
  br: MetingBr = MetingBr.Higher,
  yrc: MetingYrc = MetingYrc.Open
): Promise<MetingSong[] | null> => {
  if (server === MetingServer.Tencent) {
    return tencentSong(id, br, yrc);
  } else {
    return neteaseSong(id, br, yrc);
  }
};

export default {
  // 搜索
  tencentSearch,
  neteaseSearch,
  searchMusic,

  // 歌曲URL
  tencentSongUrl,
  neteaseSongUrl,

  // 歌词
  tencentLyric,
  neteaseLyric,

  // 封面
  tencentCover,
  neteaseCover,

  // 单曲
  tencentSong,
  neteaseSong,
  getSongDetail,

  // 歌单
  tencentPlaylist,
  neteasePlaylist,

  // 枚举
  MetingServer,
  MetingType,
  MetingBr,
  MetingYrc,
};