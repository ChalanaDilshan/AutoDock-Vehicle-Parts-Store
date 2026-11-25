// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import {
  Button,
  Input,
  Select,
  Badge,
  Card,
} from '../../src/shared/components/index.js';

describe('Shared UI Components', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Button', () => {
    it('renders children and handles click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Shop Now</Button>);

      const btn = screen.getByRole('button', { name: 'Shop Now' });
      expect(btn).toBeDefined();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disables button and shows aria-busy when isLoading is true', () => {
      const handleClick = vi.fn();
      render(
        <Button isLoading onClick={handleClick}>
          Saving
        </Button>
      );

      const btn = screen.getByRole('button', { name: 'Saving' }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
      expect(btn.getAttribute('aria-busy')).toBe('true');
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('applies variant and fullWidth classes', () => {
      render(
        <Button variant="danger" fullWidth>
          Delete
        </Button>
      );
      const btn = screen.getByRole('button', { name: 'Delete' });
      expect(btn.className).toContain('bg-rose-600');
      expect(btn.className).toContain('w-full');
    });
  });

  describe('Input', () => {
    it('links label with input and updates value on change', () => {
      const handleChange = vi.fn();
      render(
        <Input
          label="Part Number"
          placeholder="e.g. 04465-02220"
          onChange={handleChange}
        />
      );

      const input = screen.getByLabelText('Part Number') as HTMLInputElement;
      expect(input).toBeDefined();
      fireEvent.change(input, { target: { value: '04465-02220' } });
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('displays error message with aria-invalid when error prop is provided', () => {
      render(
        <Input
          label="Email"
          error="Valid email is required"
          helperText="Enter your account email"
        />
      );

      const input = screen.getByLabelText('Email');
      expect(input.getAttribute('aria-invalid')).toBe('true');
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toBe('Valid email is required');
      expect(screen.queryByText('Enter your account email')).toBeNull();
    });
  });

  describe('Select', () => {
    it('renders placeholder and options and handles selection change', () => {
      const handleChange = vi.fn();
      render(
        <Select
          label="Vehicle Make"
          placeholder="Select Make"
          options={[
            { value: 'toyota', label: 'Toyota' },
            { value: 'honda', label: 'Honda' },
          ]}
          onChange={handleChange}
        />
      );

      const select = screen.getByLabelText('Vehicle Make') as HTMLSelectElement;
      expect(screen.getByText('Select Make')).toBeDefined();
      expect(screen.getByText('Toyota')).toBeDefined();
      expect(screen.getByText('Honda')).toBeDefined();

      fireEvent.change(select, { target: { value: 'toyota' } });
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('displays error state cleanly', () => {
      render(<Select label="Model" error="Please choose a model" />);
      const select = screen.getByLabelText('Model');
      expect(select.getAttribute('aria-invalid')).toBe('true');
      expect(screen.getByRole('alert').textContent).toBe('Please choose a model');
    });
  });

  describe('Badge', () => {
    it('renders badge text with semantic variant styles', () => {
      render(<Badge variant="success">Exact Fit</Badge>);
      const badge = screen.getByText('Exact Fit');
      expect(badge).toBeDefined();
      expect(badge.className).toContain('bg-emerald-50');
      expect(badge.className).toContain('text-emerald-800');
    });
  });

  describe('Card', () => {
    it('renders card content with default and dark variants', () => {
      const { rerender } = render(
        <Card data-testid="test-card" hoverable>
          <p>Brake Disc Front</p>
        </Card>
      );
      const card = screen.getByTestId('test-card');
      expect(card.textContent).toContain('Brake Disc Front');
      expect(card.className).toContain('bg-white');
      expect(card.className).toContain('hover:shadow-sm');

      rerender(
        <Card data-testid="test-card" variant="dark">
          <p>Hero Banner</p>
        </Card>
      );
      expect(screen.getByTestId('test-card').className).toContain('bg-slate-900');
    });
  });
});
