import React from "react";
import { useSelector } from "react-redux";
import { selectChannelId, selectChannelName } from "../features/appSlice";
import "../styles/Chat.css";
import ChatFooter from "./ChatFooter";
import ChatHeader from "./ChatHeader";
import ChatRoom from "./ChatRoom";
function Chat() {
  const channelId = useSelector(selectChannelId);
  const channelName = useSelector(selectChannelName);
  return (
    <div className="chat">
      <ChatHeader channelName={channelName} />
      <ChatRoom channelId={channelId} />
      <ChatFooter channelName={channelName} channelId={channelId} />
    </div>
  );
}

export default Chat;
