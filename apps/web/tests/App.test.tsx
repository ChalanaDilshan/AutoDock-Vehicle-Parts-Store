import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { App } from '../src/app/App.js';

describe('AutoDock Frontend Foundation Tests', () => {
  it('Renders AutoDock root application shell without crashing', () => {
    render(<App />);
    expect(screen.getAllByText(/Sri Lanka Vehicle Spare-Parts Marketplace/i).length).toBeGreaterThan(0);
    expect(screen.getByText('AUTO')).toBeDefined();
    expect(screen.getByText('DOCK')).toBeDefined();
  });
});
