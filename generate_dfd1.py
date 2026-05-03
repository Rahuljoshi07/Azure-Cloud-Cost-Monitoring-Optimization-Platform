import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Ellipse
from matplotlib.lines import Line2D
import numpy as np

# ── Canvas ─────────────────────────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(36, 48))
ax.set_xlim(0, 36)
ax.set_ylim(0, 48)
ax.axis('off')
fig.patch.set_facecolor('white')
ax.set_facecolor('white')

LW = 2.2
FS = 13

# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────
def entity(ax, cx, cy, w=5.5, h=2.0, text='', fs=FS):
    """External entity — plain rectangle."""
    r = FancyBboxPatch((cx-w/2, cy-h/2), w, h,
                       boxstyle='square,pad=0', linewidth=LW,
                       edgecolor='black', facecolor='white', zorder=4)
    ax.add_patch(r)
    ax.text(cx, cy, text, ha='center', va='center',
            fontsize=fs, fontweight='bold', zorder=5, multialignment='center')

def process_oval(ax, cx, cy, w=7.5, h=3.8, text='', fs=FS):
    """Process — oval/ellipse (matching reference style)."""
    e = Ellipse((cx, cy), w, h, linewidth=LW,
                edgecolor='black', facecolor='white', zorder=4)
    ax.add_patch(e)
    ax.text(cx, cy, text, ha='center', va='center',
            fontsize=fs, zorder=5, multialignment='center')

def cylinder(ax, cx, cy, w=5.2, h=2.8, text='', fs=FS-1):
    """Data store — cylinder shape."""
    eh = 0.55
    # body
    r = FancyBboxPatch((cx-w/2, cy-h/2), w, h,
                       boxstyle='square,pad=0', linewidth=LW,
                       edgecolor='black', facecolor='white', zorder=4)
    ax.add_patch(r)
    # top ellipse
    ax.add_patch(Ellipse((cx, cy+h/2), w, eh,
                         linewidth=LW, edgecolor='black',
                         facecolor='white', zorder=6))
    # bottom ellipse
    ax.add_patch(Ellipse((cx, cy-h/2), w, eh,
                         linewidth=LW, edgecolor='black',
                         facecolor='white', zorder=5))
    ax.text(cx, cy, text, ha='center', va='center',
            fontsize=fs, fontweight='bold', zorder=7, multialignment='center')

def arr(ax, x1, y1, x2, y2, rad=0.0):
    """Simple black arrow, no label."""
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color='black', lw=LW,
                                mutation_scale=18,
                                connectionstyle=f'arc3,rad={rad}'),
                zorder=3)

def arr2(ax, x1, y1, x2, y2, rad=0.0):
    """Two-headed arrow (bidirectional)."""
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='<->', color='black', lw=LW,
                                mutation_scale=18,
                                connectionstyle=f'arc3,rad={rad}'),
                zorder=3)

def line_seg(ax, pts):
    """Draw a polyline through list of (x,y) tuples."""
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    ax.plot(xs, ys, color='black', lw=LW, zorder=3)

def final_arrow(ax, x, y, dx, dy):
    """Arrow head at end of a path."""
    ax.annotate('', xy=(x+dx, y+dy), xytext=(x, y),
                arrowprops=dict(arrowstyle='->', color='black', lw=LW,
                                mutation_scale=18), zorder=3)

# ─────────────────────────────────────────────────────────────────────────────
# TITLE
# ─────────────────────────────────────────────────────────────────────────────
ax.text(18, 47.3, 'Azure Cloud Cost Monitoring & Optimization Platform',
        ha='center', va='center', fontsize=20, fontweight='bold')
ax.text(18, 46.4, 'Data Flow Diagram — Level 1',
        ha='center', va='center', fontsize=15, color='#444')

# ─────────────────────────────────────────────────────────────────────────────
# LAYOUT CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────
# Left external entities  (x ≈ 4)
LEX = 4.0
# Right external entities (x ≈ 32)
REX = 32.0
# Centre processes        (x ≈ 18)
PCX = 18.0
# Oval dimensions
OW, OH = 8.5, 4.0
# Entity dimensions
EW, EH = 5.5, 2.0
# Data store dimensions
DW, DH = 5.5, 2.6

# Process Y positions (top → bottom, 6 processes)
PY = [43.5, 37.5, 31.5, 25.5, 19.5, 13.0]

# Data store Y (bottom row)
DSY = 5.0
# Data store X positions (6 stores)
DSX = [3.0, 9.5, 16.0, 22.5, 29.0, 35.0]  # adjusted later

# ─────────────────────────────────────────────────────────────────────────────
# PROCESSES (6 ovals, centre column)
# ─────────────────────────────────────────────────────────────────────────────
proc_labels = [
    "Authentication\nProcess",
    "Cost Monitoring\nProcess",
    "Resource Management\nProcess",
    "Budget & Alert\nProcess",
    "Data Sync\nProcess",
    "Report & Forecast\nProcess",
]
for i, (py, lbl) in enumerate(zip(PY, proc_labels)):
    process_oval(ax, PCX, py, OW, OH, lbl)

