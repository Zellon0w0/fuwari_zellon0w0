import type {
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "Zellon的小破站",
	subtitle: "记录我感兴趣的事",
	lang: "zh_CN", // 'en', 'zh_CN', 'zh_TW', 'ja', 'ko', 'es', 'th'
	themeColor: {
		hue: 350, // Default hue for the theme color, from 0 to 360. e.g. red: 0, teal: 200, cyan: 250, pink: 345
		fixed: false, // Hide the theme color picker for visitors
	},
	banner: {
		enable: false,
		src: "assets/images/Elysia.png", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
		position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
		credit: {
			enable: false, // Display the credit text of the banner image
			text: "", // Credit text to be displayed
			url: "", // (Optional) URL link to the original artwork or artist's page
		},
	},
	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
		{
			src: "/favicon/avatar-32.png",
			sizes: "32x32",
		},
		{
			src: "/favicon/avatar-128.png",
			sizes: "128x128",
		},
		{
			src: "/favicon/avatar-180.png",
			sizes: "180x180",
		},
		{
			src: "/favicon/avatar-192.png",
			sizes: "192x192",
		},
	],
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		{
			name: "文章",
			url: "/articles/",
		},
		{
			name: "碎碎念",
			url: "/thoughts/",
		},
		{
			name: "时间线",
			url: "/archive/",
		},
		LinkPreset.About,
		LinkPreset.Friends,
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "/avatar.jpg", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
	name: "Zellon",
	bio: "告别过去，是为了走向未来",
	links: [
		{
			name: "QQ",
			icon: "fa6-brands:qq", // Visit https://icones.js.org/ for icon codes
			// You will need to install the corresponding icon set if it's not already included
			// `pnpm add @iconify-json/<icon-set-name>`
			url: "https://qm.qq.com/cgi-bin/qm/qr?k=9FSZZdU6PjcZOd_hLVmpZodJU-q_FbAB",
		},
		{
			name: "Bilibili",
			icon: "fa6-brands:bilibili",
			url: "https://space.bilibili.com/96914134",
		},
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/Zellon0w0",
		},
		{
			name: "EMail",
			icon: "fa6-solid:envelope",
			url: "mailto:zellon0w0@163.com",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};
