"""Project-created vector diagrams, badge shapes and original synthesized audio.
AI cover artwork is generated separately; --art-dir supplies its original PNGs.
Only format export is performed on the new cover art; no legacy artwork/samples
are used as inputs. Build consumes checked-in exports, not this generator.
"""
from pathlib import Path
import argparse,subprocess,hashlib,json,math,wave,struct,shutil,html
parser=argparse.ArgumentParser();parser.add_argument('--art-dir',required=True);args=parser.parse_args()
ROOT=Path(__file__).resolve().parents[2];ART=Path(args.art_dir);TMP=ART/'rendered';TMP.mkdir(exist_ok=True);RECORDS=[]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def record(path,kind,source,**extra):RECORDS.append(dict(path=str(path.relative_to(ROOT)),sha256=sha(path),bytes=path.stat().st_size,kind=kind,source=source,**extra))
def encode(src,dest,quality='3'):
 dest.parent.mkdir(parents=True,exist_ok=True);subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(src),'-frames:v','1','-q:v',quality,str(dest)],check=True)
def raster(src,dest):
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(src),'-frames:v','1',str(dest)],check=True)
def svg(body,w=1200,h=675):return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><rect width="{w}" height="{h}" rx="32" fill="#101d22"/>{body}</svg>'
def text(x,y,label,size=28,color='#edf6f2'):return f'<text x="{x}" y="{y}" fill="{color}" font-family="sans-serif" font-size="{size}">{html.escape(label)}</text>'
def box(x,y,w,h,label,color='#125e55'):
 return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="20" fill="{color}" stroke="#62cdb1" stroke-width="2"/>'+text(x+22,y+h/2+10,label)
def line(points,color='#62e2bd',width=7):return '<polyline points="'+' '.join(f'{x},{y}' for x,y in points)+f'" fill="none" stroke="{color}" stroke-width="{width}" stroke-linejoin="round" stroke-linecap="round"/>'
def diagram(name,title,body):
 content=svg(text(54,65,title,34)+body+text(54,633,'ILLUSTRATIVE ONLY · NOT LIVE MARKET DATA',21,'#acbcb8'))
 source=ROOT/'docs/audits/issue-430/owner-followup-2026-11-23/media-source/diagrams'/f'{name}.svg';source.parent.mkdir(parents=True,exist_ok=True);source.write_text(content)
 png=TMP/(name+'.png');raster(source,png);dest=ROOT/'src/assets'/(name+'.jpg');encode(png,dest);record(dest,'project-vector-export','scripts/media/generate-project-media.py',vectorSource=str(source.relative_to(ROOT)))
# Fresh course artwork; paths are preserved for published course-document URLs.
for name in ['trading-basics','market-trends','risk-management','diversification','goals','technical-analysis','options-hero','futures-hero','macro-hero','psychology-hero']:
 src=ART/(('risk-management-unbranded' if name=='risk-management' else name)+'.png');assert src.is_file(),src
 dest=ROOT/('src/assets/courses/'+name+'.jpg' if name.endswith('-hero') else 'src/assets/course-'+name+'.jpg');encode(src,dest);record(dest,'AI-generated-original-cover','OpenAI image_gen; generation record in audit directory',originalPngSha256=sha(src),export='JPEG format encoding only; composition unchanged')
 if name in ['trading-basics','market-trends','risk-management','diversification']:
  other=ROOT/'public/course-covers'/(name+'.jpg');shutil.copyfile(dest,other);record(other,'same-project-cover-export',str(dest.relative_to(ROOT)),originalPngSha256=sha(src))
