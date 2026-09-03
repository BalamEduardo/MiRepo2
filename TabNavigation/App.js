import { View, Text } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import HomeScreen from './src/componentes/HomeScreen'
import ProfileScreen from './src/componentes/ProfileScreen'
import SearchScreen from './src/componentes/SearchScreen'

const Tab = createBottomTabNavigator();

export default function App() {

    return (
        <NavigationContainer>

            <Tab.Navigator
              screenOptions={{

                headerShown: false,
                tabBarActiveTintColor: 'red',
                tabBarInactiveTintColor: 'gray'
              }}  
            
            >

                <Tab.Screen
                    name="Inicio"
                    component={HomeScreen}
                />

                <Tab.Screen
                    name="Buscar"
                    component={SearchScreen}
                />

                <Tab.Screen
                    name="Perfil"
                    component={ProfileScreen}
                />


            </Tab.Navigator>

        </NavigationContainer>

    )

}
