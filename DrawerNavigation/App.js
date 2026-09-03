import { Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen from './src/components/homescreen';
import ProfileScreen from './src/components/profilescreen';
import SearchScreen from './src/components/searchscreen';
import SettingsScreen from './src/components/settingsscreen';

const Dreawer = createDrawerNavigator();


function MyDrawer() {
  return (
    <Dreawer.Navigator>
      <Dreawer.Screen 
        name="Inicio"
        component={HomeScreen}
      />

      <Dreawer.Screen 
        name="Perfil"
        component={ProfileScreen}
      />

      <Dreawer.Screen 
        name="Ajustes"
        component={SettingsScreen}
      />

      <Dreawer.Screen 
        name="Buscar"
        component={SearchScreen}
      />

    </Dreawer.Navigator>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <MyDrawer/>
    </NavigationContainer>


  )
}