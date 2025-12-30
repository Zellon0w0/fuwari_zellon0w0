---
title: Mioki Bot食用方法
published: 2025-12-30
description: 依赖Napcat的MiokiQQ机器人部署
image: ./cover.jpg
tags:
  - napcat
  - QQbot
  - Mioki
category: 折腾日记
draft: true
---
# 使用的项目 

* [mioki | KiviBot 的精神继承者](https://mioki.viki.moe/) 

* [NapCatQQ | 现代化的基于 NTQQ 的 Bot 协议端实现](https://napneko.github.io/)

# 注意事项 

推荐在 Linux 环境下使用 Napcat，Windows 环境下易出现账号冻结情况。 

# 一、Napcat部署 

Napcat 项目中已准备好一键使用脚本 

```bash
curl -o \ napcat.sh \ https://nclatest.znin.net/NapNeko/NapCat-Installer/main/script/install.sh \ && bash napcat.sh
``` 
命令选项(高级用法)

0. `--tui` 使用`tui`可视化交互安装
    
1. `--docker` [y/n]: 使用 Docker 进行安装 (y) 或使用 Shell 直接安装 (n)
    
    - Docker 安装: 将 NapCat 运行在隔离的容器环境中，方便管理和迁移，但需要先安装 Docker
    - Shell 安装: 直接在当前系统环境中安装 NapCat 及其依赖
    - `--qq`, `--mode`, `--confirm`: Docker 安装时使用的参数
2. `--cli` [y/n]: 是否安装 NapCat TUI-CLI (命令行UI工具)
    
    - `NapCat TUI-CLI` : 允许你在 ssh、没有桌面、WebUI 难以使用的情况下可视化交互配置 Napcat
3. `--proxy` [0-6]: 指定下载时使用的代理服务器序号, Docker 安装可选 0-7, shell 安装可选 0-5
    
4. `--force` 传入则执行 shell 强制重装

>此处提供的脚本为 Linux 一键使用脚本(支持Ubuntu 20+/Debian 10+/Centos9) 
>如果你需要在其他平台安装，请参考[Napcat官方文档](https://napneko.github.io/guide/boot/Shell) 