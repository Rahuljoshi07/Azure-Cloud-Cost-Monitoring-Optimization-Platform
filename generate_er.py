import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
from matplotlib.lines import Line2D

fig, ax = plt.subplots(figsize=(36, 26))
ax.set_xlim(0, 36)
ax.set_ylim(0, 26)
ax.axis('off')
fig.patch.set_facecolor('white')
ax.set_facecolor('white')

# ── helpers ───────────────────────────────────────────────────────────────────
def entity_box(ax, cx, cy, w, title, attrs):
    """Draw entity: header + attributes, returns actual height used."""
    row_h   = 1.35         # height of each attribute row
    head_h  = 1.7          # header height
    total_h = head_h + row_h * len(attrs)
    x0, y0  = cx - w/2, cy - total_h/2

    # Outer border
    outer = FancyBboxPatch((x0, y0), w, total_h,
                           boxstyle='square,pad=0', linewidth=4,
                           edgecolor='#1e40af', facecolor='#fff', zorder=3)
    ax.add_patch(outer)

    # Header fill
    header = FancyBboxPatch((x0, y0 + total_h - head_h), w, head_h,
                            boxstyle='square,pad=0', linewidth=0,
                            edgecolor='none', facecolor='#1e40af', zorder=4)
    ax.add_patch(header)

    # Header title
    ax.text(cx, y0 + total_h - head_h/2, title,
            ha='center', va='center', fontsize=28,
            fontweight='bold', color='white', zorder=5)

    # Attribute rows
    for i, (pk, attr) in enumerate(attrs):
        row_y = y0 + total_h - head_h - row_h*(i+0.5)
        # dividing line
        ax.plot([x0, x0+w], [y0 + total_h - head_h - row_h*i]*2,
                color='#bfdbfe', lw=1.5, zorder=4)
        prefix = "🔑 " if pk == "PK" else ("🔗 " if pk == "FK" else "   ")
        colour = '#7c2d12' if pk == "PK" else ('#1d4ed8' if pk == "FK" else '#111827')
        weight = 'bold' if pk in ("PK","FK") else 'normal'
        ax.text(x0 + 0.3, row_y, prefix + attr,
                ha='left', va='center', fontsize=22,
                fontweight=weight, color=colour, zorder=5)

    return cx, cy, w, total_h   # bounding info

def rel_line(ax, x1, y1, x2, y2, label, color='#374151'):
    """Draw relationship line + label."""
    ax.plot([x1, x2], [y1, y2], color=color, lw=2.5, zorder=2)
    mx, my = (x1+x2)/2, (y1+y2)/2
    ax.text(mx, my + 0.5, label, ha='center', va='center',
            fontsize=18, style='italic', color='#1f2937',
            bbox=dict(boxstyle='round,pad=0.22', facecolor='#f0f9ff',
                      edgecolor='none', alpha=0.9), zorder=6)

# ─────────────────────────────────────────────────────────────────────────────
# ENTITIES  (cx, cy, width, title, [(pk_flag, attr_name)])
# ─────────────────────────────────────────────────────────────────────────────
EW = 9.0   # wider entities for bigger text

entities = {
    'User': (5.0, 21.5, EW, "USER", [
        ("PK", "user_id"),
        ("",   "username"),
        ("",   "email"),
        ("",   "role"),
        ("",   "created_at"),
    ]),
    'Subscription': (5.0, 12.0, EW, "SUBSCRIPTION", [
        ("PK", "subscription_id"),
        ("FK", "user_id"),
        ("",   "subscription_name"),
        ("",   "azure_tenant_id"),
        ("",   "region"),
    ]),
    'Resource': (5.0, 3.0, EW, "RESOURCE", [
        ("PK", "resource_id"),
        ("FK", "subscription_id"),
        ("",   "resource_name"),
        ("",   "resource_type"),
        ("",   "location"),
    ]),
    'CostRecord': (16.0, 21.5, EW, "COST RECORD", [
        ("PK", "cost_id"),
        ("FK", "resource_id"),
        ("",   "cost_amount"),
        ("",   "currency"),
        ("",   "billing_period"),
        ("",   "recorded_at"),
    ]),
    'Budget': (16.0, 12.0, EW, "BUDGET", [
        ("PK", "budget_id"),
        ("FK", "user_id"),
        ("FK", "subscription_id"),
        ("",   "amount_limit"),
        ("",   "period"),
        ("",   "start_date"),
    ]),
    'Alert': (16.0, 3.0, EW, "ALERT", [
        ("PK", "alert_id"),
        ("FK", "user_id"),
        ("FK", "budget_id"),
        ("",   "alert_type"),
        ("",   "message"),
        ("",   "triggered_at"),
    ]),
    'AnomalyReport': (27.0, 21.5, EW, "ANOMALY REPORT", [
        ("PK", "anomaly_id"),
        ("FK", "cost_id"),
        ("",   "anomaly_type"),
        ("",   "severity"),
        ("",   "detected_at"),
    ]),
    'Recommendation': (27.0, 13.5, EW, "RECOMMENDATION", [
        ("PK", "rec_id"),
        ("FK", "resource_id"),
        ("FK", "anomaly_id"),
        ("",   "suggestion"),
        ("",   "estimated_saving"),
        ("",   "created_at"),
    ]),
    'Dashboard': (27.0, 4.5, EW, "DASHBOARD", [
        ("PK", "dashboard_id"),
        ("FK", "user_id"),
        ("",   "dashboard_name"),
        ("",   "widgets"),
        ("",   "last_updated"),
    ]),
}

