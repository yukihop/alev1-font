const THEME_KEY = 'alev-docs-theme';

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const label = document.querySelector('[data-theme-label]');
  if (label) {
    label.textContent = theme === 'dark' ? 'Dark' : 'Light';
  }
}

function setupThemeToggle() {
  const button = document.querySelector('[data-theme-toggle]');
  if (!button) {
    return;
  }

  const currentTheme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  applyTheme(currentTheme);

  button.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
  });
}

function setupLigatureTesters() {
  for (const tester of document.querySelectorAll('[data-alev-tester]')) {
    const input = tester.querySelector('[data-alev-input]');
    const preview = tester.querySelector('[data-alev-preview]');
    if (!(input instanceof HTMLTextAreaElement) || !(preview instanceof HTMLElement)) {
      continue;
    }

    const sync = () => {
      preview.textContent = input.value;
    };

    input.addEventListener('input', sync);
    sync();
  }
}

setupThemeToggle();
setupLigatureTesters();
