import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Polygon
import matplotlib.patches as mpatches
from matplotlib.lines import Line2D

fig, ax = plt.subplots(figsize=(46, 36))
ax.set_xlim(0, 46); ax.set_ylim(0, 36); ax.axis('off')
fig.patch.set_facecolor('white'); ax.set_facecolor('white')
LW = 1.6

# ── Helpers ────────────────────────────────────────────────────────────────
def ebox(ax, cx, cy, name, attrs, w=8.5):
    rh = 0.72
    h = rh * (len(attrs) + 1)
    # body
    ax.add_patch(FancyBboxPatch((cx-w/2, cy-h/2), w, h,
        boxstyle='square,pad=0', lw=LW, edgecolor='black', facecolor='white', zorder=3))
    # header
    ax.add_patch(FancyBboxPatch((cx-w/2, cy+h/2-rh), w, rh,
        boxstyle='square,pad=0', lw=LW, edgecolor='black', facecolor='#d0d0d0', zorder=4))
    ax.text(cx, cy+h/2-rh/2, name, ha='center', va='center',
            fontsize=10, fontweight='bold', zorder=5)
    for i, a in enumerate(attrs):
        yy = cy + h/2 - rh*(i+1.5)
        ax.plot([cx-w/2, cx+w/2], [cy+h/2-rh*(i+1)]*2, color='black', lw=0.7, zorder=3)
        fw = 'bold' if a.startswith('PK') else 'normal'
        fi = 'italic' if a.startswith('FK') else 'normal'
        ax.text(cx-w/2+0.25, yy, a, ha='left', va='center',
                fontsize=8, fontweight=fw, fontstyle=fi, zorder=5)
    top=(cx, cy+h/2); bot=(cx, cy-h/2)
    lft=(cx-w/2, cy); rgt=(cx+w/2, cy)
    return top, bot, lft, rgt

def diamond(ax, cx, cy, label, w=2.8, h=1.1):
    pts = [(cx,cy+h/2),(cx+w/2,cy),(cx,cy-h/2),(cx-w/2,cy)]
    ax.add_patch(Polygon(pts, closed=True, lw=LW, edgecolor='black', facecolor='white', zorder=4))
    ax.text(cx, cy, label, ha='center', va='center', fontsize=7.5, fontweight='bold', zorder=5)

def line(ax, pts, c1='', c2=''):
    xs=[p[0] for p in pts]; ys=[p[1] for p in pts]
    ax.plot(xs, ys, color='black', lw=LW, zorder=2)
    if c1:
        ax.text(pts[0][0], pts[0][1], c1, ha='center', va='center',
                fontsize=9, fontweight='bold',
                bbox=dict(fc='white',ec='none',pad=0.1), zorder=6)
    if c2:
        ax.text(pts[-1][0], pts[-1][1], c2, ha='center', va='center',
                fontsize=9, fontweight='bold',
                bbox=dict(fc='white',ec='none',pad=0.1), zorder=6)

# ── Title ──────────────────────────────────────────────────────────────────
ax.text(23, 35.4, 'Azure Cloud Cost Monitoring & Optimization Platform',
        ha='center', fontsize=20, fontweight='bold')
ax.text(23, 34.7, 'Entity Relationship Diagram (ERD)', ha='center', fontsize=14, color='#444')

# ── Entities ───────────────────────────────────────────────────────────────
# USER  (col1, top)
u_t,u_b,u_l,u_r = ebox(ax, 6, 28, 'USER', [
    'PK user_id (INT)',
    'name (VARCHAR)',
    'email (VARCHAR)',
    'role (ENUM)',
    'password_hash (TEXT)',
    'is_active (BOOL)',
    'created_at (DATETIME)',
], w=8.5)

