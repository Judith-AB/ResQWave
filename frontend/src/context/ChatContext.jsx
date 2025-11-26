import React, { createContext, useState, useContext } from 'react';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);
const initialChats = {}; 

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState(initialChats);

  const addMessage = (requestId, sender, text) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      sender: sender,
      text: text,
      timestamp: new Date().toLocaleTimeString(),
    };

    setChats(prevChats => ({
      ...prevChats,
      [requestId]: [...(prevChats[requestId] || []), newMessage],
    }));
  };

  const getMessages = (requestId) => {
    return chats[requestId] || [];
  };

  return (
    <ChatContext.Provider value={{ chats, addMessage, getMessages }}>
      {children}
    </ChatContext.Provider>
  );
};