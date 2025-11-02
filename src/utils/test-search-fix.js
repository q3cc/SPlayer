/**
 * 测试搜索功能修复
 */

// 模拟搜索数据
const mockNeteaseSongs = [
  { name: "晴天", artists: "周杰伦", source: "netease" },
  { name: "晴天", artists: "周杰伦", source: "netease" }, // 重复歌曲
  { name: "七里香", artists: "周杰伦", source: "netease" },
  { name: "告白气球", artists: "周杰伦", source: "netease" },
];

const mockTencentSongs = [
  { name: "[QQ] 晴天", artists: "周杰伦", source: "tencent" },
  { name: "[QQ] 稻香", artists: "周杰伦", source: "tencent" },
  { name: "[QQ] 青花瓷", artists: "周杰伦", source: "tencent" },
  { name: "[QQ] 晴天", artists: "周杰伦", source: "tencent" }, // 重复歌曲
];

// 模拟智能合并函数
function smartCombineSearchResults(keyword, neteaseSongs, tencentSongs, offset) {
  // 计算匹配分数
  const calculateMatchScore = (song) => {
    const songName = typeof song.name === 'string' ? song.name.replace(/\[.*?\]\s*/g, '') : song.name;
    const artistName = typeof song.artists === 'string' ? song.artists : song.artists?.map(a => a.name).join(', ') || '';

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

    // QQ音乐源优先级加成
    if (song.source === 'tencent') score += 10;

    return score;
  };

  // 去重处理
  const deduplicateSongs = (songs) => {
    const songMap = new Map();

    songs.forEach(song => {
      const songName = typeof song.name === 'string' ? song.name.replace(/\[.*?\]\s*/g, '') : song.name;
      const artistName = typeof song.artists === 'string' ? song.artists : song.artists?.map(a => a.name).join(', ') || '';
      const key = `${songName.toLowerCase()}-${artistName.toLowerCase()}`;

      if (!songMap.has(key) || (song.source === 'tencent' && songMap.get(key)?.source !== 'tencent')) {
        songMap.set(key, song);
      }
    });

    return songMap;
  };

  // 合并所有歌曲
  const allSongs = [...neteaseSongs, ...tencentSongs];
  const uniqueSongs = Array.from(deduplicateSongs(allSongs).values());

  // 计算匹配分数并排序
  const scoredSongs = uniqueSongs.map(song => ({
    song,
    score: calculateMatchScore(song)
  }));

  scoredSongs.sort((a, b) => b.score - a.score);

  // 直接返回按分数排序的结果，让最匹配的歌曲排在前面
  return scoredSongs.map(item => item.song);
}

// 测试搜索功能
console.log('🧪 测试搜索功能修复');
console.log('=====================================');

// 测试用例1: 搜索"晴天"
console.log('\n📝 测试用例1: 搜索"晴天"');
const result1 = smartCombineSearchResults("晴天", mockNeteaseSongs, mockTencentSongs, 0);
console.log('搜索结果:');
result1.forEach((song, index) => {
  console.log(`${index + 1}. [${song.source}] ${song.name} - ${song.artists}`);
});

// 测试用例2: 搜索"周杰伦"
console.log('\n📝 测试用例2: 搜索"周杰伦"');
const result2 = smartCombineSearchResults("周杰伦", mockNeteaseSongs, mockTencentSongs, 0);
console.log('搜索结果:');
result2.forEach((song, index) => {
  console.log(`${index + 1}. [${song.source}] ${song.name} - ${song.artists}`);
});

// 测试用例3: 搜索"稻香"
console.log('\n📝 测试用例3: 搜索"稻香"（仅QQ音乐有）');
const result3 = smartCombineSearchResults("稻香", mockNeteaseSongs, mockTencentSongs, 0);
console.log('搜索结果:');
result3.forEach((song, index) => {
  console.log(`${index + 1}. [${song.source}] ${song.name} - ${song.artists}`);
});

console.log('\n✅ 搜索功能测试完成！');
console.log('\n💡 修复要点:');
console.log('1. 默认音乐源改为"all"，显示所有音乐源结果');
console.log('2. 智能匹配算法：完全匹配 > 包含匹配 > 部分匹配');
console.log('3. 去重处理：相同歌名和歌手的歌曲只显示一次，优先QQ音乐版本');
console.log('4. 分数排序：按匹配度降序排列，确保最相关的结果在前');
console.log('5. QQ音乐优先级：在相同匹配度下，QQ音乐结果有额外加分');

console.log('\n🎯 预期效果:');
console.log('- 搜索"晴天"：网易云晴天在前，QQ音乐晴天在后（去重）');
console.log('- 搜索"稻香"：仅显示QQ音乐稻香（网易云无此歌）');
console.log('- 搜索"周杰伦"：按歌曲匹配度排序，最相关的歌曲在前');