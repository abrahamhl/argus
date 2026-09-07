# Dependency Policy

## The Absolute Rule
**`pnpm` ONLY.**
No `npm`, `yarn`, `bun`, or `pnpm dlx`.

## Vetting Process
Before adding a dependency, the following must be reviewed:
1. **Purpose:** Is it strictly necessary or can we use a Node native API?
2. **License:** Is it compatible with our strategy (e.g., MIT, Apache-2.0)?
3. **Maintenance:** Is the package actively maintained?
4. **Security:** Does it have known vulnerabilities?
5. **Transitives:** How many transitive dependencies does it drag in?

Any PR adding an unapproved dependency will be rejected.
