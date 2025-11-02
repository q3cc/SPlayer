# SPlayer 自动构建和部署指南

## 🚀 概述

SPlayer 使用 GitHub Actions 实现自动化构建和部署，支持：

- ✅ Windows EXE 自动构建
- ✅ macOS DMG 自动构建
- ✅ Linux AppImage/DEB 自动构建
- ✅ Docker 镜像自动构建和推送
- ✅ GitHub 发行版自动发布

## 📋 前置要求

### GitHub Secrets 配置

在仓库设置中配置以下 Secrets：

1. **Docker Hub 配置**
   - `DOCKER_USERNAME`: Docker Hub 用户名
   - `DOCKER_PASSWORD`: Docker Hub 密码或访问令牌

2. **可选：代码签名证书**
   - `WINDOWS_CERT_PASSWORD`: Windows 代码签名证书密码
   - `MAC_CERT_PASSWORD`: macOS 代码签名证书密码

### 配置步骤

1. 进入 GitHub 仓库设置
2. 点击 "Secrets and variables" > "Actions"
3. 点击 "New repository secret"
4. 添加上述 Secrets

## 🏗️ 构建流程

### 触发条件

自动构建在以下情况触发：

1. **标签推送**: `git tag v1.0.0 && git push origin v1.0.0`
2. **手动触发**: 在 GitHub Actions 页面手动运行
3. **Pull Request**: 代码审查时进行测试构建

### 构建步骤

1. **代码检查**: 运行 linting 和类型检查
2. **多平台构建**: 并行构建 Windows、macOS、Linux 版本
3. **Docker 构建**: 构建并推送 Docker 镜像
4. **发布**: 创建 GitHub 发行版并上传构建产物

## 🐳 Docker 部署

### 镜像仓库

- **Docker Hub**: `splayer/splayer`
- **GitHub Container Registry**: `ghcr.io/your-username/splayer`

### 标签策略

- `latest`: 最新稳定版
- `v1.0.0`: 特定版本标签
- `v1.0`: 主版本标签
- `dev`: 开发分支构建

### 快速部署

```bash
# 基础部署
docker run -d \
  --name splayer \
  -p 3000:3000 \
  -v /path/to/music:/app/music \
  splayer/splayer:latest

# 使用 Docker Compose
curl -O https://raw.githubusercontent.com/your-username/SPlayer/main/docker-compose.yml
docker-compose up -d
```

## 📦 发行版管理

### 版本发布

1. 更新 `package.json` 中的版本号
2. 创建并推送标签：
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. GitHub Actions 自动构建并发布

### 发行版内容

每个发行版包含：

- **Windows**: `SPlayer-1.0.0-win.exe` (安装包) 和 `SPlayer-1.0.0-portable.exe` (便携版)
- **macOS**: `SPlayer-1.0.0-mac.dmg` (DMG 安装包)
- **Linux**: `SPlayer-1.0.0.AppImage` 和 `splayer_1.0.0_amd64.deb`
- **校验和**: SHA256 文件完整性校验
- **发布说明**: 自动生成的更新日志

## 🔧 本地构建

### 环境要求

- Node.js >= 20
- npm >= 10
- Python 3.x (某些 native 依赖需要)

### 构建命令

```bash
# 安装依赖
npm ci

# 类型检查
npm run typecheck

# 构建应用
npm run build

# 打包为可执行文件
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:linux  # Linux

# 构建所有平台
npm run dist
```

### 开发模式

```bash
# 启动开发服务器
npm run dev

# 预览构建结果
npm run start
```

## 🐛 故障排除

### 构建失败

1. **依赖问题**: 尝试删除 `node_modules` 和 `package-lock.json`，然后重新安装
2. **权限问题**: 确保有足够的磁盘空间和写入权限
3. **网络问题**: 检查网络连接和代理设置

### Docker 问题

1. **镜像拉取失败**: 检查网络连接和 Docker Hub 访问
2. **端口冲突**: 使用不同端口映射
3. **权限问题**: 确保挂载目录权限正确

### 发布问题

1. **权限不足**: 确保 GitHub Token 有发布权限
2. **标签冲突**: 删除已存在的标签或使用新版本号
3. **构建超时**: 检查构建脚本和依赖

## 📊 监控和分析

### 构建状态

- GitHub Actions 页面查看构建历史
- 构建日志详细记录每个步骤
- 失败通知和错误报告

### 下载统计

- GitHub 发行版下载统计
- Docker Hub 拉取统计
- 用户反馈和问题报告

## 🔄 CI/CD 最佳实践

### 版本管理

- 遵循语义化版本控制 (SemVer)
- 使用清晰的变更日志
- 定期创建里程碑版本

### 测试策略

- 构建前进行代码质量检查
- 多平台兼容性测试
- 用户验收测试

### 安全考虑

- 定期更新依赖包
- 使用代码扫描工具
- 保护敏感信息

## 📞 获取帮助

如果遇到问题：

1. 查看 [GitHub Issues](https://github.com/your-username/SPlayer/issues)
2. 检查 [Actions 日志](https://github.com/your-username/SPlayer/actions)
3. 参考 [Docker 文档](https://docs.docker.com/)
4. 联系维护团队

---

**注意**: 本文档会随着项目发展持续更新，请定期查看最新版本。