import React from "react";
import "../styles/ChatHeader.css";
import NotificationsIcon from "@material-ui/icons/Notifications";
import EditLocationRoundedIcon from "@material-ui/icons/EditLocationRounded";
import PeopleAltRoundedIcon from "@material-ui/icons/PeopleAltRounded";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import SendRoundedIcon from "@material-ui/icons/SendRounded";
import HelpRoundedIcon from "@material-ui/icons/HelpRounded";
function ChatHeader({ channelName }) {
  return (
    <div className="chatHeader">
      <div className="chatHeader__left">
        <h3>
          <span className="chatHeader__hash">#</span>
          {channelName ? channelName : <>Select a Channel</>}
        </h3>
      </div>
      <div className="chatHeader__right">
        <NotificationsIcon onClick={() => alert('Notifications not implemented')} />
        <EditLocationRoundedIcon onClick={() => alert('Add location not implemented')} />
        <PeopleAltRoundedIcon onClick={() => alert('People list not implemented')} />

        <div className="chatHeader__search">
          <input placeholder="Search" />
          <SearchRoundedIcon onClick={() => alert('Search not implemented')} />
        </div>
        <SendRoundedIcon onClick={() => alert('Send icon is decorative')} />
        <HelpRoundedIcon onClick={() => alert('Help not implemented')} />
      </div>
    </div>
  );
}

export default ChatHeader;
