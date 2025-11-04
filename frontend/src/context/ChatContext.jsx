import React, { createContext, useState, useContext } from 'react';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

// Initial chat structure: Key is the Request ID, Value is the array of messages
const initialChats = {}; 

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState(initialChats);

  // Function to add a new message to a specific chat (by requestId)
  const addMessage = (requestId, sender, text) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      sender: sender, // e.g., 'Victim Name', or 'Volunteer Name'
      text: text,
      timestamp: new Date().toLocaleTimeString(),
    };

    setChats(prevChats => ({
      ...prevChats,
      [requestId]: [...(prevChats[requestId] || []), newMessage],
    }));
  };

  // Function to get messages for a specific request ID
  const getMessages = (requestId) => {
    return chats[requestId] || [];
  };

  return (
    <ChatContext.Provider value={{ chats, addMessage, getMessages }}>
      {children}
    </ChatContext.Provider>
  );
};