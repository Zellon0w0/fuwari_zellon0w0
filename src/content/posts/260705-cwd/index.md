---
title: CWD评论系统使用问题汇总
published: 2025-05-30
description: 由Waline转向CWD(这次总不会再转了吧)
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


本篇文章仅记录我个人使用 CWD 的过程中遇到的部分问题，大部分资料来自于 [CWD评论系统文档](https://cwd.js.org/guide/getting-started.html) ，如有错误，欢迎指正。 

