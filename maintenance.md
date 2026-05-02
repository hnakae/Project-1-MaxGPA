# Project Setup & Maintenance

## Required: Node.js Version

This project requires **Node.js v22**. Running v23+ will break the build with this error:

```text
TypeError: (0 , _build.default) is not a function
```

### If you have Homebrew Node installed (common issue)

Homebrew Node shadows nvm, so `nvm use 22` will appear to work but `node --version` still shows the wrong version. Fix it once:

```bash
brew unlink node
```

Then open a **new terminal tab** and continue below.

### Switch to Node 22 with nvm

```bash
nvm install 22   # skip if already installed
nvm use 22
node --version   # should print v22.x.x
```

To avoid doing this every session, set it as default:

```bash
nvm alias default 22
```

---

## After pulling new changes

If you see build errors or `node_modules`-related issues after pulling, do a clean reinstall. This is required any time the Node version changes or `package.json` has significant updates:

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Running the project

```bash
make dev-fe   # frontend on localhost:3000
make dev-be   # backend on localhost:8000
```

---

