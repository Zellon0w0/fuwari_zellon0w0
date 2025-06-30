---
title: OpenClash程序IP抓取绕过
published: 2025-06-30
description: 使用ipcrawltool抓取游戏ip实现openclash绕过规则配置
tags:
  - OpenClash
  - ipcrawltool
category: 折腾日记
draft: false
---
本文主要记录使用ipcrawltool工具进行抓取程序ip以进行配置OpenClash实现绕过的方法。 

# 一、需要的工具 

ipcrawltool[https://wwry.lanzouq.com/iYfLB2zy6c8d  密码:1uqd]、需要绕过的程序[此处以'雀魂麻将'作为演示] 

# 二、抓取IP

ipcrawltool[后文简称工具]会在目录下创建配置文件，抓取到的ip也会保存在目录下，因此建议单独创建一个文件夹用于放置工具。 
* 右键工具选择'**以管理员身份运行**'![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250630171307416.png) 
* 勾选'**抓取udp**'，选择模式'**netch**' ，游戏进程名在任务管理器中右键进程选择属性即可查看![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250630171944327.png)
![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250630172015928.png)

* 将获取到的进程名填入工具，下方的游戏名可填可不填![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250630172158429.png)
* 随后点击’**开始**‘，工具右侧窗口会出现
```
正在检测['Jantama_MahjongSoul.exe']远程ip,可随时关闭窗口停止终止程序。
现在你可以打开全局，并启动游戏，发现的ip将会自动记录到当前目录的rules文件中
```
* 打开游戏游玩几分钟，关闭游戏，此时工具右侧窗口应该已经有了抓取到的ip![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250630172821809.png)
 
* 直接关闭工具即可 
# 三、在OpenClash内进行配置 
* 打开目录下工具生成的txt文件，一般以设置的游戏名或进程名开头![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250630173108956.png)
* 复制此处的ip地址即可 
* 在OpenClash的'**规则附加**'设置中找到‘**自定义规则集附加**’，点击‘**添加**’![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250630173450381.png)
![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250630173848794.png)
* 按上图设置好后，在下方粘贴获取到的ip地址，并改成相应的格式即可
![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250630174051890.png)
格式如下: 
```
payload:
	-154.85.69.0/24
	-210.61.181.0/24
	-8.131.131.0/24
	-...(这些改成你自己获取的ip)
``` 
* 随后保存配置，再点击底部'**应用配置**'即可，此时再打开程序时，对应的流量会直接转发，不经过clash内核处理。