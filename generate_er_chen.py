import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Ellipse, Polygon
import numpy as np

fig, ax = plt.subplots(figsize=(50, 40))
ax.set_xlim(0,50); ax.set_ylim(0,40); ax.axis('off')
fig.patch.set_facecolor('white'); ax.set_facecolor('white')

# ── helpers ────────────────────────────────────────────────────────────────
def ent(ax,cx,cy,name,w=6.2,h=1.7):
    ax.add_patch(FancyBboxPatch((cx-w/2,cy-h/2),w,h,
        boxstyle='round,pad=0.15',lw=2.2,ec='#2d6a4f',fc='#d8f3dc',zorder=5))
    ax.text(cx,cy,name,ha='center',va='center',
            fontsize=15,fontweight='bold',color='#1b4332',zorder=6)

def dia(ax,cx,cy,label,w=3.2,h=1.4):
    pts=[(cx,cy+h/2),(cx+w/2,cy),(cx,cy-h/2),(cx-w/2,cy)]
    ax.add_patch(Polygon(pts,closed=True,lw=2,ec='#3a0ca3',fc='#dde1ff',zorder=5))
    ax.text(cx,cy,label,ha='center',va='center',
            fontsize=10,fontweight='bold',color='#1d3557',zorder=6)

def atr(ax,cx,cy,label,pk=False,w=2.8,h=1.0):
    ec='#c1121f' if pk else '#555'
    fc='#fff0f3' if pk else '#f5f5f5'
    ax.add_patch(Ellipse((cx,cy),w,h,lw=2.2 if pk else 1.5,ec=ec,fc=fc,zorder=5))
    ax.text(cx,cy,label,ha='center',va='center',
            fontsize=9,fontweight='bold' if pk else 'normal',
            color=ec if pk else 'black',zorder=6)
    if pk:
        ax.plot([cx-0.85,cx+0.85],[cy-0.22,cy-0.22],color='#c1121f',lw=1.3,zorder=7)

def ln(ax,x1,y1,x2,y2):
    ax.plot([x1,x2],[y1,y2],color='#333',lw=1.6,zorder=2)

def card(ax,x,y,t):
    ax.text(x,y,t,ha='center',va='center',fontsize=13,fontweight='bold',color='#111',zorder=7)

# ── title ──────────────────────────────────────────────────────────────────
ax.text(25,39.2,'Azure Cloud Cost Monitoring & Optimization Platform',
        ha='center',fontsize=20,fontweight='bold')
ax.text(25,38.4,'ER Model — Chen Notation',ha='center',fontsize=13,color='#444')

# ══════════════════════════════════════════════════════════════════════════
# ENTITIES
# ══════════════════════════════════════════════════════════════════════════
ent(ax, 7,   24,   'USER')
ent(ax, 22,  30,   'SUBSCRIPTION')
ent(ax, 38,  30,   'RESOURCE\nGROUP')
ent(ax, 44,  21,   'RESOURCE')
ent(ax, 28,  15,   'COST RECORD')
ent(ax, 13,  18,   'BUDGET')
ent(ax,  7,  10,   'ALERT')
ent(ax, 21,   8,   'REPORT')
ent(ax, 40,  10,   'AZURE API')

# ══════════════════════════════════════════════════════════════════════════
# RELATIONSHIP DIAMONDS
# ══════════════════════════════════════════════════════════════════════════
dia(ax, 14.5, 27,   'Has')           # User — Subscription
dia(ax, 30,   30,   'Contains')      # Subscription — ResourceGroup
dia(ax, 41,   25.5, 'Groups')        # ResourceGroup — Resource
dia(ax, 37,   18,   'Generates')     # Resource — CostRecord
dia(ax, 10,   21,   'Manages')       # User — Budget
dia(ax, 10,   14,   'Triggers')      # Budget — Alert
dia(ax, 14,    9,   'Creates')       # User — Report
dia(ax, 24.5,  11,  'Covers')        # Report — CostRecord
dia(ax, 35,    11,  'Syncs')         # AzureAPI — CostRecord

# ══════════════════════════════════════════════════════════════════════════
# ENTITY — RELATIONSHIP LINES + CARDINALITY
# ══════════════════════════════════════════════════════════════════════════
# User — Has — Subscription
ln(ax,10.1,24,12.9,27); card(ax,11.2,25.2,'1')
ln(ax,16.1,27,18.9,30); card(ax,17.8,28.7,'N')
# Subscription — Contains — ResourceGroup
ln(ax,25.1,30,28.4,30); card(ax,26.2,30.5,'1')
ln(ax,31.6,30,34.9,30); card(ax,33.2,30.5,'N')
# ResourceGroup — Groups — Resource
ln(ax,41.1,30,41,26.7); card(ax,40.3,28.5,'1')
ln(ax,41,24.3,42.5,22.4); card(ax,41.2,23.2,'N')  
# Resource — Generates — CostRecord
ln(ax,43.5,20,38.5,18.5); card(ax,41.8,19.6,'1')
ln(ax,35.8,17.5,31.1,15.5); card(ax,33.7,16.8,'N')
# User — Manages — Budget
ln(ax,7,22.1,9.2,21.5); card(ax,7.8,22.5,'1')
ln(ax,10.8,21,12.1,18.6); card(ax,11.8,20.1,'N')
# Budget — Triggers — Alert
ln(ax,10,19,10,14.7); card(ax,10.7,17,'1')
ln(ax,10,13.3,8.5,11.4); card(ax,9.8,12.5,'N')
# User — Creates — Report
ln(ax,7,22.1,10.5,9.7); card(ax,8,16,'1')
ln(ax,13.2,9,18.1,8.3); card(ax,16,8.4,'N')
# Report — Covers — CostRecord
ln(ax,24,8,24.4,10.3); card(ax,23.5,9,'N')
ln(ax,25.2,11.7,26.5,13.3); card(ax,25.4,12.5,'M')
# AzureAPI — Syncs — CostRecord
ln(ax,40,11.7,36,11.5); card(ax,38.5,11,'1')
ln(ax,33.2,11,30.8,13.3); card(ax,32,12.2,'N')

