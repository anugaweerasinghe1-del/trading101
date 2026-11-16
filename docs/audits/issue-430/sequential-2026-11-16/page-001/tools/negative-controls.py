import sys,pathlib,json,copy,importlib.util
p=pathlib.Path(sys.argv[1]);spec=importlib.util.spec_from_file_location('validator',pathlib.Path(__file__).with_name('validate-page-record.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);original=json.loads(p.read_text());assert not m.validate(original,p.parent)
cases=[]
for name,change in [
 ('missing-second-pass-block',lambda x:x['pass2'].pop()),
 ('corrupt-block-hash',lambda x:x['capture']['blocks'][0].update(sha256='0'*64)),
 ('missing-native-deployment-id',lambda x:x['production']['nativeCloudflare'].pop('id')),
 ('wrong-native-production-sha',lambda x:x['production']['nativeCloudflare'].update(sha='0'*40)),
 ('missing-native-source-url',lambda x:x['production'].pop('receiptSourceURL')),
 ('omitted-captured-block-from-all-record-lists',lambda x:[x['capture']['blocks'].pop(),x['pass1'].pop(),x['pass2'].pop()])]:
 x=copy.deepcopy(original);change(x);errors=m.validate(x,p.parent);assert errors,name+' incorrectly passed';cases.append({'case':name,'rejected':True,'errors':errors[:4]})
out={'scope':'Mechanical completeness only, not truth of editorial judgment or actual reading','validOriginalPassed':True,'negativeControls':cases};(p.parent/'coverage-negative-controls.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
