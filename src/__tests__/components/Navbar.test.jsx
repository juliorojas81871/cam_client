import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithThemeAndRouter } from '../../testUtils';
import Navbar from '../../components/Navbar';

describe('Navbar Component', () => {
  test('renders the navbar with title', () => {
    renderWithThemeAndRouter(<Navbar />);
    
    expect(screen.getByText('CAM Ventures')).toBeInTheDocument();
  });

  test('renders all navigation links', () => {
    renderWithThemeAndRouter(<Navbar />);
    
    expect(screen.getByText('Properties')).toBeInTheDocument();
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByText('Owned Properties')).toBeInTheDocument();
    expect(screen.getByText('Leased Properties')).toBeInTheDocument();
  });

  test('navigation links have correct href attributes', () => {
    renderWithThemeAndRouter(<Navbar />);
    
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
    
    // Check that we have the expected hrefs
    const hrefs = links.map(link => link.getAttribute('href'));
    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/map');
    expect(hrefs).toContain('/owned');
    expect(hrefs).toContain('/leased');
  });

  test('renders with correct Material-UI icons', () => {
    renderWithThemeAndRouter(<Navbar />);
    
    // Check that the buttons contain icons by looking for data-testid attributes or svg elements
    const buttons = screen.getAllByRole('link');
    expect(buttons).toHaveLength(4);
    
    // Each button should contain an svg element (the Material-UI icon)
    buttons.forEach(button => {
      const svg = button.querySelector('svg');
      expect(svg).toBeTruthy();
    });
  });

  test('navbar has proper Material-UI styling', () => {
    renderWithThemeAndRouter(<Navbar />);
    
    const appBar = screen.getByRole('banner');
    expect(appBar).toHaveClass('MuiAppBar-root');
  });

  test('navigation buttons are accessible', () => {
    renderWithThemeAndRouter(<Navbar />);
    
    const buttons = screen.getAllByRole('link');
    expect(buttons).toHaveLength(4);
    
    buttons.forEach(button => {
      expect(button).toHaveAttribute('href');
    });
  });
}); 