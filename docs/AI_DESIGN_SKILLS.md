# AI Design Skills (vendored)

Upstream: https://github.com/elayadesign/ai-design-skills
Pinned commit: `456d9e0d3e2d84c748bb143c6ca3d90c45e16213` (vendored 2026-11-22)
License: MIT

## Installed skills

| ID | Source file | Use |
| --- | --- | --- |
| `landing-page-design` | `skills/landing-page-design/SKILL.md` | Landing pages, marketing pages, page sections, conversion copy, visual tokens. |
| `figma-designer` | `skills/figma-designer/SKILL.md` | Figma MCP design/editing: variables, text styles, auto layout, components. |
| `design-prompt-generator-v2` | Local skill supplied by the user | 7 step domain aware design prompts and specs for web UI. |

## Installed locations

- Repo convention: `.agent/skills/<id>/SKILL.md`
- OpenCode project discovery: `.agents/skills/<id>/SKILL.md`
- OpenCode global discovery: `~/.config/opencode/skills/<id>/SKILL.md`

Copies of the first two skills are byte-identical to upstream at the pinned commit. `design-prompt-generator-v2` was supplied locally and is mirrored across the same three locations.

## Update

Download the two upstream `SKILL.md` files into every installed location listed above, then update the pinned commit in this file. Verify with:

```powershell
Get-FileHash .agents/skills/landing-page-design/SKILL.md -Algorithm SHA256
Get-FileHash .agents/skills/figma-designer/SKILL.md -Algorithm SHA256
```
