# Contributing to Know-It

Thank you for your interest in contributing to Know-It!

## Branching Strategy

To maintain a stable and reliable codebase, we adhere to the following branching strategy:

1.  **Never push directly to `main`**: The `main` branch is protected and reserved for production-ready releases. No direct changes should ever be made to this branch.
2.  **Use Feature Branches**: All new features, bug fixes, or experiments should be developed on a dedicated feature branch.
3.  **Branch from `development`**: Always create your feature branches from the `development` branch.
4.  **Merge back to `development`**: Once your work is complete, tested, and reviewed, merge your feature branch back into the `development` branch.

### Workflow Example:

## Frontend Development

We use [shadcn/ui](https://ui.shadcn.com/) for our UI components. When building new features:

1.  **Prefer Existing Components**: Check `src/components/ui` for existing components before adding new ones.
2.  **Add New Components**: Use the shadcn CLI to add new components: `bunx shadcn@latest add <component-name>`.
3.  **Styling**: Use Tailwind CSS for custom styling, following the established design system.
