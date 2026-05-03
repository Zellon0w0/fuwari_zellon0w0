<script>
import { createComment, listComments, updateCommentLike } from '@utils/waline-client';
import { onMount } from 'svelte';

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

onMount(() => {
  restoreUser();
  loadLiked();
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
  <div class="comment-form rounded-2xl p-5 mb-6 transition">
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
    <textarea bind:value={content} placeholder="写下你的想法... (Ctrl+Enter 发送)" class="comment-textarea w-full resize-none" rows="4" onkeydown={handleKeydown}></textarea>
    <div class="flex justify-between items-center mt-3">
      <span class="text-xs text-black/25 dark:text-white/25">Ctrl+Enter 发送</span>
      <button onclick={submit} disabled={!nickname.trim() || !content.trim() || submitting}
        class="comment-submit-btn px-6 py-2 rounded-xl text-sm font-bold transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
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

{#snippet commentNode(comment, depth)}
  <div class="comment-item rounded-2xl transition" style="margin-left: {depth * 2}rem"
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
        <div class="text-sm text-black/70 dark:text-white/70 leading-relaxed whitespace-pre-wrap break-words mb-2">{@html cleanContent(comment.comment)}</div>
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
          <div class="mt-3 reply-form rounded-xl p-3">
            <textarea bind:value={replyContent} placeholder="回复 {comment.nick}..."
              class="comment-textarea w-full resize-none" rows="2"
              onkeydown={(e) => handleReplyKeydown(e, comment)}></textarea>
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
  .comment-form { background: var(--card-bg); border: 1px solid rgba(0, 0, 0, 0.05); }
  :global(.dark) .comment-form { border-color: rgba(255, 255, 255, 0.06); }
  .reply-form { background: rgba(0, 0, 0, 0.02); }
  :global(.dark) .reply-form { background: rgba(255, 255, 255, 0.03); }
  .comment-input {
    height: 2.5rem; padding: 0 0.75rem; border-radius: 0.75rem; font-size: 0.875rem;
    background: rgba(0, 0, 0, 0.03); border: 1px solid transparent; color: inherit; outline: none; transition: all 0.2s;
  }
  .comment-input:focus { border-color: var(--primary); background: transparent; box-shadow: 0 0 0 3px oklch(0.75 0.14 var(--hue) / 0.1); }
  .comment-input::placeholder { color: rgba(0, 0, 0, 0.25); }
  :global(.dark) .comment-input { background: rgba(255, 255, 255, 0.05); }
  :global(.dark) .comment-input:focus { background: transparent; }
  :global(.dark) .comment-input::placeholder { color: rgba(255, 255, 255, 0.25); }
  .comment-textarea {
    padding: 0.75rem 1rem; border-radius: 1rem; font-size: 0.875rem;
    background: rgba(0, 0, 0, 0.03); border: 1px solid transparent; color: inherit; outline: none; transition: all 0.2s; line-height: 1.6;
  }
  .comment-textarea:focus { border-color: var(--primary); background: transparent; box-shadow: 0 0 0 3px oklch(0.75 0.14 var(--hue) / 0.1); }
  .comment-textarea::placeholder { color: rgba(0, 0, 0, 0.25); }
  :global(.dark) .comment-textarea { background: rgba(255, 255, 255, 0.05); }
  :global(.dark) .comment-textarea:focus { background: transparent; }
  :global(.dark) .comment-textarea::placeholder { color: rgba(255, 255, 255, 0.25); }
  .comment-submit-btn { background: var(--primary); color: white; }
  .comment-submit-btn:hover { filter: brightness(1.1); }
  .comment-item { background: var(--card-bg); border: 1px solid rgba(0, 0, 0, 0.04); }
  :global(.dark) .comment-item { border-color: rgba(255, 255, 255, 0.05); }
</style>
