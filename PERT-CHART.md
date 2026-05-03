# PERT Chart: Azure Cloud Cost Monitoring & Optimization Platform

This chart visualizes the development lifecycle, highlighting the Critical Path in red.

```mermaid
%%{init: { 
  "theme": "base", 
  "flowchart": { "htmlLabels": true, "curve": "step", "rankSpacing": 80, "nodeSpacing": 50 }, 
  "themeVariables": { "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "16px" } 
}}%%
flowchart LR

    %% --- ENDPOINTS ---
    Start(("🚀<br/>START")):::endpoint
    Deploy(("🎉<br/>DEPLOY")):::endpoint

    %% --- PLANNING PHASE ---
    subgraph Planning ["1. STRATEGY & ARCHITECTURE"]
        direction LR
        A(["📐 Architecture<br/>(1 Week)"]):::critical
    end

    %% --- CORE DEVELOPMENT ---
    subgraph Development ["2. CORE BUILD"]
        direction TB
        %% Backend
        BK(["⚙️ Backend Core<br/>(1 Week)"]):::critical
        API(["⚡ Azure API<br/>(2 Weeks)"]):::critical
        SYNC(["🔄 Data Sync<br/>(1.5 Weeks)"]):::critical
        
        %% Database & Auth
        DB(["💽 Database<br/>(1 Week)"]):::data
        AUTH(["🔐 Auth Module<br/>(1 Week)"]):::data
        
        %% Infra
        INF(["☁️ Azure Infra<br/>(1 Week)"]):::infra
        CICD(["♾️ CI/CD Pipeline<br/>(1 Week)"]):::infra
    end

    %% --- FRONTEND TRACK ---
    subgraph Frontend ["3. USER INTERFACE"]
        direction LR
        FE(["🎨 Frontend Core<br/>(0.5 Week)"]):::ui
        DASH(["📊 Dashboard UI<br/>(2 Weeks)"]):::ui
        RM(["🛠️ Resource Mgmt<br/>(1.5 Weeks)"]):::ui
    end

    %% --- FEATURES ---
    subgraph Features ["4. SMART ANALYTICS"]
        direction TB
        ANOM(["🔍 Anomaly Detect<br/>(1 Week)"]):::critical
        BUDG(["💰 Budget Alerts<br/>(1 Week)"]):::feature
        REC(["💡 Rec Engine<br/>(1 Week)"]):::feature
    end

    %% --- FINALIZATION ---
    subgraph Release ["5. QA & RELEASE"]
        direction LR
        UI_INT(["🧩 UI Integration<br/>(1.5 Weeks)"]):::critical
        QA(["🧪 System QA<br/>(1.5 Weeks)"]):::critical
    end

    %% --- CONNECTIONS ---
    Start ==> A
    
    A ==> BK
    A --- DB
    A --- INF
    A --- FE

    BK ==> API
    BK --- AUTH
    DB --- AUTH
    
    INF --- CICD
    INF ==> SYNC
    
    FE --- DASH
    DASH --- RM

    AUTH --- SYNC
    API ==> SYNC
    
    SYNC ==> ANOM
    SYNC --- BUDG
    SYNC --- REC
    
    ANOM ==> UI_INT
    BUDG --- UI_INT
    REC --- UI_INT
    RM --- UI_INT
    
    UI_INT ==> QA
    CICD --- QA
    QA ==> Deploy

    %% --- STYLING ---
    classDef endpoint fill:#0f172a,stroke:#000000,stroke-width:4px,color:#ffffff,font-weight:bold;
    classDef critical fill:#fff1f2,stroke:#ef4444,stroke-width:3px,color:#991b1b,font-weight:bold;
    classDef data fill:#f0f9ff,stroke:#0ea5e9,stroke-width:2px,color:#075985;
    classDef infra fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#14532d;
    classDef ui fill:#faf5ff,stroke:#a855f7,stroke-width:2px,color:#581c87;
    classDef feature fill:#fff7ed,stroke:#f97316,stroke-width:2px,color:#7c2d12;

    %% Link Styles for Critical Path
    linkStyle 0,1,5,13,15,18,22,24,26 stroke:#ef4444,stroke-width:5px;
    linkStyle default stroke:#94a3b8,stroke-width:2px;
```

### 🚩 Critical Path Breakdown
**Architecture → Backend Core → Azure API → Data Sync → Anomaly Detection → UI Integration → System QA → Deploy**
irement Analysis & Planning<br>14 Days| B
    B -->|Setup GitHub<br>2 Days| D
    B -->|Frontend Design<br>12 Days| C
    D -->|Develop Action Pipeline<br>4 Days| E
    C -->|Frontend Design<br>4 Days| E
    E -->|Implement Development Logic<br>18 Days| F
    F -->|Integrate Logic<br>3 Days| G
    G -->|Test Workflow<br>6 Days| H
    H -->|Deployment<br>6 Days| I
    I -->|Documentation<br>6 Days| J
```

---

## How to View
- Use a Mermaid live editor (e.g., mermaid.live) or a VS Code Mermaid extension.
- Paste the Mermaid code block above to visualize the PERT chart.

## Note
This chart is based on the project structure and README. For a GraphQL-powered dynamic chart, you would need to expose project tasks and dependencies via a GraphQL API, then generate Mermaid from the query results.
