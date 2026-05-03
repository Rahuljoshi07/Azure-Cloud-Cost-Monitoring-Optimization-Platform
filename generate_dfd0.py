import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Circle, Ellipse, Polygon
import matplotlib.patheffects as pe
import numpy as np

# ── Canvas ─────────────────────────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(36, 28))
ax.set_xlim(0, 36)
ax.set_ylim(0, 28)
ax.axis('off')
fig.patch.set_facecolor('white')
ax.set_facecolor('white')

LW  = 2.2
FS  = 13
FSL = 11   # label on arrows

# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────
def entity(ax, cx, cy, w=5.0, h=1.8, text='', fs=FS):
    """External entity — plain rectangle."""
    x, y = cx - w/2, cy - h/2
    r = FancyBboxPatch((x, y), w, h, boxstyle='square,pad=0',
                       linewidth=LW, edgecolor='black', facecolor='white', zorder=4)
    ax.add_patch(r)
    ax.text(cx, cy, text, ha='center', va='center',
            fontsize=fs, fontweight='bold', zorder=5, multialignment='center')

def process_circle(ax, cx, cy, r=4.8, text='', fs=FS+1):
    """Central process — large circle."""
    c = Circle((cx, cy), r, linewidth=LW+0.5,
               edgecolor='black', facecolor='white', zorder=4)
    ax.add_patch(c)
    ax.text(cx, cy, text, ha='center', va='center',
            fontsize=fs, fontweight='bold', zorder=5, multialignment='center')

def database(ax, cx, cy, w=4.2, h=3.8, text='', fs=FS):
    """Database — cylinder (rect + ellipse top + ellipse bottom)."""
    eh = 0.55   # ellipse height
    x  = cx - w/2
    # body rect
    r = FancyBboxPatch((x, cy - h/2), w, h, boxstyle='square,pad=0',
                       linewidth=LW, edgecolor='black', facecolor='white', zorder=4)
    ax.add_patch(r)
    # top ellipse (lid)
    top = Ellipse((cx, cy + h/2), w, eh,
                  linewidth=LW, edgecolor='black', facecolor='white', zorder=6)
    ax.add_patch(top)
    # bottom ellipse stroke only (visible arc)
    bot = Ellipse((cx, cy - h/2), w, eh,
                  linewidth=LW, edgecolor='black', facecolor='white', zorder=5)
    ax.add_patch(bot)
    ax.text(cx, cy, text, ha='center', va='center',
            fontsize=fs, fontweight='bold', zorder=7, multialignment='center')

def flow(ax, x1, y1, x2, y2, label='', lx=0, ly=0.35, ha='center', bidirect=False, rad=0.0):
    """Arrow with label."""
    style = '<->' if bidirect else '->'
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle=style, color='black', lw=LW,
                                mutation_scale=20,
                                connectionstyle=f'arc3,rad={rad}'),
                zorder=3)
    if label:
        mx = (x1+x2)/2 + lx
        my = (y1+y2)/2 + ly
        ax.text(mx, my, label, ha=ha, va='center',
                fontsize=FSL, style='italic', zorder=6,
                multialignment='center')

def flow_pair(ax, x1, y1, x2, y2, label_fwd, label_bwd,
              fwd_ly=0.3, bwd_ly=-0.3, lx=0, ha='center', gap=0.18):
    """Two separate arrows (forward + backward) with labels, slightly offset."""
    # forward arrow (slightly above centre line)
    dx = y2 - y1; dy = x1 - x2
    mag = max((dx**2+dy**2)**0.5, 0.001)
    ox, oy = gap * dx/mag, gap * dy/mag
    ax.annotate('', xy=(x2+ox, y2+oy), xytext=(x1+ox, y1+oy),
                arrowprops=dict(arrowstyle='->', color='black', lw=LW,
                                mutation_scale=20), zorder=3)
    ax.annotate('', xy=(x1-ox, y1-oy), xytext=(x2-ox, y2-oy),
                arrowprops=dict(arrowstyle='->', color='black', lw=LW,
                                mutation_scale=20), zorder=3)
    mx = (x1+x2)/2 + lx
    my = (y1+y2)/2
    ax.text(mx, my + fwd_ly, label_fwd, ha=ha, va='center',
            fontsize=FSL, style='italic', zorder=6, multialignment='center')
    ax.text(mx, my + bwd_ly, label_bwd, ha=ha, va='center',
            fontsize=FSL, style='italic', zorder=6, multialignment='center')

# ─────────────────────────────────────────────────────────────────────────────
# TITLE
# ─────────────────────────────────────────────────────────────────────────────
ax.text(18, 27.3, 'Azure Cloud Cost Monitoring & Optimization Platform',
        ha='center', va='center', fontsize=20, fontweight='bold')
