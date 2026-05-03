import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Polygon
from matplotlib.lines import Line2D
import matplotlib.patches as mpatches

fig, ax = plt.subplots(figsize=(46, 38))
ax.set_xlim(0, 46); ax.set_ylim(0, 38); ax.axis('off')
fig.patch.set_facecolor('white'); ax.set_facecolor('white')

CW = 10.5   # class width
RH = 0.65   # row height
LW = 1.4

# ── colour palette ──────────────────────────────────────────────────────────
HDR = '#1e293b'   # dark slate header
BDY = '#ffffff'   # white body
BDR = '#64748b'   # slate border
HTX = '#ffffff'   # header text
BTX = '#1e293b'   # body text
ARR = '#334155'   # arrow colour
ACC = '#3b82f6'   # accent (stereotype, cardinality)

# ── helpers ─────────────────────────────────────────────────────────────────
def cls(ax, cx, cy, stereo, name, attrs, methods):
    ah = max(len(attrs), 2) * RH
    mh = max(len(methods), 2) * RH
    hh = 1.3
    th = hh + ah + mh
    x0, y0 = cx - CW/2, cy - th/2

    # body
    ax.add_patch(FancyBboxPatch((x0, y0), CW, th,
        boxstyle='square,pad=0', lw=LW, ec=BDR, fc=BDY, zorder=4))
    # header
    ax.add_patch(FancyBboxPatch((x0, y0+ah+mh), CW, hh,
        boxstyle='square,pad=0', lw=LW, ec=BDR, fc=HDR, zorder=5))
    # stereotype
    ax.text(cx, y0+ah+mh+hh*0.76, f'«{stereo}»',
            ha='center', va='center', fontsize=8.5, color=ACC, zorder=6)
    # class name
    ax.text(cx, y0+ah+mh+hh*0.3, name,
            ha='center', va='center', fontsize=12, fontweight='bold', color=HTX, zorder=6)
    # dividers
    ax.plot([x0, x0+CW], [y0+mh]*2, color=BDR, lw=0.8, zorder=5)
    ax.plot([x0, x0+CW], [y0+ah+mh]*2, color=BDR, lw=LW, zorder=5)
    # attributes
    for i, a in enumerate(attrs):
        ax.text(x0+0.22, y0+mh+ah-(i+0.55)*RH, a,
                ha='left', va='center', fontsize=8.5, color=BTX, zorder=6)
    # methods
    for i, m in enumerate(methods):
        ax.text(x0+0.22, y0+mh-(i+0.55)*RH, m,
                ha='left', va='center', fontsize=8.5, color='#475569', zorder=6)

    return dict(t=(cx, y0+th), b=(cx, y0),
                l=(x0, cy), r=(x0+CW, cy), cx=cx, cy=cy, y0=y0, th=th)


def arrow(ax, x1, y1, x2, y2, style='assoc', c1='', c2='', lbl=''):
    ls = 'dashed' if style == 'dep' else 'solid'
    ms = 16 if style == 'inh' else 13
    atype = '-|>' if style == 'inh' else '->'
    fc = 'white' if style == 'inh' else ARR
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1), zorder=3,
        arrowprops=dict(arrowstyle=atype, color=ARR, lw=1.6,
                        mutation_scale=ms, linestyle=ls,
                        shrinkA=4, shrinkB=4))
    mx, my = (x1+x2)/2, (y1+y2)/2
    if lbl:
        ax.text(mx, my+0.28, lbl, ha='center', fontsize=8,
                color='#64748b', style='italic', zorder=7,
                bbox=dict(fc='white', ec='none', pad=0.1))
    if c1: ax.text(x1+(x2-x1)*0.13, y1+(y2-y1)*0.13+0.22,
                   c1, fontsize=11, fontweight='bold', color=ACC, zorder=7)
    if c2: ax.text(x2-(x2-x1)*0.13, y2-(y2-y1)*0.13+0.22,
                   c2, fontsize=11, fontweight='bold', color=ACC, zorder=7)


