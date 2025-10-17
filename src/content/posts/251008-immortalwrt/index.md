---
title: ImmortalWrt系统配置实现反校园网多设备检测
published: 2025-10-16
description: ImmortalWrt的编译方法
tags:
  - ImmortalWrt
  - OpenWrt
category: 折腾日记
draft: false
---
# 前言 

近日笔者学校的校园网进行了光网改造，改造后原有的路由器等均不能继续使用，同一人甚至只能有两台设备连接校园网。为保证 Nas 等其他设备的正常使用，我尝试了解了绕过设备数量限制的方法，并在本文中记录实现过程。 

# 校园网共享上网检测机制 

目前已知可能存在的检测机制如下： 
- 基于 IPv4 数据包包头内的 TTL 字段的检测 
- 基于 HTTP 数据包请求头内的 User-Agent 字段的检测 
- DPI (Deep Packet Inspection) 深度包检测技术 
- 基于 IPv4 数据包包头内的 Identification 字段的检测 
- 基于网络协议栈时钟偏移的检测技术 

下面是对这些技术的实现原理的详细说明。 

### 基于 IPv4 包头的 TTL 字段的检测 

通过观察到达包的 TTL 与预期初始 TTL 或同源历史 TTL 的差异来估算跃点数并识别路由变化、代理或伪装主机，因此TTL 异常或同源包间突变通常被视为可疑信号。 

>TTL(Time to Live)，指一个数据包在经过一个路由时，可传递的最长距离（跃点数）。每当数据包经过一个路由器时，其存活次数即TTL就会被减一。当其存活次数为0时，路由器便会取消该数据包转发，并向数据包的源发送者发送一个数据包以告知跃点数超限。其设计目的是防止数据包因不正确的路由表等原因造成的无限循环而无法送达甚至耗尽网络资源。 

### 基于 HTTP 数据包请求头内的 User-Agent 字段的检测 

HTTP数据包请求头内包含一个叫做 User-Agent 的字段，该字段用于标识操作系统类型等数据。通过解析并匹配 User-Agent 字符串与已知浏览器/爬虫/设备签名或与其它头部的不一致性，即可标记异常的客户端。 

### DPI（Deep Packet Inspection）深度包检测技术 

对重组后的会话流量进行应用层解析和签名或模式匹配（包括内容、协议字段和字节序列特征），用于识别恶意载荷、协议绕过或特定应用流量。因为需要对所有流量进行分析，这种方法耗费的性能极大，大部分学校不会采用这种方法进行检测。 

### 基于 IPv4 数据包包头内的 Identification 字段的检测 

分析同源数据包的 IP ID 生成模式（线性递增、随机或基于流）和分片行为以指纹化操作系统/协议栈、识别 NAT/中间件或检测包头被篡改。 

### 基于网络协议栈时钟偏移的检测技术 

通过长期采样 TCP timestamp、IP ID/ISN 等随时间变化的字段建模主机时钟偏移与漂移，用于关联流量、指纹设备或判断是否来自同一物理主机。这个方法同样具有局限性，是否被用于检测有待商榷。 

# 多设备检测的解决方案 

基于上述几种检测方法，只针对终端方面的修改无法满足需求，并且过于繁琐。因此，需要从路由层面解决检测。最简单的方法，便是使用软路由搭配OpenWrt实现反检测。 

这里采用OpenWrt的分支ImmortalWrt作为软路由的系统。ImmortalWrt 在原版 OpenWrt 的基础上进行了优化和扩展，更稳定更纯净。 

# 编译ImmortalWrt 

>推荐选择 Debian/Ubuntu 系统来进行本地编译，此处我选择使用 Debian13。 

以 root 权限连接 ssh，随后首先配置好 apt 源，并更新软件包。 

```bash
apt update
apt -y upgrade
``` 

安装编译所需依赖 

>安装过程中如果弹窗直接选择默认的" no "即可 

