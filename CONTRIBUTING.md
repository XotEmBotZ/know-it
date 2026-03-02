# Contributing to Know-It

Thank you for your interest in contributing to Know-It!

## Branching Strategy

To maintain a stable and reliable codebase, we adhere to the following branching strategy:

1.  **Never push directly to `main`**: The `main` branch is protected and reserved for production-ready releases. No direct changes should ever be made to this branch.
2.  **Use Feature Branches**: All new features, bug fixes, or experiments should be developed on a dedicated feature branch.
3.  **Branch from `development`**: Always create your feature branches from the `development` branch.
4.  **Merge back to `development`**: Once your work is complete, tested, and reviewed, merge your feature branch back into the `development` branch.

### Workflow Example:

1.  Update your local `development` branch: `git checkout development && git pull`
2.  Create your feature branch: `git checkout -b feature/your-feature-name`
3.  Commit your changes and push: `git push origin feature/your-feature-name`
4.  Open a Pull Request into the `development` branch.
