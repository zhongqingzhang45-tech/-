# 星野 AI 伴侣 - 部署指南

## 快速开始

### 1. 上传代码到 Git 仓库

```bash
# 方式一：使用脚本上传
chmod +x push-to-git.sh
./push-to-git.sh -r git@github.com:your-username/lifeos.git

# 方式二：手动操作
git init -b main
git add -A
git commit -m "initial commit"
git remote add origin git@github.com:your-username/lifeos.git
git push -u origin main
```

### 2. 服务器部署

```bash
# SSH 登录服务器
ssh user@your-server-ip

# 下载部署脚本并执行
curl -sSL https://raw.githubusercontent.com/your-username/lifeos/main/deploy.sh | bash -s -- -r git@github.com:your-username/lifeos.git
```

### 3. 更新部署

```bash
# 本地推送更新
./push-to-git.sh -r git@github.com:your-username/lifeos.git -m "feat: new feature"

# 服务器拉取更新
ssh user@your-server-ip
cd /opt/lifeos
./deploy.sh
```

---

## 服务器要求

| 组件 | 最低要求 | 推荐配置 |
|------|----------|----------|
| 系统 | Ubuntu 20.04+ | Ubuntu 22.04 |
| Node.js | 18.x | 20.x |
| 内存 | 1 GB | 2 GB |
| 磁盘 | 2 GB | 5 GB |
| 端口 | 80, 443 | 80, 443 |

---

## 目录结构

```
/opt/lifeos/
├── repo/                    # Git 仓库源码
│   ├── .git/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   └── package.json
├── build/                   # 运行目录（独立部署）
│   ├── server.js
│   ├── node_modules/
│   ├── .next/
│   │   └── static/
│   └── public/
├── logs/                    # 日志目录
│   ├── error.log
│   └── out.log
├── backups/                 # 历史备份（保留最近5个）
│   ├── backup_20240101_120000/
│   └── ...
├── ecosystem.config.js      # PM2 配置
└── .env                     # 环境变量（可选）
```

---

## 环境变量配置

在服务器 `/opt/lifeos/.env` 或仓库根目录创建 `.env` 文件：

```bash
cp .env.example .env
nano .env
```

---

## 管理命令

### PM2 进程管理
```bash
pm2 status              # 查看状态
pm2 logs lifeos         # 查看日志
pm2 logs lifeos --lines 100  # 查看最近100行
pm2 restart lifeos      # 重启
pm2 stop lifeos         # 停止
pm2 start lifeos        # 启动
pm2 monit               # 监控面板
```

### Nginx 管理
```bash
sudo nginx -t           # 测试配置
sudo systemctl reload nginx    # 重载配置
sudo systemctl restart nginx   # 重启 Nginx
```

### 系统服务
```bash
# 设置 PM2 开机自启
pm2 startup
pm2 save

# 查看端口占用
netstat -tlnp | grep 3000
```

---

## 部署脚本参数

### push-to-git.sh（本地上传）

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-r, --repo <url>` | Git 仓库地址（必填） | - |
| `-b, --branch <name>` | 分支名 | main |
| `-m, --message <msg>` | 提交信息 | 自动生成 |
| `-h, --help` | 帮助 | - |

### deploy.sh（服务器部署）

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-r, --repo <url>` | Git 仓库地址（首次必填） | - |
| `-b, --branch <name>` | 分支名 | main |
| `-d, --dir <path>` | 应用目录 | /opt/lifeos |
| `-f, --full` | 完整部署（重装依赖） | false |
| `-h, --help` | 帮助 | - |

---

## 常见问题

### 1. 端口被占用
```bash
# 查找占用进程
lsof -i :3000
# 或
netstat -tlnp | grep 3000

# 杀掉进程
kill -9 <PID>
```

### 2. Node.js 版本不对
```bash
# 使用 nvm 管理 Node 版本
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### 3. 权限问题
```bash
# 确保目录权限正确
sudo chown -R $USER:$USER /opt/lifeos
```

### 4. 构建失败
```bash
# 查看构建日志
cd /opt/lifeos/repo
npm run build 2>&1 | head -50

# 清理缓存重新构建
rm -rf .next node_modules
npm install
npm run build
```

### 5. Live2D 模型不显示
确保 `public/live2d-models/` 目录存在且包含模型文件。

---

## SSL 证书配置（可选）

使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期（已内置）
sudo certbot renew --dry-run
```

---

## 部署流程图示

```
本地开发
    ↓
git commit
    ↓
git push (push-to-git.sh)
    ↓
Git 仓库 (GitHub/GitLab/Gitee)
    ↓
服务器拉取 (deploy.sh)
    ↓
npm install → npm run build
    ↓
复制到 build/ 目录
    ↓
PM2 reload (零停机)
    ↓
✅ 部署完成
```