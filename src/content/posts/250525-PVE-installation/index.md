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
category: 折腾日记
draft: false
---
>为了给自己找点事情做，我决定在我作为nas使用的主机上折腾一番。原有的windows系统无法满足我对linux的需求，使用win自带的wsl想要从局域网内其他设备访问过于繁琐，而vmware提供的虚拟机服务又过于臃肿，且有各种难以言说的BUG。本文记录了我安装[PVE](www.proxmox.com)虚拟化平台并安装各系统的全过程。  

# 备份！备份！备份！
在进行**任何有风险的操作**前，请务必首先***备份重要数据***  
***数据不备份，亲人两行泪***  

# 一、准备工作
需要使用的软件/镜像：[ProxmoxVE.iso](https://www.proxmox.com)、[Windows10 22H2.iso](https://next.itellyou.cn/Original/#cbp=Product?ID=f905b2d9-11e7-4ee3-8b52-407a8befe8d1)、[Ubuntu22.04](https://ubuntu.com)、[FnOS](https://www.fnnas.com)  、[需要用到的软件(百度网盘)](https://pan.baidu.com/s/1yYTGwMY6rPXVLq-T8HsO9w?pwd=55f7)、一个≥8G的U盘

# 二、安装流程
## 1.安装PVE系统  

首先准备好需要使用的PVE镜像，使用**balenaEtcher**将镜像烧录到U盘中  

![选择镜像与U盘](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250525202452529.png)  
>烧录完成后你会看到成功的提示，如果失败可以尝试更换一个U盘或更换镜像  

将U盘插入待刷入的电脑(后文简称电脑)中，进入电脑Bios界面，将启动选择更改为U盘启动，保存并重启。 

重启后会进入PVE安装界面，选择 **Install Proxmox VE (Graphical)**。  
![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250525205605535.png)
>此处可能由于笔者电脑未安装显卡驱动，选择第一个选项后卡在了'loading driver'，此处参照[DreamLife.大佬的文章](https://blog.csdn.net/z609932088/article/details/143777861)进行设置后即可正常安装。  
>
>>操作步骤：  
>>* 在引导菜单中，使用箭头键选择 **Install Proxmox VE (Terminal UI)** 选项
>>* 按下键盘上的E键进入编辑模式
>>* 使用箭头键导航到以 **linux** 开头的那一行，并将光标移动至该行末尾
>>* 在末尾处插入一个空格，随后输入 **nomodest**
>>* 按下 **ctrl+x** 保存，启动安装程序   
>  
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

## 2.安装FnOS  

由于笔者有两块机械硬盘，想要在不同虚拟机里共用这两块机械硬盘，最好的办法是使用nas系统将硬盘共享，因此首先安装FnOS来对硬盘进行共享操作。  


此处参照[飞牛OS官方教程文档](https://help.fnnas.com/articles/fnosV1/start/install-virtual.md)。  

## 3.安装Ubuntu

* 在PVE后台选择**ISO镜像**，上传Ubuntu镜像  
* 点击**创建虚拟机**，在**操作系统**中选择上传的镜像![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250527193318769.png)
* 设置好其余设置后点击完成创建  
* 选中新创建的Ubuntu虚拟机的**控制台**，点击**START NOW**启动虚拟机  
* 自行完成Ubuntu系统安装环节  

# 三、安装后处理

#### 删除上传的ISO镜像

删除上传的ISO镜像以节省空间，删除后还需要去对应虚拟机内将其**硬件**选项卡中的**CD/DVD驱动器**改为空，以防止后续虚拟机启动时无法找到对应镜像报错。![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250527193935636.png)

#### 配置虚拟机开机自启动(可选)

在虚拟机**选项**选项卡中，将**开机自启动**配置为是。![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250527194428302.png)



至此，虚拟机平台以及虚拟机的安装已经完成，感谢你耐心看完整篇文章。如果你需要其他系统，如Windows、黑群晖、黑苹果之类，请自行前往互联网搜索教程。  

# 四、PVE使用过程遇到的问题汇总 

## 1.添加磁盘 

### · 在PVE上添加非系统盘（如外加机械硬盘） 

![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250529101440122.png)
此处的 **/dev/sda** 与 **/dev/sdb** 即笔者在主机上安装的两张机械硬盘。由于PVE不会自动挂载除系统盘外的磁盘，此处我们需要对外加的硬盘进行手动挂载。***后文的操作涉及磁盘操作，请提前对磁盘内数据进行备份！！***  

#### 操作步骤 

通过ssh连接到PVE后台，进行磁盘的分区操作。 
```bash
fdsik /dev/sda   **# 此处的/dev/sda是你要进行操作的分区**
```  

此处键入 **d** 删除原有分区，如果原有分区较多，则需要多次删除以删除所有分区  
```bash
Command (m for help): d
Selected partition 1
Partition 1 has been deleted.

 Command (m for help): d
No partition is defined yet!
```

此处键入 **n** 创建分区，按照提示键入 **p** 创建主分区，按照提示选择主分区的数量，默认1个分区即可  
```bash
Command (m for help): n
Partition type
	p   primary (0 primary, 0 extended, 4 free)
	e   extended (container for logical partitions)
Select (default p): p
Partition number (1-4, default 1): 1  **# 创建分区的数量**
```

此处是选择分区的起始位置和终止位置，如无特殊要求直接按两次回车选择默认即可  
```
First sector (2048-1465149167, default 2048):
Last sector, +/-sectors or +/-size{K,M,G,T,P} (2048-1465149167, default 1465149167):

Created a new partition 1 of type 'Linux' and of size 698.6 GiB.
```  

键入 **p** 可查看分区是否创建成功，如果没有问题则键入 **w** 写入创建的分区，保存退出  
```bash
Command (m for help): p
Disk /dev/sda: 698.64 GiB, 750156374016 bytes, 1465149168 sectors
Disk model: ST9750420AS
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 4096 bytes
I/O size (minimum/optimal): 4096 bytes / 4096 bytes
Disklabel type: dos
Disk identifier: 0xd907c71c

Device     Boot Start        End    Sectors   Size Id Type
/dev/sda1        2048 1465149167 1465147120 698.6G 83 Linux

Command (m for help): w
The partition table has been altered.
Calling ioctl() to re-read partition table.
Syncing disks.
```  

接下来格式化分区，推荐将分区格式化为ext4  
```bash
mkfs -t ext4 /dev/sda1
```

分区现在已经创建完成，接下来用命令将分区挂载。在 **/mnt** 目录下新建一个文件夹以将分区挂载到这个文件夹，这里的文件夹名字可以自定义。  
```
mkdir /mnt/hd1  # 创建文件夹
mount -t ext4 /dev/sda1 /mnt/hd1  # 将sda1分区挂载到/mnta/hd1下
```

由于此处的挂载相当于临时挂载，在每次系统重启后都会自动取消挂载，我们需要设置开机自动挂载。  
```
echo “mount -t ext4 /dev/sda1 /mnt/hd1” >> /etc/rc.local`
```

随后回到PVE后台，添加刚刚挂载好的磁盘，按照如图所示步骤操作即可。  
![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20250529104803215.png)

点击**添加**后完成添加磁盘操作，之后即可开始使用这块磁盘。

### · rc.local无法开机自动运行

笔者在使用**rc.local**配置开机自动挂载时遇到了报错，无法使用。在尝试修改权限，修改配置文件等无果后，采用另一种方式实现开机自动挂载。  

使用**systemd**服务替代**rc.local**  
```
systemd /etc/systemd/system/mount-disks.service`  **# 创建mount-disks服务**
nano /etc/systemd/system/mount-disks.service`  **# 编辑mount-sidks服务**
```

在**mount-disks.service**中插入以下文本  
```
[Unit] 
Description=Mount Disks 
After=network.target 

[Service] 
Type=oneshot 
ExecStart=/bin/mount -t ext4 /dev/sda1 /mnt/hd1 
RemainAfterExit=true 

[Install] 
WantedBy=multi-user.target
```

启用并启动服务  
```
systemctl enable mount-disks.service
systemctl start mount-disks.service
```

重启PVE测试，发现开机后磁盘成功挂载。