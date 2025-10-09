# ARGUS Design Guidelines

## Overview

ARGUS is a full-stack application for identity verification and business services. This document outlines the design system, color palette, typography, components, and usage guidelines to ensure consistency across the application.

## Color Palette

### Primary Colors

#### Blue (Primary Brand Color)

- **Primary Blue**: `#1a73e8`
  - Usage: Primary buttons, links, active states, focus indicators
  - Hover: `#287ae6`
  - Light mode text: `#1a73e8`
  - Dark mode text: `#4dabf7`

#### Supporting Blues

- **Light Blue**: `#e3f2fd`
  - Usage: Subtle backgrounds, hover states
- **Medium Blue**: `#bbdefb`
  - Usage: Card backgrounds, secondary elements

### Neutral Colors

#### Light Mode

- **White**: `#ffffff`
  - Usage: Primary backgrounds, cards
- **Gray-50**: `#f9fafb`
  - Usage: Page backgrounds, subtle sections
- **Gray-100**: `#f3f4f6`
  - Usage: Card backgrounds, input backgrounds
- **Gray-200**: `#e5e7eb`
  - Usage: Borders, dividers
- **Gray-300**: `#d1d5db`
  - Usage: Disabled states, subtle borders
- **Gray-400**: `#9ca3af`
  - Usage: Placeholder text, secondary text
- **Gray-500**: `#6b7280`
  - Usage: Body text, labels
- **Gray-600**: `#4b5563`
  - Usage: Headings, emphasized text
- **Gray-700**: `#374151`
  - Usage: Strong text, navigation
- **Gray-800**: `#1f2937`
  - Usage: Dark headings
- **Gray-900**: `#111827`
  - Usage: Very dark text

#### Dark Mode

- **Dark-900**: `#0f172a`
  - Usage: Primary backgrounds
- **Dark-800**: `#1e293b`
  - Usage: Card backgrounds, secondary sections
- **Dark-700**: `#334155`
  - Usage: Hover states, active elements
- **Dark-600**: `#475569`
  - Usage: Body text
- **Dark-500**: `#64748b`
  - Usage: Secondary text, labels
- **Dark-400**: `#94a3b8`
  - Usage: Placeholder text, disabled text
- **Dark-300**: `#cbd5e1`
  - Usage: Borders, dividers
- **Dark-200**: `#e2e8f0`
  - Usage: Subtle borders
- **Dark-100**: `#f1f5f9`
  - Usage: Light accents

### Semantic Colors

#### Success

- **Green-500**: `#10b981`
  - Usage: Success messages, confirmations
- **Green-100**: `#d1fae5`
  - Usage: Success backgrounds

#### Warning

- **Yellow-500**: `#f59e0b`
  - Usage: Warning messages
- **Yellow-100**: `#fef3c7`
  - Usage: Warning backgrounds

#### Error

- **Red-500**: `#ef4444`
  - Usage: Error messages, destructive actions
- **Red-100**: `#fee2e2`
  - Usage: Error backgrounds

## Typography

### Font Family

- **Primary Font**: `font-sans` (System font stack)
  - Light mode: Default system fonts
  - Dark mode: Default system fonts
- **Monospace**: `font-mono` (For code snippets, API keys)

### Font Sizes

- **xs**: `0.75rem` (12px) - Small labels, captions
- **sm**: `0.875rem` (14px) - Secondary text, buttons
- **base**: `1rem` (16px) - Body text, inputs
- **lg**: `1.125rem` (18px) - Large body text
- **xl**: `1.25rem` (20px) - Small headings
- **2xl**: `1.5rem` (24px) - Card titles, section headers
- **3xl**: `1.875rem` (30px) - Page titles
- **4xl**: `2.25rem` (36px) - Hero titles, logos

### Font Weights

- **normal**: `400` - Body text
- **medium**: `500` - Buttons, labels
- **semibold**: `600` - Headings, emphasized text
- **bold**: `700` - Strong headings, logos

### Line Heights

- **tight**: `1.25` - Headings
- **normal**: `1.5` - Body text
- **relaxed**: `1.625` - Large text blocks

## Assets

### Logo

