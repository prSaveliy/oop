const overlayInnerHTML = `
  <div class="dialog">
    <h2 class="dialog__title">Work 1 - Select a number</h2>
    <div class="dialog__body">
      <label class="slider-label">
        Move the slider (1 – 100):
      </label>
      <div class="slider-row">
        <input class="slider" type="range" min="1" max="100" value="50" />
        <span class="slider-value">50</span>
      </div>
    </div>
    <div class="dialog__actions">
      <button class="btn btn--primary" data-action="ok">OK</button>
      <button class="btn btn--secondary" data-action="cancel">Cancel</button>
    </div>
  </div>
`;

class SliderDialog {
  private overlay: HTMLDivElement;
  private slider: HTMLInputElement;
  private valueLabel: HTMLSpanElement;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'dialog-overlay';
    this.overlay.innerHTML = overlayInnerHTML;

    this.slider = this.overlay.querySelector<HTMLInputElement>('.slider')!;
    this.valueLabel =
      this.overlay.querySelector<HTMLSpanElement>('.slider-value')!;
  }

  private mount(): void {
    document.body.appendChild(this.overlay);
  }

  private unmount(): void {
    document.body.removeChild(this.overlay);
  }

  private bindEvents(resolve: (value: number | null) => void): void {
    this.slider.addEventListener('input', () => {
      this.valueLabel.textContent = this.slider.value;
    });

    this.overlay
      .querySelector('[data-action="ok"]')!
      .addEventListener('click', () => {
        const value = Number(this.slider.value);
        this.unmount();
        resolve(value);
      });

    this.overlay
      .querySelector('[data-action="cancel"]')!
      .addEventListener('click', () => {
        this.unmount();
        resolve(null);
      });
  }

  show(): Promise<number | null> {
    return new Promise(resolve => {
      this.mount();
      this.bindEvents(resolve);
      this.slider.focus();
    });
  }
}

export function showSliderDialog(): Promise<number | null> {
  return new SliderDialog().show();
}
