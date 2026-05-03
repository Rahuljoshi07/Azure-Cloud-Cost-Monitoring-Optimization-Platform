import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import Ellipse, FancyBboxPatch
from matplotlib.lines import Line2D
import matplotlib.patheffects as pe
import numpy as np

# ── Canvas ─────────────────────────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(44, 36))
ax.set_xlim(0, 44)
ax.set_ylim(0, 36)
ax.axis('off')
fig.patch.set_facecolor('white')
ax.set_facecolor('white')

LW  = 2.0
FS  = 12      # use-case label font
FSA = 12.5    # actor label font
FST = 18      # title font

# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────
def stick_figure(ax, cx, cy, label, fs=FSA):
    """Classic UML actor — black stick figure."""
    hr = 0.55   # head radius
    # head
    head = plt.Circle((cx, cy + 2.3), hr, color='black', zorder=5)
    ax.add_patch(head)
    # body
    ax.plot([cx, cx],             [cy+1.75, cy+0.9],  color='black', lw=2.2, zorder=5)
    # arms
    ax.plot([cx-0.85, cx+0.85],   [cy+1.4,  cy+1.4],  color='black', lw=2.2, zorder=5)
    # left leg
    ax.plot([cx, cx-0.7],         [cy+0.9,  cy+0.0],  color='black', lw=2.2, zorder=5)
    # right leg
    ax.plot([cx, cx+0.7],         [cy+0.9,  cy+0.0],  color='black', lw=2.2, zorder=5)
    # label below
    ax.text(cx, cy - 0.35, label, ha='center', va='top',
            fontsize=fs, fontweight='bold', color='black',
            multialignment='center', zorder=6)

def use_case(ax, cx, cy, label, w=7.5, h=2.0):
    """UML use-case ellipse — white fill, black border."""
    ell = Ellipse((cx, cy), w, h, linewidth=LW,
                  edgecolor='black', facecolor='white', zorder=4)
    ax.add_patch(ell)
    ax.text(cx, cy, label, ha='center', va='center',
            fontsize=FS, color='black',
            multialignment='center', zorder=5)

def assoc(ax, x1, y1, x2, y2):
    """Solid association line."""
    ax.plot([x1, x2], [y1, y2], color='black', lw=1.8, zorder=2)

def dashed_arrow(ax, x1, y1, x2, y2, label=''):
    """Dashed arrow for <<include>> / <<extend>>."""
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color='black', lw=1.6,
                                linestyle='dashed', mutation_scale=14),
                zorder=3)
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx, my + 0.28, label, ha='center', va='bottom',
                fontsize=9, style='italic', color='black', zorder=6)

# ─────────────────────────────────────────────────────────────────────────────
# TITLE
# ─────────────────────────────────────────────────────────────────────────────
ax.text(22, 35.4, 'Azure Cloud Cost Monitoring & Optimization Platform',
        ha='center', va='center', fontsize=20, fontweight='bold', color='black')
ax.text(22, 34.6, 'Use Case Diagram',
        ha='center', va='center', fontsize=14, color='#444')

# ─────────────────────────────────────────────────────────────────────────────
# SYSTEM BOUNDARY
# ─────────────────────────────────────────────────────────────────────────────
SX, SY, SW, SH = 8.5, 1.5, 27.0, 31.5
boundary = FancyBboxPatch((SX, SY), SW, SH,
                           boxstyle='square,pad=0', linewidth=2.5,
                           edgecolor='black', facecolor='white', zorder=1)
ax.add_patch(boundary)
# system boundary title (top-centre of box)
ax.text(SX + SW/2, SY + SH - 0.6,
        'Azure Cloud Cost Monitoring & Optimization System',
        ha='center', va='center', fontsize=13, fontweight='bold',
        color='black', zorder=6)

# ─────────────────────────────────────────────────────────────────────────────
# ACTORS
# ─────────────────────────────────────────────────────────────────────────────
# Left actors
stick_figure(ax,  3.8, 27.5, "End User /\nDeveloper")
stick_figure(ax,  3.8, 18.0, "Finance\nManager")
stick_figure(ax,  3.8,  8.5, "System\nAdmin")
# Right actor
stick_figure(ax, 40.2, 18.0, "Azure Cloud\n(External)")

# ─────────────────────────────────────────────────────────────────────────────
# USE CASES — Column 1 (x = 15)
# ─────────────────────────────────────────────────────────────────────────────
UC1X = 15.0
uc1 = [
    (UC1X, 31.5, "Login /\nAuthenticate"),
    (UC1X, 28.5, "View Dashboard"),
    (UC1X, 25.5, "View Cost Reports"),
    (UC1X, 22.5, "Export Data"),
    (UC1X, 19.5, "View Billing\nHistory"),
    (UC1X, 16.5, "Set Budget\nAlerts"),
    (UC1X, 13.5, "View Anomaly\nReports"),
    (UC1X, 10.5, "Get\nRecommendations"),
]
for (cx, cy, lbl) in uc1:
    use_case(ax, cx, cy, lbl, w=7.8, h=2.2)