# SUBSCRIPTION (col2, top)
s_t,s_b,s_l,s_r = ebox(ax, 20, 28.5, 'SUBSCRIPTION', [
    'PK subscription_id (INT)',
    'azure_sub_id (VARCHAR)',
    'tenant_id (VARCHAR)',
    'name (VARCHAR)',
    'status (ENUM)',
    'created_at (DATETIME)',
], w=9.0)

# AZURE_API (col3, top)
a_t,a_b,a_l,a_r = ebox(ax, 36, 28.5, 'AZURE_API', [
    'PK api_id (INT)',
    'FK subscription_id (INT)',
    'endpoint_url (TEXT)',
    'auth_token (TEXT)',
    'last_sync_at (DATETIME)',
    'sync_status (ENUM)',
], w=9.0)

# RESOURCE_GROUP (col3, mid)
rg_t,rg_b,rg_l,rg_r = ebox(ax, 36, 19, 'RESOURCE_GROUP', [
    'PK rg_id (INT)',
    'FK subscription_id (INT)',
    'name (VARCHAR)',
    'location (VARCHAR)',
    'tags (JSON)',
], w=9.0)

# RESOURCE (col3, bot)
res_t,res_b,res_l,res_r = ebox(ax, 36, 10.5, 'RESOURCE', [
    'PK resource_id (INT)',
    'FK rg_id (INT)',
    'name (VARCHAR)',
    'type (VARCHAR)',
    'location (VARCHAR)',
    'status (ENUM)',
], w=9.0)

# COST_RECORD (col2, bot)
cr_t,cr_b,cr_l,cr_r = ebox(ax, 22, 10, 'COST_RECORD', [
    'PK cost_id (INT)',
    'FK resource_id (INT)',
    'FK subscription_id (INT)',
    'amount (DECIMAL)',
    'currency (VARCHAR)',
    'billing_period (VARCHAR)',
    'recorded_at (DATETIME)',
], w=9.5)

# BUDGET (col2, mid)
bg_t,bg_b,bg_l,bg_r = ebox(ax, 21, 19.5, 'BUDGET', [
    'PK budget_id (INT)',
    'FK subscription_id (INT)',
    'FK user_id (INT)',
    'name (VARCHAR)',
    'limit_amount (DECIMAL)',
    'start_date (DATE)',
    'end_date (DATE)',
    'status (ENUM)',
], w=9.0)

# ALERT (col1, mid)
al_t,al_b,al_l,al_r = ebox(ax, 7, 19, 'ALERT', [
    'PK alert_id (INT)',
    'FK budget_id (INT)',
    'FK user_id (INT)',
    'type (ENUM)',
    'message (TEXT)',
    'threshold (DECIMAL)',
    'status (ENUM)',
    'triggered_at (DATETIME)',
], w=8.5)

# REPORT (col1, bot)
rp_t,rp_b,rp_l,rp_r = ebox(ax, 7, 9, 'REPORT', [
    'PK report_id (INT)',
    'FK user_id (INT)',
    'title (VARCHAR)',
    'type (ENUM)',
    'format (ENUM)',
    'generated_at (DATETIME)',
    'file_url (TEXT)',
], w=8.5)

# ── Relationship Diamonds ──────────────────────────────────────────────────
diamond(ax, 13.5, 28.8, 'MANAGES')       # User — Subscription
diamond(ax, 28.3, 28.8, 'USES')          # Subscription — AzureAPI
diamond(ax, 28.3, 24,   'CONTAINS')      # Subscription — ResourceGroup
diamond(ax, 36,   14.8, 'HAS')           # ResourceGroup — Resource
diamond(ax, 29.5, 10.3, 'GENERATES')     # Resource — CostRecord
diamond(ax, 21,   15,   'HAS\nBUDGET')  # Subscription — Budget
diamond(ax, 14,   19.2, 'TRIGGERS')      # Budget — Alert
diamond(ax, 7,    14.2, 'CREATES')       # User — Report
diamond(ax, 14.5, 9.3,  'SUMMARISES')   # Report — CostRecord
diamond(ax, 29.5, 17,   'SYNCS')        # AzureAPI — CostRecord

