# 密钥管理（.env.enc）

这个仓库是 **public**，所以真实 API key 不能明文提交。
`.env.enc` 是 `.env`（含 APIMART / MiniMax key）用 AES-256 加密后的密文，可以安全放在公开仓库里。

## 换机器 / 首次部署：解密出 .env

```bash
cd referral-material-agent
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in .env.enc -out .env -pass pass:'你的解密密码'
```

> 解密密码不在仓库里，存在你的密码管理器。`.env` 已被 `.gitignore` 忽略，解出来不会被误提交。

## 改了 key / .env 后：重新加密

```bash
openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -in .env -out .env.enc -pass pass:'你的解密密码'
git add .env.enc && git commit -m "update encrypted secrets" && git push
```

## 安全提醒

- **永远不要 `git add .env`**（明文），只提交 `.env.enc`。
- 解密密码丢了 = 密文打不开，只能重新去 APIMart / MiniMax 后台生成新 key。
- 仓库一直是 public，且 key 曾在聊天里出现过；如需最高安全，去两个后台**轮转一次 key**，再用上面的命令重新加密提交。
