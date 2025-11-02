/**
 * QQ音乐歌词解析测试
 * 用于验证逐字歌词修复效果
 */

import { getQQMusicLyricsAsNeteaseFormat } from './qqmusic-lyrics';

// 模拟QQ音乐逐字歌词数据（来自实际API响应）
const mockQQMusicLyric = `[ti:麦恩莉]
[ar:方大同]
[al:]
[by:]
[offset:0]
[0,270]麦(0,18)恩(18,18)莉(36,18) (54,18)-(72,18) (90,18)方(108,18)大(126,18)同(144,18) (162,18)((180,18)Khalil(198,18) (216,18)Fong(234,18))(252,18)
[270,270]曲(270,54)：(324,54)方(378,54)大(432,54)同(486,54)
[540,280]词(540,70)：(610,70)C(680,70)君(750,70)
[820,270]编(820,45)曲(865,45)：(910,45)方(955,45)大(1000,45)同(1045,45)
[1090,280]监(1090,21)：(1111,21)Edward(1132,21) (1153,21)Chan(1174,21)/(1195,21)Charles(1216,21) (1237,21)Lee(1258,21)/(1279,21)方(1300,21)大(1321,21)同(1342,21)
[1371,2130]曾(1371,70)经(1441,0)受(1441,60)过(1501,190)一(1691,240)些(1931,320)伤(2251,370)害(2621,880)
[3501,1930]曾(3501,240)经(3741,130)有(3871,190)些(4061,190)看(4251,180)不(4431,190)开(4621,810)
[5431,1870]却(5431,190)也(5621,190)胆(5811,180)怯(5991,190)迎(6181,180)接(6361,190)将(6551,320)来(6871,430)
[7301,2060]怕(7301,190)爱(7491,250)再(7741,250)卷(7991,440)来(8431,930)
[9361,2180]所(9361,250)以(9611,190)我(9801,190)已(9991,180)停(10171,190)止(10361,190)爱(10551,990)
[11541,2060]倒(11541,260)也(11801,180)过(11981,130)得(12111,180)挺(12291,190)自(12481,190)在(12671,930)`;

/**
 * 测试QQ音乐歌词解析和转换
 */
export const testQQMusicLyricParsing = async () => {
  console.log('🧪 开始测试QQ音乐歌词解析...');

  try {
    // 模拟从QQ音乐API获取歌词的过程
    const mockUrl = 'https://metingapi.q3cc.top/?server=tencent&type=lrc&id=001lmD2a2YZYN3&dwrc=true';

    // 手动创建测试用的fetch函数（模拟网络请求）
    const originalFetch = global.fetch;
    global.fetch = (() => ({
  then: () => Promise.resolve({
    ok: true,
    text: () => Promise.resolve(mockQQMusicLyric),
  })
})) as any;

    // 测试歌词转换
    const result = await getQQMusicLyricsAsNeteaseFormat(mockUrl);

    // 恢复原始fetch
    global.fetch = originalFetch;

    // 验证结果
    if (result.success) {
      console.log('✅ QQ音乐歌词解析测试成功!');
      console.log(`📊 解析统计:`);
      console.log(`   - LRC歌词行数: ${result.lrcData.length}`);
      console.log(`   - YRC歌词行数: ${result.yrcData.length}`);
      console.log(`   - 包含逐字歌词: ${result.hasWordLyric}`);

      // 显示前几行歌词作为示例
      if (result.lrcData.length > 0) {
        console.log(`🎵 LRC歌词示例:`);
        for (let i = 0; i < Math.min(3, result.lrcData.length); i++) {
          const line = result.lrcData[i];
          console.log(`   [${line.time.toFixed(2)}s] ${line.content}`);
        }
      }

      if (result.yrcData.length > 0) {
        console.log(`🎭 YRC歌词示例:`);
        for (let i = 0; i < Math.min(2, result.yrcData.length); i++) {
          const line = result.yrcData[i];
          console.log(`   [${line.time.toFixed(2)}s - ${line.endTime.toFixed(2)}s] ${line.content}`);
          if (line.contents && line.contents.length > 0) {
            console.log(`     逐字详情: ${line.contents.map(c => `[${c.time.toFixed(2)}s-${c.endTime.toFixed(2)}s]${c.content}`).join(' ')}`);
          }
        }
      }

      return result;
    } else {
      console.error('❌ QQ音乐歌词解析测试失败:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ QQ音乐歌词解析测试异常:', error);
    return null;
  }
};

/**
 * 测试直接解析原始歌词文本
 */
export const testDirectLyricParsing = () => {
  console.log('🧪 开始测试直接歌词解析...');

  try {
    // 导入解析函数
    const { smartParseQQMusicLyric, convertToNeteaseLyricFormat } = require('./qqmusic-lyrics');

    // 使用智能解析
    const parseResult = smartParseQQMusicLyric(mockQQMusicLyric);

    console.log('📊 智能解析结果:');
    console.log(`   - 歌词类型: ${parseResult.type}`);
    console.log(`   - 增强歌词行数: ${parseResult.lyrics.length}`);
    console.log(`   - 原始歌词行数: ${parseResult.originalLines.length}`);

    // 转换为网易云格式
    const neteaseFormat = convertToNeteaseLyricFormat(parseResult);

    console.log('📊 网易云格式转换结果:');
    console.log(`   - LRC行数: ${neteaseFormat.lrcData.length}`);
    console.log(`   - YRC行数: ${neteaseFormat.yrcData.length}`);
    console.log(`   - 包含逐字: ${neteaseFormat.hasWordLyric}`);

    if (neteaseFormat.hasWordLyric && neteaseFormat.yrcData.length > 0) {
      console.log('🎭 逐字歌词验证:');
      const firstLine = neteaseFormat.yrcData[0];
      console.log(`   第一行: [${firstLine.time.toFixed(2)}s - ${firstLine.endTime.toFixed(2)}s] ${firstLine.content}`);
      console.log(`   逐字内容: ${firstLine.contents.map(c => `[${c.time.toFixed(2)}s]${c.content}`).join(' ')}`);

      // 验证时间是否连续
      let isTimeValid = true;
      for (let i = 0; i < firstLine.contents.length - 1; i++) {
        const current = firstLine.contents[i];
        const next = firstLine.contents[i + 1];
        if (current.endTime !== next.time) {
          isTimeValid = false;
          console.log(`   ⚠️ 时间不连续: ${current.content} 结束时间 ${current.endTime.toFixed(2)}s != ${next.content} 开始时间 ${next.time.toFixed(2)}s`);
        }
      }

      if (isTimeValid) {
        console.log('   ✅ 逐字时间连续性验证通过');
      }
    }

    return neteaseFormat;
  } catch (error) {
    console.error('❌ 直接歌词解析测试异常:', error);
    return null;
  }
};

// 如果直接运行此文件，执行测试
if (require.main === module) {
  (async () => {
    console.log('🚀 开始QQ音乐歌词解析测试套件\n');

    // 测试1: 直接解析
    console.log('=== 测试1: 直接歌词解析 ===');
    testDirectLyricParsing();

    console.log('\n=== 测试2: 网络请求模拟解析 ===');
    // 测试2: 模拟网络请求
    await testQQMusicLyricParsing();

    console.log('\n🎉 QQ音乐歌词解析测试完成!');
  })();
}