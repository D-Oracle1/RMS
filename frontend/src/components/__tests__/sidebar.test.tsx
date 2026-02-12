import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/admin',
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock auth-storage
jest.mock('@/lib/auth-storage', () => ({
  getUser: () => ({ firstName: 'Admin', lastName: 'User', role: 'ADMIN' }),
  clearAuth: jest.fn(),
}));

// Mock api
jest.mock('@/lib/api', () => ({
  getImageUrl: (path: string) => path,
}));

// Mock fetch for CMS branding
global.fetch = jest.fn().mockResolvedValue({
  ok: false,
  json: async () => null,
});

import { Sidebar } from '../layout/sidebar';

describe('Sidebar', () => {
  it('should render admin navigation items', () => {
    render(<Sidebar role="admin" />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Realtors')).toBeInTheDocument();
    expect(screen.getByText('Properties')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Commission')).toBeInTheDocument();
    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
  });

  it('should render realtor navigation items', () => {
    render(<Sidebar role="realtor" />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Sales')).toBeInTheDocument();
    expect(screen.getByText('Loyalty')).toBeInTheDocument();
    expect(screen.queryByText('Audit Logs')).not.toBeInTheDocument();
  });

  it('should render client navigation items', () => {
    render(<Sidebar role="client" />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Properties')).toBeInTheDocument();
    expect(screen.getByText('Offers')).toBeInTheDocument();
    expect(screen.queryByText('Sales')).not.toBeInTheDocument();
  });

  it('should render staff navigation items', () => {
    render(<Sidebar role="staff" />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Tasks')).toBeInTheDocument();
    expect(screen.getByText('Attendance')).toBeInTheDocument();
    expect(screen.getByText('Payslips')).toBeInTheDocument();
  });

  it('should show user name', () => {
    render(<Sidebar role="admin" />);

    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });

  it('should show logout button', () => {
    render(<Sidebar role="admin" />);

    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should show settings link', () => {
    render(<Sidebar role="admin" />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
});