- **Primary Logo**: "ARGUS" text in bold, blue (#1a73e8)
- **Font**: Sans-serif, 4xl size
- **Usage**: Header, login page, loading screens

### Icons

- **Icon Library**: Lucide React
- **Common Icons**:
  - User: `User`
  - Settings: `Settings`
  - Search: `Search`
  - Check: `Check`
  - X: `X`
  - Chevron Right: `ChevronRight`
  - Eye: `Eye` / `EyeOff` (password toggle)

### Illustrations

- **Globe**: `globe.svg` - For global services
- **File**: `file.svg` - For documents/verification
- **Window**: `window.svg` - For web/app context

## Components

### Buttons

#### Primary Button

```tsx
<button className="h-[44px] w-full rounded-md bg-[#1a73e8] px-6 text-sm font-medium text-white hover:bg-[#287ae6] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300">
  Button Text
</button>
```

#### Secondary Button

```tsx
<button className="h-[44px] w-full rounded-md border border-gray-300 bg-white px-6 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300">
  Button Text
</button>
```

#### Loading Button

```tsx
<button
  disabled
  className="h-[44px] w-full rounded-md bg-[#1a73e8] px-6 text-sm font-medium text-white opacity-60 cursor-not-allowed"
>
  <span className="flex items-center justify-center">
    <svg
      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    Loading...
  </span>
</button>
```

### Form Components

#### Text Input (Floating Label)

```tsx
<div className="relative mt-6">
  <input
    id="email"
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="peer block w-full rounded-lg border-0 border-b border-gray-300 bg-transparent px-3 pt-9 pb-2 text-base text-gray-900 placeholder-transparent focus:border-blue-600 focus:outline-none transition-colors duration-300"
    placeholder=" "
  />
  <label
    htmlFor="email"
    className={`absolute left-3 text-base text-gray-500 transition-all duration-300 pointer-events-none ${
      value
        ? "top-1 text-xs text-blue-600"
        : "top-4 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600"
    }`}
  >
    Email or phone
  </label>
</div>
```

#### Select Dropdown

```tsx
<select className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors duration-300">
  <option value="">Select option</option>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</select>
```

#### Checkbox

```tsx
<label className="flex items-center">
  <input
    type="checkbox"
    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 focus:ring-2"
  />
  <span className="ml-2 text-sm text-gray-700">Remember me</span>
</label>
```

### Cards

#### Basic Card

```tsx
<div className="rounded-2xl border border-gray-200 bg-white px-6 py-8 shadow-sm">
  <h3 className="text-lg font-medium text-gray-900 mb-4">Card Title</h3>
  <p className="text-gray-600">Card content goes here.</p>
</div>
```

#### Stats Card

```tsx
<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-600">Total Users</p>
      <p className="text-2xl font-bold text-gray-900">1,234</p>
    </div>
    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
      <svg
        className="h-6 w-6 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
        />
      </svg>
    </div>
  </div>
</div>
```

### Navigation

#### Header

```tsx
<header className="bg-white border-b border-gray-200 px-6 py-4">
  <div className="flex items-center justify-between">
    <div className="text-2xl font-bold text-blue-600">ARGUS</div>
    <nav className="flex items-center space-x-6">
      <a
        href="/"
        className="text-gray-600 hover:text-blue-600 transition-colors"
      >
        Dashboard
      </a>
      <a
        href="/verification"
        className="text-gray-600 hover:text-blue-600 transition-colors"
      >
        Verification
      </a>
      <a
        href="/analytics"
        className="text-gray-600 hover:text-blue-600 transition-colors"
      >
        Analytics
      </a>
    </nav>
  </div>
</header>
```

#### Breadcrumbs

```tsx
<nav className="flex mb-4" aria-label="Breadcrumb">
  <ol className="flex items-center space-x-2">
    <li>
      <a
        href="/"
        className="text-gray-500 hover:text-blue-600 transition-colors"
      >
        Home
      </a>
    </li>
    <li className="text-gray-400">/</li>
    <li>
      <a
        href="/verification"
        className="text-gray-500 hover:text-blue-600 transition-colors"
      >
        Verification
      </a>
    </li>
    <li className="text-gray-400">/</li>
    <li className="text-gray-900 font-medium">Personal Verification</li>
  </ol>
</nav>
```

### Tables

#### Data Table

```tsx
<div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Name
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Status
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      <tr>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          John Doe
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            Active
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <button className="text-blue-600 hover:text-blue-900">Edit</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Modals/Dialogs

#### Basic Modal

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
  <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium text-gray-900">Confirm Action</h3>
      <button className="text-gray-400 hover:text-gray-600">
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
    <p className="text-gray-600 mb-6">Are you sure you want to proceed?</p>
    <div className="flex justify-end space-x-3">
      <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
        Cancel
      </button>
      <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
        Confirm
      </button>
    </div>
  </div>
</div>
```

### Notifications/Toast

#### Success Toast

```tsx
<div className="fixed top-4 right-4 z-50 max-w-sm rounded-lg bg-green-50 border border-green-200 p-4 shadow-lg">
  <div className="flex items-start">
    <div className="flex-shrink-0">
      <svg
        className="h-5 w-5 text-green-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <div className="ml-3">
      <p className="text-sm font-medium text-green-800">Success!</p>
      <p className="text-sm text-green-700">
        Operation completed successfully.
      </p>
    </div>
    <button className="ml-auto text-green-400 hover:text-green-600">
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>
</div>
```

#### Error Toast

```tsx
<div className="fixed top-4 right-4 z-50 max-w-sm rounded-lg bg-red-50 border border-red-200 p-4 shadow-lg">
  <div className="flex items-start">
    <div className="flex-shrink-0">
      <svg
        className="h-5 w-5 text-red-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <div className="ml-3">
      <p className="text-sm font-medium text-red-800">Error!</p>
      <p className="text-sm text-red-700">
        Something went wrong. Please try again.
      </p>
    </div>
  </div>
</div>
```

### Loading States

#### Skeleton Loader

```tsx
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
</div>
```

#### Spinner

```tsx
<div className="flex items-center justify-center">
  <svg
    className="animate-spin h-8 w-8 text-blue-600"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
</div>
```

## Layout Patterns

### Page Layout

```tsx
<div className="min-h-screen bg-gray-50">
  <header className="bg-white border-b border-gray-200">
    {/* Header content */}
  </header>
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">{/* Main content */}</div>
      <div>{/* Sidebar */}</div>
    </div>
  </main>
</div>
```

### Form Layout

```tsx
<div className="max-w-md mx-auto">
  <form className="space-y-6">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Field Label
      </label>
      <input
        type="text"
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
      />
    </div>
    <button
      type="submit"
      className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
    >
      Submit
    </button>
  </form>
</div>
```

## Animations

### CSS Keyframes

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}
```

### Usage Classes

- `animate-fadeIn`: For page/component entrance
- `animate-slideUp`: For staggered content appearance
- `animate-shake`: For error states
- `transition-all duration-300`: For hover effects
- `hover:scale-105`: For interactive elements

## Responsive Design

### Breakpoints

- **sm**: 640px and up
- **md**: 768px and up
- **lg**: 1024px and up
- **xl**: 1280px and up
- **2xl**: 1536px and up

### Responsive Utilities

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>

<div className="text-sm md:text-base lg:text-lg">
  {/* Responsive text */}
</div>

<div className="px-4 sm:px-6 lg:px-8">
  {/* Responsive padding */}
</div>
```

