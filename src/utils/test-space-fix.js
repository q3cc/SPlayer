/**
 * 测试空格处理修复
 */

// 模拟 parseQQMusicRawWordLyric 函数的逻辑
function testSpaceProcessing() {
    console.log('🧪 测试空格处理修复');
    console.log('=====================================');

    // 测试用例1: Never (43304,103)gonna
    const testLyric1 = '[43304,1294]Never (43304,103)gonna';
    console.log('\n📝 测试用例1:', testLyric1);

    const match1 = testLyric1.match(/^\[(\d+),(\d+)\](.*)$/);
    if (match1) {
        const startTime = parseInt(match1[1]);
        const duration = parseInt(match1[2]);
        const content = match1[3];

        console.log('解析结果:');
        console.log('- 开始时间:', startTime);
        console.log('- 持续时间:', duration);
        console.log('- 内容:', `"${content}"`);

        // 检查是否是时间在前格式
        const isTimeBeforeText = /^\(\d+,\d+\)/.test(content);
        console.log('- 时间在前格式:', isTimeBeforeText);

        if (!isTimeBeforeText) {
            // 处理开头文本
            const leadingTextMatch = content.match(/^([^\(]+)/);
            if (leadingTextMatch) {
                const leadingText = leadingTextMatch[1];
                console.log('- 开头文本:', `"${leadingText}"`);
                console.log('- 包含空格:', leadingText.includes(' '));
                console.log('- 长度:', leadingText.length);
            }

            // 处理 (time,duration)text 部分
            const timeBeforeTextMatches = content.match(/\((\d+),(\d+)\)([^()]*)/g);
            if (timeBeforeTextMatches) {
                timeBeforeTextMatches.forEach((match, index) => {
                    const parts = match.match(/\((\d+),(\d+)\)(.+)/);
                    if (parts) {
                        const wordTime = parseInt(parts[1]);
                        const wordDuration = parseInt(parts[2]);
                        const wordText = parts[3];

                        console.log(`- 单词${index + 1}: 时间=${wordTime}, 持续=${wordDuration}, 内容="${wordText}"`);
                    }
                });
            }
        }
    }

    // 测试用例2: I love you (12345,200)forever
    const testLyric2 = '[12345,2000]I love you (12345,200)forever';
    console.log('\n📝 测试用例2:', testLyric2);

    const match2 = testLyric2.match(/^\[(\d+),(\d+)\](.*)$/);
    if (match2) {
        const startTime = parseInt(match2[1]);
        const duration = parseInt(match2[2]);
        const content = match2[3];

        console.log('解析结果:');
        console.log('- 开始时间:', startTime);
        console.log('- 持续时间:', duration);
        console.log('- 内容:', `"${content}"`);

        const leadingTextMatch = content.match(/^([^\(]+)/);
        if (leadingTextMatch) {
            const leadingText = leadingTextMatch[1];
            console.log('- 开头文本:', `"${leadingText}"`);
            console.log('- 包含空格:', leadingText.includes(' '));
            console.log('- 长度:', leadingText.length);
        }
    }

    // 测试用例3: 时间在前格式 (0,100)Hello (100,100)world
    const testLyric3 = '[0,200](0,100)Hello (100,100)world';
    console.log('\n📝 测试用例3:', testLyric3);

    const match3 = testLyric3.match(/^\[(\d+),(\d+)\](.*)$/);
    if (match3) {
        const startTime = parseInt(match3[1]);
        const duration = parseInt(match3[2]);
        const content = match3[3];

        console.log('解析结果:');
        console.log('- 开始时间:', startTime);
        console.log('- 持续时间:', duration);
        console.log('- 内容:', `"${content}"`);

        const isTimeBeforeText = /^\(\d+,\d+\)/.test(content);
        console.log('- 时间在前格式:', isTimeBeforeText);

        if (isTimeBeforeText) {
            const wordMatches = content.match(/\((\d+),(\d+)\)([^()]*)/g);
            if (wordMatches) {
                wordMatches.forEach((match, index) => {
                    const parts = match.match(/\((\d+),(\d+)\)(.+)/);
                    if (parts) {
                        const wordTime = parseInt(parts[1]);
                        const wordDuration = parseInt(parts[2]);
                        const wordText = parts[3];

                        console.log(`- 单词${index + 1}: 时间=${wordTime}, 持续=${wordDuration}, 内容="${wordText}"`);
                    }
                });
            }
        }
    }

    console.log('\n✅ 空格处理测试完成！');
    console.log('\n💡 修复要点:');
    console.log('1. 完全保持原样，不再用 replace(/\s+/g, " ") 规范化空格');
    console.log('2. 保留原始文本中的所有空格和标点符号');
    console.log('3. endsWithSpace 使用正则表达式检测各种空格字符');
}

// 运行测试
testSpaceProcessing();