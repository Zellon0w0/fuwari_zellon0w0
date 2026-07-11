---
title: CWD评论系统使用问题汇总
published: 2026-07-11
description: CWD使用过程中的问题
image: ./cover.jpg
tags:
  - 博客
  - 评论系统
  - CWD
category: 折腾日记
draft: true
---
>如果你看了我前面的文章，可能注意到我在几个月前刚从 [Giscus](https://giscus.app/zh-CN) 转到 [Waline](https://waline.js.org/) 。然而这几个月中我使用 Waline 的体验可以说是不尽人意。这段时间因为更换了邮箱授权码，我尝试在 Vercel 后台修改环境变量，然而修改后重新部署却会报错，好在 Vercel 可以撤回构建。然而我在导出评论后，尝试从头部署时却仍旧会报错。再回想起适配 Waline 过程中的糟糕体验，我果断决定放弃 Waline，加入[@时歌](https://lapis.cafe) 推荐的 [CWD评论系统](https://cwd.js.org) 。 

部署过程这里省略，可以参照[官方后端配置方法](https://cwd.js.org/guide/backend-config.html)。 

# 部署配置过程中的问题 

### Q1、自定义管理员账号密码 

在`pnpm run deploy`前，于`cwd-api/wrangler.jsonc`文件的末尾找到如下字段，并替换成自己的邮箱及密码即可 

```json
    "vars": {
        "ADMIN_NAME": "admin@example.com",
        "ADMIN_PASSWORD": "CwdAdminSecure_2026"
    }
```

### Q2、后台管理页面打开会自动填充账号密码 

如果你没有修改管理员账号和密码，当首次打开管理后台时可能会看到账号密码已经自动填充，如下图 

![image.png](https://zellonr2.zellon.top/blog/20260711222346854.png)

此时不必惊慌，只需先参考Q1，修改账号密码后再次`pnpm run deploy`即可 

此处自动填充的账号密码是默认占位符，即使你修改为自定义的账号密码，自动填充的账号密码依旧是默认的`admin@example.com` 

### Q3、管理员评论密钥 

![image.png](https://zellonr2.zellon.top/blog/20260711222623258.png)

如果设置了管理员评论密钥，则后续无法手动关闭，即使你将密钥清空后选择右下角保存也不会正常关闭。因此本项功能建议谨慎开启，建议打开上方的新评论是否审核后再显示。 


本篇文章仅记录我个人使用 CWD 的过程中遇到的部分问题，大部分资料来自于 [CWD评论系统文档](https://cwd.js.org/guide/getting-started.html) ，如有错误，欢迎指正。 

