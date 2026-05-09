import { View, Text } from "react-native";
import '../../global.css';

interface ChatMessageProps {
    message: string;
    time: string;
    sender: string;
}

const ChatMessage = ({ message, time, sender }: ChatMessageProps) => {
    const isMe = sender === 'me';

    return (
        <View
            className={`${isMe ? 'self-end bg-primary-light' : 'self-start bg-background-light'} max-w-[65%] p-3 my-1 rounded-2xl flex-row`}
        >
            <Text 
                className={`${isMe ? 'text-background-light' : 'text-black'} pr-2 flex-shrink`}
            >
                {message}
            </Text>
            <Text 
                className={`${isMe ? 'text-background-gray' : 'text-[#aaa]'} text-[0.7rem] self-end mt-1`}
            >
                {time}
            </Text>
        </View>
    );
};

export default ChatMessage;