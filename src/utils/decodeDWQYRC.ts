/**
 * Decode QRC or YRC to text
 * Made by Pizero & NanoRocky
 * @param {string} i - yrc or qrc input
 * @returns {[number, number, [[number, number], string, number, number][]][]}
 */
export function decodeDWQYRC(i: string): LineItem[] {
    const lines = i.trim().split("\n").filter(line => !/^\[ch:\d+\]/.test(line.trim()));
    const output: LineItem[] = [];
    console.log(`🔍 decodeDWQYRC 开始解析，共 ${lines.length} 行`);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const rawLine = lines[lineIndex].trim();
        if (/^\[[a-z]+:.+\]$/i.test(rawLine)) continue;
        if (/^\[[a-z]+:.*?\]$/i.test(rawLine)) continue;
        if (/^\[[a-z]\]$/i.test(rawLine)) continue;
        const match = rawLine.match(/^\[(\d+),(\d+)\](.*)$/);
        if (!match) continue;
        const start = parseInt(match[1]);
        const duration = parseInt(match[2]);
        const content = match[3].trim();

        // 添加调试信息
        if (lineIndex < 3) {
            console.log(`🔍 处理第${lineIndex + 1}行:`, {
                原始行: rawLine,
                开始时间: start,
                持续时间: duration,
                内容: content,
                包含逐字模式: /\(\d+,\d+(?:,\d+)?\)/.test(content)
            });
        }

        if (!/(\(\d+,\d+(?:,\d+)?\))/.test(content)) {
            console.log(`⚠️ 第${lineIndex + 1}行不包含逐字模式，跳过: ${content}`);
            continue;
        }
        const timeBeforeText = /^\(\d+,\d+(?:,\d+)?\)/.test(content);
        const parts = content.split(/(\(\d+,\d+(?:,\d+)?\))/).filter(Boolean);
        const stack: WordItem[] = [];
        let wordIndex = 1;

        // 添加分割调试信息
        if (lineIndex < 3) {
            console.log(`🔧 第${lineIndex + 1}行分割结果:`, {
                时间在前: timeBeforeText,
                分割部分数量: parts.length,
                分割结果: parts.map((p, i) => `${i}: "${p}"`)
            });
        }

        if (timeBeforeText) {
            for (let i = 0; i < parts.length - 1; i += 2) {
                const timePart = parts[i];
                const textPart = parts[i + 1];
                const timeMatch = timePart.match(/^\((\d+),(\d+)(?:,\d+)?\)$/);
                if (timeMatch && textPart) {
                    const word = textPart.replace(/\s+/g, match => match === ' ' ? ' ' : match);
                    stack.push([
                        [parseInt(timeMatch[1]), parseInt(timeMatch[2])],
                        word,
                        lineIndex,
                        wordIndex
                    ]);
                    wordIndex += 1;
                };
            };
        } else {
            for (let i = 0; i < parts.length - 1; i += 2) {
                const textPart = parts[i];
                const timePart = parts[i + 1];
                const timeMatch = timePart.match(/^\((\d+),(\d+)(?:,\d+)?\)$/);
                if (timeMatch && textPart) {
                    const word = textPart.replace(/\s+/g, match => match === ' ' ? ' ' : match);
                    stack.push([
                        [parseInt(timeMatch[1]), parseInt(timeMatch[2])],
                        word,
                        lineIndex,
                        wordIndex
                    ]);
                    wordIndex += 1;
                } else {
                    console.log(`⚠️ 第${lineIndex + 1}行时间在前解析失败:`, {
                        textPart: `"${textPart}"`,
                        timePart: `"${timePart}"`,
                        timeMatch: !!timeMatch,
                        partIndex: i
                    });
                };
            };
        };
        output.push([start, duration, stack]);
    };
    if (!output.some(o => o[2].length > 0)) {
        throw new Error("歌词文件非逐字歌词");
    };
    return output;
};

type WordItem = [
    position: [number, number],
    text: string,
    lineIndex: number,
    wordIndex: number
];

type LineItem = [
    start: number,
    duration: number,
    stack: WordItem[]
];

export type {
    WordItem,
    LineItem
};