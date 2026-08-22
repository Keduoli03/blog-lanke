# 1Panel / OpenResty 部署说明

`agentic.conf` 与 Vercel 中间件使用的旧链接映射由同一个脚本生成，包含以下能力：

- 旧文章标题路径返回 HTTP 308；
- 首页在 `Accept: text/markdown` 时内部重写到 `/llms.txt`；
- 文章与专栏在 `Accept: text/markdown` 时内部重写到对应 `.md`；
- Markdown 使用 `text/markdown; charset=utf-8`；
- HTML 与 Markdown 响应携带 `Vary: Accept, Accept-Encoding`。

## 接入 1Panel

1. 在 1Panel 中打开“网站 → blog.blueke.top → 配置”。
2. 找到该站点的 `server { ... }`，把 `agentic.conf` 的内容粘贴到 `server` 内部。不要替换原有的域名、证书、日志或 `root` 配置。
3. 删除或合并原来与 `/`、`/posts/`、`/columns/` 冲突的 `location`。生成配置中的三个 location 应放在通用 `location /` 之前。
4. 确认国内服务器同步了完整 `dist`，尤其是 `.md`、`llms.txt` 和 `og-default.png` 文件。
5. 在 1Panel 保存配置；保存前后使用界面的配置检查功能确认 OpenResty 语法通过，然后重载网站。

如果主配置支持 `include`，也可以把文件上传到服务器后，在站点的 `server {}` 中加入：

```nginx
include /你的绝对路径/agentic.conf;
```

## 验证

```bash
curl -I -H 'Accept: text/markdown' https://blog.blueke.top/
curl -I -H 'Accept: text/markdown' https://blog.blueke.top/posts/astro-llms-txt
curl -I 'https://blog.blueke.top/posts/%E4%B8%BA%20Astro%20%E5%8D%9A%E5%AE%A2%E6%B7%BB%E5%8A%A0%20llms.txt/'
```

前两条应包含 `Content-Type: text/markdown` 和 `Vary: Accept, Accept-Encoding`；最后一条应返回 `308` 和正式文章地址。

每次文章标题、slug 或专栏路径变化后，运行：

```bash
pnpm generate:vercel
```

并把更新后的 `agentic.conf` 同步到国内服务器。
