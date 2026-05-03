import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Polygon
from matplotlib.lines import Line2D
import matplotlib.patches as mpatches

fig, ax = plt.subplots(figsize=(58, 46))
ax.set_xlim(0,58); ax.set_ylim(0,46); ax.axis('off')
fig.patch.set_facecolor('#f0f2f5'); ax.set_facecolor('#f0f2f5')
CW=9.5; LW=1.8

# Layer bands
ax.add_patch(FancyBboxPatch((1.5,32.5),55,9.5,boxstyle='round,pad=0.3',lw=2,ec='#0d9488',fc='#e6fffa',zorder=1))
ax.add_patch(FancyBboxPatch((1.5,16.5),55,15.5,boxstyle='round,pad=0.3',lw=2,ec='#c2410c',fc='#fff7ed',zorder=1))
ax.add_patch(FancyBboxPatch((1.5,3.5),55,12.5,boxstyle='round,pad=0.3',lw=2,ec='#7c3aed',fc='#f5f3ff',zorder=1))

# Layer labels
for y,t,c in [(37,'BOUNDARY / EXTERNAL\nLAYER','#0f766e'),(24,'SERVICE & CONTROL\nLAYER','#c2410c'),(9.5,'ENTITY & DATA\nLAYER','#6d28d9')]:
    ax.text(2.6,y,t,va='center',ha='center',fontsize=9,fontweight='bold',color=c,rotation=90,zorder=2)

COLS={'boundary':('#0f766e','#ccfbf1','#0d9488','white'),
      'control': ('#c2410c','#ffedd5','#ea580c','white'),
      'entity':  ('#6d28d9','#ede9fe','#7c3aed','white')}

def cbox(ax,cx,cy,layer,stereo,name,attrs,methods):
    h,b,e,t=COLS[layer]; rh=0.63
    ah=max(len(attrs),2)*rh; mh=max(len(methods),2)*rh; hh=1.4; th=hh+ah+mh
    x0=cx-CW/2; y0=cy-th/2
    ax.add_patch(FancyBboxPatch((x0+0.18,y0-0.18),CW,th,boxstyle='round,pad=0.08',lw=0,ec='none',fc='#aaa',alpha=0.4,zorder=3))
    ax.add_patch(FancyBboxPatch((x0,y0),CW,th,boxstyle='round,pad=0.08',lw=LW,ec=e,fc=b,zorder=4))
    ax.add_patch(FancyBboxPatch((x0,y0+ah+mh),CW,hh,boxstyle='round,pad=0.08',lw=LW,ec=e,fc=h,zorder=5))
    ax.text(cx,y0+ah+mh+hh*0.75,f'<<{stereo}>>',ha='center',va='center',fontsize=8,color='#ccc',zorder=6)
    ax.text(cx,y0+ah+mh+hh*0.28,name,ha='center',va='center',fontsize=11,fontweight='bold',color=t,zorder=6)
    ax.plot([x0,x0+CW],[y0+mh,y0+mh],color=e,lw=1.2,zorder=5)
    ax.plot([x0,x0+CW],[y0+ah+mh,y0+ah+mh],color=e,lw=LW,zorder=5)
    for i,a in enumerate(attrs): ax.text(x0+0.2,y0+mh+ah-(i+0.55)*rh,a,ha='left',va='center',fontsize=8,color='#222',zorder=6)
    for i,m in enumerate(methods): ax.text(x0+0.2,y0+mh-(i+0.55)*rh,m,ha='left',va='center',fontsize=8,color='#333',zorder=6)
    return {'t':(cx,y0+th),'b':(cx,y0),'l':(x0,cy),'r':(x0+CW,cy),'cx':cx,'cy':cy}

def arr(ax,x1,y1,x2,y2,style='assoc',lbl='',c1='',c2='',color='#374151'):
    ls='dashed' if style=='dep' else 'solid'
    ax.annotate('',xy=(x2,y2),xytext=(x1,y1),zorder=3,
        arrowprops=dict(arrowstyle='-|>' if style=='inh' else '->',color=color,lw=1.8,mutation_scale=14,
                        linestyle=ls,connectionstyle='arc3,rad=0.0'))
    mx,my=(x1+x2)/2,(y1+y2)/2
    if lbl: ax.text(mx+0.1,my+0.3,lbl,ha='center',fontsize=8,style='italic',color=color,zorder=7,
                    bbox=dict(fc='white',ec='none',pad=0.1))
    if c1: ax.text(x1+(x2-x1)*0.12,y1+(y2-y1)*0.12+0.25,c1,fontsize=10,fontweight='bold',color='#111',zorder=7)
    if c2: ax.text(x2-(x2-x1)*0.12,y2-(y2-y1)*0.12+0.25,c2,fontsize=10,fontweight='bold',color='#111',zorder=7)

