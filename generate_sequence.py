import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
from matplotlib.lines import Line2D

fig, ax = plt.subplots(figsize=(46, 38))
ax.set_xlim(0, 46); ax.set_ylim(0, 38); ax.axis('off')
fig.patch.set_facecolor('white'); ax.set_facecolor('white')

# ── Actors (name, x-center, fill, edge) ────────────────────────────────────
ACTORS = [
    ('User',                5.5,  '#bdd7ee', '#2e75b6'),
    ('Web App',            14.5,  '#c6efce', '#2e7d32'),
    ('Auth Service',       23.5,  '#fce4d6', '#c55a11'),
    ('Azure API\nConnector', 33,  '#fff2cc', '#c09000'),
    ('Database',           42.5,  '#e2cff5', '#7030a0'),
]
AW, AH = 7.5, 1.5
TOP_Y, BOT_Y = 35.5, 2.2

def actor(ax, cx, cy, label, fc, ec):
    ax.add_patch(FancyBboxPatch((cx-AW/2, cy-AH/2), AW, AH,
        boxstyle='round,pad=0.18', lw=2, ec=ec, fc=fc, zorder=4))
    ax.text(cx, cy, label, ha='center', va='center',
            fontsize=12, fontweight='bold', color='#1a1a1a', zorder=5)

xs = [a[1] for a in ACTORS]
U, W, A, Z, D = xs

# Draw actor boxes (top + bottom) + lifelines
for name, cx, fc, ec in ACTORS:
    actor(ax, cx, TOP_Y, name, fc, ec)
    actor(ax, cx, BOT_Y, name, fc, ec)
    ax.plot([cx, cx], [BOT_Y+AH/2, TOP_Y-AH/2],
            color='#aaa', lw=1.2, linestyle=(0,(6,4)), zorder=1)

# ── Activation boxes ────────────────────────────────────────────────────────
def actbox(ax, cx, y_top, y_bot, ec='#888'):
    ax.add_patch(FancyBboxPatch((cx-0.22, y_bot), 0.44, y_top-y_bot,
        boxstyle='square,pad=0', lw=1, ec=ec, fc='white', zorder=3))

actbox(ax, U,  33.5,  4.5,  '#2e75b6')
actbox(ax, W,  33.5,  4.5,  '#2e7d32')
actbox(ax, A,  30,    21,   '#c55a11')
actbox(ax, Z,  14.5,  7,    '#c09000')
actbox(ax, D,  27.5,  9,    '#7030a0')

# ── Message arrows ──────────────────────────────────────────────────────────
def msg(ax, x1, x2, y, label, ret=False):
    clr = '#c05000' if ret else '#1a1a2e'
    ls  = 'dashed'  if ret else 'solid'
    ax.annotate('', xy=(x2, y), xytext=(x1, y), zorder=5,
        arrowprops=dict(arrowstyle='->', color=clr, lw=1.8,
                        mutation_scale=13, linestyle=ls,
                        shrinkA=3, shrinkB=3))
    mid = (x1+x2)/2
    ax.text(mid, y+0.32, label, ha='center', va='bottom',
            fontsize=10, color=clr, zorder=6,
            bbox=dict(fc='white', ec='none', pad=0.08))

# ── Sequence messages (y decreasing = time going down) ──────────────────────
msg(ax, U, W,  32,   'Enter credentials',                 False)
msg(ax, W, A,  29.5, 'authenticate(email, password)',     False)
msg(ax, A, D,  27,   'findUser(email)',                   False)
msg(ax, D, A,  24.5, 'user record : UserEntity',          True)
msg(ax, A, W,  22,   'JWT Token : String',                True)
msg(ax, W, U,  19.5, 'Dashboard loaded',                  True)
msg(ax, U, W,  17,   'Request cost report',               False)
msg(ax, W, Z,  14.5, 'fetchBillingData(subscriptionId)', False)
msg(ax, Z, D,  12,   'storeCostRecords(data)',             False)
msg(ax, D, Z,  9.5,  'records saved : OK',                True)
msg(ax, Z, W,  7,    'cost data : List<CostRecord>',      True)
msg(ax, W, U,  4.5,  'Cost report displayed',             True)

# ── Step numbers on left ─────────────────────────────────────────────────────
steps = [32, 29.5, 27, 24.5, 22, 19.5, 17, 14.5, 12, 9.5, 7, 4.5]
for i, y in enumerate(steps, 1):
    ax.text(1, y, str(i), ha='center', va='center', fontsize=9,
            color='#888', fontweight='bold', zorder=6)

# ── Separator line (optional visual divider) ─────────────────────────────────
ax.axhline(y=18.5, xmin=0.04, xmax=0.96, color='#e2e8f0', lw=1.2,
           linestyle='dotted', zorder=1)
ax.text(1.2, 18.8, 'Login\nFlow', ha='center', fontsize=8, color='#94a3b8')
ax.text(1.2, 13, 'Cost\nFlow', ha='center', fontsize=8, color='#94a3b8')

# ── Title ───────────────────────────────────────────────────────────────────
ax.text(23, 37.5, 'Azure Cloud Cost Monitoring & Optimization Platform',
        ha='center', fontsize=18, fontweight='bold', color='#0f172a')
ax.text(23, 36.8, 'Sequence Diagram  —  User Login & Cost Report Flow',
        ha='center', fontsize=12, color='#64748b')

# ── Legend ───────────────────────────────────────────────────────────────────
items = [
    Line2D([0],[0], color='#1a1a2e', lw=2, label='Solid Arrow  →  Method Call / Request'),
    Line2D([0],[0], color='#c05000', lw=2, linestyle='dashed', label='Dashed Arrow  →  Return / Response'),
    Line2D([0],[0], color='#aaa', lw=1.5, linestyle='dashed', label='Vertical Dashed Line  →  Lifeline'),
    FancyBboxPatch((0,0),1,1, boxstyle='square,pad=0', lw=1, ec='#888', fc='white',
                   label='Thin Rectangle  →  Activation Box'),
]
ax.legend(handles=items, loc='lower center', ncol=2, fontsize=11,
          framealpha=1, edgecolor='#cbd5e1', bbox_to_anchor=(0.5, 0.0))

out = r'C:\Users\Lenovo\OneDrive\Desktop\Collage wla\SEQUENCE-DIAGRAM.png'
fig.savefig(out, dpi=180, bbox_inches='tight', facecolor='white')
print(f"Saved: {out}")