# Concept diagrams are source-authored, not AI-rendered financial evidence.
allocation=box(100,190,480,100,'Direct asset A')+box(650,190,450,100,'Fund: A + B + C')+line([(340,300),(340,410),(860,410),(860,300)])+text(350,485,'Look through overlapping holdings',28)
diagram('lesson-asset-allocation-chart','Exposure is more than a count of holdings',allocation)
diagram('lesson-etf-diversification','An ETF can overlap a direct holding',allocation)
diagram('lesson-portfolio-allocation','Separate the holdings and the cash',box(90,180,480,140,'Invested holdings')+box(630,180,480,140,'Uninvested cash','#344b62')+text(150,440,'Weights and prices can change over time',30))
candles=''
for x,positive in [(350,True),(800,False)]:
 color='#60d6b0' if positive else '#ed9d87';candles+=line([(x,150),(x,500)],color,5)+f'<rect x="{x-48}" y="240" width="96" height="150" fill="{color}"/>'
 candles+=text(x-95,135,'High',24)+text(x-95,542,'Low',24)+text(x+65,255,'Close' if positive else 'Open',24)+text(x+65,400,'Open' if positive else 'Close',24)
diagram('lesson-candlestick','A conventional candle: open, high, low, close',candles)
prices=[100,102,101,104,103,105,102,103];scale=lambda i,v:(110+i*135,500-(v-99)*55)
ma=[(i,sum(prices[i-2:i+1])/3) for i in range(2,len(prices))]
diagram('lesson-moving-averages','A three-observation moving average example',line([scale(i,v) for i,v in enumerate(prices)])+line([scale(i,v) for i,v in ma],'#edc782')+text(110,570,'Teal: hypothetical observations · Gold: arithmetic average',24))
diagram('lesson-technical-indicators','Different indicators describe different inputs',box(80,170,320,90,'Price path')+box(450,170,300,90,'Volume')+box(800,170,320,90,'Calculated series')+line([(100,460),(220,350),(300,410),(390,330)])+line([(460,450),(560,380),(680,425),(740,360)],'#ed9d87')+line([(810,440),(900,410),(1000,420),(1100,390)],'#edc782'))
diagram('lesson-market-trends-arrows','Observed paths depend on the chosen interval',line([(100,450),(190,380),(240,400),(360,270)])+line([(460,280),(530,390),(620,360),(730,460)],'#ed9d87')+line([(820,370),(900,350),(980,390),(1100,370)],'#edc782')+text(170,540,'Rising',26)+text(520,540,'Falling',26)+text(890,540,'Sideways',26))
diagram('lesson-goals-roadmap','A learning plan, not a promise of returns',box(65,210,250,120,'Read')+box(340,210,250,120,'Describe')+box(615,210,250,120,'Calculate')+box(890,210,250,120,'Reflect')+text(225,460,'Record assumptions and revisit uncertainty',30))
diagram('lesson-order-types','Execution and price constraints differ',box(110,170,980,130,'Market: execution price is uncertain')+box(110,350,980,130,'Limit: execution is not guaranteed','#344b62'))
diagram('lesson-risk-management','Compare an estimate with the recorded result',box(100,180,1000,110,'Quantity × hypothetical price + separate costs')+box(180,380,840,110,'A planned exit does not cap real losses','#624b47'))
diagram('lesson-risk-shield','A price gap can bypass a planned exit',line([(140,220),(350,250),(500,230)],'#ed9d87')+line([(700,460),(1000,480)],'#ed9d87')+'<path d="M500 230 L700 460" fill="none" stroke="#acbcb8" stroke-width="3" stroke-dasharray="10 12"/>'+line([(110,330),(1090,330)],'#edc782',3)+text(150,305,'Planned level',26)+text(730,390,'Gap: no observations',26))
diagram('lesson-stocks-basics','A share represents an ownership interest',box(85,200,290,130,'Company')+box(450,200,300,130,'Shares')+box(825,200,290,130,'Holders')+line([(375,265),(450,265)])+line([(750,265),(825,265)])+text(155,460,'Ownership does not guarantee dividends or gains',29))
diagram('lesson-trading-workspace','An illustrative virtual-practice workspace',box(70,150,700,300,'Hypothetical chart')+box(810,150,320,130,'Practice input')+box(810,315,320,135,'Virtual ledger')+text(100,535,'No brokerage transactions · no real funds',28))
# Keep the owner's actual current mark; raster exports use the extracted live SVG.
brand=ART/'live-brand-mark.png';assert brand.is_file()
for rel in ['public/logo.png','src/assets/tradehq-logo.png']:
 dest=ROOT/rel;shutil.copyfile(brand,dest);record(dest,'owner-retained-live-brand-raster','Live header BrandMark.tsx extraction; geometry unchanged',sourceSha256=sha(ART/'live-brand-mark.svg'))
