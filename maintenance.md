# Project Setup & Maintenance

## Required: Node.js Version

This project requires **Node.js v22**. Running v23+ will break the build.

### If you have Homebrew Node installed (common issue)

Homebrew Node shadows nvm. Fix it once:

```bash
brew unlink node
```

Then open a new terminal and continue below.

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

If you see build errors or `node_modules`-related issues after pulling, do a clean reinstall:

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
