import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
export default function Shorts() {
  return (
    <View style={s.root}><Text style={s.title}>Shorts</Text><Text style={s.sub}>Vídeos curtos em breve.</Text></View>
  );
}
const s = StyleSheet.create({
  root:{flex:1,backgroundColor:'#0E0E12',alignItems:'center',justifyContent:'center'},
  title:{color:'#fff',fontSize:22,fontWeight:'800'}, sub:{color:'#A6ADCE',marginTop:6}
});