placeholder=svg('<rect x="280" y="160" width="640" height="340" rx="20" fill="#203b3b"/>'+text(390,350,'Illustration',56),1200,675);dest=ROOT/'public/placeholder.svg';dest.write_text(placeholder);record(dest,'project-vector','scripts/media/generate-project-media.py')
# Twenty original, reproducible completion tokens, not trading-skill certificates.
symbols=[]
for n in range(1,21):
 hue=140+(n*11)%95;fill=f'hsl({hue},55%,60%)';body=f'<circle cx="128" cy="128" r="112" fill="#142a2d" stroke="{fill}" stroke-width="7"/><path d="M78 62 H178 V104 Q178 160 128 168 Q78 160 78 104Z" fill="{fill}"/><path d="M78 78 H53 V108 Q53 138 89 138 M178 78 H203 V108 Q203 138 167 138" fill="none" stroke="{fill}" stroke-width="10"/><path d="M128 168 V193 M93 202 H163" stroke="{fill}" stroke-width="12" stroke-linecap="round"/>'+text(103,120,str(n),34,'#12252a')
 content=svg(body,256,256);source=ROOT/'docs/audits/issue-430/owner-followup-2026-11-23/media-source/trophies'/f'{n:02}.svg';source.parent.mkdir(parents=True,exist_ok=True);source.write_text(content);png=TMP/f'trophy-{n}.png';raster(source,png);dest=ROOT/'public/achievements/trophies'/f'{n:02}.webp';subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(png),'-frames:v','1','-c:v','libwebp','-quality','88',str(dest)],check=True);record(dest,'project-vector-export','scripts/media/generate-project-media.py',vectorSource=str(source.relative_to(ROOT)));symbols.append(f'<symbol id="trophy-{n}" viewBox="0 0 256 256">{body}</symbol>')
dest=ROOT/'public/achievements/trophy-pieces.svg';dest.write_text('<svg xmlns="http://www.w3.org/2000/svg">'+''.join(symbols)+'</svg>');record(dest,'project-vector-sprite','scripts/media/generate-project-media.py')
# Original ambient sound: synthesized tones only, no imported recording/samples.
rate=22050;seconds=48;chords=[(48,55,62),(50,57,64),(45,52,59),(53,60,67),(48,55,64),(50,57,65),(43,50,62),(48,55,62)];samples=[]
for i in range(rate*seconds):
 t=i/rate;slot=min(7,int(t/6));local=t-slot*6;env=math.sin(math.pi*local/6)**2;globalfade=min(1,t/2,(seconds-t)/2);v=0
 for k,note in enumerate(chords[slot]):
  freq=440*2**((note-69)/12);v+=(math.sin(2*math.pi*freq*t)+.12*math.sin(2*math.pi*freq*2*t))*.12*env
 v*=max(0,globalfade);samples.append(max(-32767,min(32767,round(v*32767))))
source=TMP/'practice-reflections.wav'
with wave.open(str(source),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(struct.pack('<'+'h'*len(samples),*samples))
dest=ROOT/'public/audio/tradehq-practice-reflections.mp3';subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(source),'-c:a','libmp3lame','-b:a','96k','-metadata','title=TradeHQ Practice Reflections','-metadata','comment=Project-generated original synthesized tones; no third-party samples',str(dest)],check=True);record(dest,'original-procedural-audio','scripts/media/generate-project-media.py',seconds=seconds,externalSamples=False,pcmSha256=sha(source),maxAbsoluteSample=max(abs(s) for s in samples))
(ROOT/'public/audio/long-road-ahead-kevin-macleod.mp3').unlink(missing_ok=True)
ledger=ROOT/'docs/audits/issue-430/owner-followup-2026-11-23/NEW-MEDIA-PROVENANCE.json';ledger.write_text(json.dumps(RECORDS,indent=2)+'\n');print('Documented web media exports',len(RECORDS))