ax.text(18, 26.5, 'Data Flow Diagram — Level 0 (Context Diagram)',
        ha='center', va='center', fontsize=14, color='#444444')

# ─────────────────────────────────────────────────────────────────────────────
# POSITIONS
# ─────────────────────────────────────────────────────────────────────────────
# Central process
PCX, PCY, PR = 18, 13.5, 5.0

# External entities (left column)
EX = 3.8   # entity centre-x
entities_left = [
    (EX, 22.5, "End User /\nDeveloper"),
    (EX, 17.0, "Finance\nManager"),
    (EX, 11.5, "System\nAdmin"),
    (EX,  6.0, "Azure Cloud\n(External API)"),
]

# Database (right)
DBX, DBY = 32.5, 13.5

# ─────────────────────────────────────────────────────────────────────────────
# DRAW SHAPES
# ─────────────────────────────────────────────────────────────────────────────
process_circle(ax, PCX, PCY, PR,
               text="Azure Cloud Cost\nMonitoring &\nOptimization\nSystem")

for (ex, ey, lbl) in entities_left:
    entity(ax, ex, ey, w=5.2, h=1.9, text=lbl)

database(ax, DBX, DBY, w=4.4, h=3.6, text="PostgreSQL\nDatabase")

# ─────────────────────────────────────────────────────────────────────────────
# DATA FLOWS
# ─────────────────────────────────────────────────────────────────────────────

# --- End User / Developer (top-left) ---
# entity right edge → circle left-upper
# forward: user → system
flow_pair(ax,
          EX + 2.6, 22.5,
          PCX - PR * 0.70, PCY + PR * 0.68,
          label_fwd="Sends login credentials,\ncost queries & budget requests",
          label_bwd="Returns dashboard, cost reports,\nalerts & recommendations",
          fwd_ly=0.50, bwd_ly=-0.55,
          lx=1.0, ha='center')

# --- Finance Manager (middle-left) ---
flow_pair(ax,
          EX + 2.6, 17.0,
          PCX - PR, PCY + 0.15,
          label_fwd="Budget limits &\nreport requests",
          label_bwd="Cost reports &\nbudget alerts",
          fwd_ly=0.45, bwd_ly=-0.48,
          lx=0.8, ha='center')

# --- System Admin (lower-left) ---
flow_pair(ax,
          EX + 2.6, 11.5,
          PCX - PR * 0.70, PCY - PR * 0.70,
          label_fwd="User management &\nsystem configuration",
          label_bwd="Audit logs &\nsystem status",
          fwd_ly=0.45, bwd_ly=-0.48,
          lx=0.9, ha='center')

# --- Azure Cloud API (bottom-left) ---
flow_pair(ax,
          EX + 2.6, 6.0,
          PCX - PR * 0.35, PCY - PR * 0.93,
          label_fwd="Cost data, resource info,\nVM metrics & recommendations",
          label_bwd="API authentication\nrequests",
          fwd_ly=0.45, bwd_ly=-0.48,
          lx=1.2, ha='center')

# --- Database (right) ---
# Store (system → DB)
flow(ax, PCX + PR * 0.92, PCY + 0.4,
     DBX - 2.2, DBY + 0.4,
     label="Store data", ly=0.4, ha='center')
# Retrieve (DB → system)
flow(ax, DBX - 2.2, DBY - 0.4,
     PCX + PR * 0.92, PCY - 0.4,
     label="Retrieve data", ly=-0.45, ha='center')

# ─────────────────────────────────────────────────────────────────────────────
# LEGEND
# ─────────────────────────────────────────────────────────────────────────────
from matplotlib.lines import Line2D
legend_items = [
    mpatches.Patch(facecolor='white', edgecolor='black', lw=2,
                   label='Rectangle  →  External Entity'),
    mpatches.Patch(facecolor='white', edgecolor='black', lw=2,
                   label='Circle  →  Central Process (System)'),
    mpatches.Patch(facecolor='white', edgecolor='black', lw=2,
                   label='Cylinder  →  Data Store (Database)'),
    Line2D([0],[0], color='black', lw=2, marker='>', markersize=9,
           label='Arrow  →  Data Flow'),
]
ax.legend(handles=legend_items, loc='lower center',
          bbox_to_anchor=(0.5, 0.0), ncol=2,
          fontsize=12, framealpha=1, edgecolor='black')

# ─────────────────────────────────────────────────────────────────────────────
plt.tight_layout(pad=0.5)
out = r'C:\Users\Lenovo\OneDrive\Desktop\Collage wla\DFD-LEVEL0.png'
fig.savefig(out, dpi=200, bbox_inches='tight', facecolor='white', edgecolor='none')
print(f"Saved: {out}")
