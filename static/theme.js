// Shared theme toggle — included on every page
(function () {
  const root   = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const saved  = localStorage.getItem('theme') || 'light';

  root.setAttribute('data-theme', saved);
  if (toggle) toggle.textContent = saved === 'dark' ? '☀️' : '🌙';

  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      toggle.textContent = next === 'dark' ? '☀️' : '🌙';
    });
  }
})();
