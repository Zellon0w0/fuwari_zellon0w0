---
title: PVE虚拟机的安装与使用
published: 2025-05-25
description: 在x86主机上安装PVE虚拟化平台以实现All in One
image: https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250525220143561.png
tags:
  - PVE虚拟机
  - Windows
  - Ubuntu
  - FnOS
  - AllinBoom
category: 折腾日记
draft: false
---
>为了给自己找点事情做，我决定在我作为nas使用的主机上折腾一番。原有的windows系统无法满足我对linux的需求，使用win自带的wsl想要从局域网内其他设备访问过于繁琐，而vmware提供的虚拟机服务又过于臃肿，且有各种难以言说的BUG。本文记录了我安装[PVE](www.proxmox.com)虚拟化平台并安装各系统的全过程。  

# 备份！备份！备份！
在进行**任何有风险的操作**前，请务必首先***备份重要数据***  
'*数据不备份，亲人两行泪*'  

# 一、准备工作
需要使用的软件/镜像：[ProxmoxVE.iso](https://www.proxmox.com)、[Windows10 22H2.iso](https://next.itellyou.cn/Original/#cbp=Product?ID=f905b2d9-11e7-4ee3-8b52-407a8befe8d1)、[Ubuntu22.04](https://ubuntu.com)、[FnOS](https://www.fnnas.com)  、[需要用到的软件(百度网盘)](https://pan.baidu.com/s/1yYTGwMY6rPXVLq-T8HsO9w?pwd=55f7)、一个≥8G的U盘

# 二、安装流程
### 安装PVE系统
首先准备好需要使用的PVE镜像，使用**balenaEtcher**将镜像烧录到U盘中  

![选择镜像与U盘](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250525202452529.png)  
>烧录完成后你会看到成功的提示，如果失败可以尝试更换一个U盘或更换镜像  

将U盘插入待刷入的电脑(后文简称电脑)中，进入电脑Bios界面，将启动选择更改为U盘启动，保存并重启。 

重启后会进入PVE安装界面，选择 **Install Proxmox VE (Graphical)**。  
![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250525205605535.png)
>此处可能由于笔者电脑未安装显卡驱动，选择第一个选项后卡在了'loading driver'，此处参照[DreamLife.大佬的文章](https://blog.csdn.net/z609932088/article/details/143777861)进行设置后即可正常安装。  
>
>>操作步骤：* 在引导菜单中，使用箭头键选择 **Install Proxmox VE (Terminal UI)** 选项
>>* 按下键盘上的E键进入编辑模式
>>*使用箭头键导航到以 **linux** 开头的那一行，并将光标移动至该行末尾
>>* 在末尾处插入一个空格，随后输入 **nomodest**
>>* 按下 **ctrl+x** 保存，启动安装程序  
>Terminal UI模式下的安装流程与Graphical模式基本一致  

当完成上述流程后，电脑会在完成准备工作后自动重启，当显示出如下界面即可正常开始安装。  
![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250525210634928.png)
* 选择右下角 **I agree** 以继续安装。
* 选择安装硬盘，此处选择的***硬盘数据会被清空***，随后PVE系统将会安装在此硬盘上。
* **Country**选择**China**，**Time zone**会自动配置为**Asia/Shanghai**，**Keyboard Layout**选择**U.S.English**
* **Password**和**Confirm**自行设置，**Email**使用自己的邮箱即可
* **Management Interface**即PVE的管理网卡，如果有多个网卡建议选择与后文使用的另一台电脑在同一局域网下的网卡。**Hostname**可随意设置，**IP Address**使用与另一台电脑同一网段的地址，**Gateway**使用路由器局域网地址，**DNS Server**使用默认设置即可
* 下一步确认后即可选择**Install**进行安装，安装完成后重启电脑，拔出U盘  

当重启后看到**xxxx Login:** 字样即安装成功，记下上面的https://192.168.xx.xx:xxxx/地址，到另一台处于同一局域网下的电脑上打开。  
![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250525212244354.png)

在上图提示框中将**Language**更改为中文简体，**User name**为**root**，**Password**为你刚才设置的密码，随后点击**Login**登入  
![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250525212534399.png)
此处弹出的窗口稍后会消除，现在先点击确定关闭。  

![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250525212729655.png)

此时即可看到PVE后台，但可以发现后台显示的数据比较简略，我们需要对后台进行优化。打开提供的**MobaXterm**软件，使用ssh连接上PVE后台。  

![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250525213215888.png)

将提供的文件中的**pve_source.tar.gz**拖到**MobaXterm**窗口左侧以上传到后台。
![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250525213440182.png)

在终端中输入`tar zxvf pve_source.tar.gz`对压缩包进行解压，解压完成后输入`./pve_source`执行修改文件。在随后弹出的协议界面输入 **y** 并回车即可进入脚本界面。  
![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250525213921537.png)

随后轮流执行 **1.一键设置DNS、换源并更新系统**、**6.去除无效订阅源提示**、**7.修改PVE概要信息**、**11.配置CPU工作模式(改为节能模式)**。  

>在 **7.修改PVE概要信息** 中，建议按**O**键选择推荐方案一
>![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250525214501971.png)


修改完成后，在终端中输入`reboot`重启，等待重启完成后即可看到完整信息展示的后台。  
![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250525215118615.png)

至此，PVE虚拟平台安装完毕，可以开始安装虚拟机。

### 安装Windows10 22H2