```bash
apt install -y ack antlr3 asciidoc autoconf automake autopoint binutils bison build-essential \
  bzip2 ccache clang cmake cpio curl device-tree-compiler ecj fastjar flex gawk gettext gcc-multilib \
  g++-multilib git gnutls-dev gperf haveged help2man intltool lib32gcc-s1 libc6-dev-i386 libelf-dev \
  libglib2.0-dev libgmp3-dev libltdl-dev libmpc-dev libmpfr-dev libncurses-dev libpython3-dev libncurses5-dev libncursesw5-dev \
  libreadline-dev libssl-dev libtool libyaml-dev libz-dev lld llvm lrzsz mkisofs msmtp nano \
  ninja-build p7zip p7zip-full patch pkgconf python3 python3-pip python3-ply python3-docutils python3-setuptools \
  python3-pyelftools qemu-utils re2c rsync scons squashfs-tools subversion swig texinfo uglifyjs \
  upx-ucl unzip vim wget xmlto xxd zlib1g-dev zstd
``` 

***切换到普通用户后***，拉取官方镜像 

>此处的 v24.10.3 为我编译时的最新版本，可以替换为其他版本，进入 https://downloads.immortalwrt.org/ 即可查看最新的版本号 

```bash
git clone -b v24.10.3 --single-branch --filter=blob:none https://github.com/immortalwrt/immortalwrt
``` 

拉取完成后切换到文件夹中，逐步执行如下命令 

>若在执行 `./scripts/feeds update -a` 过程中出现报错，可尝试`git config --global http.sslVerify "false"`后再次执行更新 

```bash
cd immortalwrt
./scripts/feeds update -a
./scripts/feeds install -a
```

拉取需要编译的软件包的源码 

```bash
git clone https://github.com/Zxilly/UA2F.git package/UA2F   # UA2F
git clone https://github.com/CHN-beta/rkp-ipid.git package/rkp-ipid   # rkp-ipid
# 以上为必需的软件包，下方的软件包可自行选择拉取，也可拉取其他需要的软件包
git clone https://github.com/jerrykuku/luci-theme-argon.git package/luci-theme-argon   # argon主题
git clone https://github.com/lucikap/luci-app-ua2f.git package/luci-app-ua2f
``` 

拉取完成后再次更新 feeds 

```bash
./scripts/feeds update -a
./scripts/feeds install -a
```

进入配置界面 

>配置界面内需要按两次 ESC 才可返回上级菜单
>
```bash
make menuconfig
``` 

首先在前三个选项中选择好对应的架构，我这里使用 x86_64作为演示 

![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20251017155822946.png)

随后进入第四个选项修改内核空间大小，可自行设定大小 

![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20251017160122113.png)

添加 rkp-ipid 模块 

>Y 勾选，N 取消勾选  
>*Kernel moudles  ->  Other moudles  ->  kmod-rkp-ipid* 

添加 UA2F 模块 

>*Network  ->  Routing and Redirection  ->  ua2f* 

添加防火墙模块 

>*Network  ->  Firewall  ->  iptables-mod-conntrack-extra*  
>*Network  ->  Firewall  ->  iptables-mod-filter*  
>*Network  ->  Firewall  ->  iptables-mod-ipopt*  
>*Network  ->  Firewall  ->  iptables-nft*  
>*Network  ->  Firewall  ->  iptables-mod-u32*  
>*Network  ->  ipset* 

添加 Web 管理界面所需的模块 

>*LuCI  ->  Collections  ->  luci*  
>*LuCI  ->  Modules  ->  luci-compat*  
>*LuCI  ->  Modules  ->  Translations  ->  Chinese Simplified (zh_Hans)*  
>*LuCI  ->  Applications  ->  luci-app-argon-config*  
>*LuCI  ->  Applications  ->  luci-app-ttyd*  
>*LuCI  ->  Applications  ->  luci-app-ua2f*  
>#其余模块可以自行选择

回到主界面后用方向键选择 Save 进行保存，在弹出的窗口直接按两次回车，此时会返回主界面，再次选中 Exit 退出 

![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20251017162935610.png)

内核编译配置 

```bash
make kernel_menuconfig -j$(nproc) V=cs
```

>此处所需时间较长，耐心等待 

在弹出的页面中勾选 **64-bit kernel** ，接着添加 UA2F 所需的防火墙内核 

>勾选*Networking support  ->  Networking options  ->  Network packet filtering framework (Netfilter)*   
>随后进入上面刚勾选的选项，勾选如下选项  
>*->  Core Netfilter Configuration  ->  Netfilter NFNETLINK interface*  
>*->  Core Netfilter Configuration  ->  Netfilter LOG over NFNETLINK interface*  
>*->  Core Netfilter Configuration  ->  Netfilter connection tracking support*  
>*->  Core Netfilter Configuration  ->  Connection tracking netlink interface*  
>*->  Core Netfilter Configuration  ->  NFQUEUE and NFLOG integration with Connection Tracking*  
>随后再次保存并退出   