# ══════════════════════════════════════════════════════════════════════════
# ATTRIBUTES
# ══════════════════════════════════════════════════════════════════════════
# USER attrs
def uat(cx,cy,label,pk=False): atr(ax,cx,cy,label,pk); ln(ax,cx,cy,7,24)
uat(2.5,27,'user_id',True)
uat(1.8,25,'name')
uat(1.8,23,'email')
uat(1.8,21,'role')
uat(2.5,19,'password')
uat(4.5,27,'created_at')

# SUBSCRIPTION attrs
def sat(cx,cy,label,pk=False): atr(ax,cx,cy,label,pk); ln(ax,cx,cy,22,30)
sat(19,33.5,'sub_id',True)
sat(22,33.5,'azure_sub_id')
sat(25.5,33,'name')
sat(26.5,30.5,'status')
sat(17,31,'tenant_id')

# RESOURCE GROUP attrs
def rgt(cx,cy,label,pk=False): atr(ax,cx,cy,label,pk); ln(ax,cx,cy,38,30)
rgt(35.5,33.5,'rg_id',True)
rgt(38.5,33.5,'name')
rgt(41.5,32,'location')
rgt(42.5,30,'tags')

# RESOURCE attrs
def reat(cx,cy,label,pk=False): atr(ax,cx,cy,label,pk); ln(ax,cx,cy,44,21)
reat(47.5,23,'res_id',True)
reat(47.8,21,'res_name')
reat(47.5,19,'type')
reat(46.5,17,'status')
reat(45,15.5,'location')

# BUDGET attrs
def bat(cx,cy,label,pk=False): atr(ax,cx,cy,label,pk); ln(ax,cx,cy,13,18)
bat(10,20.5,'budget_id',True)
bat(13,21,'name')
bat(16.5,20.5,'limit_amt')
bat(10.5,15.5,'start_date')
bat(15.5,15.5,'end_date')
bat(13,15,'status')

# COST RECORD attrs
def cat(cx,cy,label,pk=False): atr(ax,cx,cy,label,pk); ln(ax,cx,cy,28,15)
cat(25,18,'cost_id',True)
cat(28.5,18,'amount')
cat(31.5,17,'currency')
cat(26,12,'billing_period')
cat(30.5,12,'recorded_at')

# ALERT attrs
def alat(cx,cy,label,pk=False): atr(ax,cx,cy,label,pk); ln(ax,cx,cy,7,10)
alat(2.5,12,'alert_id',True)
alat(2,10,'type')
alat(2,8,'message')
alat(3.5,6.5,'threshold')
alat(6.5,6.5,'status')
alat(5,12,'triggered_at')

# REPORT attrs
def rpat(cx,cy,label,pk=False): atr(ax,cx,cy,label,pk); ln(ax,cx,cy,21,8)
rpat(17.5,5.5,'report_id',True)
rpat(21,5,'title')
rpat(24,5.5,'type')
rpat(25.5,7.5,'format')
rpat(16.5,7,'generated_at')

# AZURE API attrs
def apat(cx,cy,label,pk=False): atr(ax,cx,cy,label,pk); ln(ax,cx,cy,40,10)
apat(44,12.5,'api_id',True)
apat(45.5,10.5,'endpoint_url')
apat(45,8.5,'auth_token')
apat(43,7,'last_sync_at')
apat(37.5,8,'sync_status')

# ── legend ─────────────────────────────────────────────────────────────────
from matplotlib.patches import Patch
from matplotlib.lines import Line2D
items=[
    Patch(fc='#d8f3dc',ec='#2d6a4f',lw=2,label='Rectangle → Entity'),
    Patch(fc='#dde1ff',ec='#3a0ca3',lw=2,label='Diamond → Relationship'),
    Patch(fc='#f5f5f5',ec='#555',lw=1.5,label='Oval → Attribute'),
    Patch(fc='#fff0f3',ec='#c1121f',lw=2.2,label='Red Oval (underlined) → Primary Key'),
    Line2D([0],[0],color='#333',lw=2,label='Line → Association'),
    Line2D([0],[0],lw=0,marker='$1/N$',markersize=15,color='black',label='1, N, M → Cardinality'),
]
ax.legend(handles=items,loc='lower center',ncol=3,fontsize=12,
          framealpha=1,edgecolor='black',bbox_to_anchor=(0.5,0.0))

out=r'C:\Users\Lenovo\OneDrive\Desktop\Collage wla\ER-CHEN-MODEL.png'
fig.savefig(out,dpi=180,bbox_inches='tight',facecolor='white')
print(f"Saved: {out}")
