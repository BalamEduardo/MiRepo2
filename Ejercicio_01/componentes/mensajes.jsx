import { View, Text } from "react-native";

export default function Mensaje(props) {

    return (
        <View>
            <Text>{props.msg}</Text>
            <Text>{props.num} </Text>
                
           
        </View>
    );
}