def diamond(ax, x1, y1, x2, y2, filled=False, c1='', c2=''):
    dx, dy = x2-x1, y2-y1
    ln = max((dx**2+dy**2)**.5, .001)
    ux, uy = dx/ln, dy/ln; ds = 0.55
    pts = [(x1-uy*ds*.4, y1+ux*ds*.4),
           (x1+ux*ds, y1+uy*ds),
           (x1+uy*ds*.4, y1-ux*ds*.4),
           (x1, y1)]
    ax.add_patch(Polygon(pts, closed=True, lw=LW,
                         ec=ARR, fc=ARR if filled else 'white', zorder=5))
    ax.annotate('', xy=(x2, y2), xytext=(x1+ux*ds, y1+uy*ds), zorder=3,
        arrowprops=dict(arrowstyle='->', color=ARR, lw=1.6,
                        mutation_scale=13, shrinkA=0, shrinkB=4))
    if c1: ax.text(x1, y1+0.35, c1, ha='center', fontsize=11,
                   fontweight='bold', color=ACC, zorder=7)
    if c2: ax.text(x2, y2+0.35, c2, ha='center', fontsize=11,
                   fontweight='bold', color=ACC, zorder=7)


# ══════════════════════════════════════════════════════════════════════════
# TITLE
# ══════════════════════════════════════════════════════════════════════════
ax.text(23, 37.3, 'Azure Cloud Cost Monitoring & Optimization Platform',
        ha='center', fontsize=19, fontweight='bold', color=HDR)
ax.text(23, 36.6, 'UML Class Diagram', ha='center', fontsize=13, color='#64748b')

# ══════════════════════════════════════════════════════════════════════════
# CLASSES  —  3 × 3 grid
# ══════════════════════════════════════════════════════════════════════════
# Row 1 (top)
U  = cls(ax, 7, 30, 'entity', 'User',
    ['-userId : int', '-name : String',
     '-email : String', '-role : UserRole', '-isActive : bool'],
    ['+login() : Token', '+logout() : void',
     '+getProfile() : dict', '+updateProfile() : void'])

SB = cls(ax, 21, 30, 'entity', 'Subscription',
    ['-subId : int', '-azureSubId : String',
     '-tenantId : String', '-status : String'],
    ['+getResources() : List', '+getBudgets() : List',
     '+getCostRecords() : List'])

AZ = cls(ax, 36, 31, 'boundary', 'AzureAPIConnector',
    ['-endpoint : String', '-authToken : String',
     '-lastSync : DateTime', '-syncStatus : Enum'],
    ['+connect() : bool', '+fetchBilling() : List',
     '+fetchResources() : List', '+handleRateLimit() : void'])

# Row 2 (middle)
BM = cls(ax, 7, 20, 'control', 'BudgetManager',
    ['-budgetId : int', '-limitAmount : float',
     '-startDate : Date', '-endDate : Date', '-status : Enum'],
    ['+setBudget() : void', '+checkThreshold() : bool',
     '+notifyUser() : void', '+getStatus() : String'])

RG = cls(ax, 21, 20, 'entity', 'ResourceGroup',
    ['-rgId : int', '-name : String',
     '-location : String', '-tags : dict'],
    ['+getResources() : List', '+getTotalCost() : float',
     '+updateMetadata() : void'])

RE = cls(ax, 36, 20, 'entity', 'Resource',
    ['-resourceId : int', '-name : String',
     '-type : String', '-status : String'],
    ['+getCost() : float', '+getMetrics() : dict',
     '+syncStatus() : void'])

# Row 3 (bottom)
AL = cls(ax, 7, 9, 'control', 'AlertService',
    ['-alertId : int', '-type : AlertType',
     '-threshold : float', '-status : Enum'],
    ['+createAlert() : Alert', '+sendAlert() : void',
     '+acknowledge() : void', '+getHistory() : List'])

