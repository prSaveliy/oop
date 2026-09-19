export type Step2Result = 'back' | 'ok' | 'cancel';

const makeOverlayInnerHTML = (step1Value: string) => `
  <div class="dialog">
    <h2 class="dialog__title">Setup Wizard - Step 2 of 2</h2>
    <div class="dialog__body">
      <p class="confirm-text">
        Step 1 parameter: <strong>"${step1Value || '(empty)'}"</strong>
      </p>
      <p class="confirm-text">Confirm applying parameters?</p>
    </div>
    <div class="dialog__actions dialog__actions--three">
      <button class="btn btn--secondary" data-action="back">&lsaquo; Back</button>
      <button class="btn btn--primary" data-action="ok">OK</button>
      <button class="btn btn--secondary" data-action="cancel">Cancel</button>
    </div>
  </div>
`;

class Step2Dialog {
  private overlay: HTMLDivElement;

  constructor(private readonly step1Value: string) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'dialog-overlay';
    this.overlay.innerHTML = makeOverlayInnerHTML(this.step1Value);
  }

  private mount(): void {
    document.body.appendChild(this.overlay);
  }

  private unmount(): void {
    document.body.removeChild(this.overlay);
  }

  private bindEvents(resolve: (result: Step2Result) => void): void {
    this.overlay
      .querySelector('[data-action="back"]')!
      .addEventListener('click', () => {
        this.unmount();
        resolve('back');
      });

    this.overlay
      .querySelector('[data-action="ok"]')!
      .addEventListener('click', () => {
        this.unmount();
        resolve('ok');
      });

    this.overlay
      .querySelector('[data-action="cancel"]')!
      .addEventListener('click', () => {
        this.unmount();
        resolve('cancel');
      });
  }

  show(): Promise<Step2Result> {
    return new Promise(resolve => {
      this.mount();
      this.bindEvents(resolve);
    });
  }
}

export function showStep2Dialog(step1Value: string): Promise<Step2Result> {
  return new Step2Dialog(step1Value).show();
}
