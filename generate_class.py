import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Polygon
from matplotlib.lines import Line2D
import matplotlib.patches as mpatches

fig, ax = plt.subplots(figsize=(56, 44))
ax.set_xlim(0,56); ax.set_ylim(0,44); ax.axis('off')
fig.patch.set_facecolor('white'); ax.set_facecolor('white')

HC='#47b5c7'; BC='#d5eef7'; EC='#1a6e8a'; TC='#002244'; LW=1.8; CW=10.5

def cbox(ax,cx,cy,stereo,name,attrs,methods,abstract=False):
    rh=0.62
    ah=max(len(attrs),2)*rh; mh=max(len(methods),2)*rh; hh=1.35
    th=hh+ah+mh; x0=cx-CW/2; y0=cy-th/2
    ax.add_patch(FancyBboxPatch((x0,y0),CW,th,boxstyle='square,pad=0',lw=LW,ec=EC,fc=BC,zorder=4))
    ax.add_patch(FancyBboxPatch((x0,y0+ah+mh),CW,hh,boxstyle='square,pad=0',lw=LW,ec=EC,fc=HC,zorder=5))
    ax.text(cx,y0+ah+mh+hh*0.75,f'<<{stereo}>>',ha='center',va='center',fontsize=8,color='white',zorder=6)
    ax.text(cx,y0+ah+mh+hh*0.28,name,ha='center',va='center',fontsize=11,fontweight='bold',
            style='italic' if abstract else 'normal',color='white',zorder=6)
    ax.plot([x0,x0+CW],[y0+mh,y0+mh],color=EC,lw=LW,zorder=5)
    ax.plot([x0,x0+CW],[y0+ah+mh,y0+ah+mh],color=EC,lw=LW,zorder=5)
    for i,a in enumerate(attrs):
        ax.text(x0+0.2,y0+mh+ah-(i+0.55)*rh,a,ha='left',va='center',fontsize=8,color=TC,zorder=6)
    for i,m in enumerate(methods):
        ax.text(x0+0.2,y0+mh-(i+0.55)*rh,m,ha='left',va='center',fontsize=8,color=TC,zorder=6)
    return {'t':(cx,y0+th),'b':(cx,y0),'l':(cx-CW/2,cy),'r':(cx+CW/2,cy),'cy':cy,'h':th,'y0':y0}

def dep(ax,x1,y1,x2,y2,lbl=''):
    ax.annotate('',xy=(x2,y2),xytext=(x1,y1),
        arrowprops=dict(arrowstyle='->',color=EC,lw=1.6,mutation_scale=12,linestyle='dashed'),zorder=3)
    if lbl: ax.text((x1+x2)/2,(y1+y2)/2+0.25,lbl,ha='center',fontsize=8,style='italic',color='#555',zorder=6)

def assoc(ax,x1,y1,x2,y2,c1='',c2='',lbl=''):
    ax.annotate('',xy=(x2,y2),xytext=(x1,y1),
        arrowprops=dict(arrowstyle='->',color=EC,lw=1.6,mutation_scale=12),zorder=3)
    if c1: ax.text(x1+(x2-x1)*0.1,y1+(y2-y1)*0.1+0.2,c1,ha='center',fontsize=10,fontweight='bold',color='#222',zorder=6)
    if c2: ax.text(x2-(x2-x1)*0.1,y2-(y2-y1)*0.1+0.2,c2,ha='center',fontsize=10,fontweight='bold',color='#222',zorder=6)
    if lbl: ax.text((x1+x2)/2,(y1+y2)/2+0.3,lbl,ha='center',fontsize=8,style='italic',color='#444',zorder=6)

