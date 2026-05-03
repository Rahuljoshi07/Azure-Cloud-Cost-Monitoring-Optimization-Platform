import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Circle
from matplotlib.lines import Line2D
import matplotlib.patches as mpatches

LW, FS, FSL = 1.8, 9, 7.5

def sbox(ax, cx, cy, label, w=5.6, h=1.2):
    ax.add_patch(FancyBboxPatch((cx-w/2, cy-h/2), w, h,
        boxstyle='round,pad=0.18', linewidth=LW,
        edgecolor='black', facecolor='white', zorder=4))
    ax.text(cx, cy, label, ha='center', va='center',
            fontsize=FS, zorder=5, multialignment='center')

def init_s(ax, cx, cy):
    ax.add_patch(Circle((cx, cy), 0.32, color='black', zorder=5))

def final_s(ax, cx, cy):
    ax.add_patch(Circle((cx, cy), 0.44, color='black', zorder=5))
    ax.add_patch(Circle((cx, cy), 0.26, color='white', zorder=6))
    ax.add_patch(Circle((cx, cy), 0.12, color='black', zorder=7))

def tr(ax, x1, y1, x2, y2, label='', rad=0.0):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color='black', lw=LW,
                                mutation_scale=13,
                                connectionstyle=f'arc3,rad={rad}'), zorder=3)
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx, my, label, ha='center', va='center', fontsize=FSL,
                style='italic',
                bbox=dict(boxstyle='round,pad=0.12', fc='white', ec='none', alpha=0.9), zorder=6)

fig, axes = plt.subplots(2, 2, figsize=(50, 46))
fig.patch.set_facecolor('white')
plt.subplots_adjust(wspace=0.08, hspace=0.10)

titles = [
    'Diagram 1 — User Authentication States',
    'Diagram 2 — Cost Monitoring States',
    'Diagram 3 — Budget Alert States',
    'Diagram 4 — Data Sync Process States',
]
for i, ax in enumerate(axes.flat):
    ax.set_xlim(0, 22); ax.set_ylim(0, 29); ax.axis('off')
    ax.set_facecolor('white')
    ax.text(11, 28.5, titles[i], ha='center', fontsize=12, fontweight='bold')

# ── DIAGRAM 1: User Authentication ──────────────────────────────────────────
ax = axes[0][0]
init_s(ax, 11, 27.3)
sbox(ax, 11, 25.5, "Unauthenticated")
sbox(ax, 11, 23.0, "Authenticating")
sbox(ax, 11, 20.5, "Authenticated")
sbox(ax, 11, 18.0, "Session Active")
sbox(ax, 16.5, 15.5, "Token\nRefreshing")
sbox(ax, 5.5,  15.5, "Session\nExpired")
sbox(ax, 11,   13.0, "Logging Out")
final_s(ax, 11, 11.2)

tr(ax, 11, 26.98, 11, 26.1)
tr(ax, 11, 24.9,  11, 23.6,  "Login Request")
tr(ax, 11, 22.4,  11, 21.1,  "Valid JWT")
tr(ax, 9.5, 22.7, 9.5, 25.2, "Invalid Credentials", rad=0.45)
tr(ax, 11, 19.9,  11, 18.6,  "Session Created")
tr(ax, 13.0, 18.0, 14.7, 16.1, "Token Near Expiry", rad=-0.2)
tr(ax, 15.2, 15.1, 12.8, 17.6, "Token Refreshed",   rad=-0.3)
tr(ax, 17.8, 15.0, 17.8, 23.0, "Refresh Failed",    rad=-0.35)
tr(ax, 9.0,  17.6, 7.2,  16.1, "Timeout",           rad=0.2)
tr(ax, 4.2,  14.9, 9.0,  25.2, "Session Ended",     rad=0.25)
tr(ax, 11,   17.4, 11,   13.6, "Logout")
tr(ax, 11,   12.4, 11,   11.65)

# ── DIAGRAM 2: Cost Monitoring ───────────────────────────────────────────────
ax = axes[0][1]
init_s(ax, 11, 27.3)
sbox(ax, 11,   25.5, "Idle")
sbox(ax, 11,   23.0, "Fetching Azure Data")
sbox(ax, 4.0,  23.0, "Sync Failed")
sbox(ax, 11,   20.5, "Processing Data")
sbox(ax, 11,   18.0, "Anomaly Detection")
sbox(ax, 5.5,  15.5, "Normal")
sbox(ax, 16.5, 15.5, "Anomaly Detected")
sbox(ax, 16.5, 13.0, "Alert Triggered")
sbox(ax, 11,   10.5, "Report Ready")
final_s(ax, 11, 8.8)

tr(ax, 11,   26.98, 11,   26.1)
tr(ax, 11,   24.9,  11,   23.6,  "Sync Triggered")
tr(ax, 8.7,  23.0,  5.8,  23.0,  "API Error")
tr(ax, 4.0,  22.4,  9.0,  25.2,  "Retry", rad=-0.25)
tr(ax, 11,   22.4,  11,   21.1,  "Data Received")
tr(ax, 11,   19.9,  11,   18.6,  "Data Processed")
tr(ax, 9.2,  17.6,  7.3,  16.1,  "No Anomaly")
tr(ax, 12.8, 17.6,  14.7, 16.1,  "Threshold Exceeded")
tr(ax, 16.5, 14.9,  16.5, 13.6,  "Alert Created")
tr(ax, 14.7, 13.0,  13.9, 11.1,  "Alert Sent")
tr(ax, 5.5,  14.9,  9.2,  11.1,  "")
tr(ax, 11,   9.9,   11,   9.25)

