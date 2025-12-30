---
title: 基于NapCat和Cyberbot的QQ群机器人部署教程
published: 2025-05-31
description: 本文记录了使用napcat和cyberbot搭建QQ群聊机器人的过程。
tags:
  - "#QQbot"
  - napcat
  - cyberbot
category: 折腾日记
draft: false
---

>2025.12.30补充
>当前cyberbot已更新，不建议继续按照本篇所介绍的方法进行部署。同时，napcat也更新了token的生成机制，可移步至我的[另一篇文章](www)。 


在本文之前，我在云服务器上已经部署了一个同样基于napcat的机器人，但当测试新插件时，如果机器人崩溃，会导致影响正常使用，因此我决定在本地的debian上再部署一个专门用于测试的机器人。  

# 一、部署NapCat  

>**关于[NapCat](https://napneko.github.io/)**  
>
>NapCat是基于TypeScript构建的Bot框架,通过相应的启动器或者框架,主动调用QQ Node模块提供给客户端的接口,实现Bot的功能.  

为将NapCat部署在本地的Debian系统上，此处使用[NapCat-Installer](https://github.com/NapNeko/NapCat-Installer)提供的一键安装脚本进行安装。该脚本支持**Ubuntu 20+/Debian 10+/Centos9**。  

```bash
curl -o \
napcat.sh \
https://nclatest.znin.net/NapNeko/NapCat-Installer/main/script/install.sh \
&& sudo bash napcat.sh
```

随后按照脚本提示继续部署即可。  


>此处我在使用shell安装时报错：
>```
>E: Could not get lock /var/lib/dpkg/lock-frontend. It is held by process 441980 (packagekitd)
>E: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), is another process using it?
>```
>参考[@Bungehurst的文章](https://blog.csdn.net/lun55423/article/details/108907779)，解决方法如下：  
>方案一  
>```
>sudo killall apt apt-get
>```
>如果提示没有apt进程(如下)，则执行方案二  
>```
>apt: no process found
>apt-get: no process found
>```  
>方案二  
>依次执行下列命令  
>```bash
>sudo rm /var/lib/apt/lists/lock
>sudo rm /var/cache/apt/archives/lock
>sudo rm /var/lib/dpkg/lock*
>sudo dpkg --configure -a
>sudo apt update
>``` 
>完成。  


![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250531160057438.png)
当看到如上提示时，即代表NapCat已经安装完毕。  

使用`screen -dmS napcat bash -c "xvfb-run -a qq --no-sandbox"`启动NapCat后台服务。  

**此时即可通过`宿主机IP:6099`的地址访问NapCatWebUI，默认的token为`napcat`。**  

>你也可以通过修改**webui.json**文件更改WebUI的监听地址与端口  
>该文件默认位于`/opt/QQ/resources/app/app_launcher/napcat/config/webui.json`  
>```json
>{
>    "host": "0.0.0.0", // WebUI 监听地址
>    "port": 6099, // WebUI 端口
>    "token": "xxxx", // 登录密钥, 默认是自动生成的随机登录密码
>    "loginRate": 3, // 每分钟登录次数限制
>}
>```  

# 二、配置NapCat  

登录WebUI后扫码登录QQ，随后点击左侧的网络配置，新建一个**Websocket服务器**，并按照下图所示进行配置（可自行根据需要更改端口等）![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250531164154927.png)


记住此处的端口号以及token，随后CyberBot的配置中需要用到此处的端口及token。  
# 三、部署CyberBot

>关于[CyberBot](https://github.com/RicardaY/cyberbot)  
>
>CyberBot 是一个基于 node-napcat-ts 开发的高性能 QQ 机器人框架，提供了丰富的插件系统和易用的 API 接口。  
>

1.确保你的系统已安装 Node.js (推荐 v16 或更高版本)  

2.下载项目并安装依赖：  
```
npx cyberbot-core
```  
根据交互步骤进行即可  

>此处如果出现报错请检查nodejs版本，apt安装最高只有v18版本  
>如果版本过低，请参照[node.js下载界面](https://nodejs.cn/en/download)进行更新，推荐v22及以上版本  

3.检查配置文件`config.json`:  
```json
{
  "baseUrl": "ws://localhost:3001", // napcat WebSocket地址
  "accessToken": "123456", // napcat token
  "throwPromise": false, // 是否抛出异常
  "reconnection": { // 重连配置
    "enable": true, // 是否启用重连
    "attempts": 10, // 重连次数
    "delay": 5000, // 重连延迟
    "debug": false // 是否打印重连日志
  },
  "bot": 12345678, // 机器人QQ号
  "master": [ // 主人QQ号
    1000001
  ],
  "admins": [1000001], // 管理员QQ号列表
  "plugins": { // 插件列表
    "system": [ // 系统插件
      "cmds"
    ],
    "user": [ // 用户插件
      "demo"
    ]
  },
  "logger": { // 日志配置
    "level": "info", // 日志级别
    "maxSize": "10m", // 单个日志文件最大大小
    "maxDays": 7 // 单个日志文件保存天数
  }
}
```  

4.启动机器人
```
npm start
```  

如果一切正常，此时你会收到bot发来的上线消息  
>[Bot🤖] 已成功上线！  
>📅 5/31/2025, 4:47:28 PM  
>🧩 插件状态: 2/2 已启用  
>💻 系统信息: linux x64  
>🎉 机器人已准备就绪，随时为您服务！  

编写bot插件可参考[cyberbot-core - npm](https://www.npmjs.com/package/cyberbot-core?activeTab=readme)。