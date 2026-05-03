import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Ellipse, FancyBboxPatch
from matplotlib.lines import Line2D
import matplotlib.patches as mpatches

# ── shared helpers (all drawing relative to axis coords 0-30, 0-26) ──────────
LW = 2.0

def actor(ax, cx, cy, label, fs=10):
    hr = 0.5
    ax.add_patch(plt.Circle((cx, cy+2.1), hr, color='black', zorder=5))
    ax.plot([cx,cx],           [cy+1.6, cy+0.8], color='black', lw=2, zorder=5)
    ax.plot([cx-0.75,cx+0.75], [cy+1.25,cy+1.25],color='black', lw=2, zorder=5)
    ax.plot([cx, cx-0.65],     [cy+0.8, cy+0.0], color='black', lw=2, zorder=5)
    ax.plot([cx, cx+0.65],     [cy+0.8, cy+0.0], color='black', lw=2, zorder=5)
    ax.text(cx, cy-0.3, label, ha='center', va='top', fontsize=fs,
            fontweight='bold', multialignment='center', zorder=6)

def uc(ax, cx, cy, label, w=6.0, h=1.8, fs=9):
    ax.add_patch(Ellipse((cx,cy), w, h, linewidth=LW,
                         edgecolor='black', facecolor='white', zorder=4))
    ax.text(cx, cy, label, ha='center', va='center', fontsize=fs,
            multialignment='center', zorder=5)

def assoc(ax, x1, y1, x2, y2):
    ax.plot([x1,x2],[y1,y2], color='black', lw=1.5, zorder=2)

def dash_arr(ax, x1, y1, x2, y2, label=''):
    ax.annotate('', xy=(x2,y2), xytext=(x1,y1),
                arrowprops=dict(arrowstyle='->', color='black', lw=1.5,
                                linestyle='dashed', mutation_scale=12), zorder=3)
    if label:
        ax.text((x1+x2)/2,(y1+y2)/2+0.22, label, ha='center', va='bottom',
                fontsize=7.5, style='italic', zorder=6)

def boundary(ax, title):
    ax.add_patch(FancyBboxPatch((7.5,1.0), 21.5, 23.5,
                                boxstyle='square,pad=0', linewidth=2,
                                edgecolor='black', facecolor='white', zorder=1))
    ax.text(18.25, 24.0, title, ha='center', va='center',
            fontsize=9.5, fontweight='bold', zorder=6)

# ─────────────────────────────────────────────────────────────────────────────
fig, axes = plt.subplots(2, 2, figsize=(50, 44))
fig.patch.set_facecolor('white')
plt.subplots_adjust(wspace=0.05, hspace=0.08)

titles = [
    'Diagram 1 — End User / Developer',
    'Diagram 2 — Finance Manager',
    'Diagram 3 — System Admin',
    'Diagram 4 — Azure Cloud (External)',
]
for i, ax in enumerate(axes.flat):
    ax.set_xlim(0, 30)
    ax.set_ylim(0, 26)
    ax.axis('off')
    ax.set_facecolor('white')
    ax.text(15, 25.5, titles[i], ha='center', va='center',
            fontsize=13, fontweight='bold')

# ═══════════════════════════════════════════════════════════════════════════
# DIAGRAM 1 — End User / Developer
# ═══════════════════════════════════════════════════════════════════════════
ax = axes[0][0]
boundary(ax, 'Azure Cloud Cost Monitoring & Optimization System')
actor(ax, 4.0, 11.5, "End User /\nDeveloper")

# col1 use cases x=13, col2 x=23
c1, c2 = 13.5, 23.0
ucs1 = [
    (c1, 22.0, "Login /\nAuthenticate"),
    (c1, 19.0, "View Dashboard"),
    (c1, 16.0, "View Cost Reports"),
    (c1, 13.0, "Export Data\n(CSV / Excel)"),
    (c1, 10.0, "View Billing History"),
    (c1,  7.0, "View Cost Forecast"),
    (c1,  4.0, "View Resource\nInventory"),
]
ucs2 = [
    (c2, 22.0, "Set Budget\nAlerts"),
    (c2, 18.5, "View Anomaly\nReports"),
    (c2, 15.0, "Get\nRecommendations"),
    (c2, 11.5, "Manage\nNotifications"),
    (c2,  8.0, "View KPI\nDashboard"),
    (c2,  4.5, "View Subscription\nInfo"),
]
for (cx,cy,lbl) in ucs1: uc(ax,cx,cy,lbl)
for (cx,cy,lbl) in ucs2: uc(ax,cx,cy,lbl)

