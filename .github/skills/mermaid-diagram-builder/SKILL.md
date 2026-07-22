---
name: mermaid-diagram-builder
description: Use when the user wants a Mermaid diagram for any topic, process, architecture, test flow, timeline, or relationship map.
argument-hint: Diagram intent, audience, and key nodes or steps.
---

# Mermaid Diagram Builder

Create clear, accurate Mermaid diagrams from natural language requests.

## Core Behavior

- Convert vague requests into a concrete visual structure.
- Ask brief clarifying questions only when required to avoid wrong assumptions.
- Pick the best Mermaid diagram type for the goal.
- Keep node text concise and business-readable.
- Prefer left-to-right flow for process diagrams unless the user asks otherwise.

## Diagram Type Selection

- Use flowchart for workflows, process maps, and system overviews.
- Use sequence diagrams for request-response or actor interactions over time.
- Use state diagrams for lifecycle and status transitions.
- Use class or entity relationship diagrams for models and data shape.
- Use gantt or timeline for schedules and milestones.

## Required Workflow

1. Restate the diagram goal in one sentence.
2. Identify entities, actions, and decision points.
3. Build the first Mermaid draft with stable IDs and short labels.
4. Validate Mermaid syntax.
5. Fix validation issues until clean.
6. Preview the diagram and ensure readability.
7. Return the diagram file path and a short explanation.

## Quality Rules

- Keep labels under about 5 to 7 words where possible.
- Avoid crossing lines when a simpler layout works.
- Use subgraphs to group related areas.
- Use consistent naming for repeated concepts.
- Prefer deterministic layouts over decorative complexity.

## Output Style

- Save generated diagrams to the `/mermaid` folder at workspace root by default.
- If `/mermaid` does not exist, create it.
- Use local Mermaid tooling only; do not require any external account.
- Provide the Mermaid code in a file in the workspace.
- Include one paragraph explaining what the diagram communicates.
- If requested, provide alternate versions such as high-level and detailed.