# ── DIAGRAM 3: Budget Alert ──────────────────────────────────────────────────
ax = axes[1][0]
init_s(ax, 11, 27.3)
sbox(ax, 11,   25.5, "Budget Set")
sbox(ax, 11,   23.0, "Monitoring")
sbox(ax, 4.5,  20.5, "Within Budget")
sbox(ax, 11,   20.5, "Warning Zone\n(Cost > 80%)")
sbox(ax, 17.5, 20.5, "Budget Exceeded\n(Cost > 100%)")
sbox(ax, 17.5, 18.0, "Alert Sent")
sbox(ax, 11,   18.0, "Acknowledged")
sbox(ax, 4.5,  18.0, "Budget Revised")
sbox(ax, 11,   15.5, "Resolved")
final_s(ax, 11, 13.8)

tr(ax, 11,   26.98, 11,   26.1)
tr(ax, 11,   24.9,  11,   23.6,  "Budget Defined")
tr(ax, 9.5,  22.6,  6.2,  21.1,  "Cost < 80%")
tr(ax, 11,   22.4,  11,   21.1,  "Cost 80–100%")
tr(ax, 12.5, 22.6,  15.8, 21.1,  "Cost > 100%")
tr(ax, 4.5,  19.9,  9.5,  22.6,  "Cost Increases", rad=0.3)
tr(ax, 9.5,  20.5,  9.5,  22.6,  "Cost Drops",     rad=0.35)
tr(ax, 17.5, 19.9,  17.5, 18.6,  "Notif. Sent")
tr(ax, 15.7, 18.0,  12.8, 18.0,  "User Notified")
tr(ax, 9.2,  18.0,  6.3,  18.0,  "Revise Budget")
tr(ax, 4.5,  17.4,  9.5,  22.6,  "Budget Updated", rad=0.3)
tr(ax, 11,   17.4,  11,   16.1,  "Issue Resolved")
tr(ax, 11,   14.9,  11,   14.25)

# ── DIAGRAM 4: Data Sync Process ─────────────────────────────────────────────
ax = axes[1][1]
init_s(ax, 11, 27.3)
sbox(ax, 11,   25.5, "Sync Idle")
sbox(ax, 11,   23.0, "Connecting to Azure")
sbox(ax, 4.0,  23.0, "Connection Failed")
sbox(ax, 11,   20.5, "Authenticated & Connected")
sbox(ax, 11,   18.0, "Fetching Billing Data")
sbox(ax, 11,   15.5, "Fetching Resource Data")
sbox(ax, 11,   13.0, "Fetching VM Metrics")
sbox(ax, 11,   10.5, "Storing to Database")
sbox(ax, 5.0,   8.0, "Sync Error")
sbox(ax, 17.0,  8.0, "Sync Complete")
final_s(ax, 11, 6.3)

tr(ax, 11,   26.98, 11,   26.1)
tr(ax, 11,   24.9,  11,   23.6,  "Sync Triggered")
tr(ax, 8.7,  23.0,  5.8,  23.0,  "Auth Failed")
tr(ax, 4.0,  22.4,  9.0,  25.2,  "Retry", rad=-0.25)
tr(ax, 11,   22.4,  11,   21.1,  "API Auth OK")
tr(ax, 11,   19.9,  11,   18.6,  "Ready")
tr(ax, 11,   17.4,  11,   16.1,  "Billing Fetched")
tr(ax, 11,   14.9,  11,   13.6,  "Resources Fetched")
tr(ax, 11,   12.4,  11,   11.1,  "Metrics Fetched")
tr(ax, 9.2,  10.1,  6.6,   8.6,  "DB Error")
tr(ax, 12.8, 10.1,  15.4,  8.6,  "All Stored")
tr(ax, 5.0,   7.4,  9.5,  25.2,  "Error Handled",  rad=0.28)
tr(ax, 17.0,  7.4,  12.8, 25.5,  "Next Cycle",     rad=-0.28)
tr(ax, 11,    7.65, 11,   6.75)

# ── LEGEND ───────────────────────────────────────────────────────────────────
legend_items = [
    mpatches.Patch(fc='black', ec='black', label='● Initial State'),
    mpatches.Patch(fc='white', ec='black', lw=2, label='Rounded Rect  →  State'),
    Line2D([0],[0], color='black', lw=2, label='Arrow  →  Transition / Event'),
    mpatches.Patch(fc='white', ec='black', lw=2, label='⊙  Final State'),
]
fig.legend(handles=legend_items, loc='lower center', ncol=4,
           fontsize=13, framealpha=1, edgecolor='black',
           bbox_to_anchor=(0.5, 0.005))

plt.suptitle('Azure Cloud Cost Monitoring & Optimization Platform — State Diagrams',
             fontsize=18, fontweight='bold', y=0.998)

out = r'C:\Users\Lenovo\OneDrive\Desktop\Collage wla\STATE-DIAGRAMS.png'
fig.savefig(out, dpi=180, bbox_inches='tight', facecolor='white')
print(f"Saved: {out}")
