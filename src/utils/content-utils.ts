import { getCollection, type CollectionEntry } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import MarkdownIt from "markdown-it";
import matter from "gray-matter";

const parser = new MarkdownIt();

export async function getSortedPosts(): Promise<CollectionEntry<"posts">[]> {
	const allBlogPosts = await getCollection("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const sorted = allBlogPosts.sort((a, b) => {
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].slug;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].slug;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}

	return sorted;
}

export async function getSortedThoughts(): Promise<any[]> {
	// 支持从环境变量中读取 GITHUB_TOKEN，避免 API 速率限制
	const token = process.env.GITHUB_TOKEN || import.meta.env.GITHUB_TOKEN;
	const repo = "Zellon0w0/fuwari_zellon0w0";
	const url = `https://api.github.com/repos/${repo}/issues?labels=thoughts&state=all&per_page=100`;

	try {
		const response = await fetch(url, {
			headers: {
				Accept: "application/vnd.github.v3+json",
				"User-Agent": "fuwari-blog-builder",
				...(token && { Authorization: `token ${token}` }),
			},
		});

		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.statusText}`);
		}

		const issues = await response.json();
		const thoughts = [];

		for (const issue of issues) {
			const body = issue.body || "";
			let frontmatter: any = {};
			let contentMarkdown = body;

			try {
				const parsed = matter(body);
				frontmatter = parsed.data;
				contentMarkdown = parsed.content;
			} catch (e) {
				console.warn(`Failed to parse frontmatter for issue #${issue.number}, fallback to raw body`, e);
			}

			const publishedStr = frontmatter.published || issue.created_at;
			const published = new Date(publishedStr);

			thoughts.push({
				id: String(issue.number),
				body: contentMarkdown,
				htmlContent: parser.render(contentMarkdown),
				data: {
					title: frontmatter.title || "",
					published,
					tags: frontmatter.tags || [],
					mood: frontmatter.mood || "",
					location: frontmatter.location || "",
					pinned: frontmatter.pinned || false,
					draft: false,
				},
			});
		}

		return thoughts.sort((a, b) => {
			if (a.data.pinned !== b.data.pinned) {
				return a.data.pinned ? -1 : 1;
			}
			const dateA = new Date(a.data.published);
			const dateB = new Date(b.data.published);
			return dateB.getTime() - dateA.getTime();
		});
	} catch (error) {
		console.error("Failed to fetch thoughts from GitHub Issues:", error);
		return [];
	}
}

export type Tag = {
	name: string;
	count: number;
};

export async function getTagList(): Promise<Tag[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const countMap: { [key: string]: number } = {};
	allBlogPosts.map((post: { data: { tags: string[] } }) => {
		post.data.tags.map((tag: string) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
		});
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
	name: string;
	count: number;
};

export async function getCategoryList(): Promise<Category[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
	const count: { [key: string]: number } = {};
	allBlogPosts.map((post: { data: { category: string | number } }) => {
		if (!post.data.category) {
			const ucKey = i18n(I18nKey.uncategorized);
			count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			return;
		}

		const categoryName =
			typeof post.data.category === "string"
				? post.data.category.trim()
				: String(post.data.category).trim();

		count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
	});

	const lst = Object.keys(count).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	const ret: Category[] = [];
	for (const c of lst) {
		ret.push({ name: c, count: count[c] });
	}
	return ret;
}
