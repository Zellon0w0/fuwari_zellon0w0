---
title: Mioki Bot食用方法
published: 2025-12-30
description: 依赖Napcat的MiokiQQ机器人部署
tags:
  - napcat
  - QQbot
  - Mioki
category: 折腾日记
draft: false
---
# 使用的项目 

* [mioki | KiviBot 的精神继承者](https://mioki.viki.moe/) 

* [NapCatQQ | 现代化的基于 NTQQ 的 Bot 协议端实现](https://napneko.github.io/)

# 注意事项 

推荐在 Linux 环境下使用 Napcat，Windows 环境下易出现账号冻结情况。 

# 一、Napcat部署 

Napcat 项目中已准备好适合各机型的一键使用脚本 

此处以 Linux 一键脚本为例进行演示 

在终端中输入以下命令，回车，按照项目提示选择安装选项即可 

```bash
curl -o \
napcat.sh \
https://nclatest.znin.net/NapNeko/NapCat-Installer/main/script/install.sh \
&& bash napcat.sh
``` 

<details> 
	<summary>命令选项(高级用法)</summary> 
	
1. `--tui` 使用`tui`可视化交互安装 
	
2. `--docker` [y/n]: 使用 Docker 进行安装 (y) 或使用 Shell 直接安装 (n) 
    * Docker 安装: 将 NapCat 运行在隔离的容器环境中，方便管理和迁移，但需要先安装 Docker 
    * Shell 安装: 直接在当前系统环境中安装 NapCat 及其依赖 
    * `--qq`, `--mode`, `--confirm`: Docker 安装时使用的参数 
    
3. `--cli` [y/n]: 是否安装 NapCat TUI-CLI (命令行UI工具) 
    * `NapCat TUI-CLI` : 允许你在 ssh、没有桌面、WebUI 难以使用的情况下可视化交互配置 Napcat 
	
4. `--proxy` [0-6]: 指定下载时使用的代理服务器序号, Docker 安装可选 0-7, shell 安装可选 0-5 
	
5. `--force` 传入则执行 shell 强制重装 
	
</details>

>此处提供的脚本为 Linux 一键使用脚本(支持Ubuntu 20+/Debian 10+/Centos9) 
>如果你需要在其他平台安装，请参考[Napcat官方文档](https://napneko.github.io/guide/boot/Shell)  

当出现如下界面时即安装完成 
![image.png](https://zellonr2.zellon.top/blog/20251231092359260.png)
此时即可正常启动 Napcat (推荐使用后台运行) 

在终端中运行如下命令启动 Napcat 

```bash
screen -dmS napcat bash -c "xvfb-run -a /root/Napcat/opt/QQ/qq --no-sandbox "
``` 

<details> 
	<summary>其他命令</summary> 
	
```
安装位置:  
	/root/Napcat 
  
启动 Napcat (无需 sudo):  
	 xvfb-run -a /root/Napcat/opt/QQ/qq --no-sandbox  
  
 后台运行 Napcat (使用 screen, 无需 sudo):  
	启动: screen -dmS napcat bash -c "xvfb-run -a /root/Napcat/opt/QQ/qq --no-sandbox " 
	带账号启动: screen -dmS napcat bash -c "xvfb-run -a /root/Napcat/opt/QQ/qq --no-sandbox  -q QQ号码" 
	附加到会话: screen -r napcat (按 Ctrl+A 然后按 D 分离) 
	停止会话: screen -S napcat -X quit 
  
 Napcat 相关信息:  
	 插件位置: /root/Napcat/opt/QQ/resources/app/app_launcher/napcat 
	 WebUI Token: 查看 /root/Napcat/opt/QQ/resources/app/app_launcher/napcat/config/webui.json 文件获取
```
	
</details> 

>如果你是在服务器中使用 Napcat，还需要在防火墙中放行 `3001(网络配置端口，可自定义)`，`6099(Webui，必须)`以在本地访问 Napcat 

# 二、Napcat配置 

访问`127.0.0.1:6099`或`服务器公网ip:6099`来打开 Napcat Webui，查看终端后台即可获取到登录 token  

![image.png](https://zellonr2.zellon.top/blog/20251231094203631.png)
>后台启动输入`screen -r napcat`即可打开 Napcat 后台，复制 token 后可直接`ctrl+A+D`关闭 screen 

⚠️⚠️⚠️⚠️⚠️⚠️⚠️注意⚠️⚠️⚠️⚠️⚠️⚠️⚠️ 

Webui 首次登录后一定要将 token 更改为强密码，不要使用诸如`password`,`123456789`,`88888888`之类的弱密码，已有 Napcat 用户在公网上公开端口且未设置强密码，导致 QQ 被爆破封号 

登录后可在`其他配置-登录配置`中启用快速登录，实现开机自启动后自动登录 QQ 

![image.png](https://zellonr2.zellon.top/blog/20251231095202720.png)

随后在`网络配置`中创建`Websocket服务器`，勾选`启用`，`名称`可自定义，`Host`建议改为`0.0.0.0`，`Token`自行更改，保存即可  
![image.png](https://zellonr2.zellon.top/blog/20251231095437380.png)
当你看到`网络配置`中出现了`mioki(自定义的名称)`的配置，即配置成功 
![image.png](https://zellonr2.zellon.top/blog/20251231095710519.png)

# 三、Mioki部署 

Mioki 是基于**Node.js**的机器人框架，因此请先确保你的设备上安装的 Node.js 版本 >= 22.18.0 

>可参考以下命令快速安装Nodejs 
>```bash
># 下载并安装 nvm：
>curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
>
># 代替重启 shell
>\. "$HOME/.nvm/nvm.sh"
>
># 下载并安装 Node.js：
>nvm install 24
>
># 验证 Node.js 版本：
>node -v # Should print "v24.12.0".
>
># 下载并安装 pnpm：
>corepack enable pnpm
>
># 验证 pnpm 版本：
>pnpm -v
>``` 

输入如下命令来开始安装 Mioki 

```bash
pnpx mioki@latest
``` 

CLI 会依次引导你完成项目名称、权限设置，创建完成后先按提示进入项目文件夹 

此时的项目文件夹下会生成一个配置文件`package.json`，打开后编辑`Napcat`字段，将其更改为正确的配置 

```json
    "napcat": {
      "protocol": "ws",
      "port": 3001,
      "host": "127.0.0.1",
      "token": "114514"
```

**配置项说明** 

| **配置项**           | **类型**   | **默认值**     | **说明**                             |
| ----------------- | -------- | ----------- | ---------------------------------- |
| prefix            | string   | "#"         | 指令前缀，用于识别框架指令                      |
| owners            | number[] | []          | 机器人主人 QQ 号列表，拥有最高权限                |
| admins            | number[] | []          | 机器人管理员 QQ 号列表                      |
| plugins           | string[] | []          | 启用的插件列表（插件目录名）                     |
| log_level         | string   | "info"      | 日志级别：trace、debug、info、warn、error   |
| plugins_dir       | string   | "./plugins" | 插件目录路径                             |
| error_push        | boolean  | false       | 是否将未捕获的错误推送给主人                     |
| online_push       | boolean  | false       | 机器人上线时是否通知主人                       |
| status_permission | string   | "all"       | 状态命令权限：admin-only 仅管理可用，默认所有人      |
| napcat.token      | string   | ""          | NapCat WebSocket 访问密钥              |
| napcat.protocol   | string   | "ws"        | WebSocket 协议：ws 或 wss，默认 ws        |
| napcat.host       | string   | "localhost" | NapCat WebSocket 服务地址，默认 localhost |
| napcat.port       | number   | 3001        | NapCat WebSocket 服务端口，默认 3001      |


之后在文件夹目录下使用下列命令即可启动bot 

```bash
pnpm install && pnpm start
```

当你看到如下提示即代表机器人正确启动 
```
========================================
欢迎使用 mioki 💓 v1.0.0
一个基于 NapCat 的插件式 QQ 机器人框架
轻量 * 跨平台 * 插件式 * 热重载 * 注重开发体验
========================================
>>> 正在连接 NapCat 实例: ws://localhost:3001?access_token=***
已连接到 NapCat 实例: NapCat-v4.2.0 机器人昵称(123456789)
>>> 加载 mioki 内置插件: mioki-core
成功加载了 1 个插件，总耗时 10.00 毫秒
mioki v1.0.0 启动完成，祝您使用愉快 🎉️
``` 

插件开发及使用请参考[Mioki官方文档](https://mioki.viki.moe/plugin.html)，本篇不再赘述