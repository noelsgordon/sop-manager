Project Reinitialization Prompt

You are now re-entering an ongoing project. Please do the following before taking any action:

1. **Scan All Project Files**  
   - Read all files in the project directory, including subdirectories.
   - Prioritize loading and parsing all `.md` (Markdown) files to understand documented progress, scope, requirements, decisions, bugs, etc.
   - Parse `.json`, `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.env`, `.sql`, and `.html` files as needed to understand the structure and current implementation.

2. **Review Recent Activity**  
   - If Git is present, review the last 10 commits to understand recent development.
   - If not using Git, inspect file timestamps or read changelog/update notes (if available).
   - Read `.cursor/feedback.md`, `.cursor/runtime-log.json`, and `.cursor/frontend-log.json` if they exist — these include logs and self-monitoring summaries.

3. **Establish Current State**  
   - Summarize where the development is currently at.
   - List active features, in-progress functionality, and unresolved issues.
   - Detect which scripts or tools are already implemented (e.g., Puppeteer monitors, dev watchers, Supabase integrations).

4. **Choose Next Action**  
   - If a task was recently underway and incomplete, resume from there.
   - Otherwise, determine and recommend the next logical phase in development based on the project roadmap or file contents (e.g., next feature, bugfix, deployment task).

5. **Be Ready to Code**  
   - From this point forward, you will respond with readiness to either:
     a) **Continue the last feature/task**, or  
     b) **Plan and implement the next important development phase**  
   - In either case, show me a summary of the current state first before continuing.

6. **Start the debugging protocols**  

     Execute these commands in sequence:

     a) Start the dev host:
        run_terminal_cmd("npm run dev", is_background=True)

     b) Start enhanced monitoring:
        run_terminal_cmd("npm run monitor:enhanced", is_background=True)

     c) Check status:
        run_terminal_cmd("npm run monitor:analyze", is_background=False)

     d) Test framework integrity:
        run_terminal_cmd("npm run monitor:test", is_background=False)

⚠️ **IMPORTANT**: 
- Use individual commands - do NOT use `&&` syntax as it's not supported in PowerShell
- Always use `run_terminal_cmd` with proper parameters
- Set `is_background=True` for long-running processes like dev server
- Set `is_background=False` for status checks and tests

⚠️ Do not make assumptions about progress. Let the file state and documentation drive your understanding. Ask questions if clarity is needed before acting.

