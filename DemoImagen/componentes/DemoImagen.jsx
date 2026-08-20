import { Dimensions, ImageBackground, StyleSheet, Image, Text, View } from 'react-native'

const DemoImagen = () => {

    return (
        <View style={styles.container}>
            <ImageBackground
                style={styles.fondo}
                source={require('../assets/image.png')}
            >

            <View style={styles.container}>
                <Text style={styles.titulo}>GATO APP</Text>
                <Image
                    style={styles.foto}
                    source={{ uri: 'https://http.cat/203' }}
                />
            </View>

            </ImageBackground>
        </View>
    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#a84b4b4f',
       
    },
    fondo: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    foto: {
        width: 200,
        height: 200,
        borderRadius: 16,
        borderWidth: 10,
        borderColor: '#db8edc',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowradius: 4,
        elevation: 5,
    },
    titulo: {
        width: 400,
        color: '#00ff8c79',
        fontSize: 24,
        fontWeight: 'bold',
        backgroundColor: '#ec00f044',
        textAlign: 'center',
       
    },

});

export default DemoImagen