def diam(ax,x1,y1,x2,y2,filled=False,c1='',c2=''):
    import numpy as np
    dx,dy=x2-x1,y2-y1; ln=max((dx**2+dy**2)**.5,0.001); ux,uy=dx/ln,dy/ln; ds=0.6
    pts=[(x1-uy*ds*.4,y1+ux*ds*.4),(x1+ux*ds,y1+uy*ds),(x1+uy*ds*.4,y1-ux*ds*.4),(x1,y1)]
    fc='#7c3aed' if filled else 'white'; ec='#7c3aed'
    ax.add_patch(Polygon(pts,closed=True,lw=LW,ec=ec,fc=fc,zorder=5))
    ax.annotate('',xy=(x2,y2),xytext=(x1+ux*ds,y1+uy*ds),zorder=3,
        arrowprops=dict(arrowstyle='->',color='#374151',lw=1.8,mutation_scale=14))
    if c1: ax.text(x1,y1+0.4,c1,ha='center',fontsize=10,fontweight='bold',color='#111',zorder=7)
    if c2: ax.text(x2,y2+0.4,c2,ha='center',fontsize=10,fontweight='bold',color='#111',zorder=7)

# ── Title ──────────────────────────────────────────────────────────────────
ax.text(29,45.2,'Azure Cloud Cost Monitoring & Optimization Platform',ha='center',fontsize=20,fontweight='bold',color='#111')
ax.text(29,44.4,'UML Class Diagram  —  Layered Architecture View',ha='center',fontsize=13,color='#555')

# ════════════════════ BOUNDARY LAYER ═══════════════════════════════════════
AZ=cbox(ax,29,37,'boundary','boundary','AzureAPIConnector',
    ['-endpoint : String','-authToken : String','-lastSync : DateTime','-syncStatus : Enum'],
    ['+connect() : bool','+fetchBilling() : List','+fetchResources() : List','+handleRateLimit() : void'])

# ════════════════════ CONTROL LAYER (2 rows) ════════════════════════════════
AU=cbox(ax,9,28,'control','control','AuthService',
    ['-jwtSecret : String','-tokenExpiry : int'],
    ['+authenticate(e,p) : Token','+validateToken(t) : bool','+refreshToken(t) : Token','+enforceRBAC() : bool'])

CM=cbox(ax,26,28,'control','control','CostMonitoring\nService',
    ['-anomalyThreshold : float','-monitorInterval : int'],
    ['+monitorCosts() : void','+detectAnomaly() : bool','+generateInsights() : List'])

DS=cbox(ax,43,28,'control','control','DataSyncService',
    ['-syncInterval : int','-status : SyncStatus'],
    ['+startSync() : void','+stopSync() : void','+getSyncStatus() : str','+handleFailure() : void'])

BM=cbox(ax,9,21,'control','control','BudgetManager',
    ['-limitAmount : float','-startDate : Date','-endDate : Date','-status : Enum'],
    ['+setBudget() : void','+checkThreshold() : bool','+notifyUser() : void','+getStatus() : str'])

RG2=cbox(ax,26,21,'control','control','ReportGenerator',
    ['-type : String','-format : String'],
    ['+generateReport() : Report','+exportPDF() : File','+exportCSV() : File','+scheduleReport() : void'])

AL=cbox(ax,43,21,'control','control','AlertService',
    ['-alertId : int','-type : AlertType','-threshold : float'],
    ['+createAlert() : Alert','+sendAlert() : void','+acknowledge() : void','+getHistory() : List'])

# ════════════════════ ENTITY LAYER ══════════════════════════════════════════
US=cbox(ax,6.5,10,'entity','entity','User',
    ['-userId : int','-name : String','-email : String','-role : UserRole'],
    ['+login() : Token','+logout() : void','+getProfile() : dict','+updateProfile() : void'])

SB=cbox(ax,17.5,10,'entity','entity','Subscription',
    ['-subId : int','-azureSubId : String','-tenantId : String','-status : String'],
    ['+getResources() : List','+getBudgets() : List','+getCostRecords() : List'])

