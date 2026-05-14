<script>
import { createComment, listComments, updateCommentLike } from '@utils/waline-client';
import { onMount, tick } from 'svelte';

const EMOJI_PRESETS = [
  'https://unpkg.com/@waline/emojis@1.4.0/qq',
  'https://unpkg.com/@waline/emojis@1.4.0/bmoji',
  'https://unpkg.com/@waline/emojis@1.4.0/bilibili',
  'https://unpkg.com/@waline/emojis@1.4.0/tieba',
  'https://unpkg.com/@waline/emojis@1.4.0/weibo',
];

let nickname = $state('');
let email = $state('');
let website = $state('');
let qq = $state('');
let avatarUrl = $state('');
let content = $state('');
let comments = $state([]);
let submitting = $state(false);
let replyingTo = $state(null);
let replyContent = $state('');
let likedIds = $state([]);
let loading = $state(true);
let emojiTabs = $state([]);
let activeEmojiTab = $state(0);
let emojiPanelOpen = $state(false);
let emojiLoading = $state(false);
let activeEditor = $state('content');
let mainTextarea;
let replyTextarea;

onMount(() => {
  restoreUser();
  loadLiked();
  loadEmojiTabs();
  fetchComments();
});

// ========== 用户信息 ==========

function restoreUser() {
  const saved = localStorage.getItem('comment-user');
  if (!saved) return;
  try {
    const u = JSON.parse(saved);
    nickname = u.nickname || '';
    email = u.email || '';
    website = u.website || '';
    qq = u.qq || '';
    if (qq) avatarUrl = `https://q.qlogo.cn/headimg_dl?dst_uin=${qq}&spec=640&img_type=jpg`;
  } catch {}
}

function saveUser() {
  localStorage.setItem('comment-user', JSON.stringify({
    nickname: nickname.trim(),
    email: email.trim(),
    website: normalizeWebsiteUrl(website),
    qq: qq.trim(),
  }));
}

function onQQInput() {
  const t = qq.trim();
  if (/^\d{5,12}$/.test(t)) {
    avatarUrl = `https://q.qlogo.cn/headimg_dl?dst_uin=${t}&spec=640&img_type=jpg`;
  } else if (!t) {
    avatarUrl = '';
  }
}

function getAvatar(c) {
  // 从内容中解析 QQ 号标记
  const match = `${c.orig || ''} ${c.comment || ''}`.match(/\[QQ:(\d+)\]/);
  if (match) return `https://q.qlogo.cn/headimg_dl?dst_uin=${match[1]}&spec=640&img_type=jpg`;
  if (c.avatar) return c.avatar;
  return `https://cravatar.cn/avatar/${(c.mail || '').toLowerCase()}?d=mp&s=80`;
}

function cleanContent(html) {
  // 去掉开头的 [QQ:xxxx] 标记
  return html?.replace(/^(<p>)?\[QQ:\d+\]\s*/, '$1') || '';
}

function getEmojiMap() {
  return Object.fromEntries(
    emojiTabs.flatMap((tab) => tab.items.map((item) => [item.code, item.src])),
  );
}

function renderContent(html) {
  const emojiMap = getEmojiMap();
  return cleanContent(html).replace(/:([a-zA-Z0-9_+-]+):/g, (match, code) => {
    const src = emojiMap[code];
    return src
      ? `<img class="comment-emoji" src="${src}" alt="${code}" loading="lazy" />`
      : match;
  });
}

