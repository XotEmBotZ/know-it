# Agent Instructions for Know-It

As an automated agent, you must strictly follow these rules:

## Branching Strategy

1.  **Do not modify `main`**: Never attempt to push changes, stage commits, or open pull requests directly targeting the `main` branch.
2.  **Base work on `development`**: Always create new feature branches from the `development` branch.
3.  **Target `development`**: All changes must be merged into the `development` branch before they can eventually reach `main`.

When starting a task, ensure you are on a branch derived from `development`.