RGE=cbox(ax,28.5,10,'entity','entity','ResourceGroup',
    ['-rgId : int','-name : String','-location : String','-tags : dict'],
    ['+getResources() : List','+getTotalCost() : float','+updateMetadata() : void'])

RE=cbox(ax,39.5,10,'entity','entity','Resource',
    ['-resourceId : int','-name : String','-type : String','-status : String'],
    ['+getCost() : float','+getMetrics() : dict','+syncStatus() : void'])

CR=cbox(ax,50.5,10,'entity','entity','CostRecord',
    ['-costId : int','-amount : float','-currency : String','-billingPeriod : String'],
    ['+getSummary() : dict','+getByPeriod() : List'])

# ════════════════════ RELATIONSHIPS ════════════════════════════════════════
# AzureAPIConnector -> DataSyncService (association, downward)
arr(ax,AZ['b'][0]-2,AZ['b'][1],DS['t'][0],DS['t'][1],'assoc','<<provides data>>',color='#0d9488')
# AzureAPIConnector -> CostMonitoring
arr(ax,AZ['b'][0],AZ['b'][1],CM['t'][0],CM['t'][1],'dep','<<feeds>>',color='#0d9488')
# AzureAPIConnector -> Subscription
arr(ax,AZ['b'][0]+1,AZ['b'][1],SB['t'][0],SB['t'][1],'dep','<<syncs>>',color='#0d9488')
# AuthService -> User
arr(ax,AU['b'][0],AU['b'][1],US['t'][0],US['t'][1],'assoc','<<authenticates>>',color='#c2410c')
# BudgetManager -> AlertService
arr(ax,BM['r'][0],BM['r'][1],AL['l'][0]-9.5+9.5,AL['l'][1],'assoc','triggers','1','N',color='#c2410c')
# BudgetManager -> User (down)
arr(ax,BM['b'][0],BM['b'][1],US['t'][0]+2,US['t'][1],'dep','<<manages>>',color='#c2410c')
# ReportGenerator -> CostRecord
arr(ax,RG2['b'][0],RG2['b'][1],CR['t'][0],CR['t'][1],'dep','<<reads>>',color='#c2410c')
# DataSyncService -> CostRecord
arr(ax,DS['b'][0],DS['b'][1],CR['t'][0]-1,CR['t'][1],'dep','<<creates>>',color='#c2410c')
# User -> Subscription
arr(ax,US['r'][0],US['r'][1],SB['l'][0],SB['l'][1],'assoc','','1','N',color='#6d28d9')
# Subscription -> ResourceGroup (aggregation)
diam(ax,SB['r'][0],SB['r'][1],RGE['l'][0],RGE['l'][1],False,'1','N')
# ResourceGroup -> Resource (aggregation)
diam(ax,RGE['r'][0],RGE['r'][1],RE['l'][0],RE['l'][1],False,'1','N')
# Resource -> CostRecord (composition)
diam(ax,RE['r'][0],RE['r'][1],CR['l'][0],CR['l'][1],True,'1','N')

# ── Legend ──────────────────────────────────────────────────────────────────
li=[mpatches.Patch(fc='#ccfbf1',ec='#0d9488',lw=2,label='Teal Band → Boundary Layer'),
    mpatches.Patch(fc='#ffedd5',ec='#ea580c',lw=2,label='Orange Band → Control/Service Layer'),
    mpatches.Patch(fc='#ede9fe',ec='#7c3aed',lw=2,label='Purple Band → Entity/Data Layer'),
    Line2D([0],[0],color='#374151',lw=2,label='Solid Arrow → Association'),
    Line2D([0],[0],color='#374151',lw=2,linestyle='dashed',label='Dashed Arrow → Dependency'),
    mpatches.Patch(fc='white',ec='#7c3aed',lw=2,label='Hollow ◇ → Aggregation'),
    mpatches.Patch(fc='#7c3aed',ec='#7c3aed',lw=2,label='Filled ◆ → Composition')]
ax.legend(handles=li,loc='lower center',ncol=4,fontsize=11,
          framealpha=1,edgecolor='#aaa',bbox_to_anchor=(0.5,0.0),frameon=True)

out=r'C:\Users\Lenovo\OneDrive\Desktop\Collage wla\CLASS-DIAGRAM-V2.png'
fig.savefig(out,dpi=180,bbox_inches='tight',facecolor='#f0f2f5')
print(f"Saved: {out}")
