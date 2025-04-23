import { useAppStore } from '@/store';
import { HOST } from '@/utils/constants';
import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const socket = useRef();
  const { userInfo } = useAppStore();

  useEffect(() => {
    console.log(userInfo);
    if (userInfo && userInfo.userId) {
      console.log('Setting up socket connection');
      socket.current = io.connect(HOST, {
        withCredentials: true,
        query: { userId: userInfo.userId },
      });
      socket.current.on('connect', () => {
        console.log('Connected to socket server');
      });

      const handleRecieveMessage = (message) => {
        console.log('Received direct message:', message);
        const { selectedChatData, selectedChatType, addMessage } =
          useAppStore.getState();
        if (
          selectedChatType != undefined &&
          (selectedChatData._id === message.sender._id ||
            selectedChatData._id === message.recipient._id)
        ) {
          console.log(message);
          console.log(message.content);
          addMessage(message);
        }
        addContactsInDMContacts(message);
      };

      const handleRecieveChannelMessage = (message) => {
        console.log('Received channel message:', message);
        const {
          selectedChatData,
          selectedChatType,
          addMessage,
          addChannelInChannelList,
        } = useAppStore.getState();
        if (
          selectedChatType !== undefined &&
          selectedChatData._id === message.channelId
        ) {
          console.log(message.content);
          addMessage(message);
        }
        addChannelInChannelList(message);
      };

      socket.current.on('recieveMessage', handleRecieveMessage);
      socket.current.on('recieve-channel-message', handleRecieveChannelMessage);

      return () => {
        console.log('Disconnecting socket');
        // socket.current.off('recieveMessage', handleRecieveMessage);
        // socket.current.off(
        //   'recieve-channel-message',
        //   handleRecieveChannelMessage
        // );
        socket.current.disconnect();
      };
    }
  }, [userInfo]);

  return (
    <SocketContext.Provider value={socket.current}>
      {children}
    </SocketContext.Provider>
  );
};
