# Atomic Red Team Atomics

Not included in git — too large (335+ technique YAML files).

## Setup

Run the launcher (auto-clones on first run):
```powershell
.\start.ps1
```

Or clone manually:
```powershell
git clone --depth 1 https://github.com/redcanaryco/atomic-red-team atomics-repo
Move-Item atomics-repo\atomics .\atomics
Remove-Item -Recurse atomics-repo
```
