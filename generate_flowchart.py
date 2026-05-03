import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import Ellipse, FancyBboxPatch, Polygon
from matplotlib.lines import Line2D
import numpy as np

# ── Canvas ─────────────────────────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(40, 90))
ax.set_xlim(0, 40)
ax.set_ylim(0, 240)
ax.axis('off')
fig.patch.set_facecolor('white')
ax.set_facecolor('white')

CX  = 20      # centre x
LW  = 2.5     # line width
FS  = 15      # base font size
FC  = 'white'
EC  = 'black'

# ─────────────────────────────────────────────────────────────────────────────
# SHAPE HELPERS
# ─────────────────────────────────────────────────────────────────────────────
def oval(ax, cx, cy, w=9, h=2.2, text='', fs=FS+2):
    e = Ellipse((cx, cy), w, h, linewidth=LW, edgecolor=EC, facecolor=FC, zorder=4)
    ax.add_patch(e)
    ax.text(cx, cy, text, ha='center', va='center',
            fontsize=fs, fontweight='bold', zorder=5)

def rect(ax, cx, cy, w=12, h=2.2, text='', fs=FS):
    x, y = cx - w/2, cy - h/2
    r = FancyBboxPatch((x, y), w, h, boxstyle='square,pad=0',
                       linewidth=LW, edgecolor=EC, facecolor=FC, zorder=4)
    ax.add_patch(r)
    ax.text(cx, cy, text, ha='center', va='center',
            fontsize=fs, zorder=5, multialignment='center')

def parallelogram(ax, cx, cy, w=12, h=2.2, text='', fs=FS, skew=0.9):
    x, y = cx - w/2, cy - h/2
    pts = np.array([
        [x + skew,     y + h],
        [x + w + skew, y + h],
        [x + w - skew, y    ],
        [x - skew,     y    ],
    ])
    pts[:, 0] -= skew / 2
    p = Polygon(pts, closed=True, linewidth=LW, edgecolor=EC, facecolor=FC, zorder=4)
    ax.add_patch(p)
    ax.text(cx, cy, text, ha='center', va='center',
            fontsize=fs, zorder=5, multialignment='center')

def diamond(ax, cx, cy, w=11, h=3.0, text='', fs=FS-1):
    pts = np.array([
        [cx,       cy + h/2],
        [cx + w/2, cy      ],
        [cx,       cy - h/2],
        [cx - w/2, cy      ],
    ])
    d = Polygon(pts, closed=True, linewidth=LW, edgecolor=EC, facecolor=FC, zorder=4)
    ax.add_patch(d)
    ax.text(cx, cy, text, ha='center', va='center',
            fontsize=fs, zorder=5, multialignment='center')

def arr_down(ax, x, y1, y2, label='', lx=0.2):
    ax.annotate('', xy=(x, y2), xytext=(x, y1),
                arrowprops=dict(arrowstyle='->', color='black', lw=LW,
                                mutation_scale=22))
    if label:
        ax.text(x + lx, (y1+y2)/2, label, ha='left', va='center',
                fontsize=FS, fontstyle='italic')

def arr_h(ax, x1, y, x2, label='', ly=0.4, lside='top'):
    ax.annotate('', xy=(x2, y), xytext=(x1, y),
                arrowprops=dict(arrowstyle='->', color='black', lw=LW,
                                mutation_scale=22))
    if label:
        lby = y + ly if lside == 'top' else y - ly
        ax.text((x1+x2)/2, lby, label, ha='center', va='center',
                fontsize=FS, fontstyle='italic')

def line(ax, x1, y1, x2, y2):
    ax.plot([x1, x2], [y1, y2], color='black', lw=LW, zorder=3)

# ─────────────────────────────────────────────────────────────────────────────
# TITLE
# ─────────────────────────────────────────────────────────────────────────────
ax.text(CX, 238.5, 'Azure Cloud Cost Monitoring & Optimization Platform',
        ha='center', va='center', fontsize=24, fontweight='bold')
ax.text(CX, 236.8, 'System Working Flowchart',
        ha='center', va='center', fontsize=18, color='#444444')

# ─────────────────────────────────────────────────────────────────────────────
# NODE Y-POSITIONS  (large gaps = readable spacing)
# ─────────────────────────────────────────────────────────────────────────────
Y = {}
Y['start']      = 235.0
Y['login']      = 231.5
Y['cred']       = 227.5
Y['valid']      = 223.0
Y['error']      = 223.0   # same row, left
Y['dash']       = 223.0   # same row, right
Y['selmod']     = 218.5
Y['moddec']     = 214.5

Y['br1']        = 210.0   # process row 1  (all 4 branches)
Y['br2']        = 206.0   # output  row 2

Y['db']         = 201.5
Y['sync']       = 197.0

