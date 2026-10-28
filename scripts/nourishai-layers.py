"""Split the NourishAI mascot into layers for AssistantAvatar.

Run from the repo root: python3 scripts/nourishai-layers.py (needs pillow and numpy).
"""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
im=Image.open("public/nourishai/mascot.png").convert("RGBA")
W,H=im.size
# Leaf: everything above the helmet edge. The leaf layer sits behind the body,
# so it also keeps a band below the edge that the body hides.
edge=[(450,290),(520,277),(570,268),(610,266),(650,268),(683,276),(700,290),(722,305),(740,292),(770,283),(820,280),(880,280),(950,272),(1050,262),(1100,262)]
cut=Image.new("L",im.size,0); ImageDraw.Draw(cut).polygon([(1100,0),(450,0)]+edge,fill=255)
grow=Image.new("L",im.size,0); ImageDraw.Draw(grow).polygon([(1100,0),(450,0)]+[(x,y+28) for x,y in edge],fill=255)
leaf=Image.new("RGBA",im.size,(0,0,0,0)); leaf.paste(im,(0,0),grow)
arr=np.array(im)
arr[np.array(cut)>0]=0
# Eyes: lift the glowing arcs into their own layers and paint the visor back under them.
boxes={'l':(388,598,585,722),'r':(748,622,940,742)}
a=arr.astype(float)
mask=np.zeros((H,W),bool)
for b in boxes.values():
    x0,y0,x1,y1=b
    reg=a[y0:y1,x0:x1]
    mask[y0:y1,x0:x1]=reg[...,1]>52
m=Image.fromarray((mask*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(13))
mask=np.array(m)>0
soft=np.array(m.filter(ImageFilter.GaussianBlur(3))).astype(float)/255
eyes={}
for k,(x0,y0,x1,y1) in boxes.items():
    layer=np.zeros_like(arr)
    sub=np.zeros((H,W),bool); sub[y0-6:y1+6,x0-6:x1+6]=True
    sel=sub
    layer[sel]=arr[sel]
    layer[...,3]=np.where(sel,(soft*arr[...,3]).astype(np.uint8),0)
    eyes[k]=layer
# Diffusion fill of the visor under the eyes.
y0,y1,x0,x1=580,760,370,960
reg=a[y0:y1,x0:x1,:3].copy(); mk=mask[y0:y1,x0:x1]
reg[mk]=reg[~mk].mean(0)
for _ in range(600):
    avg=(np.roll(reg,1,0)+np.roll(reg,-1,0)+np.roll(reg,1,1)+np.roll(reg,-1,1))/4
    reg[mk]=avg[mk]
a[y0:y1,x0:x1,:3]=reg
arr[...,:3]=a[...,:3].astype(np.uint8)
body=Image.fromarray(arr)
box=(0,28,1276,1214); size=(320,round(320*(1214-28)/1276))
def save(img,name):
    img.crop(box).resize(size,Image.LANCZOS).save(f"public/nourishai/{name}.webp",quality=92,method=6)
save(body,'body'); save(leaf,'leaf')
for k,l in eyes.items(): save(Image.fromarray(l),f'eye-{k}')
