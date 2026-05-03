import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
import matplotlib.patches as mpatches
from matplotlib.lines import Line2D

fig, ax = plt.subplots(figsize=(50, 42))
ax.set_xlim(0, 50); ax.set_ylim(0, 42); ax.axis('off')
fig.patch.set_facecolor('white'); ax.set_facecolor('white')

LW = 1.5
CW, CH, HH = 11.0, 9.5, 1.4   # card width, card height, header height

def crc(ax, cx, cy, name, resp, collab):
    x0, y0 = cx - CW/2, cy - CH/2
    # outer box
    ax.add_patch(FancyBboxPatch((x0, y0), CW, CH,
        boxstyle='square,pad=0', lw=LW, ec='black', fc='white', zorder=3))
    # header
    ax.add_patch(FancyBboxPatch((x0, y0+CH-HH), CW, HH,
        boxstyle='square,pad=0', lw=LW, ec='black', fc='#b8b8b8', zorder=4))
    ax.text(cx, y0+CH-HH/2, name, ha='center', va='center',
            fontsize=11, fontweight='bold', zorder=5)
    # vertical divider
    body_top = y0+CH-HH
    ax.plot([cx, cx], [y0, body_top], color='black', lw=LW, zorder=4)
    # column labels
    ax.text(cx-CW/4, body_top-0.32, 'Responsibilities',
            ha='center', va='center', fontsize=8, fontweight='bold', style='italic', zorder=5)
    ax.text(cx+CW/4, body_top-0.32, 'Collaborators',
            ha='center', va='center', fontsize=8, fontweight='bold', style='italic', zorder=5)
    ax.plot([x0, x0+CW], [body_top-0.62]*2, color='black', lw=0.8, zorder=4)
    # responsibilities
    ct = body_top - 0.75
    lh = (ct - y0 - 0.15) / max(len(resp), 1)
    for i, r in enumerate(resp):
        ax.text(x0+0.18, ct - i*lh - lh/2, f'\u2022 {r}',
                ha='left', va='center', fontsize=7.5, zorder=5)
    # collaborators
    lhc = (ct - y0 - 0.15) / max(len(collab), 1)
    for i, c in enumerate(collab):
        ax.text(cx+0.18, ct - i*lhc - lhc/2, f'\u2022 {c}',
                ha='left', va='center', fontsize=7.5, zorder=5)

# ── 12 CRC Cards ───────────────────────────────────────────────────────────
CX = [6.5, 18.5, 30.5, 42.5]   # 4 columns
CY = [33.0, 22.0, 11.0]        # 3 rows