# Draw all entities
for key, args in entities.items():
    entity_box(ax, *args)

# ─────────────────────────────────────────────────────────────────────────────
# RELATIONSHIPS
# ─────────────────────────────────────────────────────────────────────────────
rels = [
    # x1, y1,  x2,  y2,  label
    (5.0, 17.7, 5.0, 15.3,   "1 : N"),   # User → Subscription
    (5.0,  8.7, 5.0,  6.3,   "1 : N"),   # Subscription → Resource
    (8.5, 21.5, 12.5, 21.5,  "1 : N"),   # User → CostRecord (via resource)
    (8.5, 12.0,12.5, 12.0,   "1 : N"),   # User → Budget
    (8.5,  3.0, 12.5,  3.0,  "1 : N"),   # Resource → Alert
    (8.5, 21.5, 8.5, 15.3,   ""),        # connector
    (19.5, 21.5, 23.5, 21.5, "1 : 1"),   # CostRecord → AnomalyReport
    (20.5,  3.0, 20.5, 8.7,  "N : 1"),   # Alert → Budget
    (19.5, 12.0, 23.5, 13.5, "N : 1"),   # Budget → Recommendation
    (8.5,  3.0, 23.5, 13.5,  "N : 1"),   # Resource → Recommendation
    (27.0, 17.8, 27.0, 17.0, "1 : N"),   # Rec → Dashboard
    (8.5, 21.5, 23.5,  4.5,  "N : 1"),   # User → Dashboard
]

# Simplified, clean relationships
rel_line(ax, 5.0, 18.6, 5.0, 15.2,   "1 : N")   # User → Subscription
rel_line(ax, 5.0,  8.7, 5.0,  6.2,   "1 : N")   # Subscription → Resource
rel_line(ax, 8.5, 21.5,12.5, 21.5,   "1 : N")   # Resource → CostRecord
rel_line(ax, 8.5, 12.0,12.5, 12.0,   "1 : N")   # User → Budget
rel_line(ax, 8.5,  3.0,12.5,  3.0,   "1 : N")   # Subscription → Alert
rel_line(ax, 19.5,21.5,23.5,21.5,    "1 : 1")   # CostRecord → Anomaly
rel_line(ax, 16.0, 8.7,16.0,  6.2,   "1 : N")   # Budget → Alert
rel_line(ax, 19.5,13.5,23.5,13.5,    "1 : N")   # Resource → Recommendation
rel_line(ax, 27.0,17.8,27.0,16.8,    "1 : N")   # Anomaly → Recommendation
rel_line(ax, 30.5, 4.5,30.5, 21.5,   "N : 1", '#059669')  # User → Dashboard (right edge)
rel_line(ax, 23.5,21.5,30.5,21.5,    "1 : N", '#059669')  # Anomaly top connector

# ─────────────────────────────────────────────────────────────────────────────
# LEGEND
# ─────────────────────────────────────────────────────────────────────────────
legend_items = [
    mpatches.Patch(facecolor='#1e40af', label='Entity Header (Table Name)'),
    mpatches.Patch(facecolor='#fff7ed', edgecolor='#7c2d12', lw=2,
                   label='🔑 Primary Key (PK)'),
    mpatches.Patch(facecolor='#eff6ff', edgecolor='#1d4ed8', lw=2,
                   label='🔗 Foreign Key (FK)'),
    Line2D([0],[0], color='#374151', lw=2.5, label='Relationship'),
]
ax.legend(handles=legend_items, loc='lower center', ncol=4,
          fontsize=18, framealpha=0.95, edgecolor='#cbd5e1',
          bbox_to_anchor=(0.5, 0.0))

plt.tight_layout(pad=0.5)
out = r'C:\Users\Lenovo\OneDrive\Desktop\Collage wla\ER-DIAGRAM.png'
fig.savefig(out, dpi=200, bbox_inches='tight', facecolor='white', edgecolor='none')
print(f"Saved: {out}")
