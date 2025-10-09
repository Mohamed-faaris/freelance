# Argus Design Guidelines

A comprehensive guide for building consistent, accessible, and beautiful UI in the Argus project. This document covers color palettes, typography, layout, component patterns, accessibility, and best practices for both light and dark modes.

---

## 1. Color System

### Light Mode

| Name       | Hex     | Usage                        |
| ---------- | ------- | ---------------------------- |
| Primary    | #1A73E8 | Buttons, links, highlights   |
| Secondary  | #F1F3F4 | Backgrounds, cards, inputs   |
| Accent     | #34A853 | Success, active states       |
| Error      | #EA4335 | Error messages, alerts       |
| Warning    | #FBBC05 | Warnings, notifications      |
| Info       | #4285F4 | Info banners, tooltips       |
| Text Main  | #202124 | Main text                    |
| Text Muted | #5F6368 | Secondary text, placeholders |
| Border     | #E0E0E0 | Dividers, input borders      |
| Background | #FFFFFF | Page background              |

### Dark Mode

| Name       | Hex     | Usage                        |
| ---------- | ------- | ---------------------------- |
| Primary    | #8AB4F8 | Buttons, links, highlights   |
| Secondary  | #303134 | Backgrounds, cards, inputs   |
| Accent     | #81C995 | Success, active states       |
| Error      | #FF6D6D | Error messages, alerts       |
| Warning    | #FFD666 | Warnings, notifications      |
| Info       | #AECBFA | Info banners, tooltips       |
| Text Main  | #E8EAED | Main text                    |
| Text Muted | #B0B3B8 | Secondary text, placeholders |
| Border     | #5F6368 | Dividers, input borders      |
| Background | #202124 | Page background              |

---

## 2. Typography

| Style     | Font Family            | Weight | Size     | Usage                    |
| --------- | ---------------------- | ------ | -------- | ------------------------ |
| Heading 1 | 'Inter', sans-serif    | 700    | 2.25rem  | Page titles              |
| Heading 2 | 'Inter', sans-serif    | 600    | 1.5rem   | Section headers          |
| Heading 3 | 'Inter', sans-serif    | 500    | 1.25rem  | Subsection headers       |
| Body      | 'Inter', sans-serif    | 400    | 1rem     | Main content             |
| Caption   | 'Inter', sans-serif    | 400    | 0.875rem | Helper text, labels      |
| Button    | 'Inter', sans-serif    | 600    | 1rem     | Button text              |
| Code      | 'Fira Mono', monospace | 400    | 0.95rem  | Inline code, code blocks |

- **Line Height:** 1.5 for body, 1.2 for headings
- **Letter Spacing:** 0.01em for body, 0.02em for headings

---

## 3. Spacing & Layout

- **Spacing Scale:** 4px, 8px, 12px, 16px, 24px, 32px, 40px, 64px
- **Container Widths:**
  - Mobile: 100% (max 448px)
  - Tablet: 100% (max 720px)
  - Desktop: 100% (max 1200px)
- **Border Radius:**
  - Small: 4px
  - Medium: 8px
  - Large: 16px
- **Elevation:**
  - Card: 0 2px 8px rgba(32,33,36,0.08)
  - Modal: 0 4px 24px rgba(32,33,36,0.16)

---

## 4. Accessibility (A11y)

