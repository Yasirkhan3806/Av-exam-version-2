"use client";

import React, { useState } from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";

const JitsiMeetComponent = ({
  roomName,
  displayName,
  onLeave,
}) => {
  const [loading, setLoading] = useState(true);

  return (
    <div className="h-full w-full relative flex flex-col">
      {/* Info Banner for Jitsi Policy */}
      {/* <div className="bg-blue-900/50 text-blue-200 text-xs py-1 px-4 text-center backdrop-blur-sm">
        Note: If you are the first to join, you may need to <b>log in</b> within
        the Jitsi frame to start the meeting.
      </div> */}

      <div className="flex-1 relative">
        <JitsiMeeting
          domain="meet.academicvitality.org"
          roomName={roomName}
          configOverwrite={{
            startWithAudioMuted: true,
            disableThirdPartyRequests: true,
            prejoinPageEnabled: false,
            enableWelcomePage: false,
            defaultLanguage: "en",
            enableClosePage: false,
            hideConferenceTimer: true,
            showJitsiWatermark: false,
            showWatermarkForGuests: false,
            showBrandWatermark: false,
            showPoweredBy: false,
            disableInviteFunctions: true,
            toolbarButtons: [
              "microphone",
              "camera",
              "desktop",
              "chat",
              "raisehand",
              "tileview",
              "fullscreen",
              "hangup",
              "videoquality",
              "filmstrip",
              "shortcuts",
              "videobackgroundblur",
              "settings",
            ],
          }}
          interfaceConfigOverwrite={{
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false,
            DEFAULT_BACKGROUND: "#111827",
            DEFAULT_LOCAL_DISPLAY_NAME: "Me",
            DEFAULT_REMOTE_DISPLAY_NAME: "Student",
            TOOLBAR_BUTTONS: [
              "microphone",
              "camera",
              "desktop",
              "chat",
              "raisehand",
              "tileview",
              "fullscreen",
              "hangup",
              "videoquality",
              "filmstrip",
              "shortcuts",
              "videobackgroundblur",
              "settings",
            ],
          }}
          userInfo={{
            displayName: displayName,
            email: "[EMAIL_ADDRESS]",
          }}
          onApiReady={(externalApi) => {
            setLoading(false);
            externalApi.addListener("videoConferenceLeft", () => {
              if (onLeave) onLeave();
            });
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = "100%";
            iframeRef.style.width = "100%";
          }}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-10">
            Loading Library Room...
          </div>
        )}
      </div>
    </div>
  );
};

export default JitsiMeetComponent;
