# Runtime Request Architecture

```mermaid
flowchart LR
  B[Browser Request]
  IDX[src/index.ts]
  REQUEST[Request]
  ROUTES[Routes]
  GUARDS[Auth and Admin Guards]
  CONTROLLERS[Controllers]
  VALIDATION[Zod Validation]
  SERVICES[Services]
  API[Backend API]
  RENDER[Rendered Views]

  REQUEST --> ROUTES --> GUARDS --> CONTROLLERS
  CONTROLLERS --> VALIDATION
  CONTROLLERS --> SERVICES --> API
  CONTROLLERS --> RENDER

  classDef flow fill:#f8fafc,stroke:#334155,color:#0f172a,stroke-width:1.2px;
  classDef control fill:#e0f2fe,stroke:#0369a1,color:#0c4a6e,stroke-width:1.4px;
  classDef data fill:#ede9fe,stroke:#5b21b6,color:#312e81,stroke-width:1.4px;
  classDef output fill:#dcfce7,stroke:#15803d,color:#14532d,stroke-width:1.4px;

  class REQUEST,ROUTES,GUARDS,CONTROLLERS,VALIDATION flow;
  class SERVICES,API data;
  class RENDER output;
    V2[applicationSchemas]