# left pipeline column
Y['s1']         = 192.5
Y['s2']         = 188.5
Y['s3']         = 184.5
Y['s4']         = 180.5

# right anomaly column
Y['a1']         = 192.5
Y['a2']         = 188.0
Y['a3']         = 183.5

Y['store']      = 177.5
Y['anom']       = 173.0
Y['anomyes']    = 173.0   # same row, right
Y['rec']        = 168.5
Y['fore']       = 164.5
Y['disp']       = 160.5
Y['exp']        = 156.0
Y['expyes']     = 156.0   # same row, left
Y['logdec']     = 151.5
Y['logout']     = 147.5
Y['end']        = 143.5

# X positions for branches
BX = [5.5, 13.5, 26.5, 34.5]   # 4 branches
ERR_X  = 4.5
DASH_X = 35.5
SYNC_X = 6.0
ANOM_X = 34.0
EXP_X  = 4.5

# ─────────────────────────────────────────────────────────────────────────────
# DRAW NODES
# ─────────────────────────────────────────────────────────────────────────────
oval(ax, CX, Y['start'], w=9, h=2.2, text='Start')

rect(ax, CX, Y['login'],  w=12, h=2.2, text='Login Page')

parallelogram(ax, CX, Y['cred'], w=14, h=2.4,
              text='Enter Credentials\n(Username / Password  or  Azure AD SSO)')

diamond(ax, CX, Y['valid'], w=11, h=3.2, text='Valid?')

rect(ax, ERR_X,  Y['error'], w=8, h=2.2, text='Show Error\nMessage')
rect(ax, DASH_X, Y['dash'],  w=8, h=2.2, text='Redirect to\nDashboard')

parallelogram(ax, CX, Y['selmod'], w=16, h=2.4,
              text='Select Module\n(Dashboard / Costs / Resources / Alerts / Reports)')

diamond(ax, CX, Y['moddec'], w=11, h=3.0, text='Module\nSelected?')

# 4 branches — process
labels_br1 = ['Fetch Azure\nCost Data (API)',
               'Query Resources\n(Resource Graph)',
               'Check Budget\nThresholds',
               'Generate\nReport']
labels_br2 = ['Display Cost\nCharts & KPIs',
               'Display Resource\nInventory',
               'Trigger &\nDisplay Alerts',
               'Download /\nView Report']
for i, bx in enumerate(BX):
    rect(ax, bx, Y['br1'], w=7.5, h=2.2, text=labels_br1[i])
    parallelogram(ax, bx, Y['br2'], w=7.5, h=2.2, text=labels_br2[i])

rect(ax, CX, Y['db'], w=18, h=2.4,
     text='Save / Update Data to PostgreSQL Database')

diamond(ax, CX, Y['sync'], w=13, h=3.2,
        text='Data Sync Triggered?\n(Cron every 6h / Manual Admin)')

# Left pipeline
rect(ax, SYNC_X, Y['s1'], w=11, h=2.2,
     text='① Fetch Azure Subscriptions &\n    Resources (Resource Graph API)')
rect(ax, SYNC_X, Y['s2'], w=11, h=2.2,
     text='② Pull Cost Data\n    (Cost Management API)')
rect(ax, SYNC_X, Y['s3'], w=11, h=2.2,
     text='③ Collect VM Metrics\n    (Azure Monitor API)')
rect(ax, SYNC_X, Y['s4'], w=11, h=2.2,
     text='④ Fetch Recommendations\n    (Azure Advisor API)')

# Right anomaly
rect(ax, ANOM_X, Y['a1'], w=11, h=2.2,
     text='⑤ Run Anomaly Detection\n    (Z-Score Statistical Analysis)')
diamond(ax, ANOM_X, Y['a2'], w=10, h=3.0,
        text='Anomaly / Budget\nBreach Detected?')
parallelogram(ax, ANOM_X, Y['a3'], w=11, h=2.2,
              text='⑥ Send Notifications\n    (Email / Slack Alert)')

rect(ax, CX, Y['store'], w=18, h=2.4,
     text='Store All Synced Data → PostgreSQL')

diamond(ax, CX, Y['anom'], w=11, h=3.2, text='Cost Anomaly\nDetected?')

parallelogram(ax, DASH_X, Y['anomyes'], w=8, h=2.2,
              text='Show Anomaly Report\n& Alert on Dashboard')

rect(ax, CX, Y['rec'], w=18, h=2.4,
     text='Generate Optimization Recommendations\n(Right-sizing, Idle VMs, Reserved Instances)')

rect(ax, CX, Y['fore'], w=18, h=2.4,
     text='Run Cost Forecast\n(Linear Regression Model)')

parallelogram(ax, CX, Y['disp'], w=18, h=2.4,
              text='Display Results on Dashboard\n(Charts, KPI Cards, Trend Lines)')

