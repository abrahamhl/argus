# Error & Mitigation Log

| Timestamp | Component | Error / Failure | Root Cause | Mitigation / Fix |
|---|---|---|---|---|
| Initial | Workspace | Missing junction `c:\dev\02_PROJECTS\ARGUS` | Workspace path mapped to root directory while repo was in `_ACTIVOS\argus` | Created directory junction linking `c:\dev\02_PROJECTS\ARGUS` to `_ACTIVOS\argus` |