编译前预下载 

```bash
make download -j$(nproc) V=cs
```

最后开始编译  

```bash
make -j$(nproc) V=cs
```

>编译所需时间较长，耐心等待 

编译完成后在 `immortalwrt/bin/targets/x86/64/` 文件夹中取出编译好的固件，建议使用 `squashfs-combined-efi` 后缀的压缩固件

![image.png](https://zellonbucket.oss-cn-beijing.aliyuncs.com/img/20251017200823664.png)


# 刷入 ImmortalWrt 

准备一个 ≥8GB 的U盘，刷入 [WePE](https://www.wepe.com.cn) ，放入编译好的 ImmortalWrt 固件和刷写工具，这里使用 [physdiskwrite](https://m0n0.ch/wall/physdiskwrite.php) 作为刷写工具。 

将 U盘插入要刷入的主机，重启进入 BIOS ，选择 U盘启动。重启进入 U盘后，使用 WePE 自带的 DiskGunis 将目标磁盘的所有分区删除，并改为 GPT 分区类型。打开 WePE 的命令提示符窗口，将刷写工具拖入命令提示符，按照 `CMD:physdiskwrite.exe -u xxxx.img` 的格式输入命令，选择需要输入的磁盘，完成刷入，拔掉 U盘重启即可。 

# ImmortalWrt设置 

重启后当显示 `root@ImmortalWrt:` 时，即代表刷入成功。 

ImmortalWrt 的默认网段是 `192.168.1.0` ，将路由与另一台电脑用网线连接，在电脑浏览器中输入 `192.168.1.1` 即可访问路由器管理后台。 

设置好 root 管理密码后，进入 `系统-启动项-本地启动脚本` 页面，将如下脚本粘贴到文本框中。 

```
#开机自启UA2F
service ua2f start
service ua2f enable

#防火墙：
iptables -t nat -A PREROUTING -p udp --dport 53 -j REDIRECT --to-ports 53
iptables -t nat -A PREROUTING -p tcp --dport 53 -j REDIRECT --to-ports 53

# 防 IPID 检测
iptables -t mangle -N IPID_MOD
iptables -t mangle -A FORWARD -j IPID_MOD
iptables -t mangle -A OUTPUT -j IPID_MOD
iptables -t mangle -A IPID_MOD -d 0.0.0.0/8 -j RETURN
iptables -t mangle -A IPID_MOD -d 127.0.0.0/8 -j RETURN
# 由于本校局域网是 A 类网，所以我将这一条注释掉了，具体要不要注释结合你所在的校园网内网类型
# iptables -t mangle -A IPID_MOD -d 10.0.0.0/8 -j RETURN
iptables -t mangle -A IPID_MOD -d 172.16.0.0/12 -j RETURN
iptables -t mangle -A IPID_MOD -d 192.168.0.0/16 -j RETURN
iptables -t mangle -A IPID_MOD -d 255.0.0.0/8 -j RETURN
iptables -t mangle -A IPID_MOD -j MARK --set-xmark 0x10/0x10

# 防时钟偏移检测
iptables -t nat -N ntp_force_local
iptables -t nat -I PREROUTING -p udp --dport 123 -j ntp_force_local
iptables -t nat -A ntp_force_local -d 0.0.0.0/8 -j RETURN
iptables -t nat -A ntp_force_local -d 127.0.0.0/8 -j RETURN
iptables -t nat -A ntp_force_local -d 192.168.0.0/16 -j RETURN
iptables -t nat -A ntp_force_local -s 192.168.0.0/16 -j DNAT --to-destination 192.168.1.1

# 通过 iptables 修改 TTL 值
iptables -t mangle -A POSTROUTING -j TTL --ttl-set 64

# iptables 拒绝 AC 进行 Flash 检测
iptables -I FORWARD -p tcp --sport 80 --tcp-flags ACK ACK -m string --algobm --string " src=\"http://1.1.1." -j DROP
``` 

重启即可。 

------------------------------------------------------------------------
由于校园网检测方式未知，目前仍可使用，暂时不进行继续研究。 