import { showSliderDialog } from './module1.ts';
import { showStep1Dialog } from './module2_step1.ts';
import { showStep2Dialog } from './module2_step2.ts';

class App {
  private result1El: HTMLElement;
  private result2El: HTMLElement;

  private work1Value: number = 50;
  private work2Value: string = '';

  constructor() {
    this.result1El = document.querySelector<HTMLElement>('#result-1')!;
    this.result2El = document.querySelector<HTMLElement>('#result-2')!;

    window.electronAPI.onWork1(() => this.handleWork1());
    window.electronAPI.onWork2(() => this.handleWork2());
  }

  private async handleWork1(): Promise<void> {
    const result = await showSliderDialog(this.work1Value);
    if (result !== null) {
      this.work1Value = result;
      this.result1El.textContent = `Work 1 result: ${this.work1Value}`;
    }
  }

  private async handleWork2(): Promise<void> {
    let step1Value = this.work2Value;

    while (true) {
      const step1 = await showStep1Dialog(step1Value);

      if (step1.action === 'cancel') return;

      step1Value = step1.value;

      const step2 = await showStep2Dialog(step1Value);

      if (step2 === 'cancel') return;
      if (step2 === 'back') continue;

      this.work2Value = step1Value;
      this.result2El.textContent = `Work 2 result: ${this.work2Value || 'no value'}`;
      return;
    }
  }
}

new App();