def diamond_arr(ax,x1,y1,x2,y2,filled=False,c1='',c2=''):
    ax.annotate('',xy=(x2,y2),xytext=(x1,y1),
        arrowprops=dict(arrowstyle='->',color=EC,lw=1.6,mutation_scale=12),zorder=3)
    import numpy as np
    dx,dy=x2-x1,y2-y1; ln=max((dx**2+dy**2)**0.5,0.001)
    ux,uy=dx/ln,dy/ln; ds=0.55
    pts=[(x1-uy*ds*0.45,y1+ux*ds*0.45),(x1+ux*ds,y1+uy*ds),
         (x1+uy*ds*0.45,y1-ux*ds*0.45),(x1,y1)]
    ax.add_patch(Polygon(pts,closed=True,lw=LW,ec=EC,fc=EC if filled else 'white',zorder=5))
    if c1: ax.text(x1,y1+0.35,c1,ha='center',fontsize=10,fontweight='bold',color='#222',zorder=6)
    if c2: ax.text(x2,y2+0.35,c2,ha='center',fontsize=10,fontweight='bold',color='#222',zorder=6)

def inh(ax,x1,y1,x2,y2):
    ax.annotate('',xy=(x2,y2),xytext=(x1,y1),
        arrowprops=dict(arrowstyle='-|>',color=EC,lw=1.8,mutation_scale=18,facecolor='white'),zorder=3)

# ── Title ──────────────────────────────────────────────────────────────────
ax.text(28,43.3,'Azure Cloud Cost Monitoring & Optimization Platform',ha='center',fontsize=20,fontweight='bold')
ax.text(28,42.5,'UML Class Diagram',ha='center',fontsize=13,color='#444')

# ══════════════════════════════════════════════════════════════════════════
# CLASS BOXES
# ══════════════════════════════════════════════════════════════════════════
U = cbox(ax,7,30,'entity','User',
    ['-userId : int','-name : String','-email : String','-role : UserRole','-isActive : bool'],
    ['+login() : Token','+logout() : void','+getProfile() : dict','+updateProfile() : void'])

AS = cbox(ax,20,37,'control','AuthService',
    ['-jwtSecret : String','-tokenExpiry : int'],
    ['+authenticate(e,p) : Token','+validateToken(t) : bool','+refreshToken(t) : Token','+enforceRBAC() : bool'])

AZ = cbox(ax,35,37,'boundary','AzureAPIConnector',
    ['-endpoint : String','-authToken : String','-lastSync : DateTime'],
    ['+connect() : bool','+fetchBilling() : List','+fetchResources() : List','+handleRateLimit() : void'])

DS = cbox(ax,48,37,'control','DataSyncService',
    ['-syncInterval : int','-status : SyncStatus'],
    ['+startSync() : void','+stopSync() : void','+handleFailure() : void','+getSyncStatus() : str'])

SB = cbox(ax,20,26,'entity','Subscription',
    ['-subId : int','-azureSubId : String','-tenantId : String','-status : String'],
    ['+getResources() : List','+getBudgets() : List','+getCostRecords() : List'])

RG = cbox(ax,35,26,'entity','ResourceGroup',
    ['-rgId : int','-name : String','-location : String','-tags : dict'],
    ['+getResources() : List','+getTotalCost() : float','+updateMetadata() : void'])

RE = cbox(ax,48,24,'entity','Resource',
    ['-resourceId : int','-name : String','-type : String','-status : String'],
    ['+getCost() : float','+getMetrics() : dict','+syncStatus() : void'])

CR = cbox(ax,35,15,'entity','CostRecord',
    ['-costId : int','-amount : float','-currency : String','-billingPeriod : String','-recordedAt : DateTime'],
    ['+getSummary() : dict','+getByPeriod() : List'])

BM = cbox(ax,7,19,'control','BudgetManager',
    ['-budgetId : int','-limitAmount : float','-startDate : Date','-endDate : Date','-status : String'],
    ['+setBudget() : void','+checkThreshold() : bool','+notifyUser() : void','+getStatus() : str'])

AL = cbox(ax,7,8,'control','AlertService',
    ['-alertId : int','-type : AlertType','-threshold : float'],
    ['+createAlert() : Alert','+sendAlert() : void','+acknowledge() : void','+getHistory() : List'])

RG2 = cbox(ax,21,10,'control','ReportGenerator',
    ['-reportId : int','-type : String','-format : String'],
    ['+generateReport() : Report','+exportPDF() : File','+exportCSV() : File','+scheduleReport() : void'])

