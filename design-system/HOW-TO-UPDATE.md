# Updating the r4box design system

This folder is the r4box design system, exported from Claude's design tool as
a skill (SKILL.md). It is the single copy: on r4box, `~/.claude/skills/r4box-design`
is a link to this folder, so every Claude session on the box uses what is
committed here.

To update: export a new zip from the design tool, replace this folder's
contents with it (leave out its `uploads/` folder, which holds design-session
screenshots), commit, push. GitHub Pages publishes only `web/`, so nothing
here goes public.
