You have established a "manual" workflow that works perfectly for your setup. Here is your **Daily Cheat Sheet**.

Save this somewhere safe. You will do this every single time you want to code.

### 1\. Prerequisites (Before you type)

  * **Turn on Docker Desktop:** Make sure the "Whale" icon is running in your Windows taskbar.
  * **Open your WSL Terminal:** Open Ubuntu.

### 2\. The Commands (Do this in order)

**Step 1: Go to the folder**

```bash
cd ~/openSource/talawa-api
```

**Step 2: Enter the "Box" (The Magic Command)**
This command builds the container (if needed), logs you inside it, and **opens the ports** so your browser can see it.

```bash
docker compose run --rm --service-ports api bash
```

*(Wait until the prompt changes to `talawa ➜ ...`)*

**Step 3: Start the Server**
Now that you are inside, turn on the engine.

```bash
npm run start_development_server
```

### 3\. Verification

  * Wait for the log: `Server listening at http://127.0.0.1:4000`
  * Open your browser to: **[http://localhost:4000/graphql](https://www.google.com/search?q=http://localhost:4000/graphql)**

### 4\. How to Stop

When you are done for the day:

1.  Press **`Ctrl + C`** (to stop the server).
2.  Type **`exit`** and press Enter (to leave the container).
3.  Type **`docker compose down`** (optional, to clean up the database containers if you want to save RAM).

**That's it.** No more installation. Just code.


Yes, exactly. Your remotes are **perfect**.

  * **`origin`**: Points to **your** GitHub (where you push code).
  * **`upstream`**: Points to **Palisadoes** (where you pull updates).

Now you need the "Git Recipe." This is the exact sequence of commands you will run for **every single contribution** you make for GSoC.

### ⚠️ The Golden Rule

**NEVER** work on the `main` branch.
Palisadoes requires you to work on the **`develop`** branch. If you submit a PR from `main`, they might reject it.

-----

### The "Contributor's Cycle" (Save this)


#### 2\. Start a New Task (Do this for every bug)

Before you fix a bug, create a "Save Slot" (Branch). Give it a name that matches the issue, like `fix-typo-readme`.

```bash
# 1. Make sure you are up to date
git checkout develop
git pull upstream develop

# 2. Create your feature branch
git checkout -b fix/issue-name
```

\*\*

#### 3\. Save Your Work (After editing files)

When you have edited the code in VS Code:

```bash
# See what files you changed
git status

# Stage the files (Prepare them)
git add .

# Save them (Commit)
git commit -m "fix: described what I changed"
```

#### 4\. Upload (Push)

Send the code to **your** GitHub fork.

```bash
git push origin fix/issue-name
```

-----

### What happens next?

1.  Go to your GitHub repository in your browser (`github.com/NavyasreeBalu/talawa-api`).
2.  You will see a yellow button: **"Compare & Pull Request"**.
3.  Click it.
4.  **Crucial:** Make sure the "Base repository" says **`develop`** (not `main`)..
5.  Submit\!

-----

## Additional Commands for Development

### Testing Commands
```bash
# Run specific test file
npm run test test/path/to/your.test.ts

# Run all tests
npm run test

# Check code coverage
npm run check_tests

# Fix formatting issues
npm run format:fix
```

### Issue Selection & Setup (Do this FIRST)
Before touching any code:
1. Check if issue is available (not assigned to someone else)
2. Comment "I'd like to work on this" on the GitHub issue  
3. Wait for maintainer approval (usually @palisadoes or team)
4. Only then start coding

### PR Best Practices

#### Before submitting:
- [ ] Tests pass locally (`npm run test`)
- [ ] Code is formatted (`npm run format:fix`) 
- [ ] PR title follows format: `type: description (Fixes #issue-number)`
- [ ] All CI checks are green
- [ ] Linked to correct issue number
- [ ] Base branch is `develop` (not `main`)

#### Common Issue Types:
- `test:` - Adding test coverage
- `fix:` - Bug fixes  
- `feat:` - New features
- `docs:` - Documentation updates
- `refactor:` - Code improvements

### Troubleshooting
- **Redis errors during tests**: Normal, tests should still run
- **"No test files found"**: Check file path and naming
- **CI failing**: Usually formatting issues, run `npm run format:fix`
- **PR rejected**: Check if you're targeting `develop` branch
