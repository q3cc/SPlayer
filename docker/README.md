# SPlayer Docker 部署指南

## 🐳 快速开始

### 基本使用

```bash
# 使用Docker Hub镜像
docker run -d \
  --name splayer \
  -p 3000:3000 \
  -v /path/to/your/music:/app/music \
  splayer/splayer:latest

# 或使用GitHub镜像
docker run -d \
  --name splayer \
  -p 3000:3000 \
  -v /path/to/your/music:/app/music \
  ghcr.io/your-username/splayer:latest
```

### Docker Compose 部署

创建 `docker-compose.yml` 文件：

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
    networks:
      - splayer-network

  nginx:
    image: nginx:alpine
    container_name: splayer-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - splayer
    networks:
      - splayer-network

networks:
  splayer-network:
    driver: bridge

volumes:
  music:
    driver: local
  data:
    driver: local
```

启动服务：

```bash
docker-compose up -d
```

## 🔧 高级配置

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `NODE_ENV` | `production` | 运行环境 |
| `PORT` | `3000` | 应用端口 |
| `MUSIC_PATH` | `/app/music` | 音乐文件存储路径 |

### 数据持久化

```bash
# 挂载本地音乐目录
docker run -d \
  --name splayer \
  -p 3000:3000 \
  -v /home/user/music:/app/music \
  splayer/splayer:latest

# 挂载配置文件
docker run -d \
  --name splayer \
  -p 3000:3000 \
  -v /home/user/music:/app/music \
  -v /home/user/splayer/config:/app/config \
  splayer/splayer:latest
```

### 反向代理配置

Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL/TLS 配置

使用 Let's Encrypt 证书：

```yaml
version: '3.8'

services:
  splayer:
    image: splayer/splayer:latest
    # ... 其他配置

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    # ... 其他配置

  certbot:
    image: certbot/certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
```

## 📊 监控和日志

### 查看日志

```bash
# 查看容器日志
docker logs splayer

# 实时查看日志
docker logs -f splayer

# 查看最近的日志
docker logs --tail 100 splayer
```

### 健康检查

```bash
# 检查容器状态
docker ps

# 检查健康状态
docker inspect splayer | grep Health
```

### 性能监控

```bash
# 查看资源使用情况
docker stats splayer

# 查看容器详细信息
docker inspect splayer
```

## 🔄 更新和维护

### 更新镜像

```bash
# 拉取最新镜像
docker pull splayer/splayer:latest

# 重新创建容器
docker-compose down
docker-compose up -d
```

### 备份数据

```bash
# 备份音乐文件
docker run --rm -v /path/to/backup:/backup \
  -v /path/to/music:/music \
  alpine:latest \
  tar czf /backup/music-backup.tar.gz -C /music .

# 备份配置文件
docker run --rm -v /path/to/backup:/backup \
  -v splayer_data:/data \
  alpine:latest \
  tar czf /backup/config-backup.tar.gz -C /data .
```

## 🐛 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :3000
   # 或使用不同端口
   docker run -p 8080:3000 splayer/splayer:latest
   ```

2. **权限问题**
   ```bash
   # 确保音乐目录权限正确
   chown -R 1001:1001 /path/to/music
   ```

3. **内存不足**
   ```bash
   # 限制内存使用
   docker run --memory=512m splayer/splayer:latest
   ```

### 重置容器

```bash
# 停止并删除容器
docker stop splayer
docker rm splayer

# 清理未使用的镜像
docker image prune -f
```

## 📚 更多信息

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [SPlayer 项目主页](https://github.com/your-username/SPlayer)

## 🆘 获取帮助

如果遇到问题，请：

1. 查看 [GitHub Issues](https://github.com/your-username/SPlayer/issues)
2. 提交新的 Issue
3. 加入我们的 [讨论区](https://github.com/your-username/SPlayer/discussions)