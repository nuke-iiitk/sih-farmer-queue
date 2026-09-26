import type { Href } from 'expo-router';

import { APP_ICONS, type AppIconName } from '../components/iconGlyphs';
import { path } from '../navigation';

/**
 * ── HEADER MEGA-MENU STRUCTURE (data only) ─────────────────────────────────
 *
 * The portal header used to list every destination on the bar. This module
 * replaces that flat list with a hierarchy: seven sections, each opening a
 * full-width mega panel whose left column lists the section's sub-categories
 * (rails) and whose main column lists the pages of the selected rail.
 *
 * Editing rules (keep it honest):
 *  - `href` is ALWAYS a route from `src/navigation.ts`. Nothing here invents a
 *    page, so no link can 404.
 *  - A page may appear in two *different* sections when it genuinely serves
 *    both (Statutory Awards is both a project approval and a compensation
 *    input); it never appears twice inside one section.
 *  - `description` is the one-line "what you get" caption under the title.
 *  - `aside` is the right-hand contextual column: related registers, never a
 *    second copy of the section's own pages.
 *  - Labels are English, matching the existing nav labels (the i18n dictionary
 *    covers page copy; nav group labels have always been literal).
 */

export type MegaLink = {
  /** Menu title — the portal's vocabulary, kept close to the domain terms. */
  label: string;
  /** Short caption explaining what the destination shows. */
  description: string;
  href: Href;
};

/** A sub-category in the panel's left column. */
export type MegaRail = {
  key: string;
  label: string;
  icon: AppIconName;
  links: MegaLink[];
};

export type MegaSection = {
  key: string;
  /** Short label on the header bar (the requested header line). */
  label: string;
  /** Fuller title shown inside the panel. */
  title: string;
  /** Section hub — the panel's bottom "View all …" action. */
  hub: Href;
  rails: MegaRail[];
  aside: {
    title: string;
    links: MegaLink[];
  };
};