diamond(ax, CX, Y['exp'], w=10, h=3.2, text='Export\nData?')

parallelogram(ax, EXP_X, Y['expyes'], w=8, h=2.2,
              text='Download\nCSV / Excel Report')

diamond(ax, CX, Y['logdec'], w=10, h=3.2, text='Logout?')

rect(ax, CX, Y['logout'], w=12, h=2.2,
     text='Logout\n(Clear JWT / Session Token)')

oval(ax, CX, Y['end'], w=9, h=2.2, text='End')

# ─────────────────────────────────────────────────────────────────────────────
# ARROWS — MAIN SPINE
# ─────────────────────────────────────────────────────────────────────────────
arr_down(ax, CX, Y['start']-1.1,  Y['login']+1.1)
arr_down(ax, CX, Y['login']-1.1,  Y['cred']+1.3)
arr_down(ax, CX, Y['cred']-1.3,   Y['valid']+1.6)

# Valid? NO → Error (left)
arr_h(ax, CX-5.5, Y['valid'], ERR_X+4.0, label='No', ly=0.5)
# Error → loop back to Login (left spine)
line(ax, ERR_X, Y['error']+1.1, ERR_X, Y['login'])
ax.annotate('', xy=(CX-6.0, Y['login']), xytext=(ERR_X, Y['login']),
            arrowprops=dict(arrowstyle='->', color='black', lw=LW, mutation_scale=22))

# Valid? YES → Dashboard (right)
arr_h(ax, CX+5.5, Y['valid'], DASH_X-4.0, label='Yes', ly=0.5)

# Dashboard → Select Module
line(ax, DASH_X, Y['dash']-1.1, DASH_X, Y['selmod'])
ax.annotate('', xy=(CX+8.0, Y['selmod']), xytext=(DASH_X, Y['selmod']),
            arrowprops=dict(arrowstyle='->', color='black', lw=LW, mutation_scale=22))

arr_down(ax, CX, Y['selmod']-1.3, Y['moddec']+1.5)

# Module Decision → 4 branches
branch_labels = ['Cost', 'Resources', 'Alerts', 'Reports']
for i, bx in enumerate(BX):
    line(ax, bx, Y['moddec']-1.5, bx, Y['br1']+1.1)
    ax.annotate('', xy=(bx, Y['br1']+1.1), xytext=(bx, Y['moddec']-1.5),
                arrowprops=dict(arrowstyle='->', color='black', lw=LW, mutation_scale=22))
    arr_down(ax, bx, Y['br1']-1.1, Y['br2']+1.3)
    # output → merge line to DB
    line(ax, bx, Y['br2']-1.3, bx, Y['db']+1.2)

# Horizontal merge line at DB level
line(ax, BX[0], Y['db']+1.2, BX[3], Y['db']+1.2)
ax.annotate('', xy=(CX, Y['db']+1.2), xytext=(CX+0.01, Y['db']+1.2),
            arrowprops=dict(arrowstyle='->', color='black', lw=LW, mutation_scale=22))

# Branch labels
for i, bx in enumerate(BX):
    ax.text(bx, Y['moddec']-0.4, branch_labels[i],
            ha='center', fontsize=FS-1, fontstyle='italic', color='#333')

arr_down(ax, CX, Y['db']-1.2, Y['sync']+1.6)

# SYNC YES → left pipeline
line(ax, CX-6.5, Y['sync'], SYNC_X+5.5, Y['sync'])
ax.annotate('', xy=(SYNC_X+5.5, Y['s1']+1.1), xytext=(SYNC_X+5.5, Y['sync']),
            arrowprops=dict(arrowstyle='->', color='black', lw=LW, mutation_scale=22))
ax.text(SYNC_X+5.7, Y['sync']+0.4, 'Yes', fontsize=FS, fontstyle='italic')

arr_down(ax, SYNC_X, Y['s1']-1.1, Y['s2']+1.1)
arr_down(ax, SYNC_X, Y['s2']-1.1, Y['s3']+1.1)
arr_down(ax, SYNC_X, Y['s3']-1.1, Y['s4']+1.1)
# s4 → Store
line(ax, SYNC_X, Y['s4']-1.1, SYNC_X, Y['store']+1.2)
line(ax, SYNC_X, Y['store']+1.2, CX-9.0, Y['store']+1.2)

# SYNC YES → right anomaly
line(ax, CX+6.5, Y['sync'], ANOM_X-5.5, Y['sync'])
ax.annotate('', xy=(ANOM_X-5.5, Y['a1']+1.1), xytext=(ANOM_X-5.5, Y['sync']),
            arrowprops=dict(arrowstyle='->', color='black', lw=LW, mutation_scale=22))