# ─────────────────────────────────────────────────────────────────────────────
# LEFT EXTERNAL ENTITIES
# ─────────────────────────────────────────────────────────────────────────────
# Aligned roughly with processes
left_entities = [
    (LEX, 41.5, "End User /\nDeveloper"),
    (LEX, 28.5, "Finance\nManager"),
    (LEX, 17.0, "System\nAdmin"),
]
for (ex, ey, lbl) in left_entities:
    entity(ax, ex, ey, EW, EH, lbl)

# ─────────────────────────────────────────────────────────────────────────────
# RIGHT EXTERNAL ENTITIES
# ─────────────────────────────────────────────────────────────────────────────
right_entities = [
    (REX, 37.5, "Azure Cloud\nAPI"),
]
for (ex, ey, lbl) in right_entities:
    entity(ax, ex, ey, EW, EH, lbl)

# ─────────────────────────────────────────────────────────────────────────────
# DATA STORES (bottom, 6 cylinders)
# ─────────────────────────────────────────────────────────────────────────────
DSX_pos = [3.0, 9.5, 16.0, 22.5, 29.0, 35.5]
ds_labels = [
    "D1 User\nDatabase",
    "D2 Cost Records\nDatabase",
    "D3 Resources\nDatabase",
    "D4 Budget &\nAlerts DB",
    "D5 Recommendations\nDatabase",
    "D6 Reports\nDatabase",
]
for dx, lbl in zip(DSX_pos, ds_labels):
    cylinder(ax, dx, DSY, DW, DH, lbl, fs=FS-2)

# ─────────────────────────────────────────────────────────────────────────────
# ARROWS — Left entities → Processes
# ─────────────────────────────────────────────────────────────────────────────
# End User → P1 (Authentication)
arr(ax, LEX+EW/2, 41.8,  PCX-OW/2, PY[0]+0.3)
# End User → P2 (Cost Monitoring)
arr(ax, LEX+EW/2, 41.2,  PCX-OW/2, PY[1]+0.5)
# End User ← P1 (receives session token) – slightly offset
arr(ax, PCX-OW/2, PY[0]-0.3, LEX+EW/2, 41.4, rad=0.15)
# End User → P6 (view reports)
arr(ax, LEX+EW/2, 40.8,  PCX-OW/2, PY[5]+0.5, rad=-0.1)

# Finance Manager → P1
arr(ax, LEX+EW/2, 28.8,  PCX-OW/2, PY[0]-0.5, rad=-0.08)
# Finance Manager → P4 (Budget & Alert)
arr(ax, LEX+EW/2, 28.5,  PCX-OW/2, PY[3]+0.4)
# Finance Manager ← P6 (receives cost reports)
arr(ax, PCX-OW/2, PY[5]-0.3, LEX+EW/2, 28.2, rad=0.12)
# Finance Manager → P6
arr(ax, LEX+EW/2, 28.1,  PCX-OW/2, PY[5]+0.2, rad=-0.05)

# System Admin → P1
arr(ax, LEX+EW/2, 17.3,  PCX-OW/2, PY[0]-1.0, rad=-0.12)
# System Admin → P3 (Resource Management)
arr(ax, LEX+EW/2, 17.0,  PCX-OW/2, PY[2]+0.3)
# System Admin → P5 (Data Sync – trigger manual)
arr(ax, LEX+EW/2, 16.7,  PCX-OW/2, PY[4]+0.3)
# System Admin ← P3 (resource status)
arr(ax, PCX-OW/2, PY[2]-0.3, LEX+EW/2, 16.5, rad=0.12)

# ─────────────────────────────────────────────────────────────────────────────
# ARROWS — Right entity (Azure Cloud API) → Processes
# ─────────────────────────────────────────────────────────────────────────────
# Azure → P2 (cost data)
arr(ax, REX-EW/2, 37.8,  PCX+OW/2, PY[1]+0.5)
# Azure → P3 (resource graph data)
arr(ax, REX-EW/2, 37.5,  PCX+OW/2, PY[2]+0.5)
# Azure → P5 (sync trigger / full data)
arr(ax, REX-EW/2, 37.2,  PCX+OW/2, PY[4]+0.5)
# P5 ← Azure (API requests back)
arr(ax, PCX+OW/2, PY[4]-0.3, REX-EW/2, 37.0, rad=0.15)

# ─────────────────────────────────────────────────────────────────────────────
# ARROWS — Processes → Data Stores (bottom cylinders)
# ─────────────────────────────────────────────────────────────────────────────
# P1 (Auth) ↔ D1 (User DB)
arr2(ax, PCX - 1.5, PY[0]-OH/2, DSX_pos[0]+0.5, DSY+DH/2)