ax_edge = 5.7
for (_,cy,_) in ucs1: assoc(ax, ax_edge, 13.5, c1-3.0, cy)
assoc(ax, ax_edge, 12.5, c1-3.0, ucs1[0][1])

# include/extend
dash_arr(ax, c1+3.0, 19.0, c2-3.0, 22.0, '<<extend>>')
dash_arr(ax, c1+3.0, 16.0, c2-3.0, 15.0, '<<include>>')
dash_arr(ax, c1+3.0,  7.0, c2-3.0,  8.0, '<<include>>')
dash_arr(ax, c1+3.0, 13.0, c2-3.0, 11.5, '<<extend>>')

# ═══════════════════════════════════════════════════════════════════════════
# DIAGRAM 2 — Finance Manager
# ═══════════════════════════════════════════════════════════════════════════
ax = axes[0][1]
boundary(ax, 'Azure Cloud Cost Monitoring & Optimization System')
actor(ax, 4.0, 11.5, "Finance\nManager")

c1, c2 = 13.5, 23.0
ucs1 = [
    (c1, 22.0, "Login /\nAuthenticate"),
    (c1, 19.0, "View Cost Reports"),
    (c1, 16.0, "Set Budget Limits"),
    (c1, 13.0, "View Budget Alerts"),
    (c1, 10.0, "View Billing History"),
    (c1,  7.0, "Approve Budget\nPlans"),
    (c1,  4.0, "View KPI\nDashboard"),
]
ucs2 = [
    (c2, 22.0, "Generate Monthly\nReports"),
    (c2, 18.5, "View Cost Forecast"),
    (c2, 15.0, "Export Financial\nReports"),
    (c2, 11.5, "Compare Budget\nvs Actual"),
    (c2,  8.0, "Set Alert\nThresholds"),
    (c2,  4.5, "View Cost\nBreakdown"),
]
for (cx,cy,lbl) in ucs1: uc(ax,cx,cy,lbl)
for (cx,cy,lbl) in ucs2: uc(ax,cx,cy,lbl)

ax_edge = 5.7
for (_,cy,_) in ucs1: assoc(ax, ax_edge, 13.5, c1-3.0, cy)

dash_arr(ax, c1+3.0, 19.0, c2-3.0, 22.0, '<<include>>')
dash_arr(ax, c1+3.0,  7.0, c2-3.0,  8.0, '<<include>>')
dash_arr(ax, c2,     21.0, c2,      19.5, '<<include>>')
dash_arr(ax, c2,     18.0, c2,      15.5, '<<extend>>')
dash_arr(ax, c1+3.0, 13.0, c2-3.0, 11.5, '<<extend>>')

# ═══════════════════════════════════════════════════════════════════════════
# DIAGRAM 3 — System Admin
# ═══════════════════════════════════════════════════════════════════════════
ax = axes[1][0]
boundary(ax, 'Azure Cloud Cost Monitoring & Optimization System')
actor(ax, 4.0, 11.5, "System\nAdmin")

c1, c2 = 13.5, 23.0
ucs1 = [
    (c1, 22.0, "Login /\nAuthenticate"),
    (c1, 19.0, "Manage Users"),
    (c1, 16.0, "Configure System\nSettings"),
    (c1, 13.0, "Trigger Manual\nData Sync"),
    (c1, 10.0, "Monitor System\nHealth"),
    (c1,  7.0, "View Audit Logs"),
    (c1,  4.0, "Manage\nSubscriptions"),
]
ucs2 = [
    (c2, 22.0, "Set Alert Rules"),
    (c2, 18.5, "Manage Resources"),
    (c2, 15.0, "Deploy\nInfrastructure"),
    (c2, 11.5, "Manage API\nKeys / Secrets"),
    (c2,  8.0, "View System\nLogs"),
    (c2,  4.5, "Assign User\nRoles"),
]
for (cx,cy,lbl) in ucs1: uc(ax,cx,cy,lbl)
for (cx,cy,lbl) in ucs2: uc(ax,cx,cy,lbl)

ax_edge = 5.7
for (_,cy,_) in ucs1: assoc(ax, ax_edge, 13.5, c1-3.0, cy)
for (_,cy,_) in ucs2: assoc(ax, ax_edge, 12.5, c2-3.0, cy)

dash_arr(ax, c1+3.0, 13.0, c1+3.0, 10.5, '<<include>>')
dash_arr(ax, c2,     22.0, c2,      19.0, '<<extend>>')
dash_arr(ax, c1+3.0, 16.0, c2-3.0, 15.0, '<<include>>')
dash_arr(ax, c2,     15.0, c2-3.0, 19.0, '<<include>>')

# ═══════════════════════════════════════════════════════════════════════════
# DIAGRAM 4 — Azure Cloud (External)
# ═══════════════════════════════════════════════════════════════════════════
ax = axes[1][1]
boundary(ax, 'Azure Cloud Cost Monitoring & Optimization System')
actor(ax, 4.0, 11.5, "Azure Cloud\n(External)")

c1, c2 = 13.5, 23.0
ucs1 = [
    (c1, 22.0, "Authenticate via\nAzure AD SSO"),
    (c1, 19.0, "Sync Billing Data"),
    (c1, 16.0, "Provide Resource\nGraph Data"),
    (c1, 13.0, "Provide VM\nMetrics"),
    (c1, 10.0, "Provide Advisor\nRecommendations"),
    (c1,  7.0, "Provide Subscription\nInfo"),
    (c1,  4.0, "Provide Pricing\nData"),
]
ucs2 = [
    (c2, 22.0, "Send Budget\nAlerts"),
    (c2, 18.5, "Trigger Anomaly\nAlerts"),
    (c2, 15.0, "Provide Cost\nManagement Data"),
    (c2, 11.5, "Provide Monitor\nData"),
    (c2,  8.0, "Provide Key\nVault Secrets"),
    (c2,  4.5, "Send Usage\nNotifications"),
]
for (cx,cy,lbl) in ucs1: uc(ax,cx,cy,lbl)
for (cx,cy,lbl) in ucs2: uc(ax,cx,cy,lbl)

ax_edge = 5.7
for (_,cy,_) in ucs1: assoc(ax, ax_edge, 13.5, c1-3.0, cy)
for (_,cy,_) in ucs2: assoc(ax, ax_edge, 12.5, c2-3.0, cy)

dash_arr(ax, c1+3.0, 19.0, c1+3.0, 22.5, '<<include>>')
dash_arr(ax, c1+3.0, 13.0, c1+3.0, 16.5, '<<include>>')
dash_arr(ax, c1+3.0, 10.0, c1+3.0, 16.5, '<<include>>')
dash_arr(ax, c2,     22.0, c2,      19.0, '<<extend>>')
dash_arr(ax, c1+3.0, 19.0, c2-3.0, 15.0, '<<include>>')

# ─────────────────────────────────────────────────────────────────────────────
# GLOBAL LEGEND at bottom
# ─────────────────────────────────────────────────────────────────────────────
legend_items = [
    mpatches.Patch(facecolor='white', edgecolor='black', lw=2, label='Oval  →  Use Case'),
    mpatches.Patch(facecolor='white', edgecolor='black', lw=2, label='Rectangle  →  System Boundary'),
    Line2D([0],[0], color='black', lw=2, label='Solid Line  →  Association'),
    Line2D([0],[0], color='black', lw=2, linestyle='--', label='Dashed Arrow  →  <<include>> / <<extend>>'),
]
fig.legend(handles=legend_items, loc='lower center', ncol=4,
           fontsize=13, framealpha=1, edgecolor='black',
           bbox_to_anchor=(0.5, 0.005))

plt.suptitle('Azure Cloud Cost Monitoring & Optimization Platform — Use Case Diagrams',
             fontsize=18, fontweight='bold', y=0.995)

out = r'C:\Users\Lenovo\OneDrive\Desktop\Collage wla\USE-CASE-ALL-4.png'
fig.savefig(out, dpi=180, bbox_inches='tight', facecolor='white')
print(f"Saved: {out}")
