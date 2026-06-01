import { render, screen, fireEvent } from '@testing-library/react';
import CategoryForm from '@/components/categories/CategoryForm';

function renderCategoryForm(overrides: Partial<React.ComponentProps<typeof CategoryForm>> = {}) {
  const onSubmit = jest.fn();
  const onCancel = jest.fn();
  const { container } = render(
    <CategoryForm submitting={false} onSubmit={onSubmit} onCancel={onCancel} {...overrides} />,
  );
  const submitForm = () => fireEvent.submit(container.querySelector('form')!);
  return { onSubmit, onCancel, submitForm };
}

describe('CategoryForm', () => {
  it('calls onSubmit with the entered values when the form is valid', () => {
    const { onSubmit, submitForm } = renderCategoryForm();

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Groceries' } });
    fireEvent.change(screen.getByLabelText(/maximum budget/i), { target: { value: '150' } });
    submitForm();

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Groceries',
      maxBudgetEuros: '150',
      endDate: '',
    });
  });

  it('shows a validation error and does not submit when name is empty', () => {
    const { onSubmit, submitForm } = renderCategoryForm();

    fireEvent.change(screen.getByLabelText(/maximum budget/i), { target: { value: '50' } });
    submitForm();

    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a validation error and does not submit when budget is zero or negative', () => {
    const { onSubmit, submitForm } = renderCategoryForm();

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Transport' } });
    fireEvent.change(screen.getByLabelText(/maximum budget/i), { target: { value: '0' } });
    submitForm();

    expect(screen.getByText(/positive number/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onCancel when the Cancel button is clicked', () => {
    const { onCancel } = renderCategoryForm();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('pre-fills fields from the initial prop', () => {
    renderCategoryForm({
      initial: { name: 'Rent', maxBudgetEuros: '800', endDate: '2025-12-31' },
    });

    expect(screen.getByLabelText(/name/i)).toHaveValue('Rent');
    expect(screen.getByLabelText(/maximum budget/i)).toHaveValue(800);
  });
});