# ─────────────────────────────────────────────────────────────────────────────
# USE CASES — Column 2 (x = 28)
# ─────────────────────────────────────────────────────────────────────────────
UC2X = 28.0
uc2 = [
    (UC2X, 31.5, "Manage Users"),
    (UC2X, 28.5, "Configure System"),
    (UC2X, 25.5, "Monitor Azure\nUsage"),
    (UC2X, 22.5, "Sync Billing\nData"),
    (UC2X, 19.5, "Trigger Alerts"),
    (UC2X, 16.5, "Generate Reports"),
    (UC2X, 13.5, "Manage Resources"),
    (UC2X, 10.5, "Audit Logs"),
]
for (cx, cy, lbl) in uc2:
    use_case(ax, cx, cy, lbl, w=7.8, h=2.2)

# ─────────────────────────────────────────────────────────────────────────────
# ASSOCIATIONS — End User → use cases (column 1)
# ─────────────────────────────────────────────────────────────────────────────
ux, uy = 5.5, 30.5   # actor body mid point
for (_, ucy, _) in uc1:
    assoc(ax, ux, uy, UC1X - 3.9, ucy)

# ─────────────────────────────────────────────────────────────────────────────
# ASSOCIATIONS — Finance Manager → use cases
# ─────────────────────────────────────────────────────────────────────────────
fx, fy = 5.5, 21.0
fin_targets = [28.5, 25.5, 19.5, 16.5]  # Dashboard, Cost Reports, Billing, Budget
for ucy in fin_targets:
    assoc(ax, fx, fy, UC1X - 3.9, ucy)
# Finance Manager → Generate Reports (col 2)
assoc(ax, fx, fy, UC2X - 3.9, 16.5)

# ─────────────────────────────────────────────────────────────────────────────
# ASSOCIATIONS — System Admin → use cases
# ─────────────────────────────────────────────────────────────────────────────
sx, sy = 5.5, 11.5
admin_col2 = [31.5, 28.5, 13.5, 10.5]  # Manage Users, Configure, Manage Resources, Audit
for ucy in admin_col2:
    assoc(ax, sx, sy, UC2X - 3.9, ucy)
# Admin also → Login
assoc(ax, sx, sy, UC1X - 3.9, 31.5)

# ─────────────────────────────────────────────────────────────────────────────
# ASSOCIATIONS — Azure Cloud → use cases (right side)
# ─────────────────────────────────────────────────────────────────────────────
ax2, ay = 38.4, 21.0
azure_targets = [25.5, 22.5, 19.5]   # Monitor Azure, Sync Billing, Trigger Alerts
for ucy in azure_targets:
    assoc(ax, ax2, ay, UC2X + 3.9, ucy)

# ─────────────────────────────────────────────────────────────────────────────
# <<include>> / <<extend>> relationships (dashed arrows)
# ─────────────────────────────────────────────────────────────────────────────
# Login <<include>> Manage Users  (auth required)
dashed_arrow(ax, UC1X+3.9, 31.5,  UC2X-3.9, 31.5,  '<<include>>')

# View Dashboard <<include>> Generate Reports
dashed_arrow(ax, UC1X+3.9, 28.5,  UC2X-3.9, 16.5,  '<<include>>')

# View Anomaly Reports <<extend>> Trigger Alerts
dashed_arrow(ax, UC1X+3.9, 13.5,  UC2X-3.9, 19.5,  '<<extend>>')

# Set Budget Alerts <<extend>> Trigger Alerts
dashed_arrow(ax, UC1X+3.9, 16.5,  UC2X-3.9, 19.5,  '<<extend>>')

# Get Recommendations <<include>> Generate Reports
dashed_arrow(ax, UC1X+3.9, 10.5,  UC2X-3.9, 16.5,  '<<include>>')

# Sync Billing Data <<include>> Monitor Azure Usage
dashed_arrow(ax, UC2X, 22.5-1.1,  UC2X, 25.5+1.1,  '<<include>>')

# ─────────────────────────────────────────────────────────────────────────────
# LEGEND
# ─────────────────────────────────────────────────────────────────────────────
legend_items = [
    mpatches.Patch(facecolor='white', edgecolor='black', lw=2,
                   label='Oval  →  Use Case'),
    mpatches.Patch(facecolor='white', edgecolor='black', lw=2,
                   label='Rectangle  →  System Boundary'),
    Line2D([0],[0], color='black', lw=2,
           label='Solid Line  →  Association'),
    Line2D([0],[0], color='black', lw=2, linestyle='--',
           label='Dashed Arrow  →  <<include>> / <<extend>>'),
    Line2D([0],[0], color='black', lw=0, marker='$\u2640$', markersize=14,
           label='Stick Figure  →  Actor'),
]
ax.legend(handles=legend_items, loc='lower center',
          bbox_to_anchor=(0.5, 0.0), ncol=3,
          fontsize=11, framealpha=1, edgecolor='black')

# ─────────────────────────────────────────────────────────────────────────────
plt.tight_layout(pad=0.5)
out = r'C:\Users\Lenovo\OneDrive\Desktop\Collage wla\USE-CASE-DIAGRAM.png'
fig.savefig(out, dpi=200, bbox_inches='tight', facecolor='white', edgecolor='none')
print(f"Saved: {out}")
