import { defineCollection, type CollectionConfig, z } from "astro:content";

type PostSchema = {
	title: string;
	published: Date;
	updated?: Date;
	draft: boolean;
	description: string;
	image: string;
	tags: string[];
	category: string;
	lang: string;
	prevTitle: string;
	prevSlug: string;
	nextTitle: string;
	nextSlug: string;
};

type PostSchemaInput = {
	title: string;
	published: Date;
	updated?: Date;
	draft?: boolean;
	description?: string;
	image?: string;
	tags?: string[];
	category?: string;
	lang?: string;
	prevTitle?: string;
	prevSlug?: string;
	nextTitle?: string;
	nextSlug?: string;
};

type ThoughtSchema = {
	title: string;
	published: Date;
	updated?: Date;
	draft: boolean;
	tags: string[];
	mood: string;
	location: string;
	pinned: boolean;
};

type ThoughtSchemaInput = {
	title?: string;
	published: Date;
	updated?: Date;
	draft?: boolean;
	tags?: string[];
	mood?: string;
	location?: string;
	pinned?: boolean;
};

const postsSchema: z.ZodType<PostSchema, z.ZodTypeDef, PostSchemaInput> =
	z.object({
	title: z.string(),
	published: z.date(),
	updated: z.date().optional(),
	draft: z.boolean().optional().default(false),
	description: z.string().optional().default(""),
	image: z.string().optional().default(""),
	tags: z.array(z.string()).optional().default([]),
	category: z.string().optional().default(""),
	lang: z.string().optional().default(""),

	/* For internal use */
	prevTitle: z.string().default(""),
	prevSlug: z.string().default(""),
	nextTitle: z.string().default(""),
	nextSlug: z.string().default(""),
});

const postsCollection: CollectionConfig<typeof postsSchema> = defineCollection({
	schema: postsSchema,
});

const thoughtsSchema: z.ZodType<
	ThoughtSchema,
	z.ZodTypeDef,
	ThoughtSchemaInput
> = z.object({
	title: z.string().optional().default(""),
	published: z.date(),
	updated: z.date().optional(),
	draft: z.boolean().optional().default(false),
	tags: z.array(z.string()).optional().default([]),
	mood: z.string().optional().default(""),
	location: z.string().optional().default(""),
	pinned: z.boolean().optional().default(false),
});

const thoughtsCollection: CollectionConfig<typeof thoughtsSchema> =
	defineCollection({
		schema: thoughtsSchema,
	});

const specSchema: z.ZodType<Record<string, unknown>> = z
	.object({})
	.passthrough();

const specCollection: CollectionConfig<typeof specSchema> = defineCollection({
	schema: specSchema,
});

export const collections: {
	posts: typeof postsCollection;
	spec: typeof specCollection;
	thoughts: typeof thoughtsCollection;
} = {
	posts: postsCollection,
	spec: specCollection,
	thoughts: thoughtsCollection,
};