cards = [
    # Row 1
    ("User",
     ["Authenticate with system",
      "View cost dashboard",
      "Set / revise budget limits",
      "View & export reports",
      "Receive alert notifications",
      "Manage profile & settings"],
     ["AuthService",
      "BudgetManager",
      "ReportGenerator",
      "AlertService"]),

    ("AuthService",
     ["Validate user credentials",
      "Generate JWT tokens",
      "Refresh expired tokens",
      "Manage user sessions",
      "Integrate Azure AD SSO",
      "Enforce RBAC policies"],
     ["User",
      "AzureAPIConnector",
      "Database (UserDB)"]),

    ("Subscription",
     ["Store Azure subscription info",
      "Track linked resource groups",
      "Maintain subscription status",
      "Associate budgets to sub",
      "Provide sub-level cost view"],
     ["ResourceGroup",
      "BudgetManager",
      "AzureAPIConnector",
      "CostRecord"]),

    ("AzureAPIConnector",
     ["Connect to Azure REST APIs",
      "Authenticate via Azure AD",
      "Fetch billing & cost data",
      "Retrieve resource graph data",
      "Handle API rate limiting",
      "Retry failed API requests"],
     ["AuthService",
      "DataSyncService",
      "CostMonitoringService",
      "Subscription"]),

    # Row 2
    ("CostMonitoringService",
     ["Fetch cost data from Azure",
      "Analyse spending patterns",
      "Detect anomalies (Z-score)",
      "Generate cost summaries",
      "Compare actual vs budget",
      "Trigger anomaly alerts"],
     ["AzureAPIConnector",
      "CostRecord",
      "BudgetManager",
      "AlertService"]),

    ("ResourceGroup",
     ["Group resources by project",
      "Track resource-level costs",
      "Monitor resource utilisation",
      "Update resource metadata",
      "Link to parent subscription"],
     ["Subscription",
      "Resource",
      "CostRecord"]),

    ("Resource",
     ["Store individual resource info",
      "Track resource type & status",
      "Generate per-resource costs",
      "Monitor usage metrics",
      "Sync status with Azure"],
     ["ResourceGroup",
      "CostRecord",
      "AzureAPIConnector"]),

    ("BudgetManager",
     ["Define budget limits & periods",
      "Monitor spending vs budget",
      "Trigger alerts on breach",
      "Notify users of status",
      "Revise budgets on request",
      "Track budget history"],
     ["User",
      "Subscription",
      "AlertService",
      "CostRecord"]),

    # Row 3
    ("AlertService",
     ["Create & dispatch alerts",
      "Manage alert thresholds",
      "Notify via email / webhook",
      "Track alert history & status",
      "Handle acknowledgements",
      "Escalate critical alerts"],
     ["BudgetManager",
      "CostMonitoringService",
      "User",
      "NotificationService"]),

    ("ReportGenerator",
     ["Generate cost & spend reports",
      "Create cost forecasts (ML)",
      "Export PDF / CSV / Excel",
      "Schedule automated reports",
      "Provide dashboard data",
      "Summarise anomaly reports"],
     ["CostRecord",
      "User",
      "BudgetManager",
      "AzureAPIConnector"]),

    ("DataSyncService",
     ["Schedule periodic data sync",
      "Orchestrate data fetching",
      "Store synced data to DB",
      "Handle sync failures & retry",
      "Track sync history & logs",
      "Update resource metadata"],
     ["AzureAPIConnector",
      "CostRecord",
      "Resource",
      "ResourceGroup"]),

    ("CostRecord",
     ["Store billing data points",
      "Record billing period info",
      "Provide data for analysis",
      "Support report generation",
      "Enable anomaly detection",
      "Maintain cost history"],
     ["Resource",
      "Subscription",
      "ReportGenerator",
      "CostMonitoringService"]),
]

for i, (name, resp, collab) in enumerate(cards):
    row, col = i // 4, i % 4
    crc(ax, CX[col], CY[row], name, resp, collab)

# ── Title ──────────────────────────────────────────────────────────────────
ax.text(25, 41.3, 'Azure Cloud Cost Monitoring & Optimization Platform',
        ha='center', fontsize=20, fontweight='bold')
ax.text(25, 40.5, 'CRC Models (Class – Responsibility – Collaborator)',
        ha='center', fontsize=14, color='#333')

# ── Legend ─────────────────────────────────────────────────────────────────
legend_items = [
    mpatches.Patch(fc='#b8b8b8', ec='black', lw=2, label='Header  →  Class Name'),
    mpatches.Patch(fc='white',   ec='black', lw=2, label='Left Column  →  Responsibilities'),
    mpatches.Patch(fc='white',   ec='black', lw=2, label='Right Column  →  Collaborators'),
    Line2D([0],[0], color='black', lw=2, label='Vertical Line  →  Divider'),
]
ax.legend(handles=legend_items, loc='lower center', ncol=4,
          fontsize=12, framealpha=1, edgecolor='black', bbox_to_anchor=(0.5, 0.0))

out = r'C:\Users\Lenovo\OneDrive\Desktop\Collage wla\CRC-MODELS.png'
fig.savefig(out, dpi=180, bbox_inches='tight', facecolor='white')
print(f"Saved: {out}")
