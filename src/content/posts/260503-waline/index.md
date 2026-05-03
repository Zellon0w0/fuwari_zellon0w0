---
title: 带后端评论系统Waline的体验与适配
published: 2026-05-03
description: 由 Giscus 转向 Waline
tags:
  - 博客
  - 评论系统
  - Waline
category: 折腾日记
draft: false
---
在最初搭建博客的过程中，我选择了 [Giscus](https://giscus.app/zh-CN) 作为博客的评论系统，它利用 [Github Discussions](https://docs.github.com/en/discussions) 实现评论的同步与读取，轻量、简洁。 

然而，伴随着使用程度的加深， Giscus 不可避免地暴露了许多弊端。  
	首先就是**必须登录 Github 账号才能评价**，不利于普通访客进行评论。  其次， Giscus 本身并没有后台，**无法对评论进行审核**，虽然可以在 Discussions 中进行删除，但不够优雅，pass。  最重要的是， Giscus 在加载时会受到访客网络的影响，因为评论是存储在 Github 中，**加载速度会受影响**。 

比较了其他评论系统后，我选择了 [Waline](https://waline.js.org/) 。它具有的功能完全可以满足我的需求，并且还可以在 [Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fwalinejs%2Fwaline%2Ftree%2Fmain%2Fexample) 中免费部署。 

如果你有其他需求，也可以使用另一款优秀的评论系统 [Twikoo](https://twikoo.js.org/) 。

# 一、Waline 的部署 

> *这里参考官方文档 [快速上手 | Waline](https://waline.js.org/guide/get-started/) 进行部署*  

## 部署服务端 

1. 点击 [部署](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fwalinejs%2Fwaline%2Ftree%2Fmain%2Fexample) 跳转到 Vercel 进行 Server 端部署。建议使用 Github 快捷登录。 

2. 输入一个你喜欢的项目名称并点击 `Create` 继续。

![image.png|697](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20260503151532900.png)

3. 此时 Vercel 会基于 Waline 模板帮助你新建并初始化仓库，仓库名为你上一步输入的项目名。 
![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20260503151846616.png)
4. 部署完成时会弹出`Congratulations!`字样的通知，此时点击 `Continue to Dashboard` 进入控制台。 
![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20260503152134934.png)

## 创建数据库 

1. 点击左侧的 `Storage` 进入存储服务配置页，选择 `Neno` 的 `Create` 按钮进入创建页面。
![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20260503152715375.png)
2. 在弹出的创建 Neno 账号界面，选择 `Accept and Create` 接受并创建。后续选择数据库的套餐配置，包含地区和额度。不进行其他操作直接选择 `Continue` 下一步即可。 
![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20260503152938222.png)
3. 此时会让你自定义数据库名称，也可以不进行修改，直接 `Create` 进行下一步。 
![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20260503153110692.png)
4. 此处直接点击 `Connect` 即可。
![](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20260503153235264.png) 
5. 此时 `Storage` 下就有你创建的数据库服务了，在弹出的窗口中选择 `Open in Neon` 跳转到 Neon。在 Neon 界面左侧选择 `SQL Editor` ，将 [waline.pgsql](https://github.com/walinejs/waline/blob/main/assets/waline.pgsql) 中的 SQL 语句粘贴进编辑器中(覆盖原有代码)，点击 `Run` 执行创建表操作。
![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20260503153518234.png)
![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20260503154031636.png)
6. 稍等片刻之后会告知你创建成功。此时回到 Vercel ，点击左侧的 `Deployments` ，选择最新的一次部署，选择右侧的 `Redeploy` 按钮进行重新部署。该步骤是为了让刚才配置的数据库服务生效。 
![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20260503154355646.png)
7. 此时会跳转到 `Overview` 界面开始部署，等待片刻后 `STATUS` 会变成 `Ready` 。可能需要刷新一次才会显示。此时点击 `Visit` ，即可跳转到部署好的网站地址，此地址即为你的服务端地址。![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20260503154701815.png)
8. 在访问的 URL地址后加上 `/ui/register` 即可进行用户注册，首个注册的用户为管理员。 

## 绑定域名 

1. 点击左侧的 `Domains` 进入域名配置页。 
2. 输入需要绑定的域名并点击 `Add` 。 
3. 在域名服务商处添加其提示的解析记录。 
4. 等待解析生效后即可使用域名访问后台。 

# 二、评论区适配 

为保证博客外观的一致性，我这里没有采用 Waline 原生的评论区样式，仅使用了 Waline 提供的 api 接口来获取评论区内容。 
