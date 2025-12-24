import { useWebRTCStore } from "../../store/webrtcStore";
import ControlButton from "./ControlButton";
import CameraIcon from "./icons/CameraIcon";
import CameraOffIcon from "./icons/CameraOffIcon";
import EndCallIcon from "./icons/EndCallIcon";
import MicIcon from "./icons/MicIcon";
import MicMutedIcon from "./icons/MicMutedIcon";

const VideoControls = ({ onEndCall }: { onEndCall: () => void }) => {
  const {
    isMicMuted,
    isCameraOff,
    toggleMic,
    toggleCamera,
  } = useWebRTCStore();

  return (
    <div className="flex items-center justify-center gap-6">
      <ControlButton
        onClick={toggleMic}
        active={!isMicMuted}
        label={isMicMuted ? "Unmute microphone" : "Mute microphone"}
      >
        {isMicMuted ? <MicMutedIcon /> : <MicIcon />}
      </ControlButton>

      <ControlButton
        onClick={toggleCamera}
        active={!isCameraOff}
        label={isCameraOff ? "Turn camera on" : "Turn camera off"}
      >
        {isCameraOff ? <CameraOffIcon /> : <CameraIcon />}
      </ControlButton>

      <button onClick={onEndCall}>
        <EndCallIcon />
      </button>
    </div>
  );
};

export default VideoControls;
