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
    padding: 1.5rem;
    border-radius: var(--radius-large);
    background: var(--card-bg);
    border: 1px solid var(--line-divider);
    transition: all 0.2s;
  }
</style>