# P2 (Cost Monitoring) ↔ D2 (Cost Records)
arr2(ax, PCX - 1.0, PY[1]-OH/2, DSX_pos[1]+0.8, DSY+DH/2)

# P3 (Resource Mgmt) ↔ D3 (Resources DB)
arr2(ax, PCX,       PY[2]-OH/2, DSX_pos[2]+0.5, DSY+DH/2)

# P4 (Budget & Alert) ↔ D4 (Budget DB)
arr2(ax, PCX + 0.5, PY[3]-OH/2, DSX_pos[3]+0.2, DSY+DH/2)

# P5 (Data Sync) → D1, D2, D3, D4 (updates all on sync)
arr(ax, PCX - 2.5, PY[4]-OH/2, DSX_pos[0]+1.0, DSY+DH/2, rad=0.1)
arr(ax, PCX - 1.5, PY[4]-OH/2, DSX_pos[1]+0.5, DSY+DH/2, rad=0.05)
arr(ax, PCX + 0.0, PY[4]-OH/2, DSX_pos[2]+1.0, DSY+DH/2, rad=-0.05)
arr(ax, PCX + 1.5, PY[4]-OH/2, DSX_pos[3]+0.5, DSY+DH/2, rad=-0.08)
# P5 → D5 (Recommendations)
arr(ax, PCX + 2.5, PY[4]-OH/2, DSX_pos[4]+0.2, DSY+DH/2, rad=-0.1)

# P6 (Report & Forecast) ↔ D6 (Reports DB)
arr2(ax, PCX + 2.0, PY[5]-OH/2, DSX_pos[5]-0.8, DSY+DH/2)
# P6 reads from D5 (recommendations)
arr(ax, DSX_pos[4]+0.5, DSY+DH/2, PCX + 2.5, PY[5]-OH/2, rad=0.1)
# P6 reads from D2 (cost records for forecast)
arr(ax, DSX_pos[1]+1.5, DSY+DH/2, PCX - 2.0, PY[5]-OH/2, rad=0.08)

# ─────────────────────────────────────────────────────────────────────────────
# ARROWS — Between Processes (internal flows)
# ─────────────────────────────────────────────────────────────────────────────
# P1 → P2 (verified user session → cost monitor)
arr(ax, PCX + 1.5, PY[0]-OH/2, PCX + 2.0, PY[1]+OH/2)
# P1 → P3 (verified session → resource mgmt)
arr(ax, PCX + 2.0, PY[0]-OH/2, PCX + 2.5, PY[2]+OH/2, rad=-0.05)
# P1 → P4 (verified session → budget)
arr(ax, PCX + 2.5, PY[0]-OH/2, PCX + 3.0, PY[3]+OH/2, rad=-0.08)
# P1 → P6 (verified session → reports)
arr(ax, PCX + 3.0, PY[0]-OH/2, PCX + 3.5, PY[5]+OH/2, rad=-0.12)

# P2 → P4 (anomalies detected → budget alert)
arr(ax, PCX - 1.0, PY[1]-OH/2, PCX - 1.5, PY[3]+OH/2)
# P4 → P6 (alert data → reports)
arr(ax, PCX - 0.5, PY[3]-OH/2, PCX - 1.0, PY[5]+OH/2, rad=0.05)
# P5 → P2 (synced cost data flows to monitor)
arr(ax, PCX - 2.0, PY[4]+OH/2, PCX - 2.5, PY[1]-OH/2, rad=0.05)
# P5 → P3 (synced resource data)
arr(ax, PCX - 1.5, PY[4]+OH/2, PCX - 2.0, PY[2]-OH/2, rad=0.05)

# ─────────────────────────────────────────────────────────────────────────────
# LEGEND
# ─────────────────────────────────────────────────────────────────────────────
legend_items = [
    mpatches.Patch(facecolor='white', edgecolor='black', lw=2,
                   label='Rectangle  →  External Entity'),
    mpatches.Patch(facecolor='white', edgecolor='black', lw=2,
                   label='Oval  →  Process'),
    mpatches.Patch(facecolor='white', edgecolor='black', lw=2,
                   label='Cylinder  →  Data Store'),
    Line2D([0],[0], color='black', lw=2, marker='>', markersize=9,
           label='Arrow  →  Data Flow Direction'),
]
ax.legend(handles=legend_items, loc='lower center',
          bbox_to_anchor=(0.5, 0.0), ncol=2,
          fontsize=12, framealpha=1, edgecolor='black')

# ─────────────────────────────────────────────────────────────────────────────
plt.tight_layout(pad=0.5)
out = r'C:\Users\Lenovo\OneDrive\Desktop\Collage wla\DFD-LEVEL1.png'
fig.savefig(out, dpi=200, bbox_inches='tight', facecolor='white', edgecolor='none')
print(f"Saved: {out}")
