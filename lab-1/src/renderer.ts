import { showSliderDialog } from './module1.ts';
import { showStep1Dialog } from './module2_step1.ts';
import { showStep2Dialog } from './module2_step2.ts';

class App {
  private result1El: HTMLElement;
  private result2El: HTMLElement;

  constructor() {
    this.result1El = document.querySelector<HTMLElement>('#result-1')!;
    this.result2El = document.querySelector<HTMLElement>('#result-2')!;

    window.electronAPI.onWork1(() => this.handleWork1());
    window.electronAPI.onWork2(() => this.handleWork2());
  }

  private async handleWork1(): Promise<void> {
    const result = await showSliderDialog();
    if (result !== null) {
      this.result1El.textContent = `Work 1 result: ${result}`;
    }
  }

  private async handleWork2(): Promise<void> {
    let step1Value = '';

    while (true) {
      const step1 = await showStep1Dialog(step1Value);

      if (step1.action === 'cancel') return;

      step1Value = step1.value;

      const step2 = await showStep2Dialog(step1Value);

      if (step2 === 'cancel') return;
      if (step2 === 'back') continue;

      this.result2El.textContent = `Work 2 result: ${step1Value || 'no value'}`;
      return;
    }
  }
}

new App();