## Accessibility

### Focus States

- All interactive elements must have visible focus indicators
- Use `focus:outline-none focus:ring-2 focus:ring-blue-600` for custom focus styles

### Color Contrast

- Text on background: Minimum 4.5:1 contrast ratio
- Large text: Minimum 3:1 contrast ratio
- Interactive elements: Clear visual distinction

### Semantic HTML

- Use proper heading hierarchy (h1, h2, h3, etc.)
- Use semantic elements (`<main>`, `<nav>`, `<section>`, `<article>`)
- Provide alt text for images
- Use ARIA labels where necessary

### Keyboard Navigation

- All interactive elements accessible via keyboard
- Logical tab order
- Skip links for main content areas

## Dark Mode Implementation

### Theme Toggle

```tsx
const [darkMode, setDarkMode] = useState(false);

const toggleTheme = () => {
  setDarkMode(!darkMode);
  document.documentElement.classList.toggle("dark");
};
```

### Dark Mode Classes

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  {/* Content that changes with theme */}
</div>
```

## Best Practices

### Consistency

- Use design tokens (colors, spacing, typography) consistently
- Follow established patterns for similar interactions
- Maintain visual hierarchy

### Performance

- Optimize images and assets
- Use CSS transitions over JavaScript animations
- Minimize layout shifts

### User Experience

- Provide clear feedback for all actions
- Use progressive disclosure for complex forms
- Maintain consistent navigation patterns

### Maintenance

- Document component variations
- Use CSS custom properties for theming
- Keep design system up to date with application changes

## Tools & Resources

### Development Tools

- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **React Router**: Navigation
- **React Hook Form**: Form management

### Design Tools

- **Figma**: Design collaboration
- **Coolors**: Color palette generation
- **Google Fonts**: Typography exploration

### Testing

- **Storybook**: Component documentation
- **Chromatic**: Visual regression testing
- **Lighthouse**: Performance auditing

---

_This design system is living documentation. Please update it as the application evolves and new patterns emerge._</content>
<parameter name="filePath">c:\Faaris\Node\freelance\frontend\design-guidelines.md
