// Small helper utilities for Auth context
// Map backend role names (including legacy variants) to canonical frontend roles
export const mapBackendRoleToFrontend = (backendRole: string): 'chairman' | 'admin' | 'staff' | 'client' => {
  const r = String(backendRole || '').trim().toLowerCase();
  switch (r) {
    case 'admin':
    case 'company_admin':
    case 'companny_admin':
    case 'branch_head':
    case 'branch_admin':
    case 'manager':
      return 'admin';
    case 'branch_staff':
    case 'staff':
      return 'staff';
    case 'chairman':
      return 'chairman';
    case 'client':
      return 'client';
    default:
      return (r as any) || 'client';
  }
};

export const extractErrorMessage = (err: unknown): string => {
  if (!err) return 'An error occurred';
  if (err instanceof Error) return err.message;
  // Try to extract from axios-like error shape
  try {
    const maybe = err as { response?: { data?: { message?: string } } };
    const msg = maybe.response?.data?.message;
    return msg || JSON.stringify(err);
  } catch {
    return String(err);
  }
};
