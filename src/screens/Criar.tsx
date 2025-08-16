import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
export default function Criar() {
  return (
    <View style={s.root}><Text style={s.title}>Criar</Text><Text style={s.sub}>Criar post/story/live (em breve).</Text></View>
  );
}
const s = StyleSheet.create({
  root:{flex:1,backgroundColor:'#0E0E12',alignItems:'center',justifyContent:'center'},
  title:{color:'#fff',fontSize:22,fontWeight:'800'}, sub:{color:'#A6ADCE',marginTop:6}
});
