/**
 * Sync, render-blocking script that applies the user's theme on first paint,
 * before the body is committed to the screen. Prevents the dark→light flash.
 *
 * Read order: localStorage → system preference → default (dark).
 */
export function ThemeScript() {
  const code = `
    (function () {
      try {
        var key = 'pl-theme';
        var stored = localStorage.getItem(key);
        var system = window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark';
        var theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
        var root = document.documentElement;
        root.setAttribute('data-theme', theme);
        root.style.colorScheme = theme;
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    })();
  `;
  return (
    <script
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
}