export const MEGA_SECTIONS: MegaSection[] = [
  {
    key: 'acquisition',
    label: 'Land Acquisition',
    title: 'Land Acquisition',
    hub: path.workflow,
    rails: [
      {
        key: 'overview',
        label: 'Acquisition Overview',
        icon: APP_ICONS.grid,
        links: [
          {
            label: 'Acquisition Overview',
            description: 'Statutory nine-stage process under the RFCTLARR Act, 2013',
            href: path.workflow,
          },
          {
            label: 'Acquisition Status',
            description: 'Stage-wise progress with possession status and timeline',
            href: path.possession,
          },
        ],
      },
      {
        key: 'proposals',
        label: 'Proposals',
        icon: APP_ICONS.documentText,
        links: [
          {
            label: 'New Acquisition',
            description: 'File a fresh acquisition proposal through the guided wizard',
            href: path.proposal,
          },
          {
            label: 'Acquisition Proposals',
            description: 'Proposals filed by this nodal office, with current stage',
            href: path.bookings,
          },
        ],
      },
      {
        key: 'identification',
        label: 'Land Identification',
        icon: APP_ICONS.location,
        links: [
          {
            label: 'Land Identification',
            description: 'Identify and shortlist notified land parcels by district',
            href: path.parcels,
          },
          {
            label: 'GIS / Map View',
            description: 'Corridor-wise spatial and cadastral viewer',
            href: path.gis,
          },
        ],
      },
    ],
    aside: {
      title: 'Related registers',
      links: [
        {
          label: 'Documents & Gazette',
          description: 'Published notifications and statutory records',
          href: path.documents,
        },
        {
          label: 'Statutory Awards',
          description: 'Section 23 and 26–30 award register',
          href: path.awards,
        },
        {
          label: 'Compensation',
          description: 'Assessment, disbursement and audit trail',
          href: path.compensation,
        },
      ],
    },
  },

  {
    key: 'projects',
    label: 'Projects',
    title: 'Projects',
    hub: path.projects,
    rails: [
      {
        key: 'portfolio',
        label: 'Project Portfolio',
        icon: APP_ICONS.clipboard,
        links: [
          {
            label: 'Active Projects',
            description: 'Corridor-wise register with live acquisition stage',
            href: path.projects,
          },
          {
            label: 'Project Dashboard',
            description: 'National indicators and decision support actions',
            href: path.dashboard,
          },
        ],
      },
      {
        key: 'approvals',
        label: 'Approvals & Awards',
        icon: APP_ICONS.receipt,
        links: [
          {
            label: 'Statutory Awards',
            description: 'Section 23 and 26–30 award register with approval status',
            href: path.awards,
          },
          {
            label: 'Statutory Alerts',
            description: 'Section 19 and 23 milestone and compliance alerts',
            href: path.alerts,
          },
        ],
      },
      {
        key: 'progress',
        label: 'Progress & Possession',
        icon: APP_ICONS.pulse,
        links: [
          {
            label: 'Project Progress',
            description: 'Land acquired, balance area and possession milestones',
            href: path.possession,
          },
          {
            label: 'Project Timeline',
            description: 'Statutory milestone chain and stage-wise due dates',
            href: path.workflow,
          },
        ],
      },
    ],
    aside: {
      title: 'Cross-checks',
      links: [
        {
          label: 'Compensation',
          description: 'Disbursement status against each award',
          href: path.compensation,
        },
        {
          label: 'GIS / Map View',
          description: 'Corridor and parcel boundaries on the map',
          href: path.gis,
        },
        {
          label: 'Reports & Analytics',
          description: 'Project, land and financial reports',
          href: path.reports,
        },
      ],
    },
  },
  {
    key: 'assets',
    label: 'Land & Assets',
    title: 'Land & Assets',
    hub: path.parcels,
    rails: [
      {
        key: 'records',
        label: 'Land Records',
        icon: APP_ICONS.map,
        links: [
          {
            label: 'Land Records & Parcels',
            description: 'State, district and village-wise parcel register',
            href: path.parcels,
          },
          {
            label: 'Parcel Information & Ownership Details',
            description: 'Owner of record, survey details and title documents',
            href: path.documents,
          },
        ],
      },
      {
        key: 'spatial',
        label: 'Spatial & Survey Data',
        icon: APP_ICONS.globe,
        links: [
          {
            label: 'GIS / Map View',
            description: 'Plot boundaries, survey layers and acquisition zones',
            href: path.gis,
          },
          {
            label: 'Land by Project',
            description: 'Land proposed, acquired and in balance per corridor',
            href: path.projects,
          },
        ],
      },
    ],
    aside: {
      title: 'Verify',
      links: [
        {
          label: 'Statutory Awards',
          description: 'Valuation and award basis for each parcel',
          href: path.awards,
        },
        {
          label: 'Compensation',
          description: 'Payment position against the parcel register',
          href: path.compensation,
        },
        {
          label: 'Statutory Alerts',
          description: 'Pending notifications and compliance dates',
          href: path.alerts,
        },
      ],
    },
  },

  {
    key: 'documents',
    label: 'Documents',
    title: 'Documents & Records',
    hub: path.documents,
    rails: [
      {
        key: 'repository',
        label: 'Document Repository',
        icon: APP_ICONS.fileTray,
        links: [
          {
            label: 'Document Repository',
            description: 'Gazette notifications, uploads and digital records',
            href: path.documents,
          },
          {
            label: 'Approvals & Digital Records',
            description: 'Section 23 and 26–30 award copies held on record',
            href: path.awards,
          },
        ],
      },
      {
        key: 'verification',
        label: 'Verification & Alerts',
        icon: APP_ICONS.notifications,
        links: [
          {
            label: 'Verification & Approvals',
            description: 'Stage verification with pending statutory approvals',
            href: path.alerts,
          },
          {
            label: 'Possession Records',
            description: 'Possession certificates and handover verification',
            href: path.possession,
          },
        ],
      },
    ],
    aside: {
      title: 'Compliance',
      links: [
        {
          label: 'Compensation',
          description: 'Disbursement vouchers and audit trail',
          href: path.compensation,
        },
        {
          label: 'Rehabilitation & Resettlement',
          description: 'R&R entitlement records for affected families',
          href: path.rr,
        },
        {
          label: 'Reports & Analytics',
          description: 'Statutory audit reports register',
          href: path.reports,
        },
      ],
    },
  },

  {
    key: 'compensation',
    label: 'Compensation',
    title: 'Compensation & R&R',
    hub: path.compensation,
    rails: [
      {
        key: 'assessment',
        label: 'Compensation',
        icon: APP_ICONS.currency,
        links: [
          {
            label: 'Compensation Assessment',
            description: 'Award-wise computation, payment status and audit trail',
            href: path.compensation,
          },
          {
            label: 'Compensation History',
            description: 'Award basis and valuation inputs under Section 23',
            href: path.awards,
          },
        ],
      },
      {
        key: 'beneficiaries',
        label: 'R&R & Beneficiaries',
        icon: APP_ICONS.people,
        links: [
          {
            label: 'R&R & Beneficiary Details',
            description: 'Entitlement packages, resettlement progress and family registry',
            href: path.rr,
          },
        ],
      },
    ],
    aside: {
      title: 'Linked registers',
      links: [
        {
          label: 'Documents & Gazette',
          description: 'Notification and award documents',
          href: path.documents,
        },
        {
          label: 'Reports & Analytics',
          description: 'Financial reports and disbursement audits',
          href: path.reports,
        },
        {
          label: 'Statutory Alerts',
          description: 'Payment and compliance deadlines',
          href: path.alerts,
        },
      ],
    },
  },

  {
    key: 'reports',
    label: 'Reports',
    title: 'Reports & Analytics',
    hub: path.reports,
    rails: [
      {
        key: 'analytics',
        label: 'Reports & Analytics',
        icon: APP_ICONS.barChart,
        links: [
          {
            label: 'Acquisition Reports',
            description: 'Project, land and financial reports with audit register',
            href: path.reports,
          },
          {
            label: 'Land Statistics',
            description: 'Notified, acquired and balance land by state and use',
            href: path.gis,
          },
        ],
      },
      {
        key: 'statistics',
        label: 'National Statistics',
        icon: APP_ICONS.pieChart,
        links: [
          {
            label: 'Project Analytics',
            description: 'Corridor-wise progress and stage distribution',
            href: path.projects,
          },
          {
            label: 'Statutory Dashboards',
            description: 'Consolidated national indicators and decision support',
            href: path.dashboard,
          },
        ],
      },
      {
        key: 'financial',
        label: 'Financial Monitoring',
        icon: APP_ICONS.wallet,
        links: [
          {
            label: 'Financial Reports',
            description: 'Compensation outlay, disbursement and balance',
            href: path.compensation,
          },
        ],
      },
    ],
    aside: {
      title: 'Data sources',
      links: [
        {
          label: 'Statutory Awards',
          description: 'Award register behind every report',
          href: path.awards,
        },
        {
          label: 'Documents & Gazette',
          description: 'Source notifications and audit documents',
          href: path.documents,
        },
        {
          label: 'Statutory Alerts',
          description: 'Overdue milestones flagged nationally',
          href: path.alerts,
        },
      ],
    },
  },

  {
    key: 'administration',
    label: 'Administration',
    title: 'Administration',
    hub: path.administration,
    rails: [
      {
        key: 'system',
        label: 'System Administration',
        icon: APP_ICONS.shieldCheckmark,
        links: [
          {
            label: 'User Management',
            description: 'Nodal offices, users and role-based data scopes',
            href: path.administration,
          },
        ],
      },
      {
        key: 'node',
        label: 'Node & Access',
        icon: APP_ICONS.person,
        links: [
          {
            label: 'System Settings',
            description: 'Node profile, jurisdiction scope and portal preferences',
            href: path.profile,
          },
          {
            label: 'Agency Registration',
            description: 'Register a new department or agency node',
            href: path.register,
          },
          {
            label: 'Officer Login',
            description: 'Sign in for nodal officers and competent authorities',
            href: path.login,
          },
        ],
      },
    ],
    aside: {
      title: 'Official portals',
      links: [
        {
          label: 'Portal Home',
          description: 'Public landing page and entry point to all services',
          href: path.home,
        },
        {
          label: 'SLAO / Competent Authority Portal',
          description: 'Secure officer login with DigiLocker / Parichay',
          href: path.officialLogin,
        },
        {
          label: 'About the System',
          description: 'Architecture, Act reference and service scope',
          href: path.about,
        },
        {
          label: 'Help & Legal Acts',
          description: 'User manual, SOPs and RFCTLARR legal help',
          href: path.help,
        },
      ],
    },
  },

];

