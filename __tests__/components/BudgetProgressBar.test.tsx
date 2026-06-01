import { render } from '@testing-library/react';
import BudgetProgressBar from '@/components/categories/BudgetProgressBar';

function getProgressBar(container: HTMLElement) {
  return container.querySelector('.rounded-full.h-2 > div') as HTMLElement;
}

describe('BudgetProgressBar', () => {
  it('renders with indigo colour when usage is below warning threshold', () => {
    const { container } = render(
      <BudgetProgressBar usageRatio={0.5} isWarning={false} isExceeded={false} />,
    );
    const progressBar = getProgressBar(container);
    expect(progressBar.className).toContain('bg-indigo-500');
    expect(progressBar.style.width).toBe('50%');
  });

  it('renders with amber colour when in warning state', () => {
    const { container } = render(
      <BudgetProgressBar usageRatio={0.85} isWarning={true} isExceeded={false} />,
    );
    const progressBar = getProgressBar(container);
    expect(progressBar.className).toContain('bg-amber-500');
  });

  it('renders with red colour when budget is exceeded', () => {
    const { container } = render(
      <BudgetProgressBar usageRatio={1.2} isWarning={false} isExceeded={true} />,
    );
    const progressBar = getProgressBar(container);
    expect(progressBar.className).toContain('bg-red-500');
  });

  it('caps bar width at 100% when usage ratio exceeds 1', () => {
    const { container } = render(
      <BudgetProgressBar usageRatio={1.5} isWarning={false} isExceeded={true} />,
    );
    const progressBar = getProgressBar(container);
    expect(progressBar.style.width).toBe('100%');
  });

  it('renders 0% width when nothing has been spent', () => {
    const { container } = render(
      <BudgetProgressBar usageRatio={0} isWarning={false} isExceeded={false} />,
    );
    const progressBar = getProgressBar(container);
    expect(progressBar.style.width).toBe('0%');
  });
});
