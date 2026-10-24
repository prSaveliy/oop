import type { ShapeMode } from './shape_objects_editor.ts';

export interface ToolBarCallbacks {
  onSelectMode: (mode: ShapeMode) => void;
  onClear: () => void;
}

interface ToolButtonConfig {
  id: ShapeMode | 'clear';
  name: string;
  tooltip: string;
  isAction?: boolean;
  svg: string;
}

export class ToolBar {
  private container: HTMLElement;
  private tooltipEl: HTMLElement;
  private buttons: Map<string, HTMLButtonElement> = new Map();
  private activeMode: ShapeMode = 'point';

  private readonly tools: ToolButtonConfig[] = [
    {
      id: 'point',
      name: 'Крапка',
      tooltip: 'Крапка (Ctrl+1)',
      svg: '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
    },
    {
      id: 'line',
      name: 'Лінія',
      tooltip: 'Лінія (Ctrl+2)',
      svg: '<svg viewBox="0 0 24 24" width="18" height="18"><line x1="5" y1="19" x2="19" y2="5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
    },
    {
      id: 'rect',
      name: 'Прямокутник',
      tooltip: 'Прямокутник (Ctrl+3)',
      svg: '<svg viewBox="0 0 24 24" width="18" height="18"><rect x="4" y="5" width="16" height="14" fill="#38bdf8" stroke="currentColor" stroke-width="2" rx="1"/></svg>',
    },
    {
      id: 'ellipse',
      name: 'Еліпс',
      tooltip: 'Еліпс (Ctrl+4)',
      svg: '<svg viewBox="0 0 24 24" width="18" height="18"><ellipse cx="12" cy="12" rx="9" ry="6" fill="#ffffff" stroke="currentColor" stroke-width="2"/></svg>',
    },
    {
      id: 'clear',
      name: 'Очистити',
      tooltip: 'Очистити полотно (Ctrl+N)',
      isAction: true,
      svg: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    },
  ];

  constructor(
    containerSelector: string,
    tooltipSelector: string,
    private readonly callbacks: ToolBarCallbacks,
  ) {
    this.container = document.querySelector<HTMLElement>(containerSelector)!;
    this.tooltipEl = document.querySelector<HTMLElement>(tooltipSelector)!;

    this.render();
    this.setActive('point');
  }

  private render(): void {
    this.container.innerHTML = '';

    for (const config of this.tools) {
      if (config.isAction) {
        const sep = document.createElement('div');
        sep.className = 'toolbar-separator';
        this.container.appendChild(sep);
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'toolbar-btn';
      btn.dataset.id = config.id;
      btn.setAttribute('aria-label', config.name);
      btn.innerHTML = config.svg;

      btn.addEventListener('click', () => {
        if (config.isAction) {
          if (config.id === 'clear') {
            this.callbacks.onClear();
          }
        } else {
          this.setActive(config.id as ShapeMode);
          this.callbacks.onSelectMode(config.id as ShapeMode);
        }
      });

      btn.addEventListener('mouseenter', e => {
        this.showTooltip(config.tooltip, e.currentTarget as HTMLElement);
      });

      btn.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });

      this.buttons.set(config.id, btn);
      this.container.appendChild(btn);
    }
  }

  setActive(mode: ShapeMode): void {
    this.activeMode = mode;
    this.buttons.forEach((btn, id) => {
      if (id === mode) {
        btn.classList.add('is-pressed');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('is-pressed');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  }

  getActiveMode(): ShapeMode {
    return this.activeMode;
  }

  private showTooltip(text: string, anchorEl: HTMLElement): void {
    this.tooltipEl.textContent = text;
    this.tooltipEl.hidden = false;

    const rect = anchorEl.getBoundingClientRect();
    const tooltipRect = this.tooltipEl.getBoundingClientRect();

    const left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    const top = rect.bottom + 6;

    this.tooltipEl.style.left = `${Math.max(4, left)}px`;
    this.tooltipEl.style.top = `${top}px`;
  }

  private hideTooltip(): void {
    this.tooltipEl.hidden = true;
  }
}