CM = cbox(ax,48,14,'control','CostMonitoring\nService',
    ['-anomalyThreshold : float','-interval : int'],
    ['+monitorCosts() : void','+detectAnomaly() : bool','+generateInsights() : List'])

# ══════════════════════════════════════════════════════════════════════════
# RELATIONSHIPS
# ══════════════════════════════════════════════════════════════════════════
# User --dep--> AuthService
dep(ax, U['r'][0],U['r'][1], AS['b'][0]-1,AS['b'][1], '<<uses>>')
# User --assoc 1:N--> Subscription
assoc(ax, U['r'][0],26, SB['l'][0],SB['l'][1], '1','N','manages')
# Subscription --agg 1:N--> ResourceGroup
diamond_arr(ax, SB['r'][0],SB['r'][1], RG['l'][0],RG['l'][1], False,'1','N')
# ResourceGroup --agg 1:N--> Resource
diamond_arr(ax, RG['r'][0],RG['r'][1], RE['l'][0],RE['l'][1], False,'1','N')
# Resource --comp 1:N--> CostRecord
diamond_arr(ax, RE['b'][0],RE['b'][1], CR['r'][0],CR['r'][1], True,'1','N')
# User --assoc 1:N--> BudgetManager
assoc(ax, U['b'][0],U['b'][1], BM['t'][0],BM['t'][1], '1','N','manages')
# BudgetManager --assoc--> AlertService
assoc(ax, BM['b'][0],BM['b'][1], AL['t'][0],AL['t'][1], '1','N','triggers')
# AzureAPIConnector --dep--> Subscription
dep(ax, AZ['b'][0],AZ['b'][1], SB['t'][0]+1,SB['t'][1], '<<syncs>>')
# DataSyncService --dep--> AzureAPIConnector
dep(ax, DS['l'][0],DS['l'][1], AZ['r'][0],AZ['r'][1], '<<uses>>')
# DataSyncService --dep--> CostRecord
dep(ax, DS['b'][0],DS['b'][1], CR['t'][0]+1,CR['t'][1], '<<creates>>')
# ReportGenerator --dep--> CostRecord
dep(ax, RG2['r'][0],RG2['r'][1], CR['l'][0],CR['b'][1]+1, '<<reads>>')
# CostMonitoring --dep--> AzureAPIConnector
dep(ax, CM['t'][0],CM['t'][1], AZ['b'][0]+1,AZ['b'][1], '<<uses>>')
# CostMonitoring --dep--> CostRecord
dep(ax, CM['l'][0],CM['l'][1], CR['r'][0],CR['r'][1], '<<analyses>>')

# ── Legend ─────────────────────────────────────────────────────────────────
l_items=[
    mpatches.Patch(fc=HC,ec=EC,lw=2,label='Header  →  Stereotype + Class Name'),
    mpatches.Patch(fc=BC,ec=EC,lw=2,label='Body  →  Attributes / Methods'),
    Line2D([0],[0],color=EC,lw=2,label='Solid Arrow  →  Association'),
    Line2D([0],[0],color=EC,lw=2,linestyle='dashed',label='Dashed Arrow  →  Dependency'),
    mpatches.Patch(fc='white',ec=EC,lw=2,label='Hollow Diamond  →  Aggregation'),
    mpatches.Patch(fc=EC,ec=EC,lw=2,label='Filled Diamond  →  Composition'),
    Line2D([0],[0],color=EC,lw=2,marker='^',ms=10,mfc='white',mec=EC,label='Hollow Triangle  →  Inheritance'),
]
ax.legend(handles=l_items,loc='lower center',ncol=4,fontsize=11,
          framealpha=1,edgecolor='black',bbox_to_anchor=(0.5,0.0))

out=r'C:\Users\Lenovo\OneDrive\Desktop\Collage wla\CLASS-DIAGRAM.png'
fig.savefig(out,dpi=180,bbox_inches='tight',facecolor='white')
print(f"Saved: {out}")
