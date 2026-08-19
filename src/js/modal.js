export class ModalManager {
  constructor() {
    this.modal = document.getElementById('reference-modal');
    this.openBtn = document.getElementById('btn-open-modal');
    this.closeBtn = document.getElementById('btn-close-modal');

    this.initEvents();
  }

  initEvents() {
    if (this.openBtn) {
      this.openBtn.addEventListener('click', () => this.open());
    }
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    window.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
        this.close();
      }
    });

    const tabBtns = document.querySelectorAll('.modal-tab-btn');
    const tabPanels = document.querySelectorAll('.modal-tab-panel');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');

        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.add('hidden'));

        btn.classList.add('active');
        const activePanel = document.getElementById(`tab-${targetTab}`);
        if (activePanel) {
          activePanel.classList.remove('hidden');
        }
      });
    });
  }

  open() {
    if (this.modal) {
      this.modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      this.renderMath();
    }
  }

  renderMath() {
    if (window.renderMathInElement && this.modal) {
      try {
        window.renderMathInElement(this.modal, {
          delimiters: [
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false }
          ],
          throwOnError: false
        });
      } catch (e) {
        console.warn('KaTeX render warning:', e);
      }
    }
  }

  close() {
    if (this.modal) {
      this.modal.classList.add('hidden');
      document.body.style.overflow = 'auto';
    }
  }
}