CR = cls(ax, 21, 9, 'entity', 'CostRecord',
    ['-costId : int', '-amount : float',
     '-currency : String', '-billingPeriod : String',
     '-recordedAt : DateTime'],
    ['+getSummary() : dict', '+getByPeriod() : List'])

RPT= cls(ax, 36, 9, 'control', 'ReportGenerator',
    ['-reportId : int', '-type : String', '-format : String'],
    ['+generateReport() : Report', '+exportPDF() : File',
     '+exportCSV() : File', '+scheduleReport() : void'])

# ══════════════════════════════════════════════════════════════════════════
# RELATIONSHIPS
# ══════════════════════════════════════════════════════════════════════════
# User ──1:N──> Subscription
arrow(ax, U['r'][0], U['r'][1], SB['l'][0], SB['l'][1],
      c1='1', c2='N', lbl='manages')

# Subscription ──◇──1:N──> ResourceGroup
diamond(ax, SB['b'][0], SB['b'][1],
        RG['t'][0], RG['t'][1], False, '1', 'N')

# ResourceGroup ──◇──1:N──> Resource
arrow(ax, RG['r'][0], RG['r'][1], RE['l'][0], RE['l'][1],
      c1='1', c2='N', lbl='contains')

# Resource ──◆──1:N──> CostRecord
diamond(ax, RE['b'][0], RE['b'][1],
        CR['t'][0], CR['t'][1], True, '1', 'N')

# User ──1:N──> BudgetManager
arrow(ax, U['b'][0], U['b'][1], BM['t'][0], BM['t'][1],
      c1='1', c2='N', lbl='manages')

# BudgetManager ──1:N──> AlertService
arrow(ax, BM['b'][0], BM['b'][1], AL['t'][0], AL['t'][1],
      c1='1', c2='N', lbl='triggers')

# AzureAPIConnector --dep--> Subscription
arrow(ax, AZ['l'][0], AZ['l'][1], SB['r'][0], SB['r'][1],
      style='dep', lbl='«syncs»')

# AzureAPIConnector --dep--> CostRecord
arrow(ax, AZ['b'][0], AZ['b'][1], CR['r'][0], CR['r'][1],
      style='dep', lbl='«provides»')

# ReportGenerator --dep--> CostRecord
arrow(ax, RPT['l'][0], RPT['l'][1], CR['r'][0], CR['r'][1],
      style='dep', lbl='«reads»')

# CostRecord --assoc--> BudgetManager
arrow(ax, CR['l'][0], CR['l'][1], BM['r'][0], BM['r'][1],
      style='dep', lbl='«evaluates»')

# ══════════════════════════════════════════════════════════════════════════
# LEGEND
# ══════════════════════════════════════════════════════════════════════════
items = [
    mpatches.Patch(fc=HDR, ec=BDR, lw=1.4, label='Dark Header  →  Stereotype + Class Name'),
    mpatches.Patch(fc=BDY, ec=BDR, lw=1.4, label='White Body  →  Attributes / Methods'),
    Line2D([0],[0], color=ARR, lw=2, label='Solid Arrow  →  Association'),
    Line2D([0],[0], color=ARR, lw=2, linestyle='dashed', label='Dashed Arrow  →  Dependency'),
    mpatches.Patch(fc='white', ec=ARR, lw=1.6, label='Hollow ◇  →  Aggregation'),
    mpatches.Patch(fc=ARR, ec=ARR, lw=1.6, label='Filled ◆  →  Composition'),
]
ax.legend(handles=items, loc='lower center', ncol=3, fontsize=11,
          framealpha=1, edgecolor='#cbd5e1', bbox_to_anchor=(0.5, 0.0),
          facecolor='white')

out = r'C:\Users\Lenovo\OneDrive\Desktop\Collage wla\CLASS-DIAGRAM-CLEAN.png'
fig.savefig(out, dpi=180, bbox_inches='tight', facecolor='white')
print(f"Saved: {out}")
