<script>
  import { onMount } from 'svelte';

  let commentsEl;
  let commentsInstance;
  let observer;

  onMount(() => {
    // 1. 动态加载 CWD 脚本
    if (!window.CWDComments) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/cwd-widget@0.1.x/dist/cwd.js';
      script.async = true;
      script.onload = () => {
        initCWD();
      };
      script.onerror = () => {
        console.error('Failed to load CWD widget script');
      };
      document.body.appendChild(script);
    } else {
      initCWD();
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
      if (commentsInstance && typeof commentsInstance.unmount === 'function') {
        commentsInstance.unmount();
      }
    };
  });

  function initCWD() {
    if (window.CWDComments && commentsEl) {
      commentsInstance = new window.CWDComments({
        el: commentsEl,
        apiBaseUrl: 'https://cwd-api.zou2973496443.workers.dev',
        siteId: 'fuwari-blog',
        postSlug: window.location.pathname,
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      });
      commentsInstance.mount();

      // 注入自定义 CSS 到 Shadow DOM 以细化样式对齐
      const customStyle = document.createElement('style');
      customStyle.textContent = `
        /* 覆盖 CWD 原生 CSS 变量以对齐博客主题颜色与样式 */
        .cwd-comments-container {
          --cwd-primary: var(--primary) !important;
          --cwd-primary-hover: var(--primary) !important;
          --cwd-radius: var(--radius-large) !important;
          --cwd-border: var(--line-divider) !important;
          --cwd-border-light: var(--line-divider) !important;
          --cwd-bg: var(--card-bg) !important;
        }

        .cwd-comments-container[data-theme="light"] {
          --cwd-text: rgba(0, 0, 0, 0.85) !important;
          --cwd-text-secondary: rgba(0, 0, 0, 0.45) !important;
          --cwd-bg-input: rgba(0, 0, 0, 0.03) !important;
          --cwd-bg-secondary: rgba(0, 0, 0, 0.02) !important;
          --cwd-bg-reply: rgba(0, 0, 0, 0.02) !important;
          --cwd-bg-hover: rgba(0, 0, 0, 0.03) !important;
          --cwd-bg-disabled: rgba(0, 0, 0, 0.05) !important;
          --cwd-bg-avatar: rgba(0, 0, 0, 0.05) !important;
        }

        .cwd-comments-container[data-theme="dark"] {
          --cwd-text: rgba(255, 255, 255, 0.85) !important;
          --cwd-text-secondary: rgba(255, 255, 255, 0.45) !important;
          --cwd-bg-input: rgba(255, 255, 255, 0.05) !important;
          --cwd-bg-secondary: rgba(255, 255, 255, 0.03) !important;
          --cwd-bg-reply: rgba(255, 255, 255, 0.03) !important;
          --cwd-bg-hover: rgba(255, 255, 255, 0.05) !important;
          --cwd-bg-disabled: rgba(255, 255, 255, 0.06) !important;
          --cwd-bg-avatar: rgba(255, 255, 255, 0.05) !important;
        }

        .cwd-container {
          font-family: inherit !important;
          background: transparent !important;
          color: var(--cwd-text) !important;
        }

        .cwd-comment-content {
          white-space: pre-wrap !important;
        }

        /* 头部统计与喜欢按钮 */
        .cwd-header {
          border-bottom: 1px solid var(--cwd-border) !important;
          padding: 0.75rem 0.25rem !important;
          margin-bottom: 1.5rem !important;
        }
        .cwd-count {
          font-size: 1.125rem !important;
          font-weight: 800 !important;
          color: var(--cwd-text) !important;
        }
        .cwd-like-button {
          font-family: inherit !important;
          font-size: 0.875rem !important;
          border-radius: var(--cwd-radius) !important;
          background: var(--cwd-bg-secondary) !important;
          border: 1px solid var(--cwd-border) !important;
          color: var(--cwd-text) !important;
          padding: 6px 14px !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
        }
        .cwd-like-button:hover {
          background: var(--cwd-bg-hover) !important;
        }
        .cwd-like-button[data-liked="true"] {
          background: rgba(232, 105, 147, 0.1) !important;
          border-color: var(--cwd-primary) !important;
          color: var(--cwd-primary) !important;
        }
        .cwd-like-icon-wrapper {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .cwd-like-icon {
          width: 1rem !important;
          height: 1rem !important;
          fill: none !important;
          stroke: currentColor !important;
          stroke-width: 2 !important;
        }
        .cwd-like-button[data-liked="true"] .cwd-like-icon {
          fill: currentColor !important;
        }

        /* 主评论表单 */
        .cwd-comment-form {
          background: var(--cwd-bg) !important;
          border: 1px solid var(--cwd-border) !important;
          border-radius: var(--cwd-radius) !important;
          box-shadow: none !important;
          padding: 1.25rem !important;
          margin-bottom: 1.5rem !important;
        }

        /* 回复编辑器 */
        .cwd-reply-editor {
          background: var(--cwd-bg-reply) !important;
          border: 1px solid var(--cwd-border) !important;
          border-radius: var(--cwd-radius) !important;
          padding: 0.75rem !important;
          margin-top: 0.75rem !important;
        }

        /* 输入框与文本域 */
        .cwd-form-field input,
        .cwd-form-field textarea,
        .cwd-reply-textarea,
        .cwd-form-input {
          font-family: inherit !important;
          border-radius: var(--cwd-radius) !important;
          background: var(--cwd-bg-input) !important;
          border: 1px solid var(--cwd-border) !important;
          color: var(--cwd-text) !important;
          outline: none !important;
          transition: all 0.2s !important;
        }
        .cwd-form-field input:focus,
        .cwd-form-field textarea:focus,
        .cwd-reply-textarea:focus,
        .cwd-form-input:focus {
          border-color: var(--cwd-primary) !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        /* 按钮样式 */
        .cwd-btn {
          font-family: inherit !important;
          border-radius: var(--cwd-radius) !important;
          font-weight: bold !important;
          transition: all 0.2s !important;
        }
        .cwd-btn-primary {
          background: var(--cwd-primary) !important;
          color: #fff !important;
        }
        .cwd-btn-primary:hover:not(:disabled) {
          filter: brightness(1.1) !important;
        }
        .cwd-btn-secondary {
          background: var(--cwd-bg-secondary) !important;
          border: 1px solid var(--cwd-border) !important;
          color: var(--cwd-text) !important;
        }
        .cwd-btn-secondary:hover:not(:disabled) {
          background: var(--cwd-bg-hover) !important;
        }

        /* 卡片式的评论项列表 */
        .cwd-comment-item:not(.cwd-comment-reply) {
          background: var(--cwd-bg) !important;
          border: 1px solid var(--cwd-border) !important;
          border-radius: var(--cwd-radius) !important;
          padding: 1.25rem !important;
          margin-bottom: 1rem !important;
        }
        .cwd-comment-reply {
          border-bottom: 1px dashed var(--cwd-border-light) !important;
          padding: 0.75rem 0 !important;
        }
        .cwd-comment-reply:last-child {
          border-bottom: none !important;
        }

        /* 嵌套回复分割线 */
        .cwd-replies {
          border-left: 2px solid var(--cwd-border-light) !important;
          padding-left: 1rem !important;
          margin-top: 0.75rem !important;
        }

        /* 博主/站长徽章 */
        .cwd-admin-badge {
          background: var(--cwd-primary) !important;
          color: #fff !important;
          border-radius: 4px !important;
          font-weight: bold !important;
          padding: 1px 6px !important;
          font-size: 10px !important;
        }

        /* 分页器 */
        .cwd-page-btn, .cwd-page-num {
          font-family: inherit !important;
          border-radius: var(--cwd-radius) !important;
          background: var(--cwd-bg-secondary) !important;
          border: 1px solid var(--cwd-border) !important;
          color: var(--cwd-text) !important;
          transition: all 0.2s !important;
        }
        .cwd-page-btn:hover:not(:disabled), .cwd-page-num:hover {
          background: var(--cwd-bg-hover) !important;
        }
        .cwd-page-num-active {
          background: var(--cwd-primary) !important;
          color: #fff !important;
          border-color: var(--cwd-primary) !important;
        }

        /* 管理员验证弹窗 */
        .cwd-modal-overlay {
          backdrop-filter: blur(8px) !important;
          background: rgba(0, 0, 0, 0.4) !important;
        }
        .cwd-modal {
          background: var(--cwd-bg) !important;
          border-radius: var(--cwd-radius) !important;
          border: 1px solid var(--cwd-border) !important;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15) !important;
          padding: 1.5rem !important;
        }
        .cwd-modal-title {
          font-family: inherit !important;
          font-size: 1.25rem !important;
          font-weight: bold !important;
          color: var(--cwd-text) !important;
          margin-bottom: 0.75rem !important;
        }
        .cwd-modal-desc {
          font-size: 0.875rem !important;
          color: var(--cwd-text-secondary) !important;
          margin-bottom: 1rem !important;
        }
        .cwd-modal-actions {
          margin-top: 1.25rem !important;
          display: flex !important;
          justify-content: flex-end !important;
          gap: 10px !important;
        }

        /* 链接交互 */
        .cwd-author-name a {
          color: var(--cwd-text) !important;
        }
        .cwd-author-name a:hover {
          color: var(--cwd-primary) !important;
          text-decoration: underline !important;
        }
        .cwd-comment-like-button-liked {
          color: var(--cwd-primary) !important;
        }
        .cwd-action-btn:hover {
          color: var(--cwd-primary) !important;
        }
      `;
      commentsEl.shadowRoot.appendChild(customStyle);

      // 监听博客主题切换
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class' && commentsInstance) {
            const isDark = document.documentElement.classList.contains('dark');
            commentsInstance.updateConfig({
              theme: isDark ? 'dark' : 'light'
            });
          }
        });
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
    }
  }
