# Agent Instructions for Know-It

As an automated agent, you must strictly follow these rules:

## Branching Strategy

1.  **Do not modify `main`**: Never attempt to push changes, stage commits, or open pull requests directly targeting the `main` branch.
2.  **Base work on `development`**: Always create new feature branches from the `development` branch.
3.  **Target `development`**: All changes must be merged into the `development` branch before they can eventually reach `main`.

## Frontend Guidelines

1.  **UI Components**: Use [shadcn/ui](https://ui.shadcn.com/) for all UI components. 
2.  **Adding Components**: To add a new shadcn component, use the command: `bunx shadcn@latest add <component-name>`.
3.  **Component Location**: All UI components must reside in `src/components/ui`.
4.  **Consistency**: Maintain visual consistency by following the existing Tailwind CSS patterns and shadcn configurations.
