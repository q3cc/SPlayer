#!/usr/bin/env node

/**
 * SPlayer 版本发布脚本
 * 自动化版本更新、标签创建和发布流程
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

// 颜色输出函数
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
};

function log(message, color = 'white') {
  console.log(colors[color](message));
}

function execCommand(command, description) {
  try {
    log(`🔄 ${description}...`, 'cyan');
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`✅ ${description}完成`, 'green');
    return result.trim();
  } catch (error) {
    log(`❌ ${description}失败:`, 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

function getNewVersion(currentVersion, type = 'patch') {
  const [major, minor, patch] = currentVersion.split('.').map(Number);

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      return currentVersion;
  }
}

function updatePackageVersion(newVersion) {
  const packagePath = './package.json';
  packageJson.version = newVersion;
  writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  log(`📝 版本号更新为: ${newVersion}`, 'yellow');
}

function checkWorkingDirectoryClean() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      log('⚠️ 工作目录不干净，请先提交所有更改', 'yellow');
      log('当前未提交的文件:', 'yellow');
      console.log(status);
      process.exit(1);
    }
  } catch (error) {
    log('❌ 检查 Git 状态失败', 'red');
    process.exit(1);
  }
}

function getCurrentBranch() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' });
    return branch.trim();
  } catch (error) {
    log('❌ 获取当前分支失败', 'red');
    process.exit(1);
  }
}

function createReleaseNotes(version) {
  const date = new Date().toLocaleDateString('zh-CN');
  const template = `# SPlayer ${version}

## 🎵 新版本发布 (${date})

### 🆕 新功能

### 🔧 改进

### 🐛 修复

### 🐳 Docker 部署

\`\`\`bash
# 使用最新版本
docker run -d \\
  --name splayer \\
  -p 3000:3000 \\
  -v /path/to/music:/app/music \\
  splayer/splayer:${version}
\`\`\`

### 📦 下载

- [Windows EXE](https://github.com/your-username/SPlayer/releases/download/v${version}/SPlayer-${version}-win.exe)
- [macOS DMG](https://github.com/your-username/SPlayer/releases/download/v${version}/SPlayer-${version}-mac.dmg)
- [Linux AppImage](https://github.com/your-username/SPlayer/releases/download/v${version}/SPlayer-${version}.AppImage)

---

## 🔐 SHA256 校验和

文件将在发布完成后自动生成。
`;

  const notesFile = `./RELEASE_NOTES_v${version}.md`;
  writeFileSync(notesFile, template);
  log(`📝 发布说明已创建: ${notesFile}`, 'green');
  return notesFile;
}

async function main() {
  // 解析命令行参数
  const args = process.argv.slice(2);
  const versionType = args[0] || 'patch'; // major, minor, patch
  const customVersion = args[1]; // 自定义版本号

  log('🚀 SPlayer 版本发布脚本', 'blue');
  log('=====================================', 'blue');

  // 检查环境
  checkWorkingDirectoryClean();
  const currentBranch = getCurrentBranch();

  if (currentBranch !== 'main' && currentBranch !== 'dev') {
    log(`⚠️ 当前分支: ${currentBranch}，建议在 main 或 dev 分支发布`, 'yellow');
  }

  const currentVersion = packageJson.version;
  log(`📍 当前版本: ${currentVersion}`, 'cyan');

  // 确定新版本号
  let newVersion;
  if (customVersion) {
    newVersion = customVersion;
  } else {
    newVersion = getNewVersion(currentVersion, versionType);
  }

  log(`🎯 目标版本: ${newVersion}`, 'yellow');

  // 确认发布
  if (process.env.CI !== 'true') {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question(`确定要发布版本 ${newVersion} 吗? (y/N): `, resolve);
    });

    rl.close();

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      log('❌ 发布已取消', 'red');
      process.exit(0);
    }
  }

  try {
    // 1. 更新版本号
    updatePackageVersion(newVersion);

    // 2. 运行测试
    log('🧪 运行测试...', 'cyan');
    execCommand('npm run typecheck', '类型检查');
    execCommand('npm run lint', '代码检查');

    // 3. 构建项目
    execCommand('npm run build', '项目构建');

    // 4. 提交版本更改
    execCommand(`git add package.json`, '添加版本文件');
    execCommand(`git commit -m "chore: bump version to ${newVersion}"`, '提交版本更改');

    // 5. 创建标签
    const tagMessage = `Release ${newVersion}`;
    execCommand(`git tag -a v${newVersion} -m "${tagMessage}"`, '创建版本标签');

    // 6. 创建发布说明
    const notesFile = createReleaseNotes(newVersion);

    // 7. 推送到远程仓库
    log('📤 推送更改和标签到远程仓库...', 'cyan');
    execCommand(`git push origin ${currentBranch}`, '推送代码');
    execCommand(`git push origin v${newVersion}`, '推送标签');

    // 8. 清理临时文件
    execCommand(`rm ${notesFile}`, '清理临时文件');

    log('🎉 版本发布完成！', 'green');
    log(`📦 版本: ${newVersion}`, 'green');
    log(`🔗 GitHub Actions 将自动构建并发布`, 'cyan');
    log(`📊 查看构建状态: https://github.com/your-username/SPlayer/actions`, 'cyan');

  } catch (error) {
    log('❌ 发布过程中出现错误:', 'red');

    // 回滚更改
    try {
      log('🔄 回滚版本更改...', 'yellow');
      execCommand('git checkout -- package.json', '回滚 package.json');
      log('✅ 已回滚到原始状态', 'green');
    } catch (rollbackError) {
      log('⚠️ 回滚失败，请手动检查', 'yellow');
    }

    process.exit(1);
  }
}

// 运行主函数
main().catch(error => {
  log('❌ 脚本执行失败:', 'red');
  log(error.message, 'red');
  process.exit(1);
});