arr_down(ax, ANOM_X, Y['a1']-1.1, Y['a2']+1.5)
arr_down(ax, ANOM_X, Y['a2']-1.5, Y['a3']+1.3)
ax.text(ANOM_X+0.3, (Y['a2']-1.5+Y['a3']+1.3)/2, 'Yes',
        fontsize=FS, fontstyle='italic', ha='left', va='center')
# a3 → Store
line(ax, ANOM_X, Y['a3']-1.3, ANOM_X, Y['store']+1.2)
line(ax, ANOM_X, Y['store']+1.2, CX+9.0, Y['store']+1.2)

# SYNC NO → straight down
arr_down(ax, CX, Y['sync']-1.6, Y['store']+1.2, label='No', lx=0.3)

# merge arrow into store
ax.annotate('', xy=(CX, Y['store']+1.2), xytext=(CX, Y['store']+1.21),
            arrowprops=dict(arrowstyle='->', color='black', lw=LW, mutation_scale=22))

arr_down(ax, CX, Y['store']-1.2, Y['anom']+1.6)

# Anomaly YES → right
arr_h(ax, CX+5.5, Y['anom'], DASH_X-4.0, label='Yes', ly=0.5)
# anomyes → join at rec
line(ax, DASH_X, Y['anomyes']-1.1, DASH_X, Y['rec']+1.2)
ax.annotate('', xy=(CX+9.0, Y['rec']+1.2), xytext=(DASH_X, Y['rec']+1.2),
            arrowprops=dict(arrowstyle='->', color='black', lw=LW, mutation_scale=22))

# Anomaly NO → down
arr_down(ax, CX, Y['anom']-1.6, Y['rec']+1.2, label='No', lx=0.3)

arr_down(ax, CX, Y['rec']-1.2,  Y['fore']+1.2)
arr_down(ax, CX, Y['fore']-1.2, Y['disp']+1.3)
arr_down(ax, CX, Y['disp']-1.3, Y['exp']+1.6)

# Export YES → left
arr_h(ax, CX-5.0, Y['exp'], EXP_X+4.0, label='Yes', ly=0.5)
# expyes → logdec
line(ax, EXP_X, Y['expyes']-1.1, EXP_X, Y['logdec']+1.6)
ax.annotate('', xy=(CX-5.0, Y['logdec']+1.6), xytext=(EXP_X, Y['logdec']+1.6),
            arrowprops=dict(arrowstyle='->', color='black', lw=LW, mutation_scale=22))

# Export NO → straight down
arr_down(ax, CX, Y['exp']-1.6, Y['logdec']+1.6, label='No', lx=0.3)

# Logout NO → loop back to Select Module
LOOP_X = 1.5
ax.annotate('', xy=(LOOP_X, Y['logdec']), xytext=(CX-5.0, Y['logdec']),
            arrowprops=dict(arrowstyle='->', color='black', lw=LW, mutation_scale=22))
ax.text((CX-5.0+LOOP_X)/2, Y['logdec']+0.5, 'No',
        fontsize=FS, fontstyle='italic', ha='center')
line(ax, LOOP_X, Y['logdec'], LOOP_X, Y['selmod'])
ax.annotate('', xy=(CX-8.0, Y['selmod']), xytext=(LOOP_X, Y['selmod']),
            arrowprops=dict(arrowstyle='->', color='black', lw=LW, mutation_scale=22))

# Logout YES → down
arr_down(ax, CX, Y['logdec']-1.6, Y['logout']+1.1, label='Yes', lx=0.3)
arr_down(ax, CX, Y['logout']-1.1, Y['end']+1.1)

# ─────────────────────────────────────────────────────────────────────────────
# LEGEND
# ─────────────────────────────────────────────────────────────────────────────
legend_shapes = [
    mpatches.Patch(facecolor='white', edgecolor='black', lw=2, label='Oval  →  Start / End'),
    mpatches.Patch(facecolor='white', edgecolor='black', lw=2, label='Rectangle  →  Process Step'),
    mpatches.Patch(facecolor='white', edgecolor='black', lw=2, label='Parallelogram  →  Input / Output'),
    mpatches.Patch(facecolor='white', edgecolor='black', lw=2, label='Diamond  →  Decision'),
    Line2D([0],[0], color='black', lw=2, label='Arrow  →  Flow Direction'),
]
ax.legend(handles=legend_shapes, loc='lower center',
          bbox_to_anchor=(0.5, 0.0), ncol=3,
          fontsize=13, framealpha=1, edgecolor='black')

# ─────────────────────────────────────────────────────────────────────────────
plt.tight_layout(pad=0.5)
out = r'C:\Users\Lenovo\OneDrive\Desktop\Collage wla\FLOWCHART.png'
fig.savefig(out, dpi=180, bbox_inches='tight', facecolor='white', edgecolor='none')
print(f"Saved: {out}")
