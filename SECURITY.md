# Security Policy

## Data Protection

### ✅ Your Data is Already Protected

**Good news!** Your application stores all user data in the browser's `localStorage`, which means:
- **No data is stored in the Git repository** - All activities, comments, and user data remain on the user's device
- **Data cannot be accessed by downloading the repository** - The repository only contains code, not user data
- **Each user has their own isolated data** - Data is stored locally in their browser

### How It Works

The application uses browser `localStorage` to store:
- Activity records (sport, work, goals)
- Comments and notes
- All user-specific data

This data is **never** committed to Git or uploaded to GitHub.

## Repository Protection

### Current Status
- ✅ Repository is public (code is visible)
- ✅ Data is NOT in the repository (stored in browser localStorage)
- ✅ Only you can modify the repository (no collaborators)

### Can Someone Modify Your Repository?

**No, they cannot directly modify your repository** because:
1. They are not collaborators
2. They don't have write access
3. They can only view and clone the code

**However**, they can:
- Fork your repository (create their own copy)
- Create pull requests (which you can accept or reject)
- Clone and modify locally (but cannot push to your repo)

### Protecting Your Repository

To further protect your repository, you can:

1. **Enable Branch Protection** (GitHub Settings):
   - Go to Settings → Branches
   - Add a branch protection rule for `main`
   - Require pull request reviews before merging
   - Require status checks to pass

2. **Review Pull Requests Carefully**:
   - Always review code changes before accepting
   - Never accept pull requests that add data files

3. **Never Commit Sensitive Data**:
   - Never commit API keys, passwords, or tokens
   - Use environment variables for secrets
   - Keep using localStorage for user data

## Best Practices

### ✅ DO:
- Keep user data in localStorage (current implementation)
- Review all pull requests before merging
- Use `.gitignore` to exclude sensitive files
- Keep the repository public for code sharing

### ❌ DON'T:
- Never commit user data files
- Never commit API keys or secrets
- Never accept pull requests without review
- Don't add server-side storage without proper security

## Reporting Security Issues

If you discover a security vulnerability, please:
1. Do NOT create a public issue
2. Contact the repository owner privately
3. Provide details about the vulnerability

## Questions?

If you have questions about data protection or repository security, please open an issue.