- **Contrast:** All text must meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- **Focus States:** Use clear outlines (2px solid #1A73E8 for light, #8AB4F8 for dark)
- **Keyboard Navigation:** All interactive elements must be reachable via Tab
- **ARIA Labels:** Use `aria-label`, `aria-labelledby`, and roles for custom components
- **Screen Reader Support:** Use semantic HTML and landmarks
- **Motion:** Avoid excessive animation; respect `prefers-reduced-motion`

---

## 5. Component Patterns & Examples

### 5.1 Button

```tsx
<button className="bg-[#1A73E8] text-white rounded-md px-4 py-2 font-semibold hover:bg-[#287ae6] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] disabled:opacity-60 transition-all duration-200">
  Primary Button
</button>
```

### 5.2 Card

```tsx
<div className="bg-white dark:bg-[#303134] rounded-2xl shadow p-6 border border-gray-200 dark:border-[#5F6368]">
  <h2 className="text-xl font-semibold mb-2">Card Title</h2>
  <p className="text-gray-700 dark:text-[#B0B3B8]">Card content goes here.</p>
</div>
```

### 5.3 Input Field

```tsx
<input className="w-full rounded-lg border border-gray-300 dark:border-[#5F6368] px-3 py-2 text-base text-gray-900 dark:text-[#E8EAED] bg-transparent focus:border-blue-600 focus:outline-none transition-colors duration-300" />
```

### 5.4 Alert

```tsx
<div className="bg-[#EA4335] text-white rounded-md px-4 py-2 font-medium">
  Error: Something went wrong!
</div>
```

### 5.5 Modal

```tsx
<div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
  <div className="bg-white dark:bg-[#303134] rounded-xl p-8 shadow-lg w-full max-w-md">
    <h3 className="text-lg font-bold mb-4">Modal Title</h3>
    <p className="mb-6">Modal content goes here.</p>
    <button className="bg-[#1A73E8] text-white rounded px-4 py-2">Close</button>
  </div>
</div>
```

### 5.6 Toast

```tsx
<div className="fixed bottom-6 right-6 bg-[#34A853] text-white px-4 py-2 rounded shadow-lg animate-fadeIn">
  Success! Your changes have been saved.
</div>
```

### 5.7 Navigation Bar

```tsx
<nav className="bg-white dark:bg-[#202124] border-b border-gray-200 dark:border-[#5F6368] px-6 py-3 flex items-center justify-between">
  <div className="font-bold text-blue-600 dark:text-[#8AB4F8]">ARGUS</div>
  <ul className="flex gap-6 text-gray-700 dark:text-[#B0B3B8]">
    <li>
      <a href="/" className="hover:text-blue-600">
        Home
      </a>
    </li>
    <li>
      <a href="/dashboard" className="hover:text-blue-600">
        Dashboard
      </a>
    </li>
    <li>
      <a href="/profile" className="hover:text-blue-600">
        Profile
      </a>
    </li>
  </ul>
</nav>
```

### 5.8 Table

```tsx
<table className="min-w-full bg-white dark:bg-[#303134] rounded-lg overflow-hidden">
  <thead>
    <tr className="bg-[#F1F3F4] dark:bg-[#202124]">
      <th className="px-4 py-2 text-left text-gray-600 dark:text-[#B0B3B8]">Name</th>
      <th className="px-4 py-2 text-left text-gray-600 dark:text-[#B0B3B8]">Role</th>
      <th className="px-4 py-2 text-left text-gray-600 dark:text-[#B0B3B8]">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td className="px-4 py-2">John Doe</td>
      <td className="px-4 py-2">Admin</td>
      <td className="px-4 py-2">Active</td>
    </tr>
    <!-- More rows -->
  </tbody>
</table>
```

### 5.9 Avatar

```tsx
<img
  src="/public/logo.png"
  alt="User Avatar"
  className="w-10 h-10 rounded-full border-2 border-blue-600"
/>
```

### 5.10 Tabs

```tsx
<div className="flex gap-2 border-b border-gray-200 dark:border-[#5F6368]">
  <button className="px-4 py-2 font-medium text-blue-600 border-b-2 border-blue-600">
    Tab 1
  </button>
  <button className="px-4 py-2 font-medium text-gray-600 hover:text-blue-600">
    Tab 2
  </button>
</div>
```

---

## 6. Iconography

- Use Lucide React icons for consistency
- Size: 20px for inline, 24px for buttons
- Color: `currentColor` for easy theming

---

## 7. Best Practices

- Use semantic HTML for structure
- Prefer utility classes (Tailwind) for rapid prototyping
- Keep components stateless when possible
- Use context for global state (e.g., Auth, Theme)
- Test accessibility with screen readers and keyboard navigation
- Document all custom components

---

## 8. Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Lucide React Icons](https://lucide.dev/icons)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [Google Fonts: Inter](https://fonts.google.com/specimen/Inter)
- [Figma Design File](#) (link to your design system)

---

_This guide is a living document. Update as the design system evolves._
