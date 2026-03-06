import React, { useEffect, useState } from "react";
import db from "../firebase";
import "../styles/ChatRoom.css";
import Message from "./Message";
function ChatRoom({ channelId }) {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    if (channelId) {
      db.collection("channels")
        .doc(channelId)
        .collection("messages")
        .orderBy("timestamp", "desc")
        .onSnapshot((snapshot) =>
          setMessages(snapshot.docs.map((doc) => doc.data()))
        );
    }
  }, [channelId]);
  return (
    <div className="chat__messages">
      {messages.map((message) => (
        <Message
          timestamp={message.timestamp}
          message={message.message}
          user={message.user}
        />
      ))}
    </div>
  );
}

export default ChatRoom;
