import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

PROGRESS_WEEK = 4   # vertical "Today" marker

tasks = [
    ("Architecture",   0,    1.0,  "critical"),
    ("Backend Core",   1,    1.0,  "critical"),
    ("Azure API",      2,    2.0,  "critical"),
    ("Data Sync",      4,    1.5,  "critical"),
    ("Anomaly Detect", 5.5,  1.0,  "critical"),
    ("UI Integration", 6.5,  1.5,  "critical"),
    ("System QA",      8,    1.5,  "critical"),
    ("Azure Infra",    1,    1.0,  "infra"),
    ("CI/CD Pipeline", 2,    1.0,  "infra"),
    ("Database",       1,    1.0,  "data"),
    ("Auth Module",    2,    1.0,  "data"),
    ("Frontend Core",  1,    0.5,  "frontend"),
    ("Dashboard UI",   1.5,  2.0,  "frontend"),
    ("Resource Mgmt",  3.5,  1.5,  "frontend"),
    ("Budget Alerts",  5.5,  1.0,  "feature"),
    ("Rec Engine",     5.5,  1.0,  "feature"),
]

tasks = list(reversed(tasks))

colors = {
    "critical": "#f43f5e",
    "infra":    "#22c55e",
    "data":     "#38bdf8",
    "frontend": "#a855f7",
    "feature":  "#f97316",
}
labels = {
    "critical": "Critical Path",
    "infra":    "Infrastructure",
    "data":     "Data & Auth",
    "frontend": "Frontend / UI",
    "feature":  "Analytics Features",
}

fig, ax = plt.subplots(figsize=(26, 12))
fig.patch.set_facecolor('white')
ax.set_facecolor('#f8fafc')

n = len(tasks)
bar_h = 0.55

# Draw ALL bars fully
for i, (name, start, dur, cat) in enumerate(tasks):
    color = colors[cat]
    # shadow
    ax.barh(i, dur, left=start + 0.04, height=bar_h,
            color='#00000022', align='center')
    # full bar
    ax.barh(i, dur, left=start, height=bar_h,
            color=color, align='center',
            edgecolor='white', linewidth=1.5, alpha=0.92)
    # duration label
    dur_label = f"{dur}wk" if dur != 1.0 else "1wk"
    ax.text(start + dur / 2, i, dur_label,
            ha='center', va='center',
            fontsize=11, fontweight='bold', color='white', zorder=5)



# ── Y-axis ────────────────────────────────────────────────────────────────────
ax.set_yticks(range(n))
ax.set_yticklabels([t[0] for t in tasks],
                   fontsize=15, fontweight='bold', color='#1e293b')

# ── X-axis ────────────────────────────────────────────────────────────────────
total_weeks = 10
ax.set_xlim(0, total_weeks)
ax.set_xticks(range(total_weeks + 1))
ax.set_xticklabels([f"Week {w}" for w in range(total_weeks + 1)],
                   fontsize=12, color='#475569', fontweight='600')
ax.set_xlabel("Project Timeline", fontsize=16, fontweight='bold',
              color='#334155', labelpad=14)

# ── Grid ──────────────────────────────────────────────────────────────────────
ax.xaxis.grid(True, linestyle='--', alpha=0.4, color='#cbd5e1', linewidth=1.0)
ax.set_axisbelow(True)

# ── Spines ────────────────────────────────────────────────────────────────────
for spine in ['top', 'right']:
    ax.spines[spine].set_visible(False)
ax.spines['left'].set_color('#cbd5e1')
ax.spines['bottom'].set_color('#cbd5e1')

# ── Legend ────────────────────────────────────────────────────────────────────
legend_patches = [
    mpatches.Patch(color=colors[k], label=labels[k]) for k in colors
]
ax.legend(handles=legend_patches, loc='lower right',
          fontsize=13, framealpha=0.9, edgecolor='#cbd5e1',
          title="Track", title_fontsize=13)

plt.tight_layout(pad=2.0)

out = r'C:\Users\Lenovo\OneDrive\Desktop\Collage wla\GANTT-CHART.png'
fig.savefig(out, dpi=250, bbox_inches='tight',
            facecolor='white', edgecolor='none')
print(f"Saved: {out}")
