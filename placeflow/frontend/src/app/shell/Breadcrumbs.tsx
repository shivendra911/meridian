import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const PATH_LABELS: Record<string, string> = {
  student: 'Student',
  tpo: 'TPO',
  faculty: 'Faculty',
  hod: 'HOD',
  management: 'Management',
  admin: 'Admin',
  home: 'Home',
  opportunities: 'Opportunities',
  applications: 'Applications',
  academics: 'Academics',
  profile: 'Profile',
  drives: 'Drives',
  companies: 'Companies',
  interviews: 'Interviews',
  offers: 'Offers',
  students: 'Students',
  analytics: 'Analytics',
  mentees: 'Mentees',
  courses: 'Courses',
  outcomes: 'Outcomes',
  compliance: 'Compliance',
  hierarchy: 'Hierarchy',
  iam: 'Access Management',
  account: 'Account',
  security: 'Security',
  notifications: 'Notifications',
  privacy: 'Privacy',
};

export const Breadcrumbs: React.FC<{ className?: string }> = ({ className = '' }) => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  // Build breadcrumb items
  const items = segments.map((seg, idx) => {
    const path = '/' + segments.slice(0, idx + 1).join('/');
    const label = PATH_LABELS[seg.toLowerCase()] || seg.charAt(0).toUpperCase() + seg.slice(1);
    const isLast = idx === segments.length - 1;
    return { label, path, isLast };
  });

  // Limit to max 3 levels: if > 3, show first, ellipsis, and last 2
  const displayItems =
    items.length > 3
      ? [items[0], { label: '...', path: '', isLast: false }, ...items.slice(-2)]
      : items;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-xs ${className}`}>
      {displayItems.map((item, idx) => {
        const isLast = idx === displayItems.length - 1;

        return (
          <React.Fragment key={item.path || idx}>
            {idx > 0 && <span className="text-slate-300 font-normal">/</span>}
            {isLast || !item.path ? (
              <span className="font-medium text-ink truncate max-w-[140px] sm:max-w-xs" aria-current={isLast ? 'page' : undefined}>
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="text-ink-muted hover:text-ink transition-colors truncate max-w-[100px]"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
