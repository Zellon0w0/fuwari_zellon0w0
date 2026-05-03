const DEFAULT_WALINE_SERVER_URL = "https://waline.zellon.top";

type WalineResponse<T> = {
	errno?: number;
	errmsg?: string;
	data?: T;
};

type WalineCommentListData = {
	data?: WalineComment[];
};

export type WalineComment = {
	objectId: string | number;
	comment?: string;
	orig?: string;
	nick?: string;
	mail?: string;
	link?: string;
	avatar?: string;
	pid?: string | number;
	rid?: string | number;
	at?: string | number;
	like?: number;
	createdAt?: string | number;
	time?: string | number;
	children?: WalineComment[];
	_children?: WalineComment[];
};

export type CreateWalineCommentPayload = {
	comment: string;
	nick: string;
	mail?: string;
	link?: string;
	url: string;
	ua: string;
	pid?: string | number;
	rid?: string | number;
	at?: string | number;
};

function getWalineServerUrl() {
	return (
		import.meta.env.PUBLIC_WALINE_SERVER_URL || DEFAULT_WALINE_SERVER_URL
	).replace(/\/+$/, "");
}

async function readWalineResponse<T>(response: Response): Promise<T> {
	const payload = (await response.json()) as WalineResponse<T>;

	if (!response.ok || payload.errno) {
		throw new Error(
			payload.errmsg || `Waline request failed: ${response.status}`,
		);
	}

	return payload.data as T;
}

export async function listComments(path: string): Promise<WalineComment[]> {
	const search = new URLSearchParams({
		path,
		page: "1",
		pageSize: "50",
		sortBy: "insertedAt_asc",
	});

	const response = await fetch(
		`${getWalineServerUrl()}/api/comment?${search.toString()}`,
	);
	const data = await readWalineResponse<
		WalineCommentListData | WalineComment[]
	>(response);

	if (Array.isArray(data)) return data;
	return data?.data || [];
}

export async function createComment(
	payload: CreateWalineCommentPayload,
): Promise<void> {
	const response = await fetch(`${getWalineServerUrl()}/api/comment`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	await readWalineResponse(response);
}

export async function updateCommentLike(
	objectId: string | number,
	liked: boolean,
): Promise<void> {
	const response = await fetch(
		`${getWalineServerUrl()}/api/comment/${encodeURIComponent(String(objectId))}`,
		{
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ like: liked }),
		},
	);

	await readWalineResponse(response);
}
