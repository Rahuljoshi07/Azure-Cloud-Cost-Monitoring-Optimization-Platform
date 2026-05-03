import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Ellipse
import matplotlib.patches as mpatches

fig, ax = plt.subplots(figsize=(46, 30))
ax.set_xlim(0, 46); ax.set_ylim(0, 30); ax.axis('off')
fig.patch.set_facecolor('white'); ax.set_facecolor('white')

BW, BH = 8.5, 4.8   # box width/height
LW = 1.8

# ── colours ─────────────────────────────────────────────────────────────────
C = {
    'blue':   ('#dce6f1', '#4472c4'),
    'yellow': ('#fff2cc', '#c9a227'),
    'green':  ('#e2efda', '#70ad47'),
    'orange': ('#fce4d6', '#ed7d31'),
    'gray':   ('#d9d9d9', '#595959'),
}

# ── helpers ──────────────────────────────────────────────────────────────────
def box(ax, cx, cy, color, code, name, sprint, dates):
    fc, ec = C[color]
    ax.add_patch(FancyBboxPatch((cx-BW/2, cy-BH/2), BW, BH,
        boxstyle='round,pad=0.18', lw=LW, ec=ec, fc=fc, zorder=4))
    ax.text(cx, cy+BH*0.28, f'{code}:  {name}',
            ha='center', va='center', fontsize=11, fontweight='bold',
            color='#1a1a1a', zorder=5)
    ax.text(cx, cy,       sprint,
            ha='center', va='center', fontsize=10.5, color='#444', zorder=5)
    ax.text(cx, cy-BH*0.28, dates,
            ha='center', va='center', fontsize=10, color='#555', zorder=5)
    return (cx-BW/2, cx+BW/2, cy-BH/2, cy+BH/2)   # l, r, b, t

def oval(ax, cx, cy, label, w=4.2, h=2.0):
    fc, ec = C['gray']
    ax.add_patch(Ellipse((cx, cy), w, h, lw=LW, ec=ec, fc=fc, zorder=4))
    ax.text(cx, cy, label, ha='center', va='center',
            fontsize=13, fontweight='bold', color='#1a1a1a', zorder=5)

def arr(ax, x1, y1, x2, y2):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1), zorder=3,
        arrowprops=dict(arrowstyle='->', color='#222', lw=1.8,
                        mutation_scale=14, shrinkA=3, shrinkB=3,
                        connectionstyle='arc3,rad=0.0'))

# ══════════════════════════════════════════════════════════════════════════
# TITLE
# ══════════════════════════════════════════════════════════════════════════
ax.text(23, 29.3, 'Azure Cloud Cost Monitoring & Optimization Platform',
        ha='center', fontsize=18, fontweight='bold', color='#0f172a')
ax.text(23, 28.6, 'PERT Chart  —  Project Schedule & Task Dependencies',
        ha='center', fontsize=12, color='#64748b')

# ══════════════════════════════════════════════════════════════════════════
# NODES
# ══════════════════════════════════════════════════════════════════════════
# Start / End ovals
oval(ax, 2.8, 15,  'Start')
oval(ax, 43,  15,  'End')

# Column 1  (x=10)
box(ax, 10, 23.5, 'blue',   'A', 'Requirements & Analysis', 'Sprint 1',  '1 Jan – 15 Jan')
box(ax, 10, 15,   'yellow', 'B', 'UI / UX Design',          'Sprint 2a', '16 Jan – 25 Jan')
box(ax, 10,  6.5, 'yellow', 'C', 'Database Schema',         'Sprint 2b', '26 Jan – 8 Feb')

# Column 2  (x=24)
box(ax, 24, 23.5, 'green',  'D', 'Azure API Integration',   'Sprint 3a', '10 Feb – 28 Feb')
box(ax, 24, 15,   'green',  'E', 'Cost Analytics Engine',   'Sprint 3b', '28 Feb – 14 Mar')
box(ax, 24,  6.5, 'green',  'F', 'Alert & Budget Module',   'Sprint 3c', '1 Mar – 14 Mar')

# Column 3  (x=37)
box(ax, 37, 21,   'orange', 'G', 'Dashboard & Reporting',   'Sprint 4a', '15 Mar – 28 Mar')
box(ax, 37,  9,   'orange', 'H', 'Testing & Deployment',    'Sprint 4b', '29 Mar – 12 Apr')

# ══════════════════════════════════════════════════════════════════════════
# ARROWS
# ══════════════════════════════════════════════════════════════════════════
# Start  →  A, B, C
arr(ax, 5.0,  15,   6.75, 22.5)   # Start → A (up)
arr(ax, 5.0,  15,   6.75, 15)     # Start → B
arr(ax, 5.0,  15,   6.75,  7.5)   # Start → C (down)

# A  →  D, E
arr(ax, 14.25, 23.5, 19.75, 23.5) # A → D
arr(ax, 14.25, 22.5, 19.75, 16)   # A → E (diagonal down)

# B  →  D, E
arr(ax, 14.25, 16,   19.75, 22.5) # B → D (diagonal up)
arr(ax, 14.25, 15,   19.75, 15)   # B → E

# C  →  E, F
arr(ax, 14.25,  8,   19.75, 14)   # C → E (diagonal up)
arr(ax, 14.25,  6.5, 19.75,  6.5) # C → F

# D  →  G
arr(ax, 28.25, 23.5, 32.75, 22)   # D → G

# E  →  G, H
arr(ax, 28.25, 16,   32.75, 20)   # E → G (up)
arr(ax, 28.25, 14,   32.75, 10)   # E → H (down)

# F  →  H
arr(ax, 28.25,  7.5, 32.75,  8)   # F → H (slight up)

# G  →  End
arr(ax, 41.25, 21,   41.5,  16)   # G → End

# H  →  End
arr(ax, 41.25,  9,   41.5,  14)   # H → End

# ══════════════════════════════════════════════════════════════════════════
# LEGEND
# ══════════════════════════════════════════════════════════════════════════
items = [
    mpatches.Patch(fc='#dce6f1', ec='#4472c4', lw=2, label='Sprint 1  —  Initiation'),
    mpatches.Patch(fc='#fff2cc', ec='#c9a227', lw=2, label='Sprint 2  —  Design'),
    mpatches.Patch(fc='#e2efda', ec='#70ad47', lw=2, label='Sprint 3  —  Development'),
    mpatches.Patch(fc='#fce4d6', ec='#ed7d31', lw=2, label='Sprint 4  —  QA & Release'),
]
ax.legend(handles=items, loc='lower left', ncol=4, fontsize=11,
          framealpha=1, edgecolor='#cbd5e1', bbox_to_anchor=(0.04, 0.0))

out = r'C:\Users\Lenovo\OneDrive\Desktop\Collage wla\PERT-CHART.png'
fig.savefig(out, dpi=180, bbox_inches='tight', facecolor='white')
print(f"Saved: {out}")