</script>

<div bind:this={commentsEl} class="cwd-comments-wrapper mt-6"></div>

<style>
  .cwd-comments-wrapper {
    width: 100%;
    margin-top: 1.5rem;
    transition: all 0.2s;

    /* Theme colors */
    --cwd-primary: var(--primary);
    --cwd-primary-hover: var(--primary);
    --cwd-radius: var(--radius-large);
    
    /* Light mode values */
    --cwd-text: rgba(0, 0, 0, 0.85);
    --cwd-text-secondary: rgba(0, 0, 0, 0.45);
    --cwd-bg: var(--card-bg);
    --cwd-bg-input: rgba(0, 0, 0, 0.03);
    --cwd-bg-secondary: rgba(0, 0, 0, 0.02);
    --cwd-bg-reply: rgba(0, 0, 0, 0.02);
    --cwd-bg-hover: rgba(0, 0, 0, 0.03);
    --cwd-bg-disabled: rgba(0, 0, 0, 0.05);
    --cwd-bg-avatar: rgba(0, 0, 0, 0.05);
    --cwd-border: var(--line-divider);
    --cwd-border-light: var(--line-divider);
  }

  :global(.dark) .cwd-comments-wrapper {
    /* Dark mode values */
    --cwd-text: rgba(255, 255, 255, 0.85);
    --cwd-text-secondary: rgba(255, 255, 255, 0.45);
    --cwd-bg: var(--card-bg);
    --cwd-bg-input: rgba(255, 255, 255, 0.05);
    --cwd-bg-secondary: rgba(255, 255, 255, 0.03);
    --cwd-bg-reply: rgba(255, 255, 255, 0.03);
    --cwd-bg-hover: rgba(255, 255, 255, 0.05);
    --cwd-bg-disabled: rgba(255, 255, 255, 0.06);
    --cwd-bg-avatar: rgba(255, 255, 255, 0.05);
    --cwd-border: var(--line-divider);
    --cwd-border-light: var(--line-divider);
  }
</style>
