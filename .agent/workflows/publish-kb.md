---
description: Publish knowledge_base folder to the fintrepidq_eq GitHub repo
---

# Publish Knowledge Base

Pushes the `knowledge_base/` folder contents to `https://github.com/Hardhikman/fintrepidq_eq.git`.

## Steps

1. If `C:\temp\fintrepidq_eq` doesn't exist, clone the repo first:
// turbo
```bash
git clone https://github.com/Hardhikman/fintrepidq_eq.git C:\temp\fintrepidq_eq
```

2. Copy updated files from knowledge_base to the temp clone:
// turbo
```bash
xcopy /E /Y "C:\SmartQ\Intrepidq_equity\knowledge_base\*" "C:\temp\fintrepidq_eq\"
```

3. Stage changes:
// turbo
```bash
git -C C:\temp\fintrepidq_eq add .
```

4. Commit with a message:
```bash
git -C C:\temp\fintrepidq_eq commit -m "Update knowledge base"
```

5. Push to remote:
```bash
git -C C:\temp\fintrepidq_eq push origin main
```
