#!/usr/bin/env node

/**
 * 版本检查脚本
 * 检查版本号格式和依赖更新
 */

import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

// 颜色输出
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
};

function log(message, color = 'white') {
  console.log(colors[color](message));
}

function validateVersion(version) {
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

  if (!semverRegex.test(version)) {
    log(`❌ 版本号格式无效: ${version}`, 'red');
    return false;
  }

  const [major, minor, patch] = version.split('.').map(Number);

  if (major < 0 || minor < 0 || patch < 0) {
    log(`❌ 版本号不能包含负数: ${version}`, 'red');
    return false;
  }

  log(`✅ 版本号格式有效: ${version}`, 'green');
  return true;
}

function checkNodeEngines() {
  const engines = packageJson.engines;

  if (!engines || !engines.node || !engines.npm) {
    log('⚠️ package.json 中缺少 node 或 npm 版本要求', 'yellow');
    return false;
  }

  const nodeVersion = engines.node;
  const npmVersion = engines.npm;

  log(`📋 Node.js 版本要求: ${nodeVersion}`, 'cyan');
  log(`📋 npm 版本要求: ${npmVersion}`, 'cyan');

  // 简单版本检查
  const nodeMajor = parseInt(nodeVersion.replace(/[^\d]/g, ''));
  const npmMajor = parseInt(npmVersion.replace(/[^\d]/g, ''));

  if (nodeMajor < 18) {
    log('⚠️ 建议使用 Node.js 18 或更高版本', 'yellow');
  }

  if (npmMajor < 9) {
    log('⚠️ 建议使用 npm 9 或更高版本', 'yellow');
  }

  return true;
}

function checkBuildScripts() {
  const scripts = packageJson.scripts;
  const requiredScripts = [
    'build',
    'build:win',
    'build:mac',
    'build:linux',
    'dist:win',
    'dist:mac',
    'dist:linux'
  ];

  let missingScripts = [];

  requiredScripts.forEach(script => {
    if (!scripts[script]) {
      missingScripts.push(script);
    }
  });

  if (missingScripts.length > 0) {
    log('⚠️ 缺少构建脚本:', 'yellow');
    missingScripts.forEach(script => {
      log(`   - ${script}`, 'yellow');
    });
    return false;
  }

  log('✅ 所有必需的构建脚本都存在', 'green');
  return true;
}

function checkElectronBuilder() {
  const devDependencies = packageJson.devDependencies || {};
  const electronBuilderVersion = devDependencies['electron-builder'];

  if (!electronBuilderVersion) {
    log('⚠️ 缺少 electron-builder 依赖', 'yellow');
    return false;
  }

  log(`✅ electron-builder 版本: ${electronBuilderVersion}`, 'green');
  return true;
}

function checkBuildResources() {
  const fs = require('fs');

  const requiredFiles = [
    'electron-builder.config.ts',
    'electron-builder.config.js',
    'Dockerfile',
    '.github/workflows/build-and-release.yml'
  ];

  let missingFiles = [];

  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      missingFiles.push(file);
    }
  });

  if (missingFiles.length > 0) {
    log('⚠️ 缺少构建配置文件:', 'yellow');
    missingFiles.forEach(file => {
      log(`   - ${file}`, 'yellow');
    });
    return false;
  }

  log('✅ 所有构建配置文件都存在', 'green');
  return true;
}

function main() {
  log('🔍 SPlayer 版本检查脚本', 'cyan');
  log('=====================================', 'cyan');

  const version = packageJson.version;
  let allChecksPassed = true;

  // 检查版本号
  log('\n📦 检查版本号:', 'cyan');
  if (!validateVersion(version)) {
    allChecksPassed = false;
  }

  // 检查引擎要求
  log('\n🔧 检查引擎要求:', 'cyan');
  if (!checkNodeEngines()) {
    allChecksPassed = false;
  }

  // 检查构建脚本
  log('\n🏗️ 检查构建脚本:', 'cyan');
  if (!checkBuildScripts()) {
    allChecksPassed = false;
  }

  // 检查 Electron Builder
  log('\n⚡ 检查 Electron Builder:', 'cyan');
  if (!checkElectronBuilder()) {
    allChecksPassed = false;
  }

  // 检查构建资源
  log('\n📁 检查构建资源:', 'cyan');
  if (!checkBuildResources()) {
    allChecksPassed = false;
  }

  // 输出总结
  log('\n📊 检查结果:', 'cyan');
  if (allChecksPassed) {
    log('✅ 所有检查都通过，可以开始发布！', 'green');
    process.exit(0);
  } else {
    log('❌ 部分检查失败，请修复问题后再发布', 'red');
    process.exit(1);
  }
}

main();