# ── Connections ────────────────────────────────────────────────────────────
# User — MANAGES — Subscription
line(ax,[(u_r[0],u_r[1]),(12.1,28.8)], '1')
line(ax,[(14.9,28.8),(s_l[0],s_l[1])], 'N')

# Subscription — USES — AzureAPI
line(ax,[(s_r[0],s_r[1]),(26.9,28.8)], '1')
line(ax,[(29.7,28.8),(a_l[0],a_l[1])], 'N')

# Subscription — CONTAINS — ResourceGroup  (via diamond at 28.3,24)
line(ax,[(20,s_b[1]),(20,24),(26.9,24)], '1')
line(ax,[(29.7,24),(rg_l[0],rg_l[1])], 'N')

# ResourceGroup — HAS — Resource
line(ax,[(rg_b[0],rg_b[1]),(36,16.2)], '1')
line(ax,[(36,13.4),(res_t[0],res_t[1])], 'N')

# Resource — GENERATES — CostRecord
line(ax,[(res_l[0],res_l[1]),(31,10.3)], '1')
line(ax,[(28.1,10.3),(cr_r[0],cr_r[1])], 'N')

# Subscription — HAS BUDGET — Budget
line(ax,[(20,s_b[1]),(20,21.6),(21,19.5),(21,17.4)], '1')
line(ax,[(21,17.4),(21,16.5)], 'N')

# Budget — TRIGGERS — Alert
line(ax,[(bg_l[0],bg_l[1]),(16.4,19.2)], '1')
line(ax,[(11.6,19.2),(al_r[0],al_r[1])], 'N')

# User — CREATES — Report
line(ax,[(u_b[0],u_b[1]),(6,24),(6,21.4),(7,21.4)], '1')
line(ax,[(7,21.4),(7,16.4)], 'N') # goes into Alert top area - let's go via (6, 14)
# Actually let's redo
line(ax,[(6,u_b[1]),(6,14.2)], '')
line(ax,[(6,13.4),(7,13.4),(7,12.4)], 'N')

# Report — SUMMARISES — CostRecord
line(ax,[(rp_r[0],rp_r[1]),(13.1,9.3)], 'N')
line(ax,[(15.9,9.3),(cr_l[0],cr_l[1])], 'M')

# AzureAPI — SYNCS — CostRecord
line(ax,[(36,a_b[1]),(36,26),(29.5,26),(29.5,23.5)], '1')
line(ax,[(29.5,23.5),(29.5,18.4)], '')
line(ax,[(29.5,15.6),(29.5,10.3)], 'N')

# User creates Alert (via FK)
line(ax,[(6,14.2),(6,19),(5,19)], '1')
line(ax,[(5,19),(al_l[0],al_l[1])], '')

# ── Legend ─────────────────────────────────────────────────────────────────
legend_items = [
    mpatches.Patch(fc='#d0d0d0', ec='black', lw=2, label='Rectangle Header  →  Entity'),
    mpatches.Patch(fc='white',   ec='black', lw=2, label='Attributes  (PK bold, FK italic)'),
    mpatches.Patch(fc='white',   ec='black', lw=2, label='Diamond  →  Relationship'),
    Line2D([0],[0], color='black', lw=2, label='Line  →  Association'),
    Line2D([0],[0], color='black', lw=0, marker='$1$', markersize=12, label='1  →  One side'),
    Line2D([0],[0], color='black', lw=0, marker='$N$', markersize=12, label='N / M  →  Many side'),
]
ax.legend(handles=legend_items, loc='lower center', ncol=3,
          fontsize=12, framealpha=1, edgecolor='black', bbox_to_anchor=(0.5, 0.0))

out = r'C:\Users\Lenovo\OneDrive\Desktop\Collage wla\ER-DIAGRAM.png'
fig.savefig(out, dpi=180, bbox_inches='tight', facecolor='white')
print(f"Saved: {out}")
