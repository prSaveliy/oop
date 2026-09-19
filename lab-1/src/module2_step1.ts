export type Step1Result = 'next' | 'cancel';

const makeOverlayInnerHTML = (initialValue: string) => `
  <div class="dialog">
    <h2 class="dialog__title">Setup Wizard - Step 1 of 2</h2>
    <div class="dialog__body">
      <label class="field-label" for="step1-input">
        Enter your name or parameter:
      </label>
      <input
        class="text-input"
        id="step1-input"
        type="text"
        placeholder="e.g. Savelii"
        value="${initialValue}"
      />
    </div>
    <div class="dialog__actions">
      <button class="btn btn--primary" data-action="next">Next &rsaquo;</button>
      <button class="btn btn--secondary" data-action="cancel">Cancel</button>
    </div>
  </div>
`;

class Step1Dialog {
  private overlay: HTMLDivElement;
  private input: HTMLInputElement;

  constructor(initialValue: string = '') {
    this.overlay = document.createElement('div');
    this.overlay.className = 'dialog-overlay';
    this.overlay.innerHTML = makeOverlayInnerHTML(initialValue);

    this.input = this.overlay.querySelector<HTMLInputElement>('#step1-input')!;
  }

  private mount(): void {
    document.body.appendChild(this.overlay);
  }

  private unmount(): void {
    document.body.removeChild(this.overlay);
  }

  private bindEvents(
    resolve: (result: { action: Step1Result; value: string }) => void,
  ): void {
    this.overlay
      .querySelector('[data-action="next"]')!
      .addEventListener('click', () => {
        const value = this.input.value.trim();
        this.unmount();
        resolve({ action: 'next', value });
      });

    this.overlay
      .querySelector('[data-action="cancel"]')!
      .addEventListener('click', () => {
        this.unmount();
        resolve({ action: 'cancel', value: '' });
      });
  }

  show(): Promise<{ action: Step1Result; value: string }> {
    return new Promise(resolve => {
      this.mount();
      this.bindEvents(resolve);
      this.input.focus();
    });
  }
}

export function showStep1Dialog(
  initialValue?: string,
): Promise<{ action: Step1Result; value: string }> {
  return new Step1Dialog(initialValue).show();
}