function formatTime(ts) {
  const d = new Date(typeof ts === 'number' && ts < 1000000000000 ? ts * 1000 : ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${day} ${h}:${min}`;
}

function normalizeWebsiteUrl(value) {
  const trimmed = value?.trim() || '';
  if (!trimmed) return '';

  const candidate = trimmed.startsWith('//')
    ? `https:${trimmed}`
    : /^[a-z][a-z\d+.-]*:/i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

function getCommentLink(comment) {
  return normalizeWebsiteUrl(comment.link);
}

function resolveEmojiAsset(folder, prefix, item, type) {
  return `${folder.replace(/\/+$/, '')}/${prefix || ''}${item}${type ? `.${type}` : ''}`;
}

async function loadEmojiTabs() {
  emojiLoading = true;
  try {
    const tabs = await Promise.all(
      EMOJI_PRESETS.map(async (folder) => {
        const response = await fetch(`${folder}/info.json`);
        const info = await response.json();
        return {
          name: info.name,
          items: info.items.map((item) => ({
            code: `${info.prefix || ''}${item}`,
            src: resolveEmojiAsset(folder, info.prefix, item, info.type),
          })),
        };
      }),
    );
    emojiTabs = tabs;
  } catch (e) {
    console.error('Failed to load emoji presets:', e);
    emojiTabs = [];
  }
  emojiLoading = false;
}

function getEditorValue() {
  return activeEditor === 'reply' ? replyContent : content;
}

function setEditorValue(value) {
  if (activeEditor === 'reply') {
    replyContent = value;
  } else {
    content = value;
  }
}

function getActiveTextarea() {
  return activeEditor === 'reply' ? replyTextarea : mainTextarea;
}

async function insertText(before, after = '', fallback = '') {
  const textarea = getActiveTextarea();
  const current = getEditorValue();
  const start = textarea?.selectionStart ?? current.length;
  const end = textarea?.selectionEnd ?? current.length;
  const selected = current.slice(start, end) || fallback;
  const next = `${current.slice(0, start)}${before}${selected}${after}${current.slice(end)}`;

  setEditorValue(next);
  await tick();
  textarea?.focus();
  textarea?.setSelectionRange(
    start + before.length,
    start + before.length + selected.length,
  );
}

function insertEmoji(code) {
  insertText(`:${code}:`);
  emojiPanelOpen = false;
}

function toggleEmojiPanel(editor) {
  const wasActive = activeEditor === editor;
  activeEditor = editor;
  emojiPanelOpen = wasActive ? !emojiPanelOpen : true;
  if (!emojiTabs.length && !emojiLoading) loadEmojiTabs();
}

// ========== API ==========

function getCommentPath() {
  return location.pathname;
}

async function fetchComments() {
  loading = true;
  try {
    comments = await listComments(getCommentPath());
  } catch (e) {
    console.error('Failed to load comments:', e);
    comments = [];
  }
  loading = false;
}

async function submit() {
  if (!nickname.trim() || !content.trim()) return;
  submitting = true;
  saveUser();

  let body = content.trim();
  if (qq.trim()) body = `[QQ:${qq.trim()}] ${body}`;

  try {
    await createComment({
      comment: body,
      nick: nickname.trim(),
      mail: email.trim(),
      link: normalizeWebsiteUrl(website),
      url: getCommentPath(),
      ua: navigator.userAgent,
    });
    content = '';
    await fetchComments();
  } catch (e) {
    console.error('Failed to submit comment:', e);
  }
  submitting = false;
}

function getReplyRootId(comment) {
  return comment.rid || comment.objectId;
}

async function submitReply(parent) {
  if (!nickname.trim() || !replyContent.trim()) return;
  saveUser();

  let body = replyContent.trim();
  if (qq.trim()) body = `[QQ:${qq.trim()}] ${body}`;

  try {
    await createComment({
      comment: body,
      nick: nickname.trim(),
      mail: email.trim(),
      link: normalizeWebsiteUrl(website),
      url: getCommentPath(),
      ua: navigator.userAgent,
      pid: parent.objectId,
      rid: getReplyRootId(parent),
      at: parent.nick || '',
    });
    replyContent = '';
    replyingTo = null;
    await fetchComments();
  } catch (e) {
    console.error('Failed to submit reply:', e);
  }
}

function updateLocalLikeCount(list, commentId, delta) {
  return list.map((comment) => {
    if (comment.objectId === commentId) {
      return { ...comment, like: Math.max(getLikeCount(comment) + delta, 0) };
    }

    return {
      ...comment,
      children: comment.children ? updateLocalLikeCount(comment.children, commentId, delta) : comment.children,
    };
  });
}

async function toggleLike(comment) {
  const commentId = comment.objectId;
  const wasLiked = isLiked(commentId);
  const delta = wasLiked ? -1 : 1;

  try {
    await updateCommentLike(commentId, !wasLiked);

    if (wasLiked) {
      likedIds = likedIds.filter(id => String(id) !== String(commentId));
    } else {
      likedIds = [...likedIds, commentId];
    }
    comments = updateLocalLikeCount(comments, commentId, delta);
    localStorage.setItem('comment-likes', JSON.stringify(likedIds));
  } catch (e) {
    console.error('Failed to toggle comment like:', e);
  }
}

function isLiked(commentId) {
  return likedIds.some(id => String(id) === String(commentId));
}

function getLikeCount(comment) {
  return Number(comment.like || 0);
}

function loadLiked() {
  try { likedIds = JSON.parse(localStorage.getItem('comment-likes') || '[]'); } catch { likedIds = []; }
}

function startReply(id) { replyingTo = id; replyContent = ''; }
function cancelReply() { replyingTo = null; replyContent = ''; }

function handleKeydown(e) {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
}

function handleReplyKeydown(e, parent) {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitReply(parent);
  if (e.key === 'Escape') cancelReply();
}

// 构建嵌套树
function buildTree(list) {
  const map = {};
  const roots = [];

  for (const c of list) {
    map[c.objectId] = {
      ...c,
      _children: (c.children || []).map((child) => ({ ...child, _children: child.children || [] })),
    };
  }

  for (const c of Object.values(map)) {
    if (c.pid && map[c.pid]) {
      map[c.pid]._children.push(c);
    } else {
      roots.push(c);
    }
  }
  return roots;
}

function countAll(list) {
  return list.length;
}
</script>

<div class="comment-section mt-6">
  <div class="flex items-center gap-2 mb-6">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--primary)]">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
    </svg>
    <span class="text-lg font-bold text-black/80 dark:text-white/80">评论</span>
    <span class="text-sm text-black/30 dark:text-white/30">({countAll(comments)})</span>
  </div>

  <!-- 评论表单 -->
  <div class="comment-form rounded-[var(--radius-large)] p-5 mb-6 transition">
    <div class="flex gap-4 mb-4">
      <div class="flex-shrink-0">
        <div class="w-16 h-16 rounded-full overflow-hidden bg-black/5 dark:bg-white/10 border-2 border-[var(--primary)]/20 transition">
          {#if getAvatar({ mail: email, avatar: avatarUrl })}
            <img src={getAvatar({ mail: email, avatar: avatarUrl })} alt="avatar" class="w-full h-full object-cover" />
          {:else}
            <div class="w-full h-full flex items-center justify-center text-black/20 dark:text-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
          {/if}
        </div>
      </div>
      <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input bind:value={nickname} placeholder="昵称 *" class="comment-input" />
        <input bind:value={qq} placeholder="QQ 号（自动获取头像）" class="comment-input" oninput={onQQInput} />
        <input bind:value={email} type="email" placeholder="邮箱" class="comment-input" />
        <input bind:value={website} type="url" placeholder="个人网站" class="comment-input" />
      </div>
    </div>
    <textarea bind:value={content} bind:this={mainTextarea} placeholder="写下你的想法... 支持表情和 Markdown (Ctrl+Enter 发送)" class="comment-textarea w-full resize-none" rows="4" onfocus={() => activeEditor = 'content'} onkeydown={handleKeydown}></textarea>
    {@render editorToolbar('content')}
    <div class="flex justify-between items-center mt-3">
      <span class="text-xs text-black/25 dark:text-white/25">Ctrl+Enter 发送</span>
      <button onclick={submit} disabled={!nickname.trim() || !content.trim() || submitting}
        class="comment-submit-btn px-6 py-2 rounded-[var(--radius-large)] text-sm font-bold transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed">
        {submitting ? '发送中...' : '发送'}
      </button>
    </div>
  </div>

  <!-- 评论列表 -->
  {#if loading}
    <div class="text-center py-10 text-black/20 dark:text-white/20 text-sm">加载中...</div>
  {:else if comments.length > 0}
    <div class="comment-list flex flex-col gap-3">
      {#each buildTree(comments) as comment (comment.objectId)}
        {@render commentNode(comment, 0)}
      {/each}
    </div>
  {:else}
    <div class="text-center py-10 text-black/20 dark:text-white/20 text-sm">还没有评论，来抢沙发吧~</div>
  {/if}
</div>

{#snippet editorToolbar(editor)}
  <div class="comment-toolbar flex items-center gap-1 mt-3">
    <button type="button" title="表情" class="flex items-center" class:active={emojiPanelOpen && activeEditor === editor} onclick={() => toggleEmojiPanel(editor)}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/>
        <line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
      <span class="ml-1">表情</span>
    </button>
    <span class="text-xs text-black/25 dark:text-white/25 ml-2">支持输入 :emoji_code: 格式表情</span>
  </div>

  {#if emojiPanelOpen && activeEditor === editor}
    <div class="emoji-panel rounded-[var(--radius-large)] mt-2 p-3">
      {#if emojiLoading}
        <div class="text-xs text-black/30 dark:text-white/30 py-4 text-center">加载中...</div>
      {:else if emojiTabs.length > 0}
        <div class="flex gap-1 mb-3 overflow-x-auto">
          {#each emojiTabs as tab, index}
            <button type="button" class:active={activeEmojiTab === index} onclick={() => activeEmojiTab = index}>{tab.name}</button>
          {/each}
        </div>
        <div class="emoji-grid">
          {#each emojiTabs[activeEmojiTab]?.items || [] as emoji}
            <button type="button" title={emoji.code} onclick={() => insertEmoji(emoji.code)}>
              <img src={emoji.src} alt={emoji.code} loading="lazy" />
            </button>
          {/each}
        </div>
      {:else}
        <div class="text-xs text-black/30 dark:text-white/30 py-4 text-center">表情加载失败</div>
      {/if}
    </div>
  {/if}
{/snippet}

{#snippet commentNode(comment, depth)}
  <div class="comment-item rounded-[var(--radius-large)] transition" style="margin-left: {depth * 2}rem"
       class:p-4={depth === 0} class:p-3={depth > 0}>
    <div class="flex gap-3">
      <div class="flex-shrink-0">
        <div class="rounded-full overflow-hidden bg-black/5 dark:bg-white/10"
             style="width: {depth === 0 ? 2.5 : 2}rem; height: {depth === 0 ? 2.5 : 2}rem">
          <img src={getAvatar(comment)} alt="" class="w-full h-full object-cover" />
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          {#if getCommentLink(comment)}
            <a href={getCommentLink(comment)} target="_blank" rel="noopener" class="font-bold text-sm text-[var(--primary)] hover:underline">{comment.nick}</a>
          {:else}
            <span class="font-bold text-sm text-black/80 dark:text-white/80">{comment.nick}</span>
          {/if}
          {#if depth > 0}
            <span class="text-xs text-black/20 dark:text-white/20">回复</span>
          {/if}
          <span class="text-xs text-black/25 dark:text-white/25">{formatTime(comment.createdAt || comment.time)}</span>
        </div>
        <div class="comment-content text-sm text-black/70 dark:text-white/70 leading-relaxed whitespace-pre-wrap break-words mb-2">{@html renderContent(comment.comment)}</div>
        <div class="flex items-center gap-4">
          <button onclick={() => toggleLike(comment)}
            class="flex items-center gap-1 text-xs transition hover:text-[var(--primary)]"
            style="color: {isLiked(comment.objectId) ? 'var(--primary)' : ''}">
            {#if isLiked(comment.objectId)}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {/if}
            <span>{getLikeCount(comment)}</span>
          </button>
          <button onclick={() => startReply(comment.objectId)}
            class="flex items-center gap-1 text-xs text-black/30 dark:text-white/30 transition hover:text-[var(--primary)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
            回复
          </button>
        </div>
        {#if replyingTo === comment.objectId}
          <div class="mt-3 reply-form rounded-[var(--radius-large)] p-3">
            <textarea bind:value={replyContent} placeholder="回复 {comment.nick}..."
              class="comment-textarea w-full resize-none" rows="2"
              bind:this={replyTextarea}
              onfocus={() => activeEditor = 'reply'}
              onkeydown={(e) => handleReplyKeydown(e, comment)}></textarea>
            {@render editorToolbar('reply')}
            <div class="flex justify-end gap-2 mt-2">
              <button onclick={cancelReply} class="px-3 py-1.5 rounded-lg text-xs font-bold text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 transition">取消</button>
              <button onclick={() => submitReply(comment)} disabled={!replyContent.trim() || !nickname.trim()}
                class="comment-submit-btn px-4 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">回复</button>
            </div>
          </div>
        {/if}
        {#if comment._children && comment._children.length > 0}
          <div class="mt-2 flex flex-col gap-2">
            {#each comment._children as child (child.objectId)}
              {@render commentNode(child, depth + 1)}
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/snippet}

<style>
  .comment-form { background: var(--card-bg); border: 1px solid var(--line-divider); }
  :global(.dark) .comment-form { border-color: var(--line-divider); }
  .reply-form { background: rgba(0, 0, 0, 0.02); }
  :global(.dark) .reply-form { background: rgba(255, 255, 255, 0.03); }
  .comment-input {
    height: 2.5rem; padding: 0 0.75rem; border-radius: var(--radius-large); font-size: 0.875rem;
    background: rgba(0, 0, 0, 0.03); border: 1px solid var(--line-divider); color: inherit; outline: none; transition: all 0.2s;
  }
  .comment-input:focus { border-color: var(--primary); background: transparent; box-shadow: none; }
  .comment-input::placeholder { color: rgba(0, 0, 0, 0.25); }
  :global(.dark) .comment-input { background: rgba(255, 255, 255, 0.05); }
  :global(.dark) .comment-input:focus { background: transparent; }
  :global(.dark) .comment-input::placeholder { color: rgba(255, 255, 255, 0.25); }
  .comment-textarea {
    padding: 0.75rem 1rem; border-radius: var(--radius-large); font-size: 0.875rem;
    background: rgba(0, 0, 0, 0.03); border: 1px solid var(--line-divider); color: inherit; outline: none; transition: all 0.2s; line-height: 1.6;
  }
  .comment-textarea:focus { border-color: var(--primary); background: transparent; box-shadow: none; }
  .comment-textarea::placeholder { color: rgba(0, 0, 0, 0.25); }
  :global(.dark) .comment-textarea { background: rgba(255, 255, 255, 0.05); }
  :global(.dark) .comment-textarea:focus { background: transparent; }
  :global(.dark) .comment-textarea::placeholder { color: rgba(255, 255, 255, 0.25); }
  .comment-submit-btn { background: var(--primary); color: white; }
  .comment-submit-btn:hover { filter: brightness(1.1); }
  .comment-item { background: var(--card-bg); border: 1px solid var(--line-divider); }
  :global(.dark) .comment-item { border-color: var(--line-divider); }
  .comment-toolbar button {
    min-width: 2rem; height: 2rem; padding: 0 0.5rem; border-radius: var(--radius-large); font-size: 0.75rem; font-weight: 700;
    color: rgba(0, 0, 0, 0.45); background: rgba(0, 0, 0, 0.03); border: 1px solid var(--line-divider); transition: all 0.2s;
  }
  .comment-toolbar button:hover, .comment-toolbar button.active { color: var(--primary); background: oklch(0.75 0.14 var(--hue) / 0.12); }
  :global(.dark) .comment-toolbar button { color: rgba(255, 255, 255, 0.45); background: rgba(255, 255, 255, 0.05); }
  :global(.dark) .comment-toolbar button:hover, :global(.dark) .comment-toolbar button.active { color: var(--primary); background: oklch(0.75 0.14 var(--hue) / 0.18); }
  .emoji-panel { background: rgba(0, 0, 0, 0.025); border: 1px solid var(--line-divider); }
  :global(.dark) .emoji-panel { background: rgba(255, 255, 255, 0.035); border-color: var(--line-divider); }
  .emoji-panel > div:first-child button {
    height: 1.75rem; padding: 0 0.625rem; border-radius: var(--radius-large); font-size: 0.75rem;
    color: rgba(0, 0, 0, 0.45); background: transparent;
  }
  .emoji-panel > div:first-child button.active { color: var(--primary); background: oklch(0.75 0.14 var(--hue) / 0.12); }
  :global(.dark) .emoji-panel > div:first-child button { color: rgba(255, 255, 255, 0.45); }
  .emoji-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(2rem, 1fr)); gap: 0.25rem;
    max-height: 13rem; overflow-y: auto;
  }
  .emoji-grid button {
    width: 2rem; height: 2rem; border-radius: var(--radius-large); display: flex; align-items: center; justify-content: center;
  }
  .emoji-grid button:hover { background: rgba(0, 0, 0, 0.05); }
  :global(.dark) .emoji-grid button:hover { background: rgba(255, 255, 255, 0.06); }
  .emoji-grid img, :global(.comment-emoji) { width: 1.35rem; height: 1.35rem; object-fit: contain; display: inline-block; vertical-align: -0.25rem; }
  :global(.comment-content p) { margin: 0.25rem 0; }
  :global(.comment-content a) { color: var(--primary); text-decoration: underline; text-underline-offset: 2px; }
  :global(.comment-content code) { padding: 0.1rem 0.3rem; border-radius: 0.35rem; background: rgba(0, 0, 0, 0.05); }
  :global(.dark) :global(.comment-content code) { background: rgba(255, 255, 255, 0.08); }
</style>
