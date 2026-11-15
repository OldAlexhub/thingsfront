import React, {useEffect, useRef, useState} from 'react';
import {View, Text, Image, Alert, useWindowDimensions, StyleSheet, Keyboard, ScrollView} from 'react-native';
import {useRoute} from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ViewShot from 'react-native-view-shot';
import {MapPin, Sparkles, Share2, Check} from 'lucide-react-native';
import {KeyboardSafeScreen, SafeScrollView, Header, Field, Button, Label, Chip} from '../components';
import {useLocal} from '../storage';
import {useData} from '../data';
import {native, BASE_URL} from '../api';
import {localDate, memoryCaption} from '../memories';
import type {Activity} from '../types';

export function MemoryScreen() {
  const route=useRoute<any>(), {state,update}=useLocal(), {cities}=useData();
  const activity=route.params.activity as Activity;
  const previous=state.visits.find(v=>v.activityId===activity._id);
  const [name,setName]=useState(previous?.name || ''), [note,setNote]=useState(previous?.note || '');
  const [date,setDate]=useState(previous?.visitedOn || localDate()), [picker,setPicker]=useState(false);
  const [tone,setTone]=useState<'night'|'paper'>('night'), [busy,setBusy]=useState(false),[saved,setSaved]=useState(false);
  const [failed,setFailed]=useState(false), [ready,setReady]=useState(!activity.images?.[0]?.url);
  const shot=useRef<React.ElementRef<typeof ViewShot>>(null), width=Math.min(useWindowDimensions().width-44,420);
  const scroll=useRef<React.ElementRef<typeof ScrollView>>(null), fieldY=useRef({name:0,note:0}), focusedY=useRef(0);
  const focusField=(key:'name'|'note')=>{
    focusedY.current=fieldY.current[key];
    scroll.current?.scrollTo({y:Math.max(0,focusedY.current-24),animated:true});
  };
  useEffect(()=>{
    const listener=Keyboard.addListener('keyboardDidShow',()=>scroll.current?.scrollTo({y:Math.max(0,focusedY.current-24),animated:true}));
    return()=>listener.remove();
  },[]);
  const photo=activity.images?.[0], city=previous?.cityName || cities.find(c=>c._id===activity.cityId)?.name || '';
  useEffect(()=>{if(ready)return;const timer=setTimeout(()=>{setFailed(true);setReady(true);},15000);return()=>clearTimeout(timer);},[ready]);
  const title=previous?.placeTitle || activity.title;
  const dark=tone==='night', ink=dark?'#F8F6F0':'#102D32', background=dark?'#10272C':'#FAF4E8';
  const visit={activityId:activity._id,activity,placeTitle:title,cityName:city,visitedOn:date,name:name.trim(),note:note.trim()};
  const caption=[memoryCaption(visit),photo && !failed ? `Photo: ${photo.credit || ''} · ${photo.license || ''} · Cropped\n${photo.sourceUrl || ''}` : ''].filter(Boolean).join('\n\n');
  function save() {
    update(old=>({...old,visited:[activity._id,...old.visited.filter(id=>id!==activity._id)].slice(0,500),
      visits:[visit,...old.visits.filter(v=>v.activityId!==activity._id)].slice(0,500)}));
    setSaved(true);
  }
  async function exportImage(share:boolean) {
    Keyboard.dismiss(); setBusy(true);
    try {
      const uri=await shot.current?.capture?.();
      if(!uri) throw new Error('The card is not ready yet. Please try again.');
      if(share) await native.shareMemory(uri,caption);
      else {await native.saveMemoryImage(uri); Alert.alert('Image saved','Your memory card is ready to use.');}
      save();
    } catch(e) { if(!(e as Error).message?.includes('cancelled')) Alert.alert('Could not prepare the image',(e as Error).message); }
    finally {setBusy(false);}
  }
  return <KeyboardSafeScreen><SafeScrollView ref={scroll} keyboardShouldPersistTaps="handled">
    <Header back title="You were here." kicker="A LITTLE MOMENT, KEPT" />
    <View style={{paddingHorizontal:22,gap:14,paddingBottom:28}}>
      <ViewShot ref={shot} options={{format:'png',result:'tmpfile',width:1080,height:1350}} style={{width,alignSelf:'center'}}>
        <View style={{width,height:width*1.25,backgroundColor:background,overflow:'hidden',borderRadius:4}}>
          <View style={{height:width*.65,backgroundColor:'#1C5A5D',overflow:'hidden'}}>
            {photo?.url && !failed ? <Image source={{uri:photo.url.startsWith('/')?BASE_URL+photo.url:photo.url}}
              accessibilityLabel={photo.alt || title} resizeMode="cover" style={StyleSheet.absoluteFill}
              onLoad={()=>setReady(true)} onError={()=>{setFailed(true);setReady(true);}} /> :
              <View style={{flex:1,alignItems:'center',justifyContent:'center'}}>
                <View style={{position:'absolute',width:width*.9,height:width*.9,borderRadius:300,borderWidth:1,borderColor:'#F3C77555'}} />
                <View style={{position:'absolute',width:width*.6,height:width*.6,borderRadius:300,borderWidth:1,borderColor:'#F3C77588'}} />
                <MapPin color="#F3C775" size={width*.18} strokeWidth={1.2} />
              </View>}
            <View style={{position:'absolute',left:16,top:16,backgroundColor:'#10272CEB',paddingHorizontal:10,paddingVertical:7,borderRadius:20,flexDirection:'row',gap:5,alignItems:'center'}}>
              <Sparkles size={12} color="#F3C775" /><Text allowFontScaling={false} style={{color:'#F3C775',fontSize:9,fontWeight:'700',letterSpacing:1.5}}>MOMENTS THAT MATTER</Text>
            </View>
          </View>
          <View style={{paddingHorizontal:width*.06,paddingTop:width*.045,flex:1}}>
            <Text allowFontScaling={false} numberOfLines={1} style={{color:dark?'#8DDBCC':'#157367',fontSize:width*.031,fontWeight:'700',letterSpacing:1.2}}>{new Date(date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}).toUpperCase()} {city?' / '+city.toUpperCase():''}</Text>
            <Text allowFontScaling={false} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={.7} style={{color:ink,fontSize:width*.085,fontWeight:'900',lineHeight:width*.09,marginTop:width*.02}}>{name.trim() || 'I'} was here!</Text>
            <Text allowFontScaling={false} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={.8} style={{color:ink,fontSize:width*.048,fontWeight:'600',marginTop:width*.018}}>{title}</Text>
            {!!note.trim() && <Text allowFontScaling={false} numberOfLines={2} style={{color:dark?'#BCD1CE':'#4E6B68',fontSize:width*.032,marginTop:width*.02,lineHeight:width*.042}}>{note.trim()}</Text>}
            <View style={{flex:1}} />
            <View style={{borderTopWidth:1,borderTopColor:dark?'#FFFFFF22':'#10272C22',paddingTop:width*.023,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
              <Text allowFontScaling={false} style={{color:dark?'#F3C775':'#826018',fontSize:width*.039,fontWeight:'800'}}>#old_alex_hub</Text>
              <Text allowFontScaling={false} style={{color:ink,fontSize:width*.027,fontWeight:'700'}}>THINGS TO DO</Text>
            </View>
            <Text allowFontScaling={false} numberOfLines={2} style={{color:dark?'#AFC4C0':'#526B68',fontSize:width*.019,marginTop:5,marginBottom:width*.025}}>{photo && !failed ? `Photo: ${photo.credit || 'Source credited in app'} · ${photo.license || ''} · Cropped${photo.sourceUrl?' · '+photo.sourceUrl:''}` : 'A memory made with Things to Do by Old Alex Hub'}</Text>
          </View>
        </View>
      </ViewShot>
      <View style={{flexDirection:'row'}}><Chip title="Night postcard" selected={dark} onPress={()=>setTone('night')} /><Chip title="Warm paper" selected={!dark} onPress={()=>setTone('paper')} /></View>
      <View onLayout={e=>{fieldY.current.name=e.nativeEvent.layout.y;}}><Field label="Your name (optional)" placeholder="Alex" value={name} maxLength={36} onFocus={()=>focusField('name')} onChangeText={v=>{setName(v);setSaved(false);}} /></View>
      <Button secondary title={`Visited ${date} · Change date`} onPress={()=>setPicker(true)} />
      {picker && <DateTimePicker value={new Date(date+'T12:00:00')} mode="date" maximumDate={new Date()} onChange={(_,value)=>{setPicker(false);if(value){setDate(localDate(value));setSaved(false);}}} />}
      <View onLayout={e=>{fieldY.current.note=e.nativeEvent.layout.y;}}><Field label="A little memory (optional)" value={note} placeholder="The kind of afternoon I want to remember." maxLength={100} onFocus={()=>focusField('note')} onChangeText={v=>{setNote(v);setSaved(false);}} /></View>
      <Button title={saved?'Memory saved':'Save this memory'} icon={<Check size={18} color="#fff" />} onPress={save} disabled={busy} />
      <Button title={busy?'Preparing your card…':'Share memory card'} icon={<Share2 size={18} color="#fff" />} onPress={()=>void exportImage(true)} disabled={busy || !ready} />
      {!ready && <Label muted>Loading your place photo…</Label>}
      <Button secondary title="Save image to device" onPress={()=>void exportImage(false)} disabled={busy || !ready} />
      <Button secondary title="Copy caption & hashtag" onPress={()=>native.copyText(caption).then(()=>Alert.alert('Caption copied','Paste it into your social post.')).catch(()=>Alert.alert('Could not copy','Try again.'))} />
      <Label muted style={{fontSize:12}}>Your memory stays on this device until you choose to share. Some social apps only attach the image; copy the caption to include the searchable hashtag.</Label>
    </View>
  </SafeScrollView></KeyboardSafeScreen>;
}
