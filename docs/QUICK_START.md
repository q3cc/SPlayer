# SPlayer 快速开始指南

## 🚀 快速部署 SPlayer

### 方式一：使用 Docker（推荐）

#### 1. 安装 Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# CentOS/RHEL
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install docker-ce docker-ce-cli containerd.io

# macOS (使用 Homebrew)
brew install --cask docker

# Windows
# 下载并安装 Docker Desktop for Windows
```

#### 2. 启动 SPlayer

```bash
# 基础启动
docker run -d \
  --name splayer \
  -p 3000:3000 \
  -v /path/to/your/music:/app/music \
  splayer/splayer:latest

# 访问应用
# 浏览器打开: http://localhost:3000
```

#### 3. 使用 Docker Compose（推荐）

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  splayer:
    image: splayer/splayer:latest
    container_name: splayer
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./music:/app/music
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=3000
```

启动服务：

```bash
docker-compose up -d
```

### 方式二：下载可执行文件

#### Windows

1. 访问 [GitHub Releases](https://github.com/your-username/SPlayer/releases)
2. 下载 `SPlayer-x.x.x-win.exe`
3. 双击安装文件，按提示完成安装
4. 从开始菜单启动 SPlayer

#### macOS

1. 访问 [GitHub Releases](https://github.com/your-username/SPlayer/releases)
2. 下载 `SPlayer-x.x.x-mac.dmg`
3. 双击 DMG 文件，将应用拖到 Applications 文件夹
4. 从 Launchpad 启动 SPlayer

#### Linux

1. 访问 [GitHub Releases](https://github.com/your-username/SPlayer/releases)
2. 下载 `SPlayer-x.x.x.AppImage`
3. 添加执行权限：
   ```bash
   chmod +x SPlayer-x.x.x.AppImage
   ./SPlayer-x.x.x.AppImage
   ```

### 方式三：从源码构建

#### 1. 克隆仓库

```bash
git clone https://github.com/your-username/SPlayer.git
cd SPlayer
```

#### 2. 安装依赖

```bash
# 安装 Node.js (建议 v18+)
# 安装 npm (建议 v9+)

npm install
```

#### 3. 构建应用

```bash
# 开发模式
npm run dev

# 生产构建
npm run build

# 打包为可执行文件
npm run dist
```

## 🎵 使用 SPlayer

### 首次配置

1. **音乐源设置**
   - 支持网易云音乐和QQ音乐
   - 可同时搜索两个平台

2. **音乐文件夹**
   - 设置本地音乐文件路径
   - 支持多种音频格式

3. **主题设置**
   - 选择喜欢的颜色主题
   - 支持深色/浅色模式

### 基本操作

#### 搜索音乐

- 使用顶部搜索框
   - 输入歌名、歌手或专辑
   - 选择音乐源（网易云/QQ音乐/全部）
   - 点击搜索按钮

#### 播放音乐

- **播放控制**
  - 播放/暂停
  - 上一首/下一首
  - 音量调节
  - 进度条拖动

- **播放列表**
  - 添加到收藏
  - 创建自定义列表
  - 随机播放
  - 循环播放

#### 歌词功能

- **逐字歌词**
  - 支持网易云和QQ音乐的逐字歌词
  - 自动高亮当前播放位置
  - 支持翻译显示

- **歌词设置**
  - 字体大小调节
  - 显示位置调整
  - 背景透明度

### 高级功能

#### 音乐源切换

- **网易云**: 曲库丰富，推荐精准
- **QQ音乐**: 逐字歌词效果好
- **全部**: 智能合并两个平台结果

#### 下载功能

- 支持下载高质量音频
- 自动下载歌词
- 批量下载支持

#### 桌面歌词

- 独立歌词窗口
- 可调节透明度
- 置顶显示
- 跟随播放进度

## 🔧 故障排除

### 常见问题

#### Docker 相关

**问题**: 容器启动失败
```bash
# 检查端口占用
netstat -tulpn | grep :3000

# 检查日志
docker logs splayer

# 重新启动
docker restart splayer
```

**问题**: 音乐文件无法加载
```bash
# 检查挂载路径权限
ls -la /path/to/your/music

# 修复权限
chmod -R 755 /path/to/your/music
```

#### 桌面应用

**问题**: 无法播放音频
- 检查网络连接
- 确认音频文件格式支持
- 重启应用

**问题**: 歌词不显示
- 确认音乐源支持歌词
- 检查网络连接
- 刷新歌曲信息

### 性能优化

#### Docker 优化

```bash
# 限制内存使用
docker run --memory=512m splayer/splayer

# 限制CPU使用
docker run --cpus=1.0 splayer/splayer

# 使用本地存储
docker volume create splayer-data
docker run -v splayer-data:/app/data splayer/splayer
```

#### 桌面应用优化

- 关闭不必要的视觉效果
- 减少同时播放的任务
- 定期清理缓存

## 📞 获取帮助

- 📚 [完整文档](https://github.com/your-username/SPlayer/wiki)
- 🐛 [问题反馈](https://github.com/your-username/SPlayer/issues)
- 💬 [讨论区](https://github.com/your-username/SPlayer/discussions)
- 📧 [联系维护者](mailto:support@splayer.com)

## 🎉 开始使用

现在您已经了解了 SPlayer 的基本用法，快去享受音乐吧！

🎵 **SPlayer - 让音乐